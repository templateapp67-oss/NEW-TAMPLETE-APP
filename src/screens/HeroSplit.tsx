import { Sparkles, ArrowRight, CheckCircle2, Smartphone, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

export default function HeroSplit({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex-1 w-full h-full bg-[#f9f8f6] flex flex-col font-sans overflow-y-auto custom-scrollbar">
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-6 md:px-8 py-8 md:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column */}
        <div className="lg:col-span-5 flex flex-col items-start gap-5 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm text-xs font-semibold tracking-widest uppercase text-gray-600"
          >
            <Sparkles className="w-4 h-4 text-[#ac0053]" />
            SCREEN 02 OF 16 • AI SALON BUILDER
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl lg:text-[52px] font-bold text-gray-900 leading-[1.15] tracking-tight"
          >
            Create Your<br/>Salon Website<br/>
            in <span className="text-[#d9006b] relative inline-block mt-2">
              30 Minutes
              <svg className="absolute -bottom-2 left-0 w-full opacity-60" fill="none" height="8" viewBox="0 0 200 8" xmlns="http://www.w3.org/2000/svg"><path d="M2 5C50 2 150 2 198 5" stroke="#d9006b" strokeLinecap="round" strokeWidth="3"></path></svg>
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base md:text-lg text-gray-600 leading-relaxed"
          >
            No coding. No technical knowledge required. Just tell us about your business and Nexora will create your professional salon website for you.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-4 mt-2"
          >
            <button 
              onClick={onNext}
              className="bg-[#ac0053] text-white px-8 py-3.5 rounded-xl font-semibold flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-xl transition-all shadow-lg shadow-pink-900/20 active:scale-95 cursor-pointer"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex gap-6 mt-6 pt-6 border-t border-gray-200 w-full text-xs font-semibold text-gray-600"
          >
            <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#ac0053]" /> Guided setup</div>
            <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#ac0053]" /> Mobile-ready</div>
            <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#ac0053]" /> 16 Modules</div>
          </motion.div>
        </div>

        {/* Right Column - Mockup */}
        <div className="lg:col-span-7 relative h-[480px] lg:h-[540px] w-full flex items-center justify-center lg:justify-end">
          <div className="absolute inset-0 bg-[#ffd9e1]/40 rounded-full blur-[80px] -z-10 animate-pulse"></div>
          
          {/* Floating tags */}
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="absolute top-10 left-0 z-20 bg-white px-3.5 py-2 rounded-lg shadow-xl border border-gray-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#ac0053]" /> <span className="text-xs font-semibold text-gray-800">Services added</span>
          </motion.div>
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 5, delay: 1 }} className="absolute top-1/2 -right-2 z-20 bg-white px-3.5 py-2 rounded-lg shadow-xl border border-gray-100 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#ac0053]" /> <span className="text-xs font-semibold text-gray-800">Mobile ready</span>
          </motion.div>
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4.5, delay: 0.5 }} className="absolute bottom-20 left-4 z-20 bg-white px-3.5 py-2 rounded-lg shadow-xl border border-gray-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#ac0053]" /> <span className="text-xs font-semibold text-gray-800">Booking enabled</span>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="absolute -bottom-4 right-6 z-30 bg-white rounded-xl shadow-2xl border border-pink-100 p-3.5 w-64"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#ac0053] animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-800">Nexora AI is building website...</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 5, ease: "linear" }}
                className="h-full bg-[#ac0053]"
              />
            </div>
          </motion.div>

          {/* Browser Container */}
          <motion.div 
            initial={{ opacity: 0, rotate: 0, x: 20 }}
            animate={{ opacity: 1, rotate: -2, x: 0 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="w-full max-w-[620px] h-[440px] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden hover:rotate-0 transition-transform duration-500 origin-center"
          >
            <div className="h-9 bg-gray-50 border-b border-gray-200 flex items-center px-4 gap-2 shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
              <div className="mx-auto bg-white px-4 py-0.5 rounded text-[10px] font-mono text-gray-500 shadow-xs border border-gray-200">luxesalon.nexora.co</div>
            </div>
            <div className="flex-1 bg-cover bg-center relative" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1600948836101-f9ffda59d250?q=80&w=1000&auto=format&fit=crop)'}}>
              <div className="absolute inset-0 bg-black/40"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              <div className="relative z-10 p-8 flex flex-col justify-end h-full text-white">
                <span className="text-[10px] font-bold uppercase tracking-widest mb-2 opacity-80 border border-white/30 w-max px-2.5 py-0.5 rounded backdrop-blur-sm">Premium Haircare</span>
                <h2 className="text-3xl font-serif font-bold leading-tight mb-2">Elevate Your Everyday Style</h2>
                <p className="text-white/80 max-w-sm text-xs mb-4">Experience personalized styling and coloring services in the heart of the city.</p>
                <button className="bg-white text-gray-900 px-5 py-2 rounded-lg font-semibold text-xs w-max hover:bg-gray-100 transition-colors">Explore Services</button>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

