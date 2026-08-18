/**
 * PHASE 20.9 — HELP & SUPPORT · customer account sub-view.
 *
 * A clean FAQ help center. Questions/answers describe ONLY functionality
 * that actually exists in this application (booking, payment,
 * reschedule/cancel, profile, favorites, salon website) — no invented
 * policies, refund rules or features. Contact options come from the
 * salon's REAL published data (`helpContactOptions`), so nothing is
 * fabricated. There is no support-ticket backend in this app, so the
 * section says so honestly instead of faking a submission.
 */
import { useMemo, useState } from 'react';
import { ChevronDown, ArrowLeft, Mail, MessageCircle, Phone, Sparkles, X } from 'lucide-react';
import type { SalonData } from '../types';
import type { SiteHeaderThemeId } from '../lib/siteNavigation';
import { HELP_CATEGORIES, HELP_FAQS, helpContactOptions } from '../lib/siteHelpCenter';
import type { HelpCategoryId } from '../lib/siteHelpCenter';
import { useSiteLocale, useThemeAppearance } from './SiteHeader';
import { bookingSurfaces } from '../lib/siteBookingTheme';

interface Props {
  themeId: SiteHeaderThemeId;
  data: SalonData;
  onBack: () => void;
  onClose: () => void;
  onViewSalon: () => void;
}

