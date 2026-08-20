import { requireSupabase } from './supabaseClient';
import type {
  GatewayAttemptResult,
  PaymentMethod,
  PaymentRecord,
} from './siteBookingPayment';

const CHECKOUT_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

interface PaymentOrderResponse {
  key_id: string;
  order_id: string;
  amount: number;
  currency: string;
  booking_id: string;
  stage: 'advance';
  status: string;
}

interface PaymentVerificationResponse {
  verified: true;
  booking_id: string;
  status: 'captured';
  amount: number;
  currency: string;
  payment_id: string;
  method?: string;
}

interface RazorpayCheckoutResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayCheckout {
  open(): void;
  close(): void;
  on(event: 'payment.failed', callback: (response: unknown) => void): void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayCheckout;
  }
}

let checkoutScriptPromise: Promise<void> | null = null;

function safePaymentError(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  if (/not authorized|not found|unauthorized/i.test(message)) return 'This booking is not available for payment.';
  if (/already|not due|eligible|mismatch/i.test(message)) return message;
  if (/signature/i.test(message)) return 'Payment verification failed. No payment was marked successful.';
  return 'The secure payment service could not complete this request. Please try again.';
}

async function invokePayment<T>(functionName: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await requireSupabase().functions.invoke(functionName, { body });
  if (error) {
    let message = error.message;
    const context = (error as { context?: Response }).context;
    if (context && typeof context.clone === 'function') {
      const payload = await context.clone().json().catch(() => null) as { error?: unknown } | null;
      if (typeof payload?.error === 'string') message = payload.error;
    }
    throw new Error(message);
  }
  if (!data || typeof data !== 'object') throw new Error('Payment service returned an invalid response');
  return data as T;
}

function paymentMethod(value: string | null): PaymentMethod | null {
  if (value === 'card' || value === 'upi' || value === 'wallet') return value;
  return value ? 'wallet' : null;
}

function applyOrder(record: PaymentRecord, state: PaymentOrderResponse): PaymentRecord {
  const paid = state.status === 'captured';
  const advance = state.amount / 100;
  return {
    ...record,
    amountDue: advance,
    remainingAmount: Math.max(0, record.baseAmount - (paid ? advance : 0)),
    currency: state.currency,
    paymentOption: 'advance',
    paymentMethod: paid ? record.paymentMethod : null,
    paymentStatus: paid ? 'paid'
      : state.status === 'failed' ? 'failed'
        : state.status === 'created' || state.status === 'pending' || state.status === 'authorized' ? 'pending'
          : 'unpaid',
    gatewayRef: state.order_id,
    updatedAt: Date.now(),
    persistence: 'supabase',
  };
}

function applyVerification(record: PaymentRecord, state: PaymentVerificationResponse): PaymentRecord {
  const paid = state.amount / 100;
  return {
    ...record,
    amountDue: paid,
    remainingAmount: Math.max(0, record.baseAmount - paid),
    currency: state.currency,
    paymentOption: 'advance',
    paymentMethod: paymentMethod(state.method || null),
    paymentStatus: 'paid',
    gatewayRef: state.payment_id,
    updatedAt: Date.now(),
    persistence: 'supabase',
  };
}

function loadCheckout(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Razorpay Checkout requires a browser'));
  if (window.Razorpay) return Promise.resolve();
  if (checkoutScriptPromise) return checkoutScriptPromise;
  checkoutScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = CHECKOUT_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      checkoutScriptPromise = null;
      reject(new Error('Razorpay Checkout could not load'));
    };
    document.head.appendChild(script);
  });
  return checkoutScriptPromise;
}

export function startRazorpayAdvancePayment(record: PaymentRecord): {
  promise: Promise<GatewayAttemptResult>;
  cancel: () => void;
} {
  let checkout: RazorpayCheckout | null = null;
  let orderRecord = record;
  let settled = false;
  let resolveAttempt: (result: GatewayAttemptResult) => void = () => undefined;
  const promise = new Promise<GatewayAttemptResult>((resolve) => { resolveAttempt = resolve; });

  const finish = (result: GatewayAttemptResult) => {
    if (settled) return;
    settled = true;
    resolveAttempt(result);
  };

  void (async () => {
    try {
      if (record.persistence !== 'supabase') throw new Error('A persisted booking is required for Razorpay');
      if (record.paymentStatus === 'paid') {
        finish({ outcome: 'success', method: record.paymentMethod, record });
        return;
      }
      const order = await invokePayment<PaymentOrderResponse>('razorpay-create-order', {
        booking_id: record.id,
        stage: 'advance',
      });
      if (order.booking_id !== record.id || order.stage !== 'advance') {
        throw new Error('Payment order does not belong to this booking');
      }
      orderRecord = applyOrder(record, order);
      if (order.status === 'captured') {
        finish({ outcome: 'success', method: orderRecord.paymentMethod, record: orderRecord });
        return;
      }
      if (!order.order_id || !order.key_id || !Number.isSafeInteger(order.amount) || order.amount <= 0) {
        throw new Error('Payment order was not created');
      }

      await loadCheckout();
      if (!window.Razorpay) throw new Error('Razorpay Checkout is unavailable');
      checkout = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'Nexora',
        description: `25% advance for ${record.bookingId}`,
        order_id: order.order_id,
        prefill: {
          name: record.customer.name,
          email: record.customer.email || undefined,
          contact: record.customer.mobile || undefined,
        },
        notes: { booking_reference: record.bookingId },
        retry: { enabled: false },
        theme: { color: '#7c3aed' },
        modal: {
          confirm_close: true,
          ondismiss: () => finish({
            outcome: 'cancellation',
            reason: 'Payment cancelled by customer. No payment was marked successful.',
            method: null,
            record: orderRecord,
          }),
        },
        handler: async (response: RazorpayCheckoutResponse) => {
          try {
            if (response.razorpay_order_id !== order.order_id) {
              throw new Error('Checkout order mismatch');
            }
            const verified = await invokePayment<PaymentVerificationResponse>('razorpay-confirm-payment', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            if (!verified.verified || verified.status !== 'captured' || verified.booking_id !== record.id) {
              throw new Error('Payment was not verified as captured');
            }
            const verifiedRecord = applyVerification(record, verified);
            finish({ outcome: 'success', method: verifiedRecord.paymentMethod, record: verifiedRecord });
          } catch (error) {
            finish({ outcome: 'failure', reason: safePaymentError(error), method: null, record: orderRecord });
          }
        },
      });
      checkout.on('payment.failed', () => finish({
        outcome: 'failure',
        reason: 'Razorpay could not complete the payment. No payment was marked successful.',
        method: null,
        record: orderRecord,
      }));
      checkout.open();
    } catch (error) {
      finish({ outcome: 'failure', reason: safePaymentError(error), method: null, record: orderRecord });
    }
  })();

  return {
    promise,
    cancel: () => {
      checkout?.close();
      finish({
        outcome: 'cancellation',
        reason: 'Payment cancelled by customer. No payment was marked successful.',
        method: null,
        record: orderRecord,
      });
    },
  };
}
