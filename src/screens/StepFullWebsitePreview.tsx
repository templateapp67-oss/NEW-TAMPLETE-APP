import React, { useState, useRef } from 'react';
import { SalonData } from '../types';
import TemplateRenderer from '../components/TemplateRenderer';
import { ArrowLeft, ArrowRight, Monitor, Smartphone, Eye, Sparkles, Layout, Sun, Moon } from 'lucide-react';

interface Props {
  data: SalonData;
  setData: React.Dispatch<React.SetStateAction<SalonData>>;
  onNext: () => void;
  onPrev: () => void;
  onSave?: () => void;
  onEditSection?: (section: string) => void;
}

export default function StepFullWebsitePreview({ data, onNext, onPrev }: Props) {
  const [mode, setMode] = useState<'desktop' | 'mobile'>('desktop');
  const previewRef = useRef<HTMLDivElement>(null);

  const previewData: SalonData = {
    ...data,
    salonName: data.reviewedContent?.heroHeadline || data.salonName,
    tagline: data.reviewedContent?.tagline || data.tagline,
    about: data.reviewedContent?.about || data.about,
    services: data.services.map(s => ({
      ...s,
      description: data.reviewedContent?.serviceDescriptions?.[s.id] || s.description
    }))
  };

  const isDark = data.websiteAppearance === 'dark';

  const scrollToSection = (id: string) => {
    if (!previewRef.current) return;
    const el = previewRef.current.querySelector(`[data-section="${id}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const appearanceLabel = isDark ? 'Dark' : 'Light';

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#f9f9f9]">
      {/* Header bar */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ac0053]">
            <Eye className="w-4 h-4" /> STEP 13 • FULL WEBSITE PREVIEW
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-gray-500 border-l border-gray-200 pl-4">
            <Layout className="w-3.5 h-3.5" /> {previewData.templateId} template • {appearanceLabel} • {previewData.services.length} services • {previewData.team.length} team
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
            <button
              onClick={() => setMode('desktop')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-xs font-medium transition-colors ${mode === 'desktop' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <Monitor className="w-3.5 h-3.5" /> Desktop
            </button>
            <button
              onClick={() => setMode('mobile')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-xs font-medium transition-colors ${mode === 'mobile' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <Smartphone className="w-3.5 h-3.5" /> Mobile
            </button>
          </div>
        </div>
      </div>

      {/* Info strip */}
      <div className="bg-[#3f001a] text-white px-6 py-2 flex items-center justify-between text-xs shrink-0">
        <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#ffb1c4]" /> Full scrollable preview — this is exactly how your website will look to customers. Hide empty sections automatically.</span>
        <span className="hidden md:flex items-center gap-2 text-[#ffd9e1]"><span className={`w-2 h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-emerald-400'}`} /> {appearanceLabel} appearance active</span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left quick nav - desktop */}
        <div className="hidden lg:flex w-56 shrink-0 bg-white border-r border-gray-200 flex-col p-4 overflow-y-auto">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Jump to section</h3>
          <div className="space-y-1">
            {[
              { id: 'header', label: 'Header' },
              { id: 'hero', label: 'Hero' },
              { id: 'services', label: 'Services' },
              { id: 'packages', label: 'Packages' },
              { id: 'owner', label: 'Owner / About' },
              { id: 'team', label: 'Team' },
              { id: 'gallery', label: 'Gallery' },
              { id: 'social', label: 'Social Videos' },
              { id: 'location', label: 'Location' },
              { id: 'hours', label: 'Opening Hours' },
              { id: 'contact', label: 'Contact' },
              { id: 'booking', label: 'Booking CTA' },
              { id: 'footer', label: 'Footer' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-[#ffd9e1]/30 hover:text-[#ac0053] transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="mt-6 p-3 bg-gray-50 rounded-xl border border-gray-200 text-[11px] text-gray-600">
            <p className="font-bold text-gray-900 mb-1">What's included?</p>
            <p>• Header, Hero, Services, Packages, Owner, Team, Gallery, Social, Location, Hours, Contact, CTA, Footer</p>
            <p className="mt-2">Empty sections are hidden.</p>
          </div>
        </div>

        {/* Center preview canvas */}
        <div className="flex-1 bg-gray-100 overflow-hidden p-4 md:p-6 flex flex-col relative">
          <div ref={previewRef} className={`flex-1 overflow-y-auto flex justify-start custom-scrollbar ${isDark ? 'bg-zinc-900' : 'bg-white'} rounded-xl border shadow-sm`}>
            {/* Wrap TemplateRenderer inside markers for scroll */}
            <div className="w-full">
              <div data-section="header"><TemplateRenderer data={previewData} mode={mode} /></div>
              {/* Since TemplateRenderer already includes all sections, we will also show extra note about reviewed booking CTA if different */}
              {previewData.reviewedContent?.bookingCTA && (
                <div data-section="booking" className={`px-6 py-6 text-center border-t ${isDark ? 'bg-zinc-950 text-white border-zinc-800' : 'bg-white border-gray-100'}`}>
                  <p className="text-sm font-semibold">{previewData.reviewedContent?.bookingCTA || previewData.reviewedContent?.bookingCTA}</p>
                </div>
              )}
            </div>
          </div>

          {/* Floating edit hints */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur border border-gray-200 shadow-lg rounded-full px-4 py-2 text-xs font-medium text-gray-600 flex items-center gap-2">
            <Sun className="w-3.5 h-3.5" /> Preview uses {appearanceLabel} appearance • {mode} • Scroll to review full website
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="h-[72px] bg-white border-t border-gray-200 flex items-center justify-between px-6 shrink-0">
        <button onClick={onPrev} className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-xs hover:bg-gray-50 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Content Review
        </button>
        <span className="hidden md:block text-xs text-gray-400">Step 13 of 15 • Full Website Preview</span>
        <button onClick={onNext} className="px-8 py-2.5 rounded-xl bg-[#ac0053] text-white font-semibold text-xs hover:bg-[#ba005b] flex items-center gap-2 shadow-sm">
          Continue to Publish Setup <ArrowRight className="w-4 h-4" />
        </button>
      </footer>
    </div>
  );
}
