import { Sparkles, ArrowRight, Scissors, Edit2, Plus, ArrowLeft, Sun, Moon } from 'lucide-react';
import { SalonData } from '../types';
import React, { useMemo, useState } from 'react';


const BRAND_COLORS = [
  { name: 'Charcoal', value: '#1a1c1c' },
  { name: 'Nexora Pink', value: '#ac0053' },
  { name: 'Warm Taupe', value: '#8b6f61' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Royal Blue', value: '#2563eb' },
];

const TAGLINE_CATEGORIES: Record<string, Record<string, string[]>> = {
  Salon: {
    'Hair Salon': ['Where your best look begins.', 'Style that feels unmistakably you.', 'Expert care for beautiful hair.', 'Your everyday beauty, elevated.', 'Confidence in every strand.'],
    'Unisex Salon': ['Modern style for every expression.', 'One salon, every kind of style.', 'Made for your look and lifestyle.', 'Feel good. Look your best.', 'Personal style, professionally finished.'],
    'Luxury Salon': ['Where luxury meets your signature style.', 'An elevated salon experience, made for you.', 'Refined beauty. Exceptional care.', 'Luxury styling with a personal touch.', 'Your signature look, beautifully crafted.'],
  },
  Beauty: {
    'Beauty Parlour': ['Beautiful moments, beautifully made.', 'Your beauty, our signature.', 'Care that brings your glow to life.', 'Feel radiant, every day.', 'Personalized beauty for you.'],
    Makeup: ['Make every moment your moment.', 'Artistry for your most beautiful days.', 'Your features, beautifully amplified.', 'Makeup that moves with you.', 'Glow with confidence.'],
    Skincare: ['Healthy skin. Timeless confidence.', 'Nourish your glow naturally.', 'Thoughtful care for radiant skin.', 'Your skin, at its most beautiful.', 'A better glow starts with better care.'],
  },
  Spa: {
    'Day Spa': ['Pause, breathe, and feel renewed.', 'Your time to restore and reconnect.', 'Wellness that stays with you.', 'A calmer way to feel your best.', 'Relaxation, thoughtfully perfected.'],
    'Wellness Spa': ['Wellness for your body, mind, and soul.', 'Restore your balance. Renew your energy.', 'A deeper kind of self-care.', 'Feel better from the inside out.', 'Your wellbeing, beautifully supported.'],
    'Medical Spa': ['Advanced care for your natural confidence.', 'Expert wellness, beautifully personalized.', 'Science-backed care, naturally you.', 'Where innovation meets wellbeing.', 'Your most confident self, supported.'],
  },
};

const TAGLINE_SUBCATEGORIES = Object.fromEntries(
  Object.entries(TAGLINE_CATEGORIES).map(([category, subcategories]) => [category, Object.keys(subcategories)]),
);

interface Props {
  data: SalonData;
  setData: React.Dispatch<React.SetStateAction<SalonData>>;
  onNext?: () => void;
  onPrev?: () => void;
  onSave?: () => void;
}

export default function StepPublish({ data, setData, onNext, onPrev, onSave }: Props) {
  const [mode, setMode] = useState<'desktop' | 'mobile'>('desktop');
  const [taglineCategory, setTaglineCategory] = useState('Salon');
  const [taglineSubcategory, setTaglineSubcategory] = useState('Hair Salon');
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('500');
  const [newServiceDuration, setNewServiceDuration] = useState('60');
  const [newServiceDescription, setNewServiceDescription] = useState('');
  const appearance = data.websiteAppearance || 'light';

  const selectAppearance = (app: 'light' | 'dark') => {
    setData(prev => ({ ...prev, websiteAppearance: app }));
    if (onSave) onSave();
  };

  const taglineOptions = useMemo(
    () => TAGLINE_CATEGORIES[taglineCategory]?.[taglineSubcategory] || TAGLINE_CATEGORIES.Salon['Hair Salon'],
    [taglineCategory, taglineSubcategory],
  );

  const selectTagline = (tagline: string) => {
    setData(prev => ({ ...prev, tagline }));
    if (onSave) onSave();
  };

  const selectBrandColor = (brandColor: string) => {
    setData(prev => ({ ...prev, brandColor }));
    if (onSave) onSave();
  };

  const addService = (event: React.FormEvent) => {
    event.preventDefault();
    const name = newServiceName.trim();
    if (!name) return;
    setData(prev => ({
      ...prev,
      services: [...prev.services, {
        id: `custom-${Date.now()}`,
        name,
        category: 'Custom',
        description: newServiceDescription.trim() || 'Personalized service by our expert team.',
        price: Math.max(0, Number(newServicePrice) || 0),
        duration: Math.max(1, Number(newServiceDuration) || 60),
      }],
    }));
    setNewServiceName('');
    setNewServiceDescription('');
    setNewServicePrice('500');
    setNewServiceDuration('60');
    setShowServiceForm(false);
    if (onSave) onSave();
  };

  const handleContinue = () => {
    // Save appearance in background (already set), then navigate immediately without waiting
    // Persist appearance
    const updated = { ...data, websiteAppearance: appearance, lastCompletedStep: Math.max(data.lastCompletedStep || 0, 10) };
    setData(updated as any);
    // background save - do not await
    try {
      const existing = localStorage.getItem('nexora_onboarding_state');
      let parsed: any = {};
      if (existing) parsed = JSON.parse(existing);
      localStorage.setItem('nexora_onboarding_state', JSON.stringify({
        ...parsed,
        step: 11,
        data: updated,
        lastSaved: new Date().toISOString(),
        onboarding_progress: `Step 12 of 15`,
      }));
    } catch {}
    if (onSave) {
      // fire and forget background
      setTimeout(() => onSave(), 0);
    }
    if (onNext) onNext();
  };

  return (
    <div className="flex-1 flex w-full h-full bg-[#f9f9f9]">
      <div className="w-full md:w-[40%] max-w-[600px] bg-[#f9f9f9] flex flex-col border-r border-[#eeeeee] relative z-10 shrink-0 h-full overflow-hidden">
        
        {/* Panel Header */}
        <div className="p-8 border-b border-[#eeeeee] bg-[#f9f9f9] shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#d9006b]/10 rounded-full animate-[float_3s_ease-in-out_infinite]">
              <Sparkles className="w-4 h-4 text-[#ac0053]" />
              <span className="text-xs font-medium text-[#ac0053]">Live Sync Active</span>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#ac0053]">STEP 11 • TEMPLATE APPEARANCE</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1a1c1c] mb-2">Your Website is Coming to Life</h1>
          <p className="text-[#5f5e5e]">Choose light or dark appearance. Changes appear instantly. You're 5 minutes away from being live.</p>
        </div>

        {/* Builder Form Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-[#f9f9f9] pb-28">
          
          {/* TEMPLATE APPEARANCE SELECTION - Per spec Step 11 */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-[#5b3f46] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sun className="w-[18px] h-[18px]" /> Template Appearance
            </h2>
            <div className="bg-white rounded-lg border border-[#eeeeee] p-4 shadow-sm space-y-4">
              <p className="text-xs text-gray-500">Select how your website looks. Saved automatically.</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => selectAppearance('light')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${appearance === 'light' ? 'border-[#ac0053] bg-[#ffd9e1]/20 shadow-sm' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}
                >
                  <div className="w-10 h-10 rounded-full bg-white border shadow-sm flex items-center justify-center">
                    <Sun className="w-5 h-5 text-amber-500" />
                  </div>
                  <span className="text-sm font-bold text-gray-900">Light</span>
                  <span className="text-[11px] text-gray-500">Clean & bright</span>
                </button>
                <button
                  onClick={() => selectAppearance('dark')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${appearance === 'dark' ? 'border-[#ac0053] bg-[#ffd9e1]/20 shadow-sm' : 'border-gray-200 bg-gray-900 hover:bg-black'}`}
                >
                  <div className={`w-10 h-10 rounded-full border shadow-sm flex items-center justify-center ${appearance === 'dark' ? 'bg-zinc-800' : 'bg-zinc-800'}`}>
                    <Moon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-bold">Dark</span>
                  <span className={`text-[11px] ${appearance === 'dark' ? 'text-gray-900' : 'text-gray-300'}`}>Bold & premium</span>
                </button>
              </div>
              <div className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                Appearance saved: <strong>{appearance}</strong> • Preview updates instantly
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-sm font-semibold text-[#5b3f46] uppercase tracking-wider mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Brand Identity
            </h2>
            <div className="bg-white rounded-lg border border-[#eeeeee] p-4 shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#1a1c1c] mb-2">Salon Name</label>
                <input 
                  type="text" 
                  value={data.salonName}
                  onChange={e => setData({...data, salonName: e.target.value})}
                  onBlur={onSave}
                  className="w-full bg-[#f9f9f9] border border-[#eeeeee] rounded-lg px-4 py-3 text-[#1a1c1c] outline-none focus:border-[#ac0053] focus:ring-1 focus:ring-[#ac0053] transition-colors"
                />
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-[#1a1c1c]">Tagline</label>
                <div className="grid grid-cols-2 gap-2">
                  <select value={taglineCategory} onChange={e => { const next = e.target.value; setTaglineCategory(next); setTaglineSubcategory(TAGLINE_SUBCATEGORIES[next][0]); }} className="w-full bg-[#f9f9f9] border border-[#eeeeee] rounded-lg px-3 py-2.5 text-xs text-[#1a1c1c] outline-none focus:border-[#ac0053]">
                    {Object.keys(TAGLINE_CATEGORIES).map(category => <option key={category}>{category}</option>)}
                  </select>
                  <select value={taglineSubcategory} onChange={e => setTaglineSubcategory(e.target.value)} className="w-full bg-[#f9f9f9] border border-[#eeeeee] rounded-lg px-3 py-2.5 text-xs text-[#1a1c1c] outline-none focus:border-[#ac0053]">
                    {TAGLINE_SUBCATEGORIES[taglineCategory].map(subcategory => <option key={subcategory}>{subcategory}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  {taglineOptions.map(option => (
                    <button key={option} type="button" onClick={() => selectTagline(option)} className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition-colors ${data.tagline === option ? 'border-[#ac0053] bg-[#ffd9e1]/30 text-[#ac0053] font-bold' : 'border-[#eeeeee] bg-[#f9f9f9] text-[#5f5e5e] hover:border-[#ac0053]'}`}>
                      {option}
                    </button>
                  ))}
                </div>
                <input type="text" value={data.tagline} onChange={e => setData({...data, tagline: e.target.value})} onBlur={onSave} placeholder="Or write your own tagline" className="w-full bg-[#f9f9f9] border border-[#eeeeee] rounded-lg px-4 py-3 text-[#1a1c1c] outline-none focus:border-[#ac0053] focus:ring-1 focus:ring-[#ac0053] transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1a1c1c] mb-2">Brand Color</label>
                <div className="flex flex-wrap gap-4">
                  {BRAND_COLORS.map(color => {
                    const selected = (data.brandColor || '#1a1c1c') === color.value;
                    return (
                      <button
                        key={color.value}
                        type="button"
                        title={color.name}
                        aria-label={`Select ${color.name} brand color`}
                        onClick={() => selectBrandColor(color.value)}
                        className={`h-10 w-10 rounded-full border-2 transition-transform hover:scale-110 ${selected ? 'ring-2 ring-offset-2 ring-[#ffb1c4] border-white' : 'border-transparent'}`}
                        style={{ backgroundColor: color.value }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-sm font-semibold text-[#5b3f46] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Scissors className="w-[18px] h-[18px]" />
              Core Services
            </h2>
            <div className="bg-white rounded-lg border border-[#eeeeee] p-4 shadow-sm space-y-4">
              {data.services.map((s) => (
                <div key={s.id} className="flex items-center gap-4 bg-[#eeeeee] rounded-lg p-3 group cursor-pointer border border-transparent hover:border-[#eeeeee] transition-colors">
                  <div className="w-12 h-12 rounded bg-[#f9f9f9] flex items-center justify-center shrink-0">
                    <Sparkles className="w-6 h-6 text-[#ac0053]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-[#1a1c1c]">{s.name}</h3>
                    <p className="text-sm text-[#5f5e5e]">{s.duration} min • ₹{s.price.toLocaleString('en-IN')}</p>
                  </div>
                  <Edit2 className="w-5 h-5 text-[#5f5e5e] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
              
              <button type="button" onClick={() => setShowServiceForm(prev => !prev)} className="w-full py-3 border border-dashed border-[#eeeeee] rounded-lg text-[#5f5e5e] text-sm font-semibold hover:text-[#ac0053] hover:border-[#ac0053] transition-colors flex items-center justify-center gap-2">
                <Plus className="w-[18px] h-[18px]" /> Add Another Service
              </button>
              {showServiceForm && (
                <form onSubmit={addService} className="space-y-3 rounded-xl border border-[#ac0053]/20 bg-[#fff8fa] p-4">
                  <input autoFocus required value={newServiceName} onChange={e => setNewServiceName(e.target.value)} placeholder="Service name" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-[#ac0053]" />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" min="0" value={newServicePrice} onChange={e => setNewServicePrice(e.target.value)} placeholder="Price" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-[#ac0053]" />
                    <input type="number" min="1" value={newServiceDuration} onChange={e => setNewServiceDuration(e.target.value)} placeholder="Minutes" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-[#ac0053]" />
                  </div>
                  <textarea value={newServiceDescription} onChange={e => setNewServiceDescription(e.target.value)} placeholder="Short description (optional)" rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-[#ac0053]" />
                  <button type="submit" className="w-full rounded-lg bg-[#ac0053] px-3 py-2 text-xs font-bold text-white hover:bg-[#ba005b]">Save Service</button>
                </form>
              )}
            </div>
          </div>

        </div>

        {/* Panel Footer CTA - Fixed to handle navigation correctly */}
        <div className="absolute bottom-0 left-0 w-full p-6 border-t border-[#eeeeee] bg-[#f9f9f9] flex gap-3 z-20">
          {onPrev && (
            <button onClick={onPrev} className="px-5 py-4 rounded-lg border border-gray-300 text-gray-700 font-semibold text-sm flex items-center gap-2 hover:bg-white">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}
          <button onClick={handleContinue} className="flex-1 bg-[#ac0053] text-white font-semibold text-sm py-4 rounded-lg flex items-center justify-center gap-2 hover:bg-[#ba005b] transition-colors shadow-sm">
            Continue to AI Review <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Right Column: Real-Time Preview */}
      <div className="hidden md:flex flex-1 bg-[#f3f3f4] p-8 relative overflow-hidden items-center justify-center">
        {/* Browser Mockup */}
        <div className={`w-full max-w-[1000px] h-full max-h-[800px] bg-white rounded-xl shadow-2xl border border-[#e5e2e1] flex flex-col overflow-hidden relative z-10 transition-transform duration-500 hover:scale-[1.01] ${data.websiteAppearance === 'dark' ? 'dark' : ''}`}>
          {/* Header */}
          <div className={`h-10 border-b flex items-center px-4 gap-2 shrink-0 ${appearance === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-[#f3f3f4] border-[#e5e2e1]'}`}>
            <div className="w-3 h-3 rounded-full bg-[#c8c6c5]"></div>
            <div className="w-3 h-3 rounded-full bg-[#c8c6c5]"></div>
            <div className="w-3 h-3 rounded-full bg-[#c8c6c5]"></div>
            <div className="mx-auto bg-[#f9f9f9] px-6 py-1 rounded-md text-[11px] text-[#5f5e5e] border border-[#e5e2e1] font-mono tracking-wide">
              preview.nexora.com/{(data.websiteSlug || 'lumina')} • {appearance}
            </div>
          </div>

          <div className={`flex-1 overflow-y-auto custom-scrollbar ${appearance === 'dark' ? 'bg-zinc-950' : 'bg-white'}`}>
            {/* Preview Nav */}
            <nav className={`flex justify-between items-center px-8 py-6 border-b ${appearance === 'dark' ? 'border-zinc-800 bg-zinc-950 text-white' : 'border-[#e5e2e1]/50 bg-white text-[#1a1c1c]'}`}>
              <div className="text-2xl font-bold transition-all">{data.salonName || 'Your Salon'}</div>
              <div className={`flex gap-6 text-sm ${appearance === 'dark' ? 'text-zinc-400' : 'text-[#5f5e5e]'}`}>
                <span className={`${appearance === 'dark' ? 'text-white' : 'text-[#1a1c1c]'} font-medium`}>Home</span>
                <span>Services</span>
                <span>About</span>
                <span>Contact</span>
              </div>
            </nav>

            {/* Preview Hero */}
            <div className="relative w-full h-[400px] flex items-center px-12 overflow-hidden">
              <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?q=80&w=1000)'}}></div>
              <div className="absolute inset-0 bg-white/70 z-10"></div>
              <div className="relative z-20 max-w-lg" style={{ '--brand-color': data.brandColor || '#1a1c1c' } as React.CSSProperties}>
                <h1 className="text-4xl md:text-5xl font-bold text-[#1a1c1c] mb-4 transition-all">{data.salonName || 'Your Salon'}</h1>
                <p className="text-lg text-[#5b3f46] mb-8 transition-all">{data.tagline || 'Your tagline'}</p>
                <button className="text-white px-8 py-3 rounded-lg text-sm font-semibold" style={{ backgroundColor: data.brandColor || '#1a1c1c' }}>Book Appointment</button>
              </div>
            </div>

            {/* Preview Services */}
            <div className={`px-12 py-16 ${appearance === 'dark' ? 'bg-zinc-900' : 'bg-[#ffffff]'}`}>
              <h2 className={`text-3xl font-bold text-center mb-12 ${appearance === 'dark' ? 'text-white' : 'text-[#1a1c1c]'}`}>Our Services</h2>
              <div className="grid grid-cols-2 gap-6">
                {data.services.map((s) => (
                  <div key={s.id} className={`rounded-xl p-8 border hover:shadow-lg transition-shadow ${appearance === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-[#f9f9f9] border-[#e5e2e1]/50'}`}>
                    <div className="w-12 h-12 rounded-full bg-[#ac0053]/10 flex items-center justify-center mb-6">
                      <Sparkles className="w-6 h-6 text-[#ac0053]" />
                    </div>
                    <h3 className={`text-2xl font-bold mb-2 ${appearance === 'dark' ? 'text-white' : 'text-[#1a1c1c]'}`}>{s.name}</h3>
                    <p className={`text-sm mb-4 ${appearance === 'dark' ? 'text-zinc-400' : 'text-[#5f5e5e]'}`}>{s.description}</p>
                    <div className="text-sm font-semibold" style={{ color: data.brandColor || '#ac0053' }}>₹{s.price.toLocaleString('en-IN')} • {s.duration} min</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 text-center">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${appearance === 'light' ? 'bg-[#ffd9e1] text-[#ac0053]' : 'bg-zinc-800 text-amber-400 border border-zinc-700'}`}>
                  Appearance: {appearance} • Click Continue to review AI Content
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative blur behind browser */}
        <div className="absolute right-[-10%] bottom-[-10%] w-[600px] h-[600px] bg-[#ffb1c4]/20 rounded-full blur-3xl pointer-events-none"></div>
      </div>
    </div>
  );
}
