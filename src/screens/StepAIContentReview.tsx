import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SalonData, ReviewedContent } from '../types';
import TemplateRenderer from '../components/TemplateRenderer';
import { ArrowLeft, ArrowRight, Sparkles, Wand2, Type, Monitor, Smartphone, Save, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  data: SalonData;
  setData: React.Dispatch<React.SetStateAction<SalonData>>;
  onNext: () => void;
  onPrev: () => void;
  onSave?: () => void;
}

type ActiveField = 'hero' | 'tagline' | 'about' | 'owner' | 'services' | 'booking' | null;

export default function StepAIContentReview({ data, setData, onNext, onPrev, onSave }: Props) {
  const [activeField, setActiveField] = useState<ActiveField>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [mode, setMode] = useState<'desktop' | 'mobile'>('desktop');
  const saveTimer = useRef<number | null>(null);

  // Initialize reviewed content from saved data if not present
  const reviewed: ReviewedContent = data.reviewedContent || {
    heroHeadline: data.salonName || 'Welcome to our salon',
    tagline: data.tagline || '',
    about: data.about || '',
    ownerIntro: data.ownerRole ? `${data.ownerName} — ${data.ownerRole}. ${data.about?.slice(0, 120) || ''}` : `${data.ownerName || 'Owner'} is dedicated to premium care.`,
    serviceDescriptions: {},
    bookingCTA: 'Ready to Transform Your Look? Book your appointment today.'
  };

  // Ensure serviceDescriptions contains entries for existing services
  useEffect(() => {
    if (!data.reviewedContent) {
      const svcDesc: Record<string, string> = {};
      data.services.forEach(s => {
        svcDesc[s.id] = s.description;
      });
      const initial: ReviewedContent = {
        heroHeadline: data.salonName,
        tagline: data.tagline,
        about: data.about,
        ownerIntro: `${data.ownerName} is ${data.ownerRole || 'Founder'}. Passionate about delivering luxury hair and beauty experiences.`,
        serviceDescriptions: svcDesc,
        bookingCTA: 'Ready to Transform Your Look? Book your appointment today and experience premium care.'
      };
      setData(prev => ({ ...prev, reviewedContent: initial }));
    } else {
      // sync missing service descriptions
      const missing: Record<string, string> = { ...data.reviewedContent.serviceDescriptions };
      let changed = false;
      data.services.forEach(s => {
        if (!missing[s.id]) {
          missing[s.id] = s.description;
          changed = true;
        }
      });
      if (changed) {
        setData(prev => ({
          ...prev,
          reviewedContent: prev.reviewedContent ? { ...prev.reviewedContent, serviceDescriptions: missing } : prev.reviewedContent
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerAutoSave = useCallback((updated: ReviewedContent) => {
    setSaveStatus('saving');
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      setData(prev => ({ ...prev, reviewedContent: updated, lastCompletedStep: Math.max(prev.lastCompletedStep || 0, 11) }));
      if (onSave) onSave();
      setSaveStatus('saved');
    }, 600) as unknown as number;
  }, [setData, onSave]);

  const updateField = (field: keyof ReviewedContent, value: any) => {
    const updated = { ...reviewed, [field]: value } as ReviewedContent;
    // immediate UI
    setData(prev => ({ ...prev, reviewedContent: updated }));
    triggerAutoSave(updated);
  };

  const updateServiceDesc = (serviceId: string, value: string) => {
    const updatedDescs = { ...reviewed.serviceDescriptions, [serviceId]: value };
    const updated = { ...reviewed, serviceDescriptions: updatedDescs };
    setData(prev => ({ ...prev, reviewedContent: updated }));
    triggerAutoSave(updated);
  };

  // AI mock improvements
  const improveWithAI = (text: string) => {
    if (!text) return text;
    const suffixes = [
      " — curated with expert artistry, premium products, and personalized care for a flawless finish that lasts.",
      " Experience luxury, precision, and warmth in every visit — designed to make you look and feel your absolute best.",
      " Crafted by Nexora AI to captivate your clients and reflect your salon's signature elegance and professionalism.",
    ];
    const pick = suffixes[Math.floor(Math.random() * suffixes.length)];
    // if already improved, make slightly different
    if (text.includes('Nexora AI') || text.includes('Experience luxury')) {
      return text + " ✨";
    }
    return text.trim() + pick;
  };

  const makeSimpler = (text: string) => {
    if (!text) return text;
    // take first sentence or shorten to ~120 chars
    const firstSentence = text.split(/[.!?]/)[0];
    if (firstSentence.length > 20 && firstSentence.length < 140) return firstSentence.trim() + '.';
    return text.slice(0, 120).trim().replace(/[^a-zA-Z0-9\s]+$/, '') + '.';
  };

  const handleImprove = (field: keyof ReviewedContent) => {
    if (field === 'serviceDescriptions') return;
    const current = (reviewed[field] as string) || '';
    const improved = improveWithAI(current);
    updateField(field, improved);
  };

  const handleSimplify = (field: keyof ReviewedContent) => {
    if (field === 'serviceDescriptions') return;
    const current = (reviewed[field] as string) || '';
    const simple = makeSimpler(current);
    updateField(field, simple);
  };

  // Merge data for preview: use reviewed content to override
  const previewData: SalonData = {
    ...data,
    salonName: reviewed.heroHeadline || data.salonName,
    tagline: reviewed.tagline || data.tagline,
    about: reviewed.about || data.about,
    // we will inject owner intro via bio override? For preview, we'll keep data but TemplateRenderer uses data.about and tagline.
    // For services, override descriptions
    services: data.services.map(s => ({
      ...s,
      description: reviewed.serviceDescriptions?.[s.id] || s.description
    })),
    // keep bookingCTA considered in preview later, but we show as extra note
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-[#f9f9f9]">
      {/* LEFT 55%: Content review/edit */}
      <div className="w-full md:w-[55%] h-full flex flex-col relative bg-white border-r border-gray-200">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
          <div className="max-w-2xl mx-auto pb-28 space-y-8">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ac0053]">
                  <Sparkles className="w-4 h-4" /> STEP 12 • AI CONTENT REVIEW
                </div>
                <div className="flex items-center gap-2 text-xs font-medium">
                  {saveStatus === 'saving' ? (
                    <span className="flex items-center gap-1.5 text-[#ac0053] bg-[#ffd9e1]/30 px-2.5 py-1 rounded-full"><Save className="w-3.5 h-3.5 animate-pulse" /> Saving…</span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200"><CheckCircle2 className="w-3.5 h-3.5" /> Saved ✓</span>
                  )}
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#1a1c1c]">Review AI-generated content</h1>
              <p className="text-sm text-[#5f5e5e] leading-relaxed">Nexora created your website text from your saved salon data. Review and edit before final preview. Changes appear instantly on the right.</p>
            </div>

            {/* Hero Headline */}
            <div className={`bg-white rounded-2xl border p-5 shadow-sm space-y-3 transition-all ${activeField === 'hero' ? 'border-[#ac0053] ring-2 ring-[#ac0053]/20' : 'border-gray-200'}`}>
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-2"><Type className="w-4 h-4 text-[#ac0053]" /> Hero Headline</label>
                <div className="flex gap-2">
                  <button onClick={() => handleImprove('heroHeadline')} className="text-[11px] font-semibold text-[#ac0053] hover:bg-[#ffd9e1]/40 px-2 py-1 rounded flex items-center gap-1"><Wand2 className="w-3 h-3" /> Improve with AI</button>
                  <button onClick={() => handleSimplify('heroHeadline')} className="text-[11px] font-semibold text-gray-500 hover:bg-gray-100 px-2 py-1 rounded">Make it simpler</button>
                </div>
              </div>
              <input
                type="text"
                value={reviewed.heroHeadline}
                onFocus={() => setActiveField('hero')}
                onChange={e => updateField('heroHeadline', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#ac0053] outline-none text-sm font-semibold text-gray-900 transition-colors"
                placeholder="Your salon name / hero headline"
              />
              <p className="text-[11px] text-gray-400">Focuses Hero section in live preview.</p>
            </div>

            {/* Tagline */}
            <div className={`bg-white rounded-2xl border p-5 shadow-sm space-y-3 transition-all ${activeField === 'tagline' ? 'border-[#ac0053] ring-2 ring-[#ac0053]/20' : 'border-gray-200'}`}>
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-800">Tagline</label>
                <div className="flex gap-2">
                  <button onClick={() => handleImprove('tagline')} className="text-[11px] font-semibold text-[#ac0053] hover:bg-[#ffd9e1]/40 px-2 py-1 rounded flex items-center gap-1"><Wand2 className="w-3 h-3" /> Improve with AI</button>
                  <button onClick={() => handleSimplify('tagline')} className="text-[11px] font-semibold text-gray-500 hover:bg-gray-100 px-2 py-1 rounded">Make it simpler</button>
                </div>
              </div>
              <input
                type="text"
                value={reviewed.tagline}
                onFocus={() => setActiveField('tagline')}
                onChange={e => updateField('tagline', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#ac0053] outline-none text-sm text-gray-900 transition-colors"
                placeholder="Premium Hair, Beauty & Spa Care"
              />
              <p className="text-[11px] text-gray-400">Visible in Hero subtitle.</p>
            </div>

            {/* About */}
            <div className={`bg-white rounded-2xl border p-5 shadow-sm space-y-3 transition-all ${activeField === 'about' ? 'border-[#ac0053] ring-2 ring-[#ac0053]/20' : 'border-gray-200'}`}>
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-800">About Salon</label>
                <div className="flex gap-2">
                  <button onClick={() => handleImprove('about')} className="text-[11px] font-semibold text-[#ac0053] hover:bg-[#ffd9e1]/40 px-2 py-1 rounded flex items-center gap-1"><Wand2 className="w-3 h-3" /> Improve with AI</button>
                  <button onClick={() => handleSimplify('about')} className="text-[11px] font-semibold text-gray-500 hover:bg-gray-100 px-2 py-1 rounded">Make it simpler</button>
                </div>
              </div>
              <textarea
                rows={4}
                value={reviewed.about}
                onFocus={() => setActiveField('about')}
                onChange={e => updateField('about', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#ac0053] outline-none text-sm text-gray-800 resize-none leading-relaxed"
                placeholder="Tell customers about your salon..."
              />
            </div>

            {/* Owner Intro */}
            <div className={`bg-white rounded-2xl border p-5 shadow-sm space-y-3 transition-all ${activeField === 'owner' ? 'border-[#ac0053] ring-2 ring-[#ac0053]/20' : 'border-gray-200'}`}>
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-800">Owner / Founder Intro</label>
                <div className="flex gap-2">
                  <button onClick={() => handleImprove('ownerIntro')} className="text-[11px] font-semibold text-[#ac0053] hover:bg-[#ffd9e1]/40 px-2 py-1 rounded flex items-center gap-1"><Wand2 className="w-3 h-3" /> Improve with AI</button>
                  <button onClick={() => handleSimplify('ownerIntro')} className="text-[11px] font-semibold text-gray-500 hover:bg-gray-100 px-2 py-1 rounded">Make it simpler</button>
                </div>
              </div>
              <textarea
                rows={3}
                value={reviewed.ownerIntro}
                onFocus={() => setActiveField('owner')}
                onChange={e => updateField('ownerIntro', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#ac0053] outline-none text-sm text-gray-800 resize-none"
                placeholder="Founder intro..."
              />
              <p className="text-[11px] text-gray-400">Shown in About / Owner section. Focuses Owner section.</p>
            </div>

            {/* Service Descriptions */}
            <div className={`bg-white rounded-2xl border p-5 shadow-sm space-y-4 transition-all ${activeField === 'services' ? 'border-[#ac0053] ring-2 ring-[#ac0053]/20' : 'border-gray-200'}`}>
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-800">Service Descriptions</label>
                <span className="text-[11px] bg-gray-100 px-2 py-1 rounded-full text-gray-600">{data.services.length} services</span>
              </div>
              <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                {data.services.map(s => (
                  <div key={s.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-900">{s.name}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            const curr = reviewed.serviceDescriptions[s.id] || s.description;
                            updateServiceDesc(s.id, improveWithAI(curr));
                            setActiveField('services');
                          }}
                          className="text-[10px] text-[#ac0053] hover:bg-[#ffd9e1]/30 px-1.5 py-0.5 rounded">AI ✨</button>
                        <button
                          onClick={() => {
                            const curr = reviewed.serviceDescriptions[s.id] || s.description;
                            updateServiceDesc(s.id, makeSimpler(curr));
                            setActiveField('services');
                          }}
                          className="text-[10px] text-gray-500 hover:bg-gray-100 px-1.5 py-0.5 rounded">Simple</button>
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      value={reviewed.serviceDescriptions[s.id] || ''}
                      onFocus={() => setActiveField('services')}
                      onChange={e => updateServiceDesc(s.id, e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#ac0053] outline-none text-xs text-gray-700 resize-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Booking CTA */}
            <div className={`bg-white rounded-2xl border p-5 shadow-sm space-y-3 transition-all ${activeField === 'booking' ? 'border-[#ac0053] ring-2 ring-[#ac0053]/20' : 'border-gray-200'}`}>
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-800">Booking CTA Text</label>
                <div className="flex gap-2">
                  <button onClick={() => handleImprove('bookingCTA')} className="text-[11px] font-semibold text-[#ac0053] hover:bg-[#ffd9e1]/40 px-2 py-1 rounded flex items-center gap-1"><Wand2 className="w-3 h-3" /> Improve with AI</button>
                  <button onClick={() => handleSimplify('bookingCTA')} className="text-[11px] font-semibold text-gray-500 hover:bg-gray-100 px-2 py-1 rounded">Make it simpler</button>
                </div>
              </div>
              <textarea
                rows={2}
                value={reviewed.bookingCTA}
                onFocus={() => setActiveField('booking')}
                onChange={e => updateField('bookingCTA', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#ac0053] outline-none text-sm text-gray-800 resize-none"
                placeholder="Book your appointment today..."
              />
            </div>

            <div className="bg-[#ffd9e1]/20 border border-[#ac0053]/20 rounded-xl p-4 text-xs text-[#80003c] leading-relaxed">
              <strong className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> Auto-save active:</strong> All edits are saved automatically. Preview updates instantly when you focus a field — Hero, About, Services, Owner, Booking.
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="absolute bottom-0 left-0 w-full p-4 bg-white border-t border-gray-200 flex justify-between items-center z-10 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
          <button onClick={onPrev} className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-xs hover:bg-gray-50 flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <span className="hidden sm:block text-xs text-gray-400">Step 12 of 15 • AI Content Review</span>
          <button onClick={onNext} className="px-6 py-2.5 rounded-xl bg-[#ac0053] text-white font-semibold text-xs hover:bg-[#ba005b] flex items-center gap-2 shadow-sm">
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        </footer>
      </div>

      {/* RIGHT 45%: LIVE WEBSITE PREVIEW */}
      <div className="hidden md:flex w-[45%] h-full bg-gray-100 flex-col">
        <div className="h-14 border-b border-gray-200 bg-white/90 backdrop-blur flex items-center justify-between px-5 shrink-0">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Live Website Preview</span>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button onClick={() => setMode('desktop')} className={`px-3 py-1 rounded-md flex items-center gap-1.5 text-xs font-medium ${mode === 'desktop' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}><Monitor className="w-3.5 h-3.5" /> Desktop</button>
              <button onClick={() => setMode('mobile')} className={`px-3 py-1 rounded-md flex items-center gap-1.5 text-xs font-medium ${mode === 'mobile' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}><Smartphone className="w-3.5 h-3.5" /> Mobile</button>
            </div>
          </div>
        </div>
        {/* Focus indicator */}
        {activeField && (
          <div className="px-5 py-2 bg-[#ac0053]/10 text-[#ac0053] text-[11px] font-semibold border-b border-[#ac0053]/20 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ac0053] animate-pulse" /> Focusing: {activeField === 'hero' ? 'Hero Section' : activeField === 'tagline' ? 'Hero Tagline' : activeField === 'about' ? 'About Section' : activeField === 'owner' ? 'Owner / About Section' : activeField === 'services' ? 'Services Section' : 'Booking CTA Section'}
          </div>
        )}
        <div className="flex-1 overflow-hidden p-3 bg-[radial-gradient(#e5e2e1_1px,transparent_1px)] [background-size:16px_16px] relative">
          <motion.div key={activeField + mode + reviewed.heroHeadline} initial={{ opacity: 0.8 }} animate={{ opacity: 1 }} className="w-full h-full flex justify-center">
            <div className="w-full h-full overflow-auto">
              <TemplateRenderer data={previewData} mode={mode} />
              {/* Extra overlay for focused section highlight in preview - we rely on scroll? For simplicity show banner for booking CTA */}
              {activeField === 'booking' && (
                <div className="mt-4 mx-4 p-3 bg-[#ac0053] text-white rounded-xl text-xs font-semibold text-center shadow-lg">
                  {reviewed.bookingCTA}
                </div>
              )}
              {activeField === 'owner' && (
                <div className="mt-4 mx-4 p-4 bg-white border border-[#ac0053]/20 rounded-xl text-xs text-gray-700 italic">
                  "{reviewed.ownerIntro}"
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
