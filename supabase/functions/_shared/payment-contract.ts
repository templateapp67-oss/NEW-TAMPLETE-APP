export const ADVANCE_STAGE = 'advance' as const;
export const PAYMENT_CURRENCY = 'INR' as const;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const hasOnlyKeys = (value: Record<string, unknown>, allowed: readonly string[]) => (
  Object.keys(value).every((key) => allowed.includes(key))
);

export const calculateAdvancePaise = (totalPaise: unknown): number => {
  const total = Number(totalPaise);
  if (!Number.isSafeInteger(total) || total <= 0) throw new Error('Invalid authoritative booking total');
  return Math.round(total * 0.25);
};

export interface AdvanceOrderRequest {
  booking_id: string;
  stage: typeof ADVANCE_STAGE;
}

export const parseAdvanceOrderRequest = (value: unknown): AdvanceOrderRequest => {
  if (!isRecord(value) || !hasOnlyKeys(value, ['booking_id', 'stage'])) {
    throw new Error('Only booking_id and stage are accepted');
  }
  if (typeof value.booking_id !== 'string' || !UUID_PATTERN.test(value.booking_id)) {
    throw new Error('Invalid booking_id');
  }
  if (value.stage !== ADVANCE_STAGE) throw new Error('Only the advance payment stage is supported');
  return { booking_id: value.booking_id, stage: ADVANCE_STAGE };
};

export interface CheckoutVerificationRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export const parseCheckoutVerificationRequest = (value: unknown): CheckoutVerificationRequest => {
  const keys = ['razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature'];
  if (!isRecord(value) || !hasOnlyKeys(value, keys)) throw new Error('Invalid checkout response');
  const response = Object.fromEntries(keys.map((key) => [key, value[key]])) as Record<string, unknown>;
  if (keys.some((key) => typeof response[key] !== 'string' || !(response[key] as string).trim())) {
    throw new Error('Invalid checkout response');
  }
  return response as unknown as CheckoutVerificationRequest;
};

export const normalizeCurrency = (value: unknown): string => {
  const currency = String(value ?? '').trim().toUpperCase();
  if (currency !== PAYMENT_CURRENCY) throw new Error('Unsupported booking currency');
  return currency;
};

export const isReusablePaymentStatus = (status: unknown) => (
  ['created', 'pending', 'authorized', 'failed'].includes(String(status))
);

export const safeProviderMethod = (method: unknown): string => (
  ['upi', 'card', 'wallet', 'netbanking'].includes(String(method)) ? String(method) : 'wallet'
);
