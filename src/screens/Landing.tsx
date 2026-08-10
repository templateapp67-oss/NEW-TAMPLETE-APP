import { Sparkles, ArrowRight, Check } from 'lucide-react';
import { motion } from 'motion/react';

export default function Landing({ onNext }: { onNext: () => void }) {
  return (
    <div className="min-h-screen bg-[#fcfbf9] flex flex-col font-sans">
      <header className="h-16 px-6 border-b border-gray-200 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2 text-[#ac0053]">
          <Sparkles className="w-6 h-6" />
          <span className="font-semibold text-xl tracking-tight">Nexora</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 hidden md:block">Already have a website?</span>
          <button className="text-[#ac0053] font-semibold text-sm hover:opacity-80">Log In</button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center pt-24 px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#ffd9e1] text-[#8f0044] rounded-full text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3 h-3" />
            AI-Powered Builder
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight leading-tight">
            Create Your Salon Website in 30 Minutes
          </h1>
          
          <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
            No coding. No technical knowledge required. Just tell us about your business and we'll create your website for you.
          </p>

          <button 
            onClick={onNext}
            className="bg-[#ac0053] text-white px-8 py-4 rounded-lg font-semibold flex items-center gap-2 mx-auto hover:bg-[#8f0044] transition-colors shadow-lg shadow-pink-900/20"
          >
            Create My Website
            <ArrowRight className="w-5 h-5" />
          </button>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6 mt-8 text-sm text-gray-600 font-medium">
            <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#ac0053]" /> Simple setup</div>
            <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#ac0053]" /> Mobile ready</div>
            <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#ac0053]" /> No coding required</div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
