import React, { useState } from 'react';
import { SalonData } from '../types';
import { CheckCircle2, Globe, Copy, Share2, LayoutDashboard, ExternalLink, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  data: SalonData;
  setData: React.Dispatch<React.SetStateAction<SalonData>>;
  onNext: () => void; // go to dashboard
  onPrev?: () => void;
  onSave?: () => void;
}

export default function StepPublishSuccess({ data, onNext }: Props) {
  const [copied, setCopied] = useState(false);
  const url = data.publishedUrl || `https://nexora.site/${data.websiteSlug || 'royal-hair-studio'}`;
  const displayUrl = url.replace(/^https?:\/\//, '');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const el = document.createElement('input');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsAppShare = () => {
    const text = `🎉 My salon website is live! Check it out: ${url} — created with Nexora ✨`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const handleViewWebsite = () => {
    window.open(url, '_blank');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#f9f9f9] relative">
      <div className="flex-1 overflow-y-auto p-6 md:p-12 flex items-center justify-center">
        <div className="w-full max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2rem] border border-gray-200 shadow-xl p-8 md:p-12 text-center space-y-8">
            <div className="space-y-4">
              <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-200 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#ffd9e1] text-[#ac0053] rounded-full text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> STEP 15 • PUBLISH SUCCESS
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#1a1c1c]">Your website is ready! 🎉</h1>
              <p className="text-sm md:text-base text-[#5f5e5e] max-w-lg mx-auto">Congratulations! Your salon website is now live on the internet. Share it with customers and start taking bookings.</p>
            </div>

            {/* URL Box */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
                <Globe className="w-4 h-4 text-[#ac0053]" /> Your Live Website URL
              </div>
              <div className="flex items-center justify-between gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
                <div className="text-left flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">{displayUrl}</div>
                  <div className="text-[11px] text-gray-500">Powered by Nexora • Secure • Mobile-ready</div>
                </div>
                <a href={url} target="_blank" rel="noreferrer" className="p-2 text-gray-500 hover:text-[#ac0053] rounded-lg hover:bg-gray-50">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                <button onClick={handleViewWebsite} className="px-5 py-2.5 bg-[#ac0053] text-white rounded-xl text-xs font-semibold hover:bg-[#ba005b] flex items-center gap-2 shadow-sm">
                  <ExternalLink className="w-4 h-4" /> View Website
                </button>
                <button onClick={handleCopy} className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-colors ${copied ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                  <Copy className="w-4 h-4" /> {copied ? 'Copied!' : 'Copy Link'}
                </button>
                <button onClick={handleWhatsAppShare} className="px-5 py-2.5 bg-[#25D366] text-white rounded-xl text-xs font-semibold hover:bg-[#20bd5a] flex items-center gap-2 shadow-sm">
                  <Share2 className="w-4 h-4" /> Share on WhatsApp
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-[#ffd9e1]/20 rounded-xl p-3 border border-[#ac0053]/10">
                <div className="text-lg font-bold text-[#ac0053]">{data.services.length}</div>
                <div className="text-[11px] text-gray-600">Services live</div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200">
                <div className="text-lg font-bold text-emerald-700">{data.team.length}</div>
                <div className="text-[11px] text-gray-600">Team ready</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                <div className="text-lg font-bold text-gray-900">{data.templateId}</div>
                <div className="text-[11px] text-gray-600">template + {data.websiteAppearance || 'light'}</div>
              </div>
            </div>

            <div className="pt-2">
              <button onClick={onNext} className="w-full py-4 bg-[#1a1c1c] text-white rounded-xl font-semibold text-sm hover:bg-black flex items-center justify-center gap-2 shadow-md">
                <LayoutDashboard className="w-5 h-5" /> Go to Dashboard <span className="ml-2 text-xs opacity-70">→</span>
              </button>
              <p className="text-[11px] text-gray-400 mt-3">You won’t return to onboarding unless you explicitly choose Edit/Setup. Your progress is saved.</p>
            </div>

            <div className="bg-gray-900 text-white rounded-xl p-4 flex items-center gap-3 text-left text-xs leading-relaxed">
              <div className="w-10 h-10 rounded-full bg-[#ac0053] flex items-center justify-center shrink-0"><Sparkles className="w-5 h-5" /></div>
              <div>
                <strong>Next steps:</strong> Add your custom domain, connect Instagram bookings, and enable payments. All can be done from Dashboard → Website Settings.
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
