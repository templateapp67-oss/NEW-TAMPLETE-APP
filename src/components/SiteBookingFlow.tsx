import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CalendarCheck,
  Check,
  ChevronRight,
  Clock,
  CreditCard,
  Leaf,
  Mail,
  MessageSquare,
  Phone,
  Scissors,
  Smartphone,
  Sparkles,
  User,
  Users,
} from 'lucide-react';
import type { SalonData, Service } from '../types';
import { displayService } from '../lib/displayService';
import { serviceDisplayPrice, formatCurrency } from '../lib/pricing';
import { useSiteLocale, useThemeAppearance } from './SiteHeader';
import SiteSalonStatus from './SiteSalonStatus';
import { salonDisplayName } from '../lib/siteBooking';
import { getSalonNameStyle } from '../lib/brandIdentity';
import { useTickingNow } from '../lib/salonStatus';
import { dayLabel, translateCategory } from '../lib/siteI18n';
import { bookingFlowText, fillBookingText } from '../lib/siteBookingI18n';
import { bookingSurfaces } from '../lib/siteBookingTheme';
import type { BookingFlowSurface } from '../lib/siteBookingTheme';
import {
  BOOKING_HOLD_EVENT,
  BOOKING_STEP_IDS,
  bookingDayList,
  bookingServicesByCategory,
  bookingServicesForTheme,
  bookingSlotIsStillAvailable,
  bookingSlotsForDay,
  releaseBookingSlot,
  reserveBookingSlot,
  validateBookingCustomer,
} from '../lib/siteBookingFlow';
import type { BookingDayInfo, BookingSlot, BookingStepId } from '../lib/siteBookingFlow';
import type { SiteHeaderThemeId } from '../lib/siteNavigation';

interface Props {
  /** One of the five database-backed theme ids (drives visuals + isolation). */
  themeId: SiteHeaderThemeId;
  data: SalonData;
  onBackToWebsite: () => void;
  onShowToast?: (msg: string) => void;
}

/* ------------------------------------------------------------------ */
/* Per-theme visual design (structure is common, visuals are NOT).     */
/* ------------------------------------------------------------------ */

interface FlowDesign {
  /** Typography / shape personality for the five shared building blocks. */
  card: string;
  chip: string;
  primary: string;
  primaryShadow: string;
  secondary: string;
  stepTitle: string;
  stepChip: string;
  stepChipDone: string;
  input: string;
  slot: string;
  dateCard: string;
  serviceRow: string;
  label: string;
  sectionTitle: string;
  /** Small brand flourish next to the flow title. */
  flourish: (s: BookingFlowSurface) => ReactNode;
  /** Primary button decoration (nail uses a gradient, barber a flat gold). */
  primaryStyle: (s: BookingFlowSurface) => CSSProperties;
  /** Category chip selected decoration. */
  catSelectedStyle: (s: BookingFlowSurface) => CSSProperties;
}

