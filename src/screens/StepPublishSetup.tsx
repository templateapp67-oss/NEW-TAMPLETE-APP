import React, { useState, useEffect } from 'react';
import { SalonData } from '../types';
import { ArrowLeft, ArrowRight, Globe, CheckCircle2, Link2, AlertCircle, Sparkles, ExternalLink } from 'lucide-react';

interface Props {
  data: SalonData;
  setData: React.Dispatch<React.SetStateAction<SalonData>>;
  onNext: () => void;
  onPrev: () => void;
  onSave?: () => void;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);
}

export default function StepPublishSetup({ data, setData, onNext, onPrev, onSave }: Props) {
  const [slug, setSlug] = useState<string>(data.websiteSlug || slugify(data.salonName) || 'royal-hair-studio');
  const [editingSlug, setEditingSlug] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (!data.websiteSlug) {
      const generated = slugify(data.salonName) || 'royal-hair-studio';
      setSlug(generated);
    }
  }, [data.salonName, data.websiteSlug]);

  useEffect(() => {
    setData(prev => ({ ...prev, websiteSlug: slug }));
  }, [slug, setData]);

  const previewUrl = `nexora.site/${slug}`;
  const fullUrl = `https://${previewUrl}`;

  // Checklist logic
  const checks = [
    { label: 'Business details added', done: !!(data.salonName && (data.tagline || data.about)) },
    { label: 'Services added', done: data.services && data.services.length > 0 },
    { label: 'Contact details added', done: !!(data.phone && data.email) },
    { label: 'Template selected', done: !!data.templateId },
    { label: 'Website appearance selected', done: !!data.websiteAppearance },
    { label: 'Preview reviewed', done: !!(data.reviewedContent && data.lastCompletedStep && data.lastCompletedStep >= 12) },
  ];

  const allRequiredDone = checks.slice(0, 4).every(c => c.done); // first 4 required, others optional
  const optionalMissing = checks.slice(4).filter(c => !c.done).length;

  const handlePublish = () => {
    setPublishing(true);
    // Save appearance in background already done, now simulate publishing
    setData(prev => ({ ...prev, publishState: 'publishing', publishedUrl: fullUrl, websiteSlug: slug }));
    if (onSave) onSave();
    setTimeout(() => {
      setData(prev => ({ ...prev, publishState: 'published', publishedUrl: fullUrl, lastCompletedStep: 14 }));
      if (onSave) onSave();
      setPublishing(false);
      onNext(); // go to Step 15
    }, 1200);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#f9f9f9]">
      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-3xl mx-auto pb-28 space-y-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ac0053]">
              <Globe className="w-4 h-4" /> STEP 14 • PUBLISH SETUP
            </div>
            <h1 className="text-3xl font-bold text-[#1a1c1c]">Prepare your website for publishing</h1>
            <p className="text-sm text-[#5f5e5e]">Review your URL and checklist. Optional sections won’t block publishing.</p>
          </div>

          {/* URL Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#1a1c1c] flex items-center gap-2"><Link2 className="w-5 h-5 text-[#ac0053]" /> Website Address</h2>
              <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Ready to publish</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-gray-600 w-28">Website Name</label>
                <div className="flex-1 text-sm font-semibold text-gray-900">{data.salonName}</div>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-gray-600 w-28">Slug</label>
                <div className="flex-1 flex items-center gap-2">
                  {editingSlug ? (
                    <input
                      value={slug}
                      onChange={e => setSlug(slugify(e.target.value))}
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#ac0053] outline-none text-sm"
                      autoFocus
                      onBlur={() => setEditingSlug(false)}
                      onKeyDown={e => e.key === 'Enter' && setEditingSlug(false)}
                    />
                  ) : (
                    <div className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm font-mono text-gray-800 flex items-center justify-between">
                      <span>{slug}</span>
                      <button onClick={() => setEditingSlug(true)} className="text-xs text-[#ac0053] font-semibold hover:underline">Edit</button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-gray-600 w-28">Preview URL</label>
                <a href={fullUrl} target="_blank" rel="noreferrer" className="flex-1 px-3 py-2 rounded-lg bg-[#ffd9e1]/20 border border-[#ac0053]/20 text-sm font-mono text-[#ac0053] flex items-center justify-between hover:bg-[#ffd9e1]/40 transition-colors">
                  <span>{previewUrl}</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 text-[11px] text-gray-500 leading-relaxed">
                Example: If your salon is <strong>Royal Hair Studio</strong>, slug becomes <strong>royal-hair-studio</strong> and URL is <strong>nexora.site/royal-hair-studio</strong>. You can edit slug if available. Domain will be available instantly after publish.
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-[#1a1c1c] flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-600" /> Publishing Checklist</h2>
            <div className="space-y-3">
              {checks.map((c, i) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${c.done ? 'bg-emerald-50/60 border-emerald-200' : 'bg-amber-50/60 border-amber-200'}`}>
                  <span className="text-sm font-medium text-gray-800 flex items-center gap-2">
                    {c.done ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-amber-600" />}
                    {c.label}
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${c.done ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {c.done ? 'Done ✓' : (i >= 4 ? 'Optional' : 'Required')}
                  </span>
                </div>
              ))}
            </div>
            {!allRequiredDone && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> Please complete required fields: Business details, Services, Contact, Template.
              </div>
            )}
            {allRequiredDone && optionalMissing > 0 && (
              <div className="bg-[#ffd9e1]/20 border border-[#ac0053]/20 rounded-xl p-3 text-xs text-[#80003c]">
                Optional sections missing ({optionalMissing}) — you can still publish now and add them later.
              </div>
            )}
          </div>

          {/* Appearance summary */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Template & Appearance</h3>
              <p className="text-xs text-gray-500 mt-1">Template: <span className="font-semibold text-gray-900">{data.templateId}</span> • Appearance: <span className="font-semibold text-gray-900">{data.websiteAppearance || 'light'}</span> • Reviewed: <span className="font-semibold text-gray-900">{data.reviewedContent ? 'Yes' : 'Not yet'}</span></p>
            </div>
            <div className="flex items-center gap-2 text-xs bg-[#ffd9e1]/30 text-[#ac0053] px-3 py-1.5 rounded-full font-semibold"><Sparkles className="w-3.5 h-3.5" /> Nexora AI ready</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="h-[80px] bg-white border-t border-gray-200 flex items-center justify-between px-6 shrink-0">
        <button onClick={onPrev} className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-xs hover:bg-gray-50 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Preview
        </button>
        <span className="hidden md:block text-xs text-gray-400">Step 14 of 15 • Publish Setup</span>
        <button
          disabled={!allRequiredDone || publishing}
          onClick={handlePublish}
          className="px-8 py-3 rounded-xl bg-[#ac0053] text-white font-semibold text-xs hover:bg-[#ba005b] flex items-center gap-2 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {publishing ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Publishing…</> : <><Globe className="w-4 h-4" /> Publish Website <ArrowRight className="w-4 h-4" /></>}
        </button>
      </footer>
    </div>
  );
}
