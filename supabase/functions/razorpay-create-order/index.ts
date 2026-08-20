// @ts-nocheck -- Supabase Edge Runtime supplies Deno.
import {
  ADVANCE_STAGE,
  calculateAdvancePaise,
  isReusablePaymentStatus,
  normalizeCurrency,
  parseAdvanceOrderRequest,
} from '../_shared/payment-contract.ts';
import {
  corsHeaders,
  isAllowedOrigin,
  json,
  razorpayRequest,
  requiredEnv,
  safeFunctionError,
  serviceClient,
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

    const { booking_id, stage } = parseAdvanceOrderRequest(await req.json());
    const admin = serviceClient();
    const { data: booking, error: bookingError } = await admin.from('bookings')
      .select('id,booking_number,customer_user_id,currency,total_paise,advance_due_paise,financial_status,status')
      .eq('id', booking_id)
      .eq('customer_user_id', auth.user.id)
      .single();
    if (bookingError || !booking) return json(req, { error: 'Booking not found' }, 404);

    const currency = normalizeCurrency(booking.currency);
    const amount = calculateAdvancePaise(booking.total_paise);
    if (Number(booking.advance_due_paise) !== amount) {
      return json(req, { error: 'Authoritative advance does not equal 25% of the booking total' }, 409);
    }
    if (!['advance_due', 'advance_pending', 'advance_paid'].includes(String(booking.financial_status))) {
      return json(req, { error: 'Advance is not due' }, 409);
    }
    if (['cancelled', 'completed', 'no_show'].includes(String(booking.status))) {
      return json(req, { error: 'Booking is not eligible for payment' }, 409);
    }

    const { data: existing, error: existingError } = await admin.from('payments')
      .select('id,provider_order_id,provider_payment_id,amount_paise,currency,status,payment_stage')
      .eq('booking_id', booking.id)
      .eq('payment_stage', ADVANCE_STAGE)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) {
      if (Number(existing.amount_paise) !== amount || normalizeCurrency(existing.currency) !== currency) {
        return json(req, { error: 'Existing payment does not match the authoritative advance' }, 409);
      }
      if (existing.status === 'captured' || (existing.provider_order_id && isReusablePaymentStatus(existing.status))) {
        return json(req, {
          key_id: requiredEnv('RAZORPAY_KEY_ID'),
          order_id: existing.provider_order_id,
          amount,
          currency,
          booking_id: booking.id,
          stage,
          status: existing.status,
        });
      }
    }
    if (booking.financial_status === 'advance_paid') {
      return json(req, { error: 'Advance is already paid but no captured payment could be resolved' }, 409);
    }

    const order = await razorpayRequest('/orders', {
      method: 'POST',
      body: JSON.stringify({
        amount,
        currency,
        receipt: `${booking.booking_number}-${stage}`.slice(0, 40),
        notes: { booking_id: booking.id, stage },
      }),
    });
    if (!order?.id || Number(order.amount) !== amount || normalizeCurrency(order.currency) !== currency) {
      throw new Error('Provider order does not match the authoritative advance');
    }

    const { data: paymentId, error: rpcError } = await admin.rpc('prepare_razorpay_order', {
      p_booking_id: booking.id,
      p_stage: stage,
      p_provider_order_id: order.id,
    });
    if (rpcError) throw rpcError;
    const { data: persisted, error: persistedError } = await admin.from('payments')
      .select('provider_order_id,amount_paise,currency,status,payment_stage')
      .eq('id', paymentId)
      .single();
    if (persistedError || !persisted) throw persistedError || new Error('Payment order was not persisted');
    if (persisted.provider_order_id !== order.id
      || persisted.payment_stage !== ADVANCE_STAGE
      || Number(persisted.amount_paise) !== amount
      || normalizeCurrency(persisted.currency) !== currency) {
      throw new Error('Persisted payment order mismatch');
    }

    return json(req, {
      key_id: requiredEnv('RAZORPAY_KEY_ID'),
      order_id: persisted.provider_order_id,
      amount,
      currency,
      booking_id: booking.id,
      stage,
      status: persisted.status,
    });
  } catch (error) {
    const safe = safeFunctionError(error, 'Order creation failed');
    return json(req, { error: safe.message }, safe.status);
  }
});
