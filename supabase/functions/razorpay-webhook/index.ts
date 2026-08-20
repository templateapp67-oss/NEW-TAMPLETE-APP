// @ts-nocheck -- Supabase Edge Runtime supplies Deno.
import { normalizeCurrency, safeProviderMethod } from '../_shared/payment-contract.ts';
import {
  constantTimeEqual,
  corsHeaders,
  hmacHex,
  isAllowedOrigin,
  json,
  requiredEnv,
  safeFunctionError,
  serviceClient,
  sha256Hex,
} from '../_shared/razorpay.ts';

Deno.serve(async (req) => {
  if (!isAllowedOrigin(req)) return json(req, { error: 'Origin not allowed' }, 403);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(req) });
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405);

  const rawBody = await req.text();
  let admin: ReturnType<typeof serviceClient> | null = null;
  let claimedEventId: string | null = null;
  let eventProcessed = false;
  try {
    const signature = req.headers.get('x-razorpay-signature') ?? '';
    const providerEventId = req.headers.get('x-razorpay-event-id') ?? '';
    if (!providerEventId) return json(req, { error: 'Webhook event id missing' }, 400);
    if (!signature) return json(req, { error: 'Webhook signature missing' }, 400);
    const expected = await hmacHex(requiredEnv('RAZORPAY_WEBHOOK_SECRET'), rawBody);
    if (!constantTimeEqual(expected, signature.toLowerCase())) {
      return json(req, { error: 'Invalid webhook signature' }, 400);
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return json(req, { error: 'Invalid webhook payload' }, 400);
    }

    admin = serviceClient();
    const { data: claimedEvent, error: claimError } = await admin
      .from('payment_webhook_events')
      .insert({ provider: 'razorpay', event_id: providerEventId, payload })
      .select('id')
      .single();
    if (claimError) {
      if (claimError.code === '23505') {
        return json(req, { accepted: true, duplicate: true });
      }
      throw claimError;
    }
    claimedEventId = claimedEvent.id;
    const completeEvent = async (body: Record<string, unknown>, status = 200) => {
      const { error: completionError } = await admin!.from('payment_webhook_events')
        .update({ processed_at: new Date().toISOString() })
        .eq('id', claimedEventId!);
      if (completionError) throw completionError;
      eventProcessed = true;
      return json(req, body, status);
    };

    const event = String(payload.event ?? '');
    const providerPayment = payload.payload?.payment?.entity;
    if (!providerPayment?.id || !providerPayment?.order_id) {
      return await completeEvent({ accepted: true, ignored: true });
    }

    const { data: payment, error: paymentError } = await admin.from('payments')
      .select('id,provider_order_id,provider_payment_id,amount_paise,currency,status')
      .eq('provider_order_id', providerPayment.order_id)
      .maybeSingle();
    if (paymentError) throw paymentError;
    if (!payment) return await completeEvent({ accepted: true, ignored: true });

    if (event === 'payment.failed' && payment.status !== 'captured') {
      const { error: failureError } = await admin.from('payments').update({
        status: 'failed',
        failure_code: typeof providerPayment.error_code === 'string'
          ? providerPayment.error_code.slice(0, 100)
          : null,
        failure_message_safe: 'Payment failed at the provider. Please try again.',
        updated_at: new Date().toISOString(),
      }).eq('id', payment.id).neq('status', 'captured');
      if (failureError) throw failureError;
      return await completeEvent({ accepted: true, failed: true });
    }
    if (!['payment.captured', 'order.paid'].includes(event) || providerPayment.status !== 'captured') {
      return await completeEvent({ accepted: true, ignored: true });
    }

    const currency = normalizeCurrency(payment.currency);
    if (Number(providerPayment.amount) !== Number(payment.amount_paise)
      || normalizeCurrency(providerPayment.currency) !== currency) {
      return await completeEvent({ error: 'Webhook payment amount mismatch' }, 400);
    }
    if (payment.status === 'captured' && payment.provider_payment_id
      && payment.provider_payment_id !== providerPayment.id) {
      return await completeEvent({ error: 'Payment already captured with another provider payment' }, 409);
    }

    const { error: finalizeError } = await admin.rpc('finalize_razorpay_capture', {
      p_provider_order_id: payment.provider_order_id,
      p_provider_payment_id: providerPayment.id,
      p_provider_event_id: providerEventId,
      p_method: safeProviderMethod(providerPayment.method),
      p_payload_hash: await sha256Hex(rawBody),
      p_occurred_at: new Date(Number(providerPayment.created_at) * 1000).toISOString(),
    });
    if (finalizeError) throw finalizeError;
    return await completeEvent({ accepted: true });
  } catch (error) {
    if (admin && claimedEventId && !eventProcessed) {
      await admin.from('payment_webhook_events').delete().eq('id', claimedEventId);
    }
    const safe = safeFunctionError(error, 'Webhook processing failed');
    return json(req, { error: safe.message }, safe.status);
  }
});