const FLOW_DESIGNS: Record<SiteHeaderThemeId, FlowDesign> = {
  /* 1 · BARBER — sharp corners, engraving type, numbered rows, gold. */
  barber_mens_grooming: {
    card: 'border rounded-none shadow-sm',
    chip: 'border rounded-none',
    primary: 'rounded-none font-black uppercase tracking-[0.18em] text-[11px] py-3.5 transition-all hover:brightness-110 active:scale-[0.99]',
    primaryShadow: 'none',
    secondary: 'rounded-none border font-black uppercase tracking-[0.18em] text-[11px] py-3 transition-colors',
    stepTitle: 'font-black uppercase tracking-[0.08em]',
    stepChip: 'rounded-none border font-black uppercase text-[9px] tracking-[0.2em]',
    stepChipDone: 'rounded-none font-black uppercase text-[9px] tracking-[0.2em]',
    input: 'rounded-none border',
    slot: 'rounded-none border-2 font-black text-xs uppercase tracking-[0.08em]',
    dateCard: 'rounded-none border-2',
    serviceRow: 'rounded-none border',
    label: 'text-[9px] font-black uppercase tracking-[0.3em]',
    sectionTitle: 'font-black uppercase tracking-[0.12em] text-xs',
    flourish: (s) => <Scissors className="w-4 h-4" style={{ color: s.accent }} />,
    primaryStyle: (s) => ({ backgroundColor: s.accent, color: s.accentText }),
    catSelectedStyle: (s) => ({ backgroundColor: s.accent, color: s.accentText, borderColor: s.accent }),
  },

  /* 2 · HAIR STUDIO — editorial hairlines, serif headings, rose-gold. */
  hair_studio_color_bar: {
    card: 'border rounded-md shadow-none',
    chip: 'border rounded-md',
    primary: 'rounded-md font-serif font-semibold uppercase tracking-[0.16em] text-xs py-3.5 border transition-colors',
    primaryShadow: 'none',
    secondary: 'rounded-md border font-serif text-xs uppercase tracking-[0.16em] py-3 transition-colors',
    stepTitle: 'font-serif tracking-wide',
    stepChip: 'rounded-full border font-serif text-[9px] uppercase tracking-[0.18em]',
    stepChipDone: 'rounded-full font-serif text-[9px] uppercase tracking-[0.18em]',
    input: 'rounded-md border',
    slot: 'rounded-md border-2 font-serif text-xs',
    dateCard: 'rounded-md border-2',
    serviceRow: 'rounded-md border',
    label: 'text-[9px] font-medium uppercase tracking-[0.28em]',
    sectionTitle: 'font-serif text-xs uppercase tracking-[0.22em]',
    flourish: (s) => (
      <span className="font-serif italic text-sm leading-none" style={{ color: s.accent }}>No.</span>
    ),
    primaryStyle: (s) => ({ backgroundColor: s.accent, color: s.accentText, borderColor: s.accent }),
    catSelectedStyle: (s) => ({ borderColor: s.accent, color: s.accent, backgroundColor: s.accentSoft }),
  },

  /* 3 · BEAUTY SPA — soft pills, emerald wash, rounded sanctuary forms. */
  beauty_skin_spa: {
    card: 'border rounded-3xl shadow-sm',
    chip: 'border rounded-full',
    primary: 'rounded-full uppercase tracking-[0.18em] text-[11px] font-semibold py-3.5 transition-all hover:brightness-105 active:scale-[0.99] shadow-md',
    primaryShadow: 'none',
    secondary: 'rounded-full border text-[11px] font-semibold uppercase tracking-[0.14em] py-3 transition-colors',
    stepTitle: 'font-serif tracking-wide',
    stepChip: 'rounded-full text-[9px] font-semibold uppercase tracking-[0.16em]',
    stepChipDone: 'rounded-full text-[9px] font-semibold uppercase tracking-[0.16em]',
    input: 'rounded-2xl border',
    slot: 'rounded-full border-2 text-xs font-semibold',
    dateCard: 'rounded-2xl border-2',
    serviceRow: 'rounded-2xl border',
    label: 'text-[9px] font-semibold uppercase tracking-[0.24em]',
    sectionTitle: 'font-serif text-xs uppercase tracking-[0.2em]',
    flourish: (s) => <Leaf className="w-4 h-4" style={{ color: s.accent }} />,
    primaryStyle: (s) => ({ backgroundColor: s.accent, color: s.accentText }),
    catSelectedStyle: (s) => ({ backgroundColor: s.accent, color: s.accentText, borderColor: s.accent }),
  },

  /* 4 · FAMILY — friendly rounded cards, bold type, sky-blue energy. */
  family_full_service: {
    card: 'border rounded-2xl shadow-sm',
    chip: 'border rounded-lg',
    primary: 'rounded-xl font-extrabold text-xs py-3.5 transition-all hover:brightness-105 active:scale-[0.99]',
    primaryShadow: 'none',
    secondary: 'rounded-xl border font-extrabold text-xs py-3 transition-colors',
    stepTitle: 'font-extrabold tracking-tight',
    stepChip: 'rounded-lg text-[9px] font-extrabold uppercase tracking-[0.1em]',
    stepChipDone: 'rounded-lg text-[9px] font-extrabold uppercase tracking-[0.1em]',
    input: 'rounded-xl border',
    slot: 'rounded-xl border-2 font-bold text-xs',
    dateCard: 'rounded-xl border-2',
    serviceRow: 'rounded-xl border',
    label: 'text-[9px] font-extrabold uppercase tracking-[0.18em]',
    sectionTitle: 'font-extrabold text-xs uppercase tracking-[0.12em]',
    flourish: (s) => <Users className="w-4 h-4" style={{ color: s.accent }} />,
    primaryStyle: (s) => ({ backgroundColor: s.accent, color: s.accentText }),
    catSelectedStyle: (s) => ({ backgroundColor: s.accent, color: s.accentText, borderColor: s.accent }),
  },

  /* 5 · NAIL & LASH — pink flash, rounded-full, playful uppercase. */
  nail_lash_studio: {
    card: 'border rounded-3xl shadow-sm',
    chip: 'border rounded-full',
    primary: 'rounded-full font-extrabold text-[10px] uppercase tracking-[0.14em] py-3.5 transition-all hover:brightness-110 active:scale-[0.99]',
    primaryShadow: '0 6px 18px rgba(240,84,163,0.35)',
    secondary: 'rounded-full border font-extrabold text-[10px] uppercase tracking-[0.14em] py-3 transition-colors',
    stepTitle: 'font-extrabold uppercase tracking-[0.04em]',
    stepChip: 'rounded-full text-[8px] font-extrabold uppercase tracking-[0.16em]',
    stepChipDone: 'rounded-full text-[8px] font-extrabold uppercase tracking-[0.16em]',
    input: 'rounded-2xl border',
    slot: 'rounded-full border-2 font-extrabold text-xs',
    dateCard: 'rounded-2xl border-2',
    serviceRow: 'rounded-2xl border',
    label: 'text-[8px] font-extrabold uppercase tracking-[0.2em]',
    sectionTitle: 'font-extrabold text-xs uppercase tracking-[0.16em]',
    flourish: (s) => <Sparkles className="w-4 h-4" style={{ color: s.accent }} />,
    primaryStyle: (s) => ({
      backgroundImage: `linear-gradient(120deg, ${s.accent} 0%, ${s.accentHover} 100%)`,
      backgroundColor: s.accent,
      color: s.accentText,
    }),
    catSelectedStyle: (s) => ({ backgroundColor: s.accent, color: s.accentText, borderColor: s.accent }),
  },
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function SiteBookingFlow({ themeId, data, onBackToWebsite, onShowToast }: Props) {
  const locale = useSiteLocale();
  const appearance = useThemeAppearance(themeId);
  const now = useTickingNow(30_000);
  const T = bookingFlowText(locale);
  const s = bookingSurfaces(themeId, appearance);
  const D = FLOW_DESIGNS[themeId];

  const services = useMemo(() => bookingServicesForTheme(data, themeId), [data, themeId]);
  const categories = useMemo(() => bookingServicesByCategory(services), [services]);

  /* ---------- wizard state (preserved while moving between steps) ---------- */
  const [step, setStep] = useState<BookingStepId>('service');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(services[0]?.id ?? null);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [selectedSlotMinutes, setSelectedSlotMinutes] = useState<number | null>(null);
  const [holdKey, setHoldKey] = useState<string | null>(null);
  const [holdsVersion, setHoldsVersion] = useState(0);
  const [customer, setCustomer] = useState({ name: '', mobile: '', email: '', notes: '' });
  const [formTouched, setFormTouched] = useState(false);

  const selectedService = services.find((item) => item.id === selectedServiceId) || null;
  const selectedDate = selectedDateKey ? new Date(`${selectedDateKey}T12:00:00`) : null;

  const days = useMemo(
    () => bookingDayList(data, 14, now),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, now.getTime()],
  );

  const slots: BookingSlot[] = useMemo(() => {
    if (!selectedService || !selectedDate) return [];
    return bookingSlotsForDay(data, themeId, selectedService, selectedDate, now);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, themeId, selectedServiceId, selectedDateKey, now.getTime(), holdsVersion]);

  const visibleServices = useMemo(
    () => (categoryFilter ? services.filter((item) => item.category === categoryFilter) : services),
    [services, categoryFilter],
  );

  /* Foreign holds landing while we look at the grid must refresh it. */
  useEffect(() => {
    const bump = () => setHoldsVersion((v) => v + 1);
    window.addEventListener(BOOKING_HOLD_EVENT, bump);
    return () => window.removeEventListener(BOOKING_HOLD_EVENT, bump);
  }, []);

  /* ---------- slot picking + double-booking guard ---------- */
  const pickSlot = useCallback(
    (slot: BookingSlot) => {
      if (!selectedService || !selectedDateKey) return;
      if (slot.state === 'past' || slot.state === 'taken') return;
      const result = reserveBookingSlot(themeId, selectedService, selectedDateKey, slot.minutes);
      if (!result.ok || !result.hold) {
        setHoldsVersion((v) => v + 1);
        onShowToast?.(T.slotLost);
        return;
      }
      if (holdKey && holdKey !== result.hold.key) releaseBookingSlot(holdKey);
      setHoldKey(result.hold.key);
      setSelectedSlotMinutes(slot.minutes);
      setHoldsVersion((v) => v + 1);
    },
    [themeId, selectedService, selectedDateKey, holdKey, onShowToast, T],
  );

  /* Entering the time step always lands on a valid, held slot. */
  useEffect(() => {
    if (step !== 'time' || !selectedService || !selectedDate) return;
    if (
      selectedSlotMinutes != null
      && bookingSlotIsStillAvailable(data, themeId, selectedService, selectedDate, selectedSlotMinutes, now)
    ) {
      return;
    }
    const first = bookingSlotsForDay(data, themeId, selectedService, selectedDate, now).find(
      (slot) => slot.state === 'available' || slot.state === 'held',
    );
    if (first) {
      pickSlot(first);
    } else if (selectedSlotMinutes != null) {
      setSelectedSlotMinutes(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, selectedDateKey, selectedServiceId, now.getTime()]);

  const selectService = useCallback(
    (service: Service) => {
      if (service.id === selectedServiceId) return;
      if (holdKey) releaseBookingSlot(holdKey);
      setSelectedServiceId(service.id);
      setSelectedSlotMinutes(null);
      setHoldKey(null);
      setHoldsVersion((v) => v + 1);
    },
    [selectedServiceId, holdKey],
  );

  const selectDate = useCallback(
    (day: BookingDayInfo) => {
      if (!day.selectable) return;
      if (holdKey) releaseBookingSlot(holdKey);
      setSelectedDateKey(day.dateKey);
      setSelectedSlotMinutes(null);
      setHoldKey(null);
      setHoldsVersion((v) => v + 1);
    },
    [holdKey],
  );

  /* ---------- navigation + gating ---------- */
  const customerErrors = validateBookingCustomer(customer);
  const detailsValid = !customerErrors.name && !customerErrors.mobile && !customerErrors.email;

  const stepIndex = BOOKING_STEP_IDS.indexOf(step);

  const canContinue = (() => {
    if (step === 'service') return !!selectedService;
    if (step === 'date') {
      const day = days.find((item) => item.dateKey === selectedDateKey);
      return !!day && day.selectable;
    }
    if (step === 'time') return selectedSlotMinutes != null;
    if (step === 'details') return detailsValid;
    return true;
  })();

  const goNext = () => {
    if (!canContinue) return;
    if (step === 'service' && selectedService) {
      if (!selectedDateKey) {
        const firstOpen = days.find((day) => day.selectable);
        if (firstOpen) setSelectedDateKey(firstOpen.dateKey);
      }
      setStep('date');
      return;
    }
    if (step === 'date') {
      setStep('time');
      return;
    }
    if (step === 'time') {
      if (!selectedService || !selectedDate || selectedSlotMinutes == null) return;
      if (!bookingSlotIsStillAvailable(data, themeId, selectedService, selectedDate, selectedSlotMinutes, now)) {
        onShowToast?.(T.slotLost);
        setStep('time');
        return;
      }
      setStep('details');
      return;
    }
    if (step === 'details') {
      setFormTouched(true);
      if (!detailsValid) return;
      setStep('summary');
      return;
    }
  };

  const goBack = () => {
    if (step === 'summary') {
      setStep('details');
      return;
    }
    if (step === 'details') {
      setStep('time');
      return;
    }
    if (step === 'time') {
      setStep('date');
      return;
    }
    if (step === 'date') {
      setStep('service');
      return;
    }
  };

  const jumpToStep = (target: BookingStepId) => {
    const targetIndex = BOOKING_STEP_IDS.indexOf(target);
    if (targetIndex >= stepIndex) return; // only backward jumps are free
    if (target === 'summary') return; // summary is reached through details
    setStep(target);
  };

  /* ---------- derived display data ---------- */
  const serviceDisplay = selectedService ? displayService(selectedService, locale) : null;
  const servicePricing = selectedService ? serviceDisplayPrice(selectedService, data.offers) : null;
  const serviceDuration = selectedService
    ? selectedService.pricingVariants?.find((v) => v.status === 'active')?.duration ?? selectedService.duration
    : 0;

  const dateLabel = (date: Date) =>
    date.toLocaleDateString(locale === 'hi' ? 'hi-IN' : 'en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const selectedDay = days.find((item) => item.dateKey === selectedDateKey);
  const selectedSlot = slots.find((slot) => slot.minutes === selectedSlotMinutes);

  const salonName = salonDisplayName(data, themeId);
  const nameStyle = { ...getSalonNameStyle(data) };
  if (!nameStyle.color) nameStyle.color = s.textStrong;

  const toast = (key: string) => onShowToast?.(T[key as keyof typeof T]);

  /* ---------- shared building blocks ---------- */
  const stepChipStyle = (id: BookingStepId): CSSProperties => {
    const index = BOOKING_STEP_IDS.indexOf(id);
    if (index < stepIndex) return { backgroundColor: s.success, color: '#ffffff', borderColor: s.success };
    if (index === stepIndex) return { backgroundColor: s.accent, color: s.accentText, borderColor: s.accent };
    return { backgroundColor: s.chip, color: s.muted, borderColor: s.chipLine };
  };

  const primaryBtnStyle: CSSProperties = canContinue
    ? { ...D.primaryStyle(s), boxShadow: D.primaryShadow }
    : { backgroundColor: s.disabled, color: s.disabledText, borderColor: 'transparent', boxShadow: 'none', cursor: 'not-allowed' };

  const summaryLine = (icon: ReactNode, label: string, value: ReactNode) => (
    <div className="flex items-start justify-between gap-3 py-2">
      <span className="flex items-center gap-2 shrink-0" style={{ color: s.muted }}>
        {icon}
        <span className={D.label}>{label}</span>
      </span>
      <span className="text-right text-xs font-semibold break-words" style={{ color: s.textStrong }}>
        {value}
      </span>
    </div>
  );

  /* ================================================================ */
  return (
    <div
      data-testid="booking-flow"
      data-theme={themeId}
      data-appearance={appearance}
      data-locale={locale}
      data-step={step}
      className="absolute inset-0 z-[70] flex flex-col overflow-hidden"
      style={{ backgroundColor: s.page, color: s.text }}
    >
      {/* ---- header ---- */}
      <header
        className="shrink-0 flex items-center justify-between gap-3 px-4 md:px-6 py-3 border-b"
        style={{ backgroundColor: s.card, borderColor: s.line }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            data-testid="booking-close"
            onClick={onBackToWebsite}
            className={`${D.secondary} px-3 md:px-3.5 flex items-center gap-1.5 shrink-0 cursor-pointer`}
            style={{ backgroundColor: 'transparent', borderColor: s.chipLine, color: s.text }}
            aria-label={T['flow.close']}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{T['flow.close']}</span>
          </button>
          <div className="min-w-0 flex items-center gap-2">
            <span className="truncate text-sm md:text-base font-bold" style={nameStyle}>
              {salonName}
            </span>
            <SiteSalonStatus themeId={themeId} data={data} placement="booking" compact />
          </div>
        </div>
        <span
          className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
          style={{ backgroundColor: s.well, color: s.muted, border: `1px solid ${s.chipLine}`, borderRadius: 8 }}
        >
          {fillBookingText(T['step.of'], { current: stepIndex + 1, total: BOOKING_STEP_IDS.length })}
        </span>
      </header>

      {/* ---- stepper ---- */}
      <div
        data-testid="booking-stepper"
        className="shrink-0 px-4 md:px-6 py-3 border-b flex items-center gap-1.5 md:gap-2 overflow-x-auto"
        style={{ backgroundColor: s.page, borderColor: s.line }}
      >
        {BOOKING_STEP_IDS.map((id, index) => {
          const isDone = index < stepIndex;
          const isCurrent = index === stepIndex;
          const label = T[`step.${id}` as keyof typeof T];
          return (
            <React.Fragment key={id}>
              {index > 0 && <ChevronRight className="w-3 h-3 shrink-0" style={{ color: s.chipLine }} />}
              <button
                type="button"
                data-testid={`booking-step-${id}`}
                data-state={isDone ? 'done' : isCurrent ? 'current' : 'upcoming'}
                onClick={() => jumpToStep(id)}
                className={`${isDone ? D.stepChipDone : D.stepChip} px-2.5 md:px-3 py-1.5 flex items-center gap-1.5 whitespace-nowrap transition-colors ${isDone ? 'cursor-pointer' : isCurrent ? '' : 'cursor-default'}`}
                style={stepChipStyle(id)}
              >
                {isDone ? <Check className="w-3 h-3" /> : <span>{index + 1}</span>}
                <span className="hidden sm:inline">{label}</span>
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* ---- body ---- */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        <div
          data-testid="booking-body"
          className="max-w-5xl mx-auto w-full px-4 md:px-6 py-5 md:py-6 grid grid-cols-1 lg:grid-cols-12 gap-5"
        >
            {/* ===================== STEP 1 · SERVICE ===================== */}
            {step === 'service' && (
              <motion.div
                key="step-service"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-12 flex flex-col gap-4"
              >
                <div className="flex items-center gap-2.5">
                  {D.flourish(s)}
                  <div>
                    <h1 className={`text-lg md:text-xl ${D.stepTitle}`} style={{ color: s.textStrong }}>
                      {T['service.title']}
                    </h1>
                    <p className="text-[11px] mt-0.5 font-medium" style={{ color: s.muted }}>
                      {fillBookingText(T['service.subtitle'], { salon: salonName })}
                    </p>
                  </div>
                </div>

                {services.length === 0 ? (
                  <div
                    data-testid="booking-empty-services"
                    className={`${D.card} p-8 text-center text-xs font-semibold`}
                    style={{ backgroundColor: s.card, borderColor: s.line, color: s.muted }}
                  >
                    {T['service.empty']}
                  </div>
                ) : (
                  <>
                    {/* Category → service: isolated to the ACTIVE theme's list. */}
                    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                      <button
                        type="button"
                        data-testid="booking-category-all"
                        onClick={() => setCategoryFilter(null)}
                        className={`${D.chip} px-3 py-1.5 text-[10px] font-bold whitespace-nowrap transition-colors cursor-pointer`}
                        style={
                          categoryFilter === null
                            ? D.catSelectedStyle(s)
                            : { backgroundColor: s.chip, color: s.muted, borderColor: s.chipLine }
                        }
                      >
                        {T['service.allCategories']}
                      </button>
                      {categories.map((group) => (
                        <button
                          key={group.category}
                          type="button"
                          data-testid={`booking-category-${group.category}`}
                          onClick={() => setCategoryFilter(group.category)}
                          className={`${D.chip} px-3 py-1.5 text-[10px] font-bold whitespace-nowrap transition-colors cursor-pointer`}
                          style={
                            categoryFilter === group.category
                              ? D.catSelectedStyle(s)
                              : { backgroundColor: s.chip, color: s.muted, borderColor: s.chipLine }
                          }
                        >
                          {translateCategory(group.category, locale)}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {visibleServices.map((service, index) => {
                        const shown = displayService(service, locale);
                        const pricing = serviceDisplayPrice(service, data.offers);
                        const isSelected = service.id === selectedServiceId;
                        return (
                          <button
                            key={service.id}
                            type="button"
                            data-testid={`booking-service-${service.id}`}
                            data-selected={isSelected}
                            onClick={() => selectService(service)}
                            className={`${D.serviceRow} text-left p-3.5 md:p-4 flex gap-3 items-start transition-all cursor-pointer`}
                            style={{
                              backgroundColor: isSelected ? s.accentSoft : s.card,
                              borderColor: isSelected ? s.accent : s.line,
                            }}
                          >
                            <span
                              className={`${D.stepChipDone} w-7 h-7 shrink-0 flex items-center justify-center`}
                              style={{
                                backgroundColor: isSelected ? s.accent : s.chip,
                                color: isSelected ? s.accentText : s.muted,
                                borderColor: isSelected ? s.accent : s.chipLine,
                              }}
                            >
                              {isSelected ? <Check className="w-3.5 h-3.5" /> : String(index + 1).padStart(2, '0')}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs md:text-sm font-bold truncate" style={{ color: s.textStrong }}>
                                  {shown.name}
                                </span>
                                {(pricing.offer?.promotionalBadge || service.promotionalBadge) && (
                                  <span
                                    className="px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wide"
                                    style={{ backgroundColor: s.accentSoft, color: s.accent }}
                                  >
                                    {pricing.offer?.promotionalBadge || service.promotionalBadge}
                                  </span>
                                )}
                              </span>
                              <span className="block text-[10px] font-semibold mt-0.5 truncate" style={{ color: s.muted }}>
                                {translateCategory(service.category, locale)}
                                {shown.description ? ` · ${shown.description}` : ''}
                              </span>
                              <span className="mt-1.5 flex items-center gap-3">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold" style={{ color: s.muted }}>
                                  <Clock className="w-3 h-3" style={{ color: s.accent }} />
                                  {service.duration} {locale === 'hi' ? 'मिनट' : 'min'}
                                </span>
                                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold" style={{ color: s.accent }}>
                                  <CreditCard className="w-3 h-3" />
                                  {formatCurrency(pricing.finalPrice)}
                                </span>
                              </span>
                            </span>
                            <span
                              className="shrink-0 text-[9px] font-extrabold uppercase tracking-wider px-2 py-1 mt-0.5"
                              style={{ backgroundColor: isSelected ? s.accent : s.chip, color: isSelected ? s.accentText : s.muted }}
                            >
                              {isSelected ? T['service.selected'] : T['service.select']}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* ===================== STEP 2 · DATE ===================== */}
            {step === 'date' && (
              <motion.div
                key="step-date"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-12 flex flex-col gap-4"
              >
                <div className="flex items-center gap-2.5">
                  {D.flourish(s)}
                  <div>
                    <h1 className={`text-lg md:text-xl ${D.stepTitle}`} style={{ color: s.textStrong }}>
                      {T['date.title']}
                    </h1>
                    <p className="text-[11px] mt-0.5 font-medium" style={{ color: s.muted }}>
                      {T['date.subtitle']}
                    </p>
                  </div>
                </div>

                <div className={`${D.card} p-4 md:p-5`} style={{ backgroundColor: s.card, borderColor: s.line }}>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {days.map((day) => {
                      const isSelected = day.dateKey === selectedDateKey;
                      const dayName = dayLabel(day.weekday, locale);
                      const monthName = day.date.toLocaleDateString(locale === 'hi' ? 'hi-IN' : 'en-IN', { month: 'short' });
                      const reasonLabel =
                        day.reason === 'holiday'
                          ? T['date.holiday']
                          : day.reason === 'closed' || day.reason === 'outside-window' || day.reason === 'past'
                            ? T['date.closed']
                            : undefined;
                      return (
                        <button
                          key={day.dateKey}
                          type="button"
                          data-testid={`booking-date-${day.dateKey}`}
                          data-date-selectable={day.selectable}
                          data-date-reason={day.reason || 'ok'}
                          data-selected={isSelected}
                          disabled={!day.selectable}
                          onClick={() => selectDate(day)}
                          className={`${D.dateCard} flex flex-col items-center justify-center px-1 py-2.5 md:py-3 transition-all ${
                            day.selectable ? 'cursor-pointer' : 'cursor-not-allowed'
                          }`}
                          style={{
                            backgroundColor: isSelected ? s.accentSoft : s.card,
                            borderColor: isSelected ? s.accent : day.selectable ? s.chipLine : s.disabled,
                          }}
                        >
                          <span
                            className="text-[8px] md:text-[9px] font-extrabold uppercase tracking-wider truncate max-w-full"
                            style={{ color: isSelected ? s.accent : day.selectable ? s.muted : s.disabledText }}
                          >
                            {day.isToday ? T['date.today'] : dayName.slice(0, 3)}
                          </span>
                          <span
                            className="text-base md:text-lg font-black leading-tight my-0.5"
                            style={{ color: isSelected ? s.accent : day.selectable ? s.textStrong : s.disabledText }}
                          >
                            {day.date.getDate()}
                          </span>
                          <span
                            className="text-[8px] md:text-[9px] font-bold uppercase tracking-wider"
                            style={{ color: isSelected ? s.accent : day.selectable ? s.muted : s.disabledText }}
                          >
                            {monthName}
                          </span>
                          <span
                            className="text-[7px] md:text-[8px] font-bold uppercase tracking-wide truncate max-w-full mt-0.5"
                            style={{ color: s.disabledText }}
                          >
                            {day.reason === 'holiday' ? day.holiday?.name || reasonLabel : reasonLabel || ''}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {selectedDay && selectedDay.openLabel && selectedDay.closeLabel && (
                    <p className="mt-3 text-[10px] font-semibold flex items-center gap-1.5" style={{ color: s.muted }}>
                      <Clock className="w-3 h-3" style={{ color: s.accent }} />
                      {fillBookingText(T['time.openFrom'], { open: selectedDay.openLabel, close: selectedDay.closeLabel })}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* ===================== STEP 3 · TIME ===================== */}
            {step === 'time' && (
              <motion.div
                key="step-time"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-12 flex flex-col gap-4"
              >
                <div className="flex items-center gap-2.5">
                  {D.flourish(s)}
                  <div>
                    <h1 className={`text-lg md:text-xl ${D.stepTitle}`} style={{ color: s.textStrong }}>
                      {T['time.title']}
                    </h1>
                    <p className="text-[11px] mt-0.5 font-medium" style={{ color: s.muted }}>
                      {T['time.subtitle']}
                    </p>
                  </div>
                </div>

                <div className={`${D.card} p-4 md:p-5`} style={{ backgroundColor: s.card, borderColor: s.line }}>
                  <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                    <p className="text-xs font-bold" style={{ color: s.textStrong }}>
                      {selectedDate ? dateLabel(selectedDate) : ''}
                    </p>
                    {selectedDay?.openLabel && selectedDay?.closeLabel && (
                      <span
                        className="text-[10px] font-bold px-2 py-1"
                        style={{ backgroundColor: s.well, color: s.muted, borderRadius: 999 }}
                      >
                        {fillBookingText(T['time.openFrom'], { open: selectedDay.openLabel, close: selectedDay.closeLabel })}
                      </span>
                    )}
                  </div>

                  {slots.length === 0 ? (
                    <div
                      data-testid="booking-empty-slots"
                      className="p-6 text-center text-xs font-semibold"
                      style={{ color: s.muted }}
                    >
                      {T['time.noSlots']}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 md:gap-2.5">
                      {slots.map((slot) => {
                        const isSelected = slot.minutes === selectedSlotMinutes;
                        const disabled = slot.state === 'past' || slot.state === 'taken';
                        const held = slot.state === 'held';
                        return (
                          <button
                            key={slot.minutes}
                            type="button"
                            data-testid={`booking-slot-${slot.minutes}`}
                            data-slot-state={slot.state}
                            data-selected={isSelected}
                            disabled={disabled}
                            onClick={() => pickSlot(slot)}
                            className={`${D.slot} py-2.5 px-2 text-center transition-all ${
                              disabled ? 'cursor-not-allowed line-through' : 'cursor-pointer'
                            }`}
                            style={
                              disabled
                                ? { backgroundColor: s.disabled, borderColor: s.disabled, color: s.disabledText }
                                : isSelected
                                  ? { backgroundColor: s.accent, borderColor: s.accent, color: s.accentText }
                                  : { backgroundColor: held ? s.successSoft : s.card, borderColor: held ? s.success : s.chipLine, color: s.textStrong }
                            }
                          >
                            {slot.startLabel}
                            {held && !isSelected && (
                              <span className="block text-[7px] font-bold uppercase tracking-wide mt-0.5" style={{ color: s.success }}>
                                {T['time.heldByYou']}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {selectedSlot && !disabledSlot(selectedSlot) && (
                    <p className="mt-3 text-[10px] font-semibold flex items-start gap-1.5" style={{ color: s.muted }}>
                      <CalendarCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: s.success }} />
                      {T['time.holdNote']}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* ===================== STEP 4 · DETAILS ===================== */}
            {step === 'details' && (
              <motion.div
                key="step-details"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-12 flex flex-col gap-4"
              >
                <div className="flex items-center gap-2.5">
                  {D.flourish(s)}
                  <div>
                    <h1 className={`text-lg md:text-xl ${D.stepTitle}`} style={{ color: s.textStrong }}>
                      {T['details.title']}
                    </h1>
                    <p className="text-[11px] mt-0.5 font-medium" style={{ color: s.muted }}>
                      {T['details.subtitle']}
                    </p>
                  </div>
                </div>

                <div className={`${D.card} p-4 md:p-5 flex flex-col gap-4`} style={{ backgroundColor: s.card, borderColor: s.line }}>
                  <label className="flex flex-col gap-1.5">
                    <span className={D.label} style={{ color: s.muted }}>
                      {T['details.name']} <span style={{ color: s.danger }}>*</span>
                    </span>
                    <input
                      type="text"
                      data-testid="booking-input-name"
                      value={customer.name}
                      onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
                      placeholder={T['details.namePlaceholder']}
                      className={`${D.input} w-full px-3.5 py-2.5 text-xs font-semibold outline-none transition-colors`}
                      style={{
                        backgroundColor: s.well,
                        borderColor: formTouched && customerErrors.name ? s.danger : s.chipLine,
                        color: s.textStrong,
                      }}
                    />
                    {formTouched && customerErrors.name && (
                      <span className="text-[10px] font-bold" style={{ color: s.danger }}>
                        {T['details.errName']}
                      </span>
                    )}
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className={D.label} style={{ color: s.muted }}>
                      {T['details.mobile']} <span style={{ color: s.danger }}>*</span>
                    </span>
                    <div className="relative">
                      <Smartphone className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: s.accent }} />
                      <input
                        type="tel"
                        inputMode="numeric"
                        data-testid="booking-input-mobile"
                        value={customer.mobile}
                        onChange={(e) => setCustomer((c) => ({ ...c, mobile: e.target.value }))}
                        placeholder={T['details.mobilePlaceholder']}
                        className={`${D.input} w-full pl-9 pr-3.5 py-2.5 text-xs font-semibold outline-none transition-colors`}
                        style={{
                          backgroundColor: s.well,
                          borderColor: formTouched && customerErrors.mobile ? s.danger : s.chipLine,
                          color: s.textStrong,
                        }}
                      />
                    </div>
                    {formTouched && customerErrors.mobile && (
                      <span className="text-[10px] font-bold" style={{ color: s.danger }}>
                        {T['details.errMobile']}
                      </span>
                    )}
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className={D.label} style={{ color: s.muted }}>
                      {T['details.email']}
                    </span>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: s.accent }} />
                      <input
                        type="email"
                        data-testid="booking-input-email"
                        value={customer.email}
                        onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))}
                        placeholder={T['details.emailPlaceholder']}
                        className={`${D.input} w-full pl-9 pr-3.5 py-2.5 text-xs font-semibold outline-none transition-colors`}
                        style={{
                          backgroundColor: s.well,
                          borderColor: formTouched && customerErrors.email ? s.danger : s.chipLine,
                          color: s.textStrong,
                        }}
                      />
                    </div>
                    {formTouched && customerErrors.email && (
                      <span className="text-[10px] font-bold" style={{ color: s.danger }}>
                        {T['details.errEmail']}
                      </span>
                    )}
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className={D.label} style={{ color: s.muted }}>
                      {T['details.notes']}
                    </span>
                    <div className="relative">
                      <MessageSquare className="w-3.5 h-3.5 absolute left-3.5 top-3" style={{ color: s.accent }} />
                      <textarea
                        rows={3}
                        data-testid="booking-input-notes"
                        value={customer.notes}
                        onChange={(e) => setCustomer((c) => ({ ...c, notes: e.target.value }))}
                        placeholder={T['details.notesPlaceholder']}
                        className={`${D.input} w-full pl-9 pr-3.5 py-2.5 text-xs font-semibold outline-none resize-none transition-colors`}
                        style={{ backgroundColor: s.well, borderColor: s.chipLine, color: s.textStrong }}
                      />
                    </div>
                  </label>
                </div>
              </motion.div>
            )}

            {/* ===================== STEP 5 · SUMMARY ===================== */}
            {step === 'summary' && (
              <motion.div
                key="step-summary"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-12 flex flex-col gap-4"
              >
                <div className="flex items-center gap-2.5">
                  {D.flourish(s)}
                  <div>
                    <h1 className={`text-lg md:text-xl ${D.stepTitle}`} style={{ color: s.textStrong }}>
                      {T['summary.title']}
                    </h1>
                    <p className="text-[11px] mt-0.5 font-medium" style={{ color: s.muted }}>
                      {T['summary.subtitle']}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className={`${D.card} p-4 md:p-5 flex flex-col gap-1`} style={{ backgroundColor: s.card, borderColor: s.line }}>
                    <div className="flex items-center justify-between mb-1">
                      <h2 className={D.sectionTitle} style={{ color: s.accent }}>
                        {T['summary.service']}
                      </h2>
                      <button
                        type="button"
                        data-testid="booking-summary-edit-service"
                        onClick={() => setStep('service')}
                        className="text-[10px] font-extrabold uppercase tracking-wider cursor-pointer"
                        style={{ color: s.accent }}
                      >
                        {T['summary.change']}
                      </button>
                    </div>
                    {summaryLine(
                      <Sparkles className="w-3.5 h-3.5" />,
                      T['summary.service'],
                      serviceDisplay?.name || '—',
                    )}
                    {summaryLine(
                      <Check className="w-3.5 h-3.5" />,
                      T['summary.category'],
                      serviceDisplay ? translateCategory(serviceDisplay.category, locale) : '—',
                    )}
                    {summaryLine(<Clock className="w-3.5 h-3.5" />, T['summary.duration'], `${serviceDuration} ${locale === 'hi' ? 'मिनट' : 'min'}`)}
                    {summaryLine(
                      <CreditCard className="w-3.5 h-3.5" />,
                      T['summary.price'],
                      servicePricing ? formatCurrency(servicePricing.finalPrice) : '—',
                    )}
                  </div>

                  <div className={`${D.card} p-4 md:p-5 flex flex-col gap-1`} style={{ backgroundColor: s.card, borderColor: s.line }}>
                    <div className="flex items-center justify-between mb-1">
                      <h2 className={D.sectionTitle} style={{ color: s.accent }}>
                        {T['step.time']}
                      </h2>
                      <button
                        type="button"
                        data-testid="booking-summary-edit-time"
                        onClick={() => setStep('date')}
                        className="text-[10px] font-extrabold uppercase tracking-wider cursor-pointer"
                        style={{ color: s.accent }}
                      >
                        {T['summary.change']}
                      </button>
                    </div>
                    {summaryLine(<Calendar className="w-3.5 h-3.5" />, T['summary.date'], selectedDate ? dateLabel(selectedDate) : '—')}
                    {summaryLine(<Clock className="w-3.5 h-3.5" />, T['summary.time'], selectedSlot ? `${selectedSlot.startLabel} – ${selectedSlot.endLabel}` : '—')}
                    {summaryLine(<User className="w-3.5 h-3.5" />, T['summary.salon'], salonName)}
                  </div>

                  <div className={`${D.card} p-4 md:p-5 flex flex-col gap-1`} style={{ backgroundColor: s.card, borderColor: s.line }}>
                    <div className="flex items-center justify-between mb-1">
                      <h2 className={D.sectionTitle} style={{ color: s.accent }}>
                        {T['summary.customer']}
                      </h2>
                      <button
                        type="button"
                        data-testid="booking-summary-edit-details"
                        onClick={() => setStep('details')}
                        className="text-[10px] font-extrabold uppercase tracking-wider cursor-pointer"
                        style={{ color: s.accent }}
                      >
                        {T['summary.change']}
                      </button>
                    </div>
                    {summaryLine(<User className="w-3.5 h-3.5" />, T['details.name'], customer.name)}
                    {summaryLine(<Phone className="w-3.5 h-3.5" />, T['summary.mobile'], customer.mobile)}
                    {summaryLine(
                      <Mail className="w-3.5 h-3.5" />,
                      T['summary.email'],
                      customer.email || T['summary.notProvided'],
                    )}
                    {summaryLine(
                      <MessageSquare className="w-3.5 h-3.5" />,
                      T['summary.notes'],
                      customer.notes || T['summary.notProvided'],
                    )}
                  </div>

                  <div className={`${D.card} p-4 md:p-5 flex flex-col gap-2`} style={{ backgroundColor: s.well, borderColor: s.line }}>
                    <h2 className={D.sectionTitle} style={{ color: s.accent }}>
                      {T['summary.price']}
                    </h2>
                    <div className="flex items-center justify-between text-sm font-extrabold" style={{ color: s.textStrong }}>
                      <span>{serviceDisplay?.name || '—'}</span>
                      <span>{servicePricing ? formatCurrency(servicePricing.finalPrice) : '—'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold" style={{ color: s.muted }}>
                      <span>{T['summary.payAtSalon']}</span>
                      <span>{servicePricing ? formatCurrency(servicePricing.finalPrice) : '—'}</span>
                    </div>
                    <p
                      className="text-[10px] font-semibold mt-2 p-2.5 border"
                      style={{
                        backgroundColor: s.card,
                        borderColor: s.chipLine,
                        color: s.muted,
                        borderRadius: 10,
                      }}
                    >
                      {T['summary.confirmNote']}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
        </div>
      </div>

      {/* ---- sticky action bar (mobile-first) ---- */}
      <div
        className="shrink-0 border-t px-4 md:px-6 py-3 flex items-center justify-between gap-3"
        style={{ backgroundColor: s.card, borderColor: s.line }}
      >
        <button
          type="button"
          data-testid="booking-back"
          onClick={goBack}
          disabled={step === 'service'}
          className={`${D.secondary} px-4 flex items-center gap-1.5 ${step === 'service' ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
          style={{ backgroundColor: 'transparent', borderColor: s.chipLine, color: s.text }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {T.back}
        </button>

        {step === 'summary' ? (
          <button
            type="button"
            data-testid="booking-confirm"
            onClick={() => {
              toast('summary.confirmNote');
            }}
            className={`${D.primary} px-6 md:px-8 flex items-center gap-2 cursor-pointer`}
            style={D.primaryStyle(s)}
          >
            <CalendarCheck className="w-4 h-4" />
            {T.confirm}
          </button>
        ) : (
          <button
            type="button"
            data-testid="booking-continue"
            onClick={goNext}
            disabled={!canContinue}
            className={`${D.primary} px-6 md:px-8 flex items-center gap-2`}
            style={primaryBtnStyle}
          >
            {T.continue}
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/** Slot that the visitor may still book (available or their own hold). */
function disabledSlot(slot: BookingSlot): boolean {
  return slot.state === 'past' || slot.state === 'taken';
}
