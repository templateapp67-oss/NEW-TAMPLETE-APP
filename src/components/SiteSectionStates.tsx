import type { CSSProperties, ReactNode } from 'react';
import { AlertCircle, CalendarCheck, RefreshCw } from 'lucide-react';
import { scrollToSiteSection } from '../lib/siteNavigation';
import type { SectionStatus, SiteSectionKey } from '../lib/siteStructure';
import { SITE_SECTION_IDS, sectionProps } from '../lib/siteStructure';

export interface StructurePalette {
  accent: string;
  accentSoft?: string;
  text: string;
  muted: string;
  card: string;
  line: string;
  invert?: string;
}

interface StateCopy {
  loading: string;
  emptyTitle: string;
  emptyBody: string;
  errorTitle: string;
  errorBody: string;
  retry: string;
}

export function SectionStatePanel({
  status,
  copy,
  palette,
  onRetry,
  emptyTitle,
  emptyBody,
}: {
  status: SectionStatus;
  copy: StateCopy;
  palette: StructurePalette;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyBody?: string;
}) {
  if (status === 'ready') return null;
  if (status === 'loading') {
    return (
      <div
        data-testid="section-state-loading"
        className="flex items-center justify-center gap-3 rounded-2xl border px-4 py-8 min-h-[88px]"
        style={{ borderColor: palette.line, backgroundColor: palette.card, color: palette.muted }}
      >
        <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" aria-hidden />
        <span className="text-xs font-semibold">{copy.loading}</span>
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div
        data-testid="section-state-error"
        className="flex flex-col items-center justify-center gap-3 rounded-2xl border px-4 py-8 text-center min-h-[88px]"
        style={{ borderColor: palette.line, backgroundColor: palette.card }}
      >
        <AlertCircle className="w-5 h-5" style={{ color: palette.accent }} />
        <p className="text-sm font-bold" style={{ color: palette.text }}>{copy.errorTitle}</p>
        <p className="text-xs max-w-sm" style={{ color: palette.muted }}>{copy.errorBody}</p>
        <button
          type="button"
          data-testid="section-state-retry"
          onClick={onRetry}
          className="inline-flex items-center gap-2 min-h-11 px-4 rounded-xl text-[10px] font-extrabold uppercase tracking-wider"
          style={{ backgroundColor: palette.accent, color: palette.invert || '#ffffff' }}
        >
          <RefreshCw className="w-3.5 h-3.5" /> {copy.retry}
        </button>
      </div>
    );
  }
  return (
    <div
      data-testid="section-state-empty"
      className="rounded-2xl border border-dashed px-4 py-8 text-center min-h-[88px]"
      style={{ borderColor: palette.line, backgroundColor: palette.card }}
    >
      <p className="text-sm font-bold" style={{ color: palette.text }}>{emptyTitle || copy.emptyTitle}</p>
      <p className="text-xs mt-1 max-w-sm mx-auto" style={{ color: palette.muted }}>{emptyBody || copy.emptyBody}</p>
    </div>
  );
}

export function StructuredSection({
  section,
  status,
  id,
  className,
  style,
  children,
  copy,
  palette,
  emptyTitle,
  emptyBody,
}: {
  section: SiteSectionKey;
  status: SectionStatus;
  id?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  copy: StateCopy;
  palette: StructurePalette;
  emptyTitle?: string;
  emptyBody?: string;
}) {
  return (
    <section {...sectionProps(section, status, id)} className={`site-section min-w-0 ${className || ''}`} style={style}>
      {status === 'ready' ? children : (
        <div className="max-w-3xl mx-auto px-5 md:px-8 py-10">
          <SectionStatePanel status={status} copy={copy} palette={palette} emptyTitle={emptyTitle} emptyBody={emptyBody} />
        </div>
      )}
    </section>
  );
}

export function structureCopyFrom(S: Record<string, string>): StateCopy {
  return {
    loading: S['struct.loading'],
    emptyTitle: S['struct.emptyTitle'],
    emptyBody: S['struct.emptyBody'],
    errorTitle: S['struct.errorTitle'],
    errorBody: S['struct.errorBody'],
    retry: S['struct.retry'],
  };
}

export function FinalBookingCta({
  title,
  body,
  cta,
  palette,
  sharp = false,
}: {
  title: string;
  body: string;
  cta: string;
  palette: StructurePalette;
  sharp?: boolean;
}) {
  return (
    <section
      {...sectionProps('booking', 'ready', SITE_SECTION_IDS.booking)}
      className="site-section px-5 md:px-8 py-12 text-center min-w-0"
      style={{ backgroundColor: palette.accent }}
    >
      <div className="max-w-xl mx-auto">
        <div
          className={`w-12 h-12 mx-auto mb-4 flex items-center justify-center ${sharp ? '' : 'rounded-full'}`}
          style={{ backgroundColor: 'rgba(255,255,255,0.16)' }}
        >
          <CalendarCheck className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{title}</h2>
        <p className="text-xs md:text-sm mt-3 text-white/80 leading-relaxed">{body}</p>
        <button
          type="button"
          data-testid="final-booking-cta"
          onClick={() => scrollToSiteSection('section-contact')}
          className={`mt-6 inline-flex items-center justify-center min-h-11 px-8 text-[11px] font-extrabold uppercase tracking-[0.16em] ${sharp ? '' : 'rounded-full'}`}
          style={{ backgroundColor: '#ffffff', color: palette.accent }}
        >
          {cta}
        </button>
      </div>
    </section>
  );
}
