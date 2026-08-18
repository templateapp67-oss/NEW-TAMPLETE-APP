/**
 * PHASE 20.5 — MY PROFILE · customer account sub-view.
 *
 * Shows THIS browser's real profile (name / mobile / email — the only
 * customer fields the existing booking architecture stores) and lets the
 * customer EDIT it. Persistence is the app's existing browser-scoped
 * store model (`siteCustomerProfile.ts`), keyed by the SAME identity the
 * booking records use (`bookingBrowserId()`), so:
 *
 *   - the profile read resolves the identity INTERNALLY — another
 *     customer's profile is structurally unreachable,
 *   - validation reuses the EXISTING booking-details rules (name ≥ 2
 *     chars, mobile 10–13 digits, optional valid email),
 *   - the edited profile becomes the preferred source for the account
 *     header / My Bookings (booking snapshots stay untouched),
 *   - it survives a page refresh (persisted, not React state).
 *
 * No profile-image storage exists in the app, so the existing initials
 * avatar behavior is kept (no fake upload system).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Save,
  User,
  X,
} from 'lucide-react';
import type { SalonData } from '../types';
import type { SiteHeaderThemeId } from '../lib/siteNavigation';
import {
  CUSTOMER_PROFILE_EVENT,
  readCustomerProfile,
  saveCustomerProfile,
  validateCustomerProfile,
} from '../lib/siteCustomerProfile';
import type { CustomerProfile, CustomerProfileErrors } from '../lib/siteCustomerProfile';
import { readCustomerAccountInfo } from '../lib/siteCustomerAccount';
import { useSiteLocale, useThemeAppearance } from './SiteHeader';
import { bookingSurfaces } from '../lib/siteBookingTheme';
import { PAYMENT_EVENT } from '../lib/siteBookingPayment';
import type { BookingFlowSurface } from '../lib/siteBookingTheme';

interface Props {
  themeId: SiteHeaderThemeId;
  data?: SalonData;
  onBack: () => void;
  onClose: () => void;
}

export default function SiteCustomerProfile({ themeId, data: _data, onBack, onClose }: Props) {
  const locale = useSiteLocale();
  const appearance = useThemeAppearance(themeId);
  const s = bookingSurfaces(themeId, appearance);

  const [version, setVersion] = useState(0);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<CustomerProfile>({ name: '', mobile: '', email: '' });
  const [touched, setTouched] = useState<{ name: boolean; mobile: boolean; email: boolean }>({
    name: false, mobile: false, email: false,
  });
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);

  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener(CUSTOMER_PROFILE_EVENT, bump);
    window.addEventListener(PAYMENT_EVENT, bump);
    return () => {
      window.removeEventListener(CUSTOMER_PROFILE_EVENT, bump);
      window.removeEventListener(PAYMENT_EVENT, bump);
    };
  }, []);

  // Real profile: stored profile first, else the existing booking snapshot.
  const profile = useMemo(() => {
    const stored = readCustomerProfile();
    if (stored) return stored;
    const info = readCustomerAccountInfo();
    return info.recognized
      ? { name: info.name || '', mobile: info.mobile || '', email: info.email || '' }
      : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  const L = (en: string, hi: string) => (locale === 'hi' ? hi : en);

  const startEdit = useCallback(() => {
    setDraft({
      name: profile?.name || '',
      mobile: profile?.mobile || '',
      email: profile?.email || '',
    });
    setTouched({ name: false, mobile: false, email: false });
    setSaveError(null);
    setSuccessNote(null);
    setEditing(true);
  }, [profile]);

  const cancelEdit = useCallback(() => {
    setEditing(false);
    setSaveError(null);
    setTouched({ name: false, mobile: false, email: false });
  }, []);

  const errors: CustomerProfileErrors = useMemo(
    () => validateCustomerProfile(draft),
    [draft],
  );
  const showError = (field: 'name' | 'mobile' | 'email') => touched[field] && Boolean(errors[field]);

  const save = useCallback(() => {
    if (busy) return; // prevent duplicate submits while saving
    setTouched({ name: true, mobile: true, email: true });
    const result = saveCustomerProfile(draft);
    if (!result.ok) {
      setSaveError(L('Please fix the highlighted fields.', 'कृपया चिह्नित फ़ील्ड ठीक करें।'));
      return;
    }
    setBusy(true);
    setSaveError(null);
    // The store write is synchronous + persisted; reflect immediately and
    // re-read from the store (not React state) so it survives refresh.
    setVersion((v) => v + 1);
    setEditing(false);
    setSuccessNote(L('Profile updated.', 'प्रोफ़ाइल अपडेट हो गई।'));
    setBusy(false);
  }, [busy, draft, L]);

  const initials = (profile?.name || '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col gap-4" data-testid="customer-profile" data-editing={editing}>
      {/* header */}
      <div className="flex items-center gap-2.5 p-3.5 border rounded-xl" style={{ backgroundColor: s.card, borderColor: s.line }}>
        <button
          type="button"
          data-testid="customer-profile-back"
          onClick={onBack}
          aria-label={L('Back to My Account', 'मेरे खाते पर वापस')}
          className="shrink-0 p-2 rounded-lg cursor-pointer transition-colors hover:opacity-80"
          style={{ color: s.muted }}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold truncate" style={{ color: s.textStrong }}>
            {L('My Profile', 'मेरी प्रोफ़ाइल')}
          </p>
          <p className="text-[10px] font-semibold" style={{ color: s.muted }}>
            {editing ? L('Edit your details', 'अपना विवरण संपादित करें') : L('Your details on this device', 'इस डिवाइस पर आपका विवरण')}
          </p>
        </div>
        <button
          type="button"
          data-testid="customer-profile-close"
          onClick={onClose}
          aria-label={L('Close', 'बंद करें')}
          className="shrink-0 p-2 rounded-lg cursor-pointer transition-colors"
          style={{ color: s.muted }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {successNote && (
        <div
          data-testid="customer-profile-success"
          className="flex items-start gap-2 p-3 rounded-xl border text-[11px] font-semibold"
          style={{ backgroundColor: s.successSoft, borderColor: s.success, color: s.success }}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successNote}</span>
        </div>
      )}
      {saveError && (
        <div
          data-testid="customer-profile-error"
          className="flex items-start gap-2 p-3 rounded-xl border text-[11px] font-semibold"
          style={{ backgroundColor: s.chip, borderColor: s.danger, color: s.danger }}
        >
          <X className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{saveError}</span>
        </div>
      )}

      {/* identity card */}
      <div className="flex items-center gap-3 p-4 border rounded-xl" style={{ backgroundColor: s.card, borderColor: s.line }}>
        <span
          className="w-12 h-12 rounded-full flex items-center justify-center text-base font-extrabold shrink-0"
          style={{ backgroundColor: s.accent, color: s.accentText }}
        >
          {initials}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-extrabold truncate" style={{ color: s.textStrong }}>
            {profile?.name || L('Guest', 'अतिथि')}
          </p>
          <p className="text-[10px] font-semibold" style={{ color: s.muted }}>
            {L('Profile image is not available in this app — using initials.', 'इस ऐप में प्रोफ़ाइल फोटो उपलब्ध नहीं है — इनिशियल दिखाए जा रहे हैं।')}
          </p>
        </div>
      </div>

      {!editing ? (
        /* ---- VIEW MODE ---- */
        <>
          <div className="p-4 border rounded-xl space-y-2" style={{ backgroundColor: s.card, borderColor: s.line }}>
            <h3 className="text-[10px] font-black uppercase tracking-wider" style={{ color: s.muted }}>
              {L('Profile information', 'प्रोफ़ाइल जानकारी')}
            </h3>
            <ProfileRow s={s} icon={<User className="w-3.5 h-3.5" />} label={L('Name', 'नाम')} value={profile?.name || L('Not set', 'सेट नहीं')} />
            <ProfileRow s={s} icon={<Phone className="w-3.5 h-3.5" />} label={L('Phone', 'फ़ोन')} value={profile?.mobile || L('Not set', 'सेट नहीं')} />
            <ProfileRow s={s} icon={<Mail className="w-3.5 h-3.5" />} label={L('Email', 'ईमेल')} value={profile?.email || L('Not set', 'सेट नहीं')} />
          </div>

          <button
            type="button"
            data-testid="customer-profile-edit"
            onClick={startEdit}
            className="w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border cursor-pointer transition-colors"
            style={{ borderColor: s.accent, color: s.accent, backgroundColor: 'transparent' }}
          >
            <Pencil className="w-4 h-4" />
            {L('Edit Profile', 'प्रोफ़ाइल संपादित करें')}
          </button>
        </>
      ) : (
        /* ---- EDIT MODE ---- */
        <div className="flex flex-col gap-3">
          <Field
            s={s}
            id="customer-profile-name"
            label={L('Name', 'नाम')}
            value={draft.name}
            invalid={showError('name')}
            errorText={L('Please enter your name (at least 2 characters).', 'कृपया अपना नाम दर्ज करें (कम से कम 2 अक्षर)।')}
            placeholder={L('Your full name', 'आपका पूरा नाम')}
            onChange={(v) => setDraft((d) => ({ ...d, name: v }))}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            testId="customer-profile-input-name"
          />
          <Field
            s={s}
            id="customer-profile-mobile"
            label={L('Phone', 'फ़ोन')}
            value={draft.mobile}
            invalid={showError('mobile')}
            errorText={L('Enter a valid mobile number (10 digits).', 'मान्य मोबाइल नंबर दर्ज करें (10 अंक)।')}
            placeholder={L('10-digit mobile number', '10 अंकों का मोबाइल नंबर')}
            inputMode="tel"
            onChange={(v) => setDraft((d) => ({ ...d, mobile: v }))}
            onBlur={() => setTouched((t) => ({ ...t, mobile: true }))}
            testId="customer-profile-input-mobile"
          />
          <Field
            s={s}
            id="customer-profile-email"
            label={L('Email (optional)', 'ईमेल (वैकल्पिक)')}
            value={draft.email}
            invalid={showError('email')}
            errorText={L('Enter a valid email address.', 'मान्य ईमेल पता दर्ज करें।')}
            placeholder={L('you@example.com', 'you@example.com')}
            type="email"
            onChange={(v) => setDraft((d) => ({ ...d, email: v }))}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            testId="customer-profile-input-email"
          />

          <div className="flex gap-2">
            <button
              type="button"
              data-testid="customer-profile-cancel"
              disabled={busy}
              onClick={cancelEdit}
              className="flex-1 py-3 rounded-xl text-xs font-bold border cursor-pointer transition-colors disabled:opacity-60"
              style={{ borderColor: s.chipLine, color: s.text, backgroundColor: 'transparent' }}
            >
              {L('Cancel', 'रद्द करें')}
            </button>
            <button
              type="button"
              data-testid="customer-profile-save"
              disabled={busy}
              onClick={save}
              className="flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: s.accent, color: s.accentText }}
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {busy ? L('Saving…', 'सेव हो रहा है…') : L('Save', 'सेव करें')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileRow({
  s,
  icon,
  label,
  value,
}: {
  s: BookingFlowSurface;
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 border-b last:border-b-0" style={{ borderColor: s.line }}>
      <span className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider shrink-0" style={{ color: s.muted }}>
        <span style={{ color: s.accent }}>{icon}</span>
        {label}
      </span>
      <span className="text-right text-[11px] font-bold break-words min-w-0 max-w-[60%]" style={{ color: s.textStrong }}>
        {value}
      </span>
    </div>
  );
}

function Field({
  s,
  id,
  label,
  value,
  invalid,
  errorText,
  placeholder,
  type = 'text',
  inputMode,
  onChange,
  onBlur,
  testId,
}: {
  s: BookingFlowSurface;
  id: string;
  label: string;
  value: string;
  invalid: boolean;
  errorText: string;
  placeholder: string;
  type?: string;
  inputMode?: 'tel' | 'email' | 'text';
  onChange: (value: string) => void;
  onBlur: () => void;
  testId: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: s.muted }}>
        {label}
      </span>
      <input
        id={id}
        name={id}
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        aria-invalid={invalid}
        aria-describedby={invalid ? `${id}-err` : undefined}
        data-testid={testId}
        className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold outline-none transition-colors"
        style={{
          backgroundColor: s.well,
          borderColor: invalid ? s.danger : s.chipLine,
          color: s.textStrong,
        }}
      />
      {invalid && (
        <span id={`${id}-err`} data-testid={`${testId}-error`} className="text-[10px] font-bold" style={{ color: s.danger }}>
          {errorText}
        </span>
      )}
    </label>
  );
}
