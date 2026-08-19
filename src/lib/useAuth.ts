import { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import {
  supabase,
  isSupabaseConfigured,
  supabaseConfigurationMessage,
} from './supabaseClient';

/**
 * Thin wrapper over the application's single Supabase Auth client.
 * Credentials go directly to Supabase and are never stored by application
 * code. Supabase-js persists/refreshes the browser session configured in
 * `supabaseClient.ts`.
 */

export type AuthStatus =
  | 'loading'
  | 'authenticated'
  | 'anonymous'
  | 'configuration-error'
  | 'network-error'
  | 'auth-error';

export interface AuthFailure {
  kind: 'configuration' | 'network' | 'auth';
  message: string;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  status: AuthStatus;
  error: AuthFailure | null;
}

function looksLikeNetworkError(error: unknown): boolean {
  const message = error && typeof error === 'object' && 'message' in error
    ? String((error as { message?: unknown }).message ?? '')
    : String(error ?? '');
  return /fetch|network|offline|connection|timeout|socket|dns/i.test(message);
}

function authFailure(error: unknown, fallback: string): AuthFailure {
  const message = error && typeof error === 'object' && 'message' in error
    ? String((error as { message?: unknown }).message ?? fallback)
    : fallback;
  return looksLikeNetworkError(error)
    ? { kind: 'network', message }
    : { kind: 'auth', message };
}

function anonymousState(): AuthState {
  return { user: null, session: null, loading: false, status: 'anonymous', error: null };
}

function configurationState(): AuthState {
  return {
    user: null,
    session: null,
    loading: false,
    status: 'configuration-error',
    error: {
      kind: 'configuration',
      message: supabaseConfigurationMessage() ?? 'Supabase is not configured.',
    },
  };
}

/**
 * Reads the persisted session and validates its user with Supabase Auth.
 * A cached session alone is not treated as proof of a current authenticated
 * user. This is also a reusable verification boundary for protected screens.
 */
export async function readAuthenticatedSession(): Promise<
  | { status: 'authenticated'; session: Session; user: User }
  | { status: 'anonymous' }
  | { status: 'configuration-error'; error: AuthFailure }
  | { status: 'network-error'; error: AuthFailure }
  | { status: 'auth-error'; error: AuthFailure }
> {
  if (!supabase || !isSupabaseConfigured) {
    return { status: 'configuration-error', error: configurationState().error as AuthFailure };
  }

  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!sessionData.session) return { status: 'anonymous' };

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!userData.user || userData.user.id !== sessionData.session.user.id) {
      return {
        status: 'auth-error',
        error: { kind: 'auth', message: 'The persisted session could not be validated.' },
      };
    }
    return { status: 'authenticated', session: sessionData.session, user: userData.user };
  } catch (error) {
    const failure = authFailure(error, 'Unable to verify the authentication session.');
    return {
      status: failure.kind === 'network' ? 'network-error' : 'auth-error',
      error: failure,
    };
  }
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>(() =>
    isSupabaseConfigured
      ? { user: null, session: null, loading: true, status: 'loading', error: null }
      : configurationState(),
  );

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) {
      setState(configurationState());
      return;
    }

    let active = true;

    // Safety fallback: expose a network-classified failure instead of leaving
    // every protected screen in a permanent loading state.
    const timeoutId = setTimeout(() => {
      if (active) {
        setState((previous) =>
          previous.loading
            ? {
                user: null,
                session: null,
                loading: false,
                status: 'network-error',
                error: { kind: 'network', message: 'Authentication session verification timed out.' },
              }
            : previous,
        );
      }
    }, 8000);

    void readAuthenticatedSession().then((result) => {
      if (!active) return;
      clearTimeout(timeoutId);
      if (result.status === 'authenticated') {
        setState({
          user: result.user,
          session: result.session,
          loading: false,
          status: 'authenticated',
          error: null,
        });
      } else if (result.status === 'anonymous') {
        setState(anonymousState());
      } else {
        setState({
          user: null,
          session: null,
          loading: false,
          status: result.status,
          error: result.error,
        });
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active || event === 'INITIAL_SESSION') return;
      clearTimeout(timeoutId);
      if (session?.user) {
        setState({
          user: session.user,
          session,
          loading: false,
          status: 'authenticated',
          error: null,
        });
      } else {
        setState(anonymousState());
      }
    });

    return () => {
      active = false;
      clearTimeout(timeoutId);
      subscription.subscription.unsubscribe();
    };
  }, []);

  return state;
}

/** Email/password sign-in using Supabase Auth. */
export async function signInWithPassword(
  email: string,
  password: string,
): Promise<{ error: string | null }> {
  if (!supabase) {
    return {
      error: supabaseConfigurationMessage()
        ?? 'Authentication is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    };
  }
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('Sign-in failed:', error);
      return { error: error.message || 'Incorrect email or password.' };
    }
    return { error: null };
  } catch (error) {
    console.error('Sign-in exception:', error);
    return {
      error: authFailure(error, 'Could not connect to authentication service. Please try again.').message,
    };
  }
}

/**
 * Email/password sign-up using Supabase Auth. `needsConfirmation` is true when
 * the project requires email confirmation before issuing a session.
 */
export async function signUpWithPassword(
  email: string,
  password: string,
): Promise<{ error: string | null; needsConfirmation: boolean }> {
  if (!supabase) {
    return {
      error: supabaseConfigurationMessage()
        ?? 'Authentication is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      needsConfirmation: false,
    };
  }
  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      console.error('Sign-up failed:', error);
      const message = /already registered|already exists/i.test(error.message)
        ? 'That email is already registered. Try logging in.'
        : error.message || 'Could not create the account. Please try again.';
      return { error: message, needsConfirmation: false };
    }
    return { error: null, needsConfirmation: !data.session };
  } catch (error) {
    console.error('Sign-up exception:', error);
    return {
      error: authFailure(error, 'Could not connect to authentication service. Please try again.').message,
      needsConfirmation: false,
    };
  }
}

/** Logout result used by live verification; no exception is silently promoted to PASS. */
export async function signOutWithResult(): Promise<{ error: string | null }> {
  if (!supabase) {
    return { error: supabaseConfigurationMessage() ?? 'Authentication is not configured.' };
  }
  try {
    const { error } = await supabase.auth.signOut();
    if (error) return { error: error.message || 'Unable to log out.' };
    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) return { error: sessionError.message || 'Unable to verify logout.' };
    if (data.session) return { error: 'Logout did not clear the Supabase session.' };
    return { error: null };
  } catch (error) {
    return { error: authFailure(error, 'Unable to log out.').message };
  }
}

export async function signOut(): Promise<void> {
  const result = await signOutWithResult();
  if (result.error) console.error('Sign-out failed:', result.error);
}
