import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  calculateAdvancePaise,
  normalizeCurrency,
  parseAdvanceOrderRequest,
  parseCheckoutVerificationRequest,
} from '../supabase/functions/_shared/payment-contract.ts';

let passed = 0;
const test = (name, fn) => {
  try {
    fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (error) {
    console.error(`  ✗ ${name}`);
    throw error;
  }
};

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const createOrder = source('supabase/functions/razorpay-create-order/index.ts');
const confirmPayment = source('supabase/functions/razorpay-confirm-payment/index.ts');
const webhook = source('supabase/functions/razorpay-webhook/index.ts');
const shared = source('supabase/functions/_shared/razorpay.ts');
const client = source('src/lib/supabasePayment.ts');
const paymentFlow = source('src/components/SiteBookingPaymentFlow.tsx');
const config = source('supabase/config.toml');

test('advance is rounded from authoritative integer paise', () => {
  assert.equal(calculateAdvancePaise(10001), 2500);
  assert.equal(calculateAdvancePaise(125000), 31250);
  assert.throws(() => calculateAdvancePaise(0), /invalid authoritative/i);
  assert.throws(() => calculateAdvancePaise(10.5), /invalid authoritative/i);
});

test('create-order input accepts only booking_id and advance stage', () => {
  const bookingId = '11111111-1111-4111-8111-111111111111';
  assert.deepEqual(parseAdvanceOrderRequest({ booking_id: bookingId, stage: 'advance' }), {
    booking_id: bookingId,
    stage: 'advance',
  });
  assert.throws(() => parseAdvanceOrderRequest({ booking_id: bookingId, stage: 'final' }), /advance/i);
  assert.throws(() => parseAdvanceOrderRequest({ booking_id: bookingId, stage: 'advance', amount: 1 }), /only/i);
});

test('confirmation input rejects amount and other browser authority', () => {
  const valid = {
    razorpay_order_id: 'order_test',
    razorpay_payment_id: 'pay_test',
    razorpay_signature: 'abc',
  };
  assert.deepEqual(parseCheckoutVerificationRequest(valid), valid);
  assert.throws(() => parseCheckoutVerificationRequest({ ...valid, amount: 1 }), /invalid checkout/i);
});

test('currency contract is INR only', () => {
  assert.equal(normalizeCurrency(' inr '), 'INR');
  assert.throws(() => normalizeCurrency('USD'), /unsupported/i);
});

test('create-order authenticates ownership and persists through canonical RPC', () => {
  assert.match(createOrder, /customer\.auth\.getUser\(\)/);
  assert.match(createOrder, /\.eq\('customer_user_id', auth\.user\.id\)/);
  assert.match(createOrder, /calculateAdvancePaise\(booking\.total_paise\)/);
  assert.match(createOrder, /admin\.rpc\('prepare_razorpay_order'/);
  assert.doesNotMatch(createOrder, /body\.amount|body\.currency|body\.customer_id|body\.salon_id/);
});

test('confirm-payment verifies signature even for idempotent captured responses', () => {
  const signatureCheck = confirmPayment.indexOf('constantTimeEqual(expected');
  const capturedBranch = confirmPayment.indexOf("payment.status === 'captured'");
  assert.ok(signatureCheck >= 0 && capturedBranch > signatureCheck);
  assert.match(confirmPayment, /Provider payment does not match the authoritative order/);
  assert.match(confirmPayment, /admin\.rpc\('finalize_razorpay_capture'/);
});

test('webhook verifies raw-body signature and uses event-id idempotency', () => {
  assert.match(webhook, /const rawBody = await req\.text\(\)/);
  assert.match(webhook, /x-razorpay-signature/);
  assert.match(webhook, /x-razorpay-event-id/);
  assert.match(webhook, /p_provider_event_id: providerEventId/);
  assert.match(webhook, /admin\.rpc\('finalize_razorpay_capture'/);
  assert.match(webhook, /from\('payment_webhook_events'\)/);
  assert.match(webhook, /claimError\.code === '23505'/);
  assert.match(webhook, /duplicate: true/);
  assert.match(webhook, /processed_at: new Date\(\)\.toISOString\(\)/);
  const eventClaim = webhook.indexOf(".from('payment_webhook_events')");
  const failedMutation = webhook.indexOf("event === 'payment.failed'");
  assert.ok(eventClaim >= 0 && failedMutation > eventClaim);
});

test('required security and failure regressions remain enforced', () => {
  assert.match(createOrder, /\.eq\('customer_user_id', auth\.user\.id\)/);
  assert.match(confirmPayment, /payment\.bookings\.customer_user_id !== auth\.user\.id/);
  assert.match(confirmPayment, /Number\(providerPayment\.amount\) !== Number\(payment\.amount_paise\)/);
  const signatureCheck = confirmPayment.indexOf('constantTimeEqual(expected');
  const duplicateConfirmation = confirmPayment.indexOf("payment.status === 'captured'");
  assert.ok(signatureCheck >= 0 && duplicateConfirmation > signatureCheck);
  assert.match(client, /outcome: 'cancellation'/);
  assert.match(client, /checkout\.on\('payment\.failed'/);
  assert.match(createOrder, /return json\(req, \{ error: 'Unauthorized' \}, 401\)/);
  assert.match(confirmPayment, /return json\(req, \{ error: 'Unauthorized' \}, 401\)/);
});

test('server secrets remain Edge-only and Test keys are enforced', () => {
  assert.match(shared, /requiredEnv\('RAZORPAY_KEY_SECRET'\)/);
  assert.match(shared, /startsWith\('rzp_test_'\)/);
  assert.doesNotMatch(client, /RAZORPAY_KEY_SECRET|RAZORPAY_WEBHOOK_SECRET|SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(paymentFlow, /RAZORPAY_KEY_SECRET|RAZORPAY_WEBHOOK_SECRET|SUPABASE_SERVICE_ROLE_KEY/);
});

test('configured client uses Edge Functions and never localStorage as payment authority', () => {
  assert.match(client, /functions\.invoke\(functionName/);
  assert.match(client, /'razorpay-create-order'/);
  assert.match(client, /'razorpay-confirm-payment'/);
  assert.doesNotMatch(client, /localStorage|simulateGateway/);
  const configuredBranch = paymentFlow.indexOf("record?.persistence === 'supabase'");
  const mockCall = paymentFlow.indexOf('simulateGateway(activeRec');
  assert.ok(configuredBranch >= 0 && mockCall > configuredBranch);
});

test('checkout handles cancellation and provider failure without success', () => {
  assert.match(client, /ondismiss:/);
  assert.match(client, /outcome: 'cancellation'/);
  assert.match(client, /checkout\.on\('payment\.failed'/);
  assert.match(client, /outcome: 'failure'/);
  assert.match(client, /verified\.status !== 'captured'/);
});

test('JWT verification is enabled only for customer functions', () => {
  assert.match(config, /\[functions\.razorpay-create-order\][\s\S]*?verify_jwt = true/);
  assert.match(config, /\[functions\.razorpay-confirm-payment\][\s\S]*?verify_jwt = true/);
  assert.match(config, /\[functions\.razorpay-webhook\][\s\S]*?verify_jwt = false/);
});

console.log(`\nPhase 16.5 Razorpay implementation: ${passed}/${passed} checks passed.`);
