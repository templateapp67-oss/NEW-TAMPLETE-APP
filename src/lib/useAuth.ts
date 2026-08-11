import { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabaseClient';

/**
 * Thin wrapper over the existing Supabase Auth (email/password, which the
 * live project has enabled). No second auth system, no manual token or
 * password handling, no service_role.
 */

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: isSupabaseConfigured,
  });

  useEffect(() => {
    if (!supabase) {
      setState({ user: null, session: null, loading: false });
      return;
    }

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setState({
        user: data.session?.user ?? null,
        session: data.session ?? null,
        loading: false,
      });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ user: session?.user ?? null, session: session ?? null, loading: false });
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}

/** Email/password sign-in using the existing Supabase Auth. */
export async function signInWithPassword(
  email: string,
  password: string,
): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Sign-in is unavailable right now.' };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error('Sign-in failed:', error);
    return { error: 'Incorrect email or password.' };
  }
  return { error: null };
}

/**
 * Email/password sign-up using the existing Supabase Auth.
 * `needsConfirmation` is true when the project requires email confirmation
 * before a session is issued.
 */
export async function signUpWithPassword(
  email: string,
  password: string,
): Promise<{ error: string | null; needsConfirmation: boolean }> {
  if (!supabase) {
    return { error: 'Sign-up is unavailable right now.', needsConfirmation: false };
  }
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    console.error('Sign-up failed:', error);
    const message = /already registered|already exists/i.test(error.message)
      ? 'That email is already registered. Try logging in.'
      : 'Could not create the account. Please try again.';
    return { error: message, needsConfirmation: false };
  }
  return { error: null, needsConfirmation: !data.session };
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}
