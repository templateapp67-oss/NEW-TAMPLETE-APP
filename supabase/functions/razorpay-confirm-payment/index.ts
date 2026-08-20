// @ts-nocheck -- Supabase Edge Runtime supplies Deno.
import {
  ADVANCE_STAGE,
  normalizeCurrency,
  parseCheckoutVerificationRequest,
  safeProviderMethod,
} from '../_shared/payment-contract.ts';
import {
  constantTimeEqual,
  corsHeaders,
  hmacHex,
  isAllowedOrigin,
  json,
  razorpayRequest,
  requiredEnv,
  safeFunctionError,
  serviceClient,
  sha256Hex,
  userClient,
} from '../_shared/razorpay.ts';

Deno.serve(async (req) => {
  if (!isAllowedOrigin(req)) return json(req, { error: 'Origin not allowed' }, 403);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(req) });
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405);

  try {
    const authorization = req.headers.get('Authorization') ?? '';
    if (!authorization.startsWith('Bearer ')) return json(req, { error: 'Unauthorized' }, 401);
    const customer = userClient(authorization);
    const { data: auth, error: authError } = await customer.auth.getUser();
    if (authError || !auth.user) return json(req, { error: 'Unauthorized' }, 401);

    const response = parseCheckoutVerificationRequest(await req.json());
    const admin = serviceClient();
    const { data: payment, error: paymentError } = await admin.from('payments')
      .select('id,booking_id,provider_order_id,provider_payment_id,amount_paise,currency,status,payment_stage,bookings!inner(customer_user_id)')
      .eq('provider_order_id', response.razorpay_order_id)
      .single();
    if (paymentError || !payment || payment.bookings.customer_user_id !== auth.user.id) {
      return json(req, { error: 'Payment not found' }, 404);
    }
    if (payment.payment_stage !== ADVANCE_STAGE) return json(req, { error: 'Payment stage mismatch' }, 409);

    const expected = await hmacHex(
      requiredEnv('RAZORPAY_KEY_SECRET'),
      `${payment.provider_order_id}|${response.razorpay_payment_id}`,
    );
    if (!constantTimeEqual(expected, response.razorpay_signature.toLowerCase())) {
      return json(req, { error: 'Invalid payment signature' }, 400);
    }

    const currency = normalizeCurrency(payment.currency);
    if (payment.status === 'captured') {
      if (payment.provider_payment_id !== response.razorpay_payment_id) {
        return json(req, { error: 'Payment already captured with another provider payment' }, 409);
      }
      return json(req, {
        verified: true,
        booking_id: payment.booking_id,
        status: 'captured',
        amount: Number(payment.amount_paise),
        currency,
        payment_id: payment.provider_payment_id,
      });
    }

    let providerPayment = await razorpayRequest(`/payments/${encodeURIComponent(response.razorpay_payment_id)}`);
    if (providerPayment.order_id !== payment.provider_order_id
      || Number(providerPayment.amount) !== Number(payment.amount_paise)
      || normalizeCurrency(providerPayment.currency) !== currency) {
      return json(req, { error: 'Provider payment does not match the authoritative order' }, 400);
    }
    if (providerPayment.status === 'authorized') {
      providerPayment = await razorpayRequest(`/payments/${encodeURIComponent(response.razorpay_payment_id)}/capture`, {
        method: 'POST',
        body: JSON.stringify({ amount: Number(payment.amount_paise), currency }),
      });
    }
    if (providerPayment.status !== 'captured') {
      return json(req, { error: 'Razorpay payment is not captured' }, 409);
    }
    if (providerPayment.order_id !== payment.provider_order_id
      || Number(providerPayment.amount) !== Number(payment.amount_paise)
      || normalizeCurrency(providerPayment.currency) !== currency) {
      return json(req, { error: 'Captured payment does not match the authoritative order' }, 400);
    }

    const { error: finalizeError } = await admin.rpc('finalize_razorpay_capture', {
      p_provider_order_id: payment.provider_order_id,
      p_provider_payment_id: response.razorpay_payment_id,
      p_provider_event_id: `checkout:${response.razorpay_payment_id}`,
      p_method: safeProviderMethod(providerPayment.method),
      p_payload_hash: await sha256Hex(`${payment.provider_order_id}|${response.razorpay_payment_id}|${payment.amount_paise}`),
      p_occurred_at: new Date(Number(providerPayment.created_at) * 1000).toISOString(),
    });
    if (finalizeError) throw finalizeError;

    const { data: captured, error: capturedError } = await admin.from('payments')
      .select('provider_payment_id,amount_paise,currency,status')
      .eq('id', payment.id)
      .single();
    if (capturedError || !captured) throw capturedError || new Error('Captured payment was not persisted');
    if (captured.status !== 'captured'
      || captured.provider_payment_id !== response.razorpay_payment_id
      || Number(captured.amount_paise) !== Number(payment.amount_paise)
      || normalizeCurrency(captured.currency) !== currency) {
      throw new Error('Captured payment persistence mismatch');
    }

    return json(req, {
      verified: true,
      booking_id: payment.booking_id,
      status: 'captured',
      amount: Number(payment.amount_paise),
      currency,
      payment_id: response.razorpay_payment_id,
      method: safeProviderMethod(providerPayment.method),
    });
  } catch (error) {
    const safe = safeFunctionError(error, 'Payment confirmation failed');
    return json(req, { error: safe.message }, safe.status);
  }
});