export default function SiteHelpCenter({ themeId, data, onBack, onClose, onViewSalon }: Props) {
  const locale = useSiteLocale();
  const appearance = useThemeAppearance(themeId);
  const s = bookingSurfaces(themeId, appearance);
  const L = (en: string, hi: string) => (locale === 'hi' ? hi : en);

  const [category, setCategory] = useState<HelpCategoryId | 'all'>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const faqs = useMemo(
    () => (category === 'all' ? HELP_FAQS : HELP_FAQS.filter((f) => f.category === category)),
    [category],
  );

  const contacts = helpContactOptions(data);
  const hasContacts = Boolean(contacts.call || contacts.whatsapp || contacts.email);

  const toggle = (id: string) => setOpenId((current) => (current === id ? null : id));

  return (
    <div className="flex flex-col gap-4" data-testid="customer-help">
      {/* header */}
      <div className="flex items-center gap-2.5 p-3.5 border rounded-xl" style={{ backgroundColor: s.card, borderColor: s.line }}>
        <button
          type="button"
          data-testid="customer-help-back"
          onClick={onBack}
          aria-label={L('Back to My Account', 'मेरे खाते पर वापस')}
          className="shrink-0 p-2 rounded-lg cursor-pointer transition-colors hover:opacity-80"
          style={{ color: s.muted }}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold truncate" style={{ color: s.textStrong }}>
            {L('Help & Support', 'सहायता')}
          </p>
          <p className="text-[10px] font-semibold" style={{ color: s.muted }}>
            {L('Frequently asked questions', 'अक्सर पूछे जाने वाले प्रश्न')}
          </p>
        </div>
        <button
          type="button"
          data-testid="customer-help-close"
          onClick={onClose}
          aria-label={L('Close', 'बंद करें')}
          className="shrink-0 p-2 rounded-lg cursor-pointer transition-colors"
          style={{ color: s.muted }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* categories */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        <button
          type="button"
          data-testid="help-category-all"
          aria-pressed={category === 'all'}
          onClick={() => { setCategory('all'); setOpenId(null); }}
          className="shrink-0 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer"
          style={{
            backgroundColor: category === 'all' ? s.accent : s.chip,
            color: category === 'all' ? s.accentText : s.muted,
          }}
        >
          {L('All', 'सभी')}
        </button>
        {HELP_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            data-testid={`help-category-${cat.id}`}
            aria-pressed={category === cat.id}
            onClick={() => { setCategory(cat.id); setOpenId(null); }}
            className="shrink-0 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer"
            style={{
              backgroundColor: category === cat.id ? s.accent : s.chip,
              color: category === cat.id ? s.accentText : s.muted,
            }}
          >
            {locale === 'hi' ? cat.labelHi : cat.labelEn}
          </button>
        ))}
      </div>

      {/* FAQ accordion */}
      <div className="flex flex-col gap-2 pb-1">
        {faqs.map((faq) => {
          const open = openId === faq.id;
          return (
            <div
              key={faq.id}
              data-testid={`help-faq-${faq.id}`}
              data-open={open}
              className="border rounded-xl overflow-hidden"
              style={{ backgroundColor: s.card, borderColor: open ? s.accentLine : s.line }}
            >
              <button
                type="button"
                data-testid={`help-faq-toggle-${faq.id}`}
                aria-expanded={open}
                onClick={() => toggle(faq.id)}
                className="w-full flex items-center justify-between gap-3 px-3.5 py-3 text-left cursor-pointer transition-colors hover:opacity-90"
                style={{ color: s.textStrong }}
              >
                <span className="text-xs font-bold leading-snug">
                  {locale === 'hi' ? faq.questionHi : faq.questionEn}
                </span>
                <ChevronDown
                  className="w-4 h-4 shrink-0 transition-transform"
                  style={{ color: s.muted, transform: open ? 'rotate(180deg)' : undefined }}
                  aria-hidden="true"
                />
              </button>
              {open && (
                <div
                  data-testid={`help-faq-answer-${faq.id}`}
                  className="px-3.5 pb-3.5 text-[11px] font-semibold leading-relaxed border-t pt-2.5"
                  style={{ borderColor: s.line, color: s.muted }}
                >
                  {locale === 'hi' ? faq.answerHi : faq.answerEn}
                </div>
              )}
            </div>
          );
        })}
        {faqs.length === 0 && (
          <p className="text-[11px] font-semibold text-center py-4" style={{ color: s.muted }}>
            {L('No questions in this category.', 'इस श्रेणी में कोई प्रश्न नहीं है।')}
          </p>
        )}
      </div>

      {/* contact options — REAL salon data only */}
      <div className="p-4 border rounded-xl space-y-2" style={{ backgroundColor: s.card, borderColor: s.line }}>
        <h3 className="text-[10px] font-black uppercase tracking-wider" style={{ color: s.muted }}>
          {L('Contact the salon', 'सैलून से संपर्क करें')}
        </h3>
        {hasContacts ? (
          <div className="flex flex-col gap-2">
            {contacts.call && (
              <a
                data-testid="help-contact-call"
                href={contacts.call.href}
                className="w-full py-2.5 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-2 border transition-colors"
                style={{ borderColor: s.accent, color: s.accent, backgroundColor: 'transparent' }}
              >
                <Phone className="w-3.5 h-3.5" />
                {L('Call Salon', 'सैलून को कॉल करें')} · {contacts.call.label}
              </a>
            )}
            {contacts.whatsapp && (
              <a
                data-testid="help-contact-whatsapp"
                href={contacts.whatsapp.href}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-2 border transition-colors"
                style={{ borderColor: '#25D366', color: '#128C7E', backgroundColor: 'transparent' }}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                {contacts.whatsapp.label}
              </a>
            )}
            {contacts.email && (
              <a
                data-testid="help-contact-email"
                href={contacts.email.href}
                className="w-full py-2.5 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-2 border transition-colors"
                style={{ borderColor: s.accent, color: s.accent, backgroundColor: 'transparent' }}
              >
                <Mail className="w-3.5 h-3.5" />
                {contacts.email.label}
              </a>
            )}
          </div>
        ) : (
          <p className="text-[11px] font-semibold leading-relaxed" style={{ color: s.muted }}>
            {L(
              'The salon has not published contact details. Use the salon website for updates.',
              'सैलून ने संपर्क विवरण प्रकाशित नहीं किया है। अपडेट के लिए सैलून वेबसाइट देखें।',
            )}
          </p>
        )}
        <button
          type="button"
          data-testid="help-view-salon"
          onClick={onViewSalon}
          className="w-full py-2.5 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-all hover:brightness-110"
          style={{ backgroundColor: s.accent, color: s.accentText }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          {L('Open Salon Website', 'सैलून वेबसाइट खोलें')}
        </button>
      </div>

      {/* honest support-request limitation */}
      <div
        data-testid="help-support-note"
        className="p-3.5 border rounded-xl text-[10px] font-semibold leading-relaxed"
        style={{ borderColor: s.chipLine, backgroundColor: s.well, color: s.muted }}
      >
        {L(
          'This app does not have a support-ticket system yet. For issues with a specific booking, open the booking from My Bookings and use its options.',
          'इस ऐप में अभी सपोर्ट-टिकट सिस्टम नहीं है। किसी विशेष बुकिंग की समस्या के लिए मेरी बुकिंग से बुकिंग खोलें और उसके विकल्पों का उपयोग करें।',
        )}
      </div>
    </div>
  );
}
