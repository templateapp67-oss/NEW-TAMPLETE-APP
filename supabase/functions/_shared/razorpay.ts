// @ts-nocheck -- Supabase Edge Runtime supplies Deno and npm: imports.
import { createClient } from 'npm:@supabase/supabase-js@2.112.3';

const DEFAULT_TRUSTED_ORIGINS = [
  'https://new-tamplete-app.vercel.app',
  'https://nexora-main-website.vercel.app',
  'https://shop-onwer-pink-nexora-aap.vercel.app',
  'https://pink-growth-partner.vercel.app',
  'https://custmer-fresh-app.vercel.app',
] as const;

const configuredTrustedOrigins = (Deno.env.get('NEXORA_ALLOWED_CORS_ORIGINS') ?? '')
  .split(',')
  .map((value) => value.trim())
  .filter((value) => {
    if (!value || value.includes('*')) return false;
    try {
      const parsed = new URL(value);
      return ['http:', 'https:'].includes(parsed.protocol) && parsed.origin === value;
    } catch {
      return false;
    }
  });

const trustedOrigins = new Set<string>([...DEFAULT_TRUSTED_ORIGINS, ...configuredTrustedOrigins]);

export const isAllowedOrigin = (req: Request) => {
  const origin = req.headers.get('Origin');
  return origin === null || trustedOrigins.has(origin);
};

export const corsHeaders = (req: Request): HeadersInit => {
  const origin = req.headers.get('Origin');
  return {
    ...(origin && trustedOrigins.has(origin) ? { 'Access-Control-Allow-Origin': origin } : {}),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature, x-razorpay-event-id',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
};

export const json = (req: Request, body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
});

export const requiredEnv = (name: string) => {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Missing server secret: ${name}`);
  return value;
};

export const serviceClient = () => createClient(
  requiredEnv('SUPABASE_URL'),
  requiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
  { auth: { persistSession: false, autoRefreshToken: false } },
);

export const userClient = (authorization: string) => createClient(
  requiredEnv('SUPABASE_URL'),
  requiredEnv('SUPABASE_ANON_KEY'),
  {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  },
);

const bytesToHex = (bytes: Uint8Array) => Array.from(bytes)
  .map((byte) => byte.toString(16).padStart(2, '0')).join('');

export const hmacHex = async (secret: string, message: string) => {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  return bytesToHex(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))));
};

export const sha256Hex = async (message: string) => bytesToHex(new Uint8Array(
  await crypto.subtle.digest('SHA-256', new TextEncoder().encode(message)),
));

export const constantTimeEqual = (left: string, right: string) => {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return result === 0;
};

export class ProviderRequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ProviderRequestError';
    this.status = status;
  }
}

export const razorpayRequest = async (path: string, init: RequestInit = {}) => {
  const keyId = requiredEnv('RAZORPAY_KEY_ID');
  const keySecret = requiredEnv('RAZORPAY_KEY_SECRET');
  if (!keyId.startsWith('rzp_test_')) throw new Error('Razorpay TEST key required');
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const providerMessage = typeof payload?.error?.description === 'string'
      ? payload.error.description.slice(0, 240)
      : 'Razorpay request failed';
    throw new ProviderRequestError(response.status, providerMessage);
  }
  return payload;
};

export const safeFunctionError = (error: unknown, fallback: string) => {
  if (error instanceof ProviderRequestError) {
    if (error.status === 401) return { status: 502, message: 'Razorpay Test authentication failed' };
    return { status: 502, message: 'Razorpay Test service rejected the request' };
  }
  const message = error instanceof Error ? error.message : fallback;
  if (/missing server secret/i.test(message)) return { status: 503, message };
  if (/invalid|only .* accepted|unsupported/i.test(message)) return { status: 400, message };
  return { status: 500, message: fallback };
};
