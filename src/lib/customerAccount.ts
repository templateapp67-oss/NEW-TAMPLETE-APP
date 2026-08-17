/**
 * PHASE 20.1 — CUSTOMER ACCOUNT FOUNDATION · data layer.
 *
 * Builds the foundation for a Customer Account area by:
 *   - Reading the authenticated customer's profile from Supabase Auth
 *   - Reusing the existing `readMyBookings()` for the customer's bookings
 *   - Never creating duplicate customer accounts
 *   - Never allowing access to another customer's private data
 *
 * Authentication uses the existing Supabase Auth via `useAuth.ts`.
 * Customer identity is the authenticated Supabase user (`auth.users`).
 *
 * Database tables (from M03/M08):
 *   - `public.profiles` (id → auth.users.id) for user profile data
 *   - `public.customers` for salon-specific customer records
 *   - `public.bookings` for booking history
 *
 * This module is READ-ONLY for Phase 20.1. Profile editing, favorites,
 * reviews, loyalty, and notifications are future phases.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';
import { readMyBookings, sortBookingsForList } from './bookingManagement';
import type { PaymentRecord } from './siteBookingPayment';
import type { AppLocale } from './locale';

/* ------------------------------------------------------------------ */
/* Customer identity and profile                                        */
/* ------------------------------------------------------------------ */

/**
 * Authenticated user profile from Supabase Auth + profiles table.
 * The customer identity is the authenticated Supabase user, not a separate
 * customer account — `profiles.id` IS the `auth.users.id`.
 */
export interface CustomerProfile {
  id: string;
  email: string | null;
  fullName: string | null;
  mobile: string | null;
  avatarUrl: string | null;
  createdAt: string | null;
}

/**
 * Resolution result for loading the customer profile.
 */
export type CustomerAccountAccess =
  | { status: 'loading' }
  | { status: 'authorized'; profile: CustomerProfile }
  | { status: 'not-configured' }
  | { status: 'not-authenticated' }
  | { status: 'error'; message: string };

/**
 * Load the authenticated customer's profile.
 * Returns null when Supabase is not configured or user is not signed in.
 */
export async function loadCustomerProfile(): Promise<CustomerAccountAccess> {
  if (!isSupabaseConfigured || !supabase) {
    return { status: 'not-configured' };
  }

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('Customer auth error:', authError);
      return { status: 'error', message: authError.message };
    }

    if (!user) {
      return { status: 'not-authenticated' };
    }

    // Try to load the profile from public.profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, mobile, email, avatar_url, created_at')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError && profileError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine for new users
      console.error('Customer profile error:', profileError);
      // Still return authorized with basic user data
      return {
        status: 'authorized',
        profile: {
          id: user.id,
          email: user.email ?? null,
          fullName: user.user_metadata?.full_name ?? null,
          mobile: user.user_metadata?.mobile ?? null,
          avatarUrl: user.user_metadata?.avatar_url ?? null,
          createdAt: user.created_at,
        },
      };
    }

    // Return profile if found, otherwise create from auth metadata
    if (profile) {
      return {
        status: 'authorized',
        profile: {
          id: profile.id,
          email: profile.email ?? user.email ?? null,
          fullName: profile.full_name ?? user.user_metadata?.full_name ?? null,
          mobile: profile.mobile ?? user.user_metadata?.mobile ?? null,
          avatarUrl: profile.avatar_url ?? user.user_metadata?.avatar_url ?? null,
          createdAt: profile.created_at,
        },
      };
    }

    // No profile record yet — return from auth metadata
    return {
      status: 'authorized',
      profile: {
        id: user.id,
        email: user.email ?? null,
        fullName: user.user_metadata?.full_name ?? null,
        mobile: user.user_metadata?.mobile ?? null,
        avatarUrl: user.user_metadata?.avatar_url ?? null,
        createdAt: user.created_at,
      },
    };
  } catch (err) {
    console.error('Customer profile exception:', err);
    return {
      status: 'error',
      message: err instanceof Error ? err.message : 'Failed to load customer profile',
    };
  }
}

/* ------------------------------------------------------------------ */
/* Customer bookings                                                   */
/* ------------------------------------------------------------------ */

/**
 * Customer's bookings — reuses `readMyBookings()` which reads the browser
 * identity internally and returns ONLY this customer's bookings.
 * Additional salon-specific filtering can be applied by the caller.
 */
export function readCustomerBookings(): PaymentRecord[] {
  return sortBookingsForList(readMyBookings());
}

/**
 * Customer's bookings filtered by business (salon).
 * Another salon's bookings are structurally unreachable.
 */
export function readCustomerBookingsForSalon(businessId: string): PaymentRecord[] {
  return sortBookingsForList(
    readMyBookings().filter((r) => r.businessId === businessId),
  );
}

/* ------------------------------------------------------------------ */
/* Booking statistics                                                  */
/* ------------------------------------------------------------------ */

export interface CustomerBookingStats {
  total: number;
  completed: number;
  cancelled: number;
  pending: number;
}

export function getCustomerBookingStats(bookings: PaymentRecord[]): CustomerBookingStats {
  return bookings.reduce(
    (stats, booking) => {
      stats.total++;
      if (booking.bookingStatus === 'completed') stats.completed++;
      else if (booking.bookingStatus === 'cancelled' || booking.bookingStatus === 'failed') stats.cancelled++;
      else stats.pending++;
      return stats;
    },
    { total: 0, completed: 0, cancelled: 0, pending: 0 },
  );
}

/* ------------------------------------------------------------------ */
/* Date formatting helpers                                             */
/* ------------------------------------------------------------------ */

/**
 * Format a date string for display in the customer's locale.
 */
export function formatBookingDate(dateKey: string, locale: AppLocale): string {
  const date = new Date(`${dateKey}T12:00:00`);
  return date.toLocaleDateString(locale === 'hi' ? 'hi-IN' : 'en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format a timestamp for display in the customer's locale.
 */
export function formatTimestamp(isoString: string | null, locale: AppLocale): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString(locale === 'hi' ? 'hi-IN' : 'en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/* ------------------------------------------------------------------ */
/* User-facing messages                                                */
/* ------------------------------------------------------------------ */

export function customerAccountDeniedMessage(access: CustomerAccountAccess): string {
  switch (access.status) {
    case 'loading':
      return '';
    case 'authorized':
      return '';
    case 'not-configured':
      return 'Customer account is unavailable. Please configure Supabase.';
    case 'not-authenticated':
      return 'Please log in to access your account.';
    case 'error':
      return access.message || 'Unable to load your account.';
    default:
      return '';
  }
}

export function customerAccountCanRetry(access: CustomerAccountAccess): boolean {
  return access.status === 'error';
}
