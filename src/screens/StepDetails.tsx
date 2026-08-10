import { Sparkles, Mic, ImagePlus, ArrowLeft, ArrowRight } from 'lucide-react';
import { SalonData } from '../types';
import PreviewPane from '../components/PreviewPane';
import { motion } from 'motion/react';

interface Props {
  data: SalonData;
  setData: (d: SalonData) => void;
  onNext: () => void;
  onPrev: () => void;
  onSave?: () => void;
}

export default function StepDetails({ data, setData, onNext, onPrev, onSave }: Props) {
  return (
    <div className="flex-1 flex w-full h-full">
      <div className="w-full md:w-[55%] h-full flex flex-col relative bg-white">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-12 lg:p-16">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto pb-24">
            <div className="mb-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#ffd9e1] text-[#8f0044] rounded-full text-[10px] font-bold uppercase tracking-wider mb-6">
                Business Details
              </span>
              <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">Tell us about your salon</h1>
              <p className="text-gray-500 text-lg">Add a few basic details. Nexora will use them to create your website.</p>
            </div>

            <form className="space-y-12" onSubmit={e => e.preventDefault()}>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Business / Salon Name <span className="text-[#ac0053]">*</span></label>
                  <input 
                    type="text" 
                    value={data.salonName}
                    onChange={e => setData({...data, salonName: e.target.value})}
                    onBlur={onSave}
                    className="w-full px-4 py-3.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#d9006b] focus:ring-2 focus:ring-pink-100 outline-none transition-all"
                  />
                  <p className="text-xs text-gray-400 mt-2">This name will appear on your website.</p>
                </div>
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <label className="block text-sm font-semibold text-gray-900">Business Tagline <span className="text-gray-400 font-normal ml-1">(Optional)</span></label>
                    <button type="button" className="text-[#ac0053] text-xs font-semibold flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                      <Sparkles className="w-3.5 h-3.5" /> Suggest with AI
                    </button>
                  </div>
                  <input 
                    type="text" 
                    value={data.tagline}
                    onChange={e => setData({...data, tagline: e.target.value})}
                    onBlur={onSave}
                    className="w-full px-4 py-3.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#d9006b] focus:ring-2 focus:ring-pink-100 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="p-8 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#ac0053]"></div>
                <h2 className="text-2xl font-bold text-gray-900">About the Owner</h2>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Owner / Founder Name <span className="text-[#ac0053]">*</span></label>
                  <input 
                    type="text" 
                    value={data.ownerName}
                    onChange={e => setData({...data, ownerName: e.target.value})}
                    onBlur={onSave}
                    className="w-full px-4 py-3.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#d9006b] focus:ring-2 focus:ring-pink-100 outline-none transition-all"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Owner Photo <span className="text-gray-400 font-normal">(Optional)</span></label>
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors group">
                      <span className="text-sm font-semibold text-gray-500 group-hover:text-[#ac0053] flex items-center gap-2">
                        <ImagePlus className="w-4 h-4" /> Add Photo
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Owner Role <span className="text-gray-400 font-normal">(Optional)</span></label>
                    <input 
                      type="text" 
                      value={data.ownerRole}
                      onChange={e => setData({...data, ownerRole: e.target.value})}
                      onBlur={onSave}
                      className="w-full h-[72px] px-4 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#d9006b] focus:ring-2 focus:ring-pink-100 outline-none transition-all"
                      placeholder="e.g. Founder & Stylist"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-sm font-semibold text-gray-900">Tell customers about your business <span className="text-gray-400 font-normal">(Optional)</span></label>
                  <div className="flex gap-4">
                    <button type="button" className="text-gray-500 text-xs font-semibold flex items-center gap-1.5 hover:text-[#ac0053] transition-colors">
                      <Mic className="w-3.5 h-3.5" /> Speak instead
                    </button>
                    <button type="button" className="text-[#ac0053] text-xs font-semibold flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                      <Sparkles className="w-3.5 h-3.5" /> Write with AI
                    </button>
                  </div>
                </div>
                <textarea 
                  rows={5}
                  value={data.about}
                  onChange={e => setData({...data, about: e.target.value})}
                  onBlur={onSave}
                  className="w-full px-4 py-4 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#d9006b] focus:ring-2 focus:ring-pink-100 outline-none transition-all resize-none"
                  placeholder="Briefly describe your services, ambiance, or specialties..."
                />
              </div>
            </form>
          </motion.div>
        </div>
        
        {/* Footer Actions */}
        <div className="absolute bottom-0 left-0 w-full p-6 bg-white border-t border-gray-200 flex justify-between items-center z-10 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
          <button onClick={onPrev} className="px-6 py-3 rounded-lg text-gray-600 font-semibold flex items-center gap-2 hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button onClick={onNext} className="px-8 py-3 rounded-lg bg-[#ac0053] text-white font-semibold flex items-center gap-2 hover:bg-[#8f0044] transition-colors shadow-sm">
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="hidden md:block w-[45%] h-full">
        <PreviewPane data={data} step={2} />
      </div>
    </div>
  );
}
