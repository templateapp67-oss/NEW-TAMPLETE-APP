import { useEffect, useState } from 'react';
import { X, Loader2, AlertCircle, LogIn, UserPlus, MailCheck } from 'lucide-react';
import { signInWithPassword, signUpWithPassword } from '../lib/useAuth';
import { isSupabaseConfigured } from '../lib/supabaseClient';

/**
 * Sign in / sign up against the existing Supabase Auth (email + password,
 * which the live project has enabled). Credentials go straight to Supabase —
 * never stored or handled manually, no service_role.
 */
interface Props {
  open: boolean;
  onClose: () => void;
  onSignedIn?: () => void;
}

type Mode = 'login' | 'signup';

export default function LoginModal({ open, onClose, onSignedIn }: Props) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setNotice(null);
    setBusy(false);
  }, [open]);

  if (!open) return null;

  const handleSubmit = async () => {
    const mail = email.trim();
    if (!mail || !password) {
      setError('Enter your email and password.');
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!isSupabaseConfigured) {
      setError('Sign-in is unavailable right now.');
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);

    if (mode === 'login') {
      const { error: err } = await signInWithPassword(mail, password);
      setBusy(false);
      if (err) {
        setError(err);
        return;
      }
      setPassword('');
      onSignedIn?.();
      onClose();
      return;
    }

    const { error: err, needsConfirmation } = await signUpWithPassword(mail, password);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setPassword('');
    if (needsConfirmation) {
      setNotice('Account created. Check your email to confirm, then log in.');
      setMode('login');
      return;
    }
    onSignedIn?.();
    onClose();
  };

  const isLogin = mode === 'login';

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#1a1c1c]">
            {isLogin ? 'Log in to your shop' : 'Create your shop account'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#1a1c1c]">Email</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@salon.com"
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm outline-none focus:border-[#ac0053] focus:bg-white focus:ring-2 focus:ring-[#ffd9e1]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#1a1c1c]">Password</label>
            <input
              type="password"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void handleSubmit();
                }
              }}
              placeholder={isLogin ? '' : 'At least 6 characters'}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm outline-none focus:border-[#ac0053] focus:bg-white focus:ring-2 focus:ring-[#ffd9e1]"
            />
          </div>

          {notice && (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800">
              <MailCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{notice}</span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={() => void handleSubmit()}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ac0053] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#ba005b] disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isLogin ? (
              <LogIn className="h-3.5 w-3.5" />
            ) : (
              <UserPlus className="h-3.5 w-3.5" />
            )}
            {busy ? 'Please wait...' : isLogin ? 'Log In' : 'Sign Up'}
          </button>

          <button
            onClick={() => {
              setMode(isLogin ? 'signup' : 'login');
              setError(null);
              setNotice(null);
            }}
            className="w-full text-center text-xs text-gray-500 hover:text-[#ac0053]"
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : 'Already have an account? Log in'}
          </button>
        </div>
      </div>
    </div>
  );
}
