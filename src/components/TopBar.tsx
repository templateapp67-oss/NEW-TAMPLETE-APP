import { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Users, 
  LayoutDashboard, 
  Loader2, 
  ChevronDown, 
  ChevronRight, 
  Search, 
  Layers, 
  X,
  ArrowLeft,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { ALL_16_SCREENS, TOTAL_SCREENS_COUNT } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  step: number;
  activeModule: 'wizard' | 'staff-management';
  setActiveModule: (m: 'wizard' | 'staff-management') => void;
  goToStep: (index: number) => void;
  onNext?: () => void;
  onPrev?: () => void;
  saveStatus?: 'saved' | 'saving';
}

export default function TopBar({ 
  step, 
  activeModule, 
  setActiveModule, 
  goToStep, 
  onNext, 
  onPrev, 
  saveStatus = 'saved' 
}: Props) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Determine current active screen index (0 to 15)
  const currentScreenIndex = activeModule === 'staff-management' ? 15 : step;
  const currentScreen = ALL_16_SCREENS[currentScreenIndex] || ALL_16_SCREENS[0];
  const displayStepNumber = currentScreen.screenNumber;
  const progress = Math.max(5, (displayStepNumber / TOTAL_SCREENS_COUNT) * 100);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleSelectScreen = (screenIndex: number) => {
    setIsDropdownOpen(false);
    goToStep(screenIndex);
  };

  const filteredScreens = ALL_16_SCREENS.filter(s => 
    s.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
    s.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
    s.category.toLowerCase().includes(searchFilter.toLowerCase()) ||
    `screen ${s.screenNumber}`.includes(searchFilter.toLowerCase()) ||
    `step ${s.screenNumber}`.includes(searchFilter.toLowerCase())
  );

  return (
    <header className="h-16 px-4 md:px-6 bg-white border-b border-gray-200 flex items-center justify-between shrink-0 z-50 sticky top-0 shadow-2xs font-sans">
      
      {/* LEFT SECTION: BRAND & SCREEN SWITCHER */}
      <div className="flex items-center gap-3 md:gap-6">
        
        {/* Nexora Brand */}
        <button 
          onClick={() => goToStep(0)}
          className="flex items-center gap-2 text-[#ac0053] hover:opacity-85 transition-opacity"
          title="Go to Home / Landing Screen"
        >
          <div className="w-8 h-8 rounded-lg bg-[#ffd9e1]/60 flex items-center justify-center text-[#ac0053]">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-xl tracking-tight hidden sm:inline">Nexora</span>
        </button>

        {/* SCREEN SELECTOR DROPDOWN TRIGGER */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(prev => !prev)}
            className="flex items-center gap-2 bg-gray-50 hover:bg-[#ffd9e1]/30 border border-gray-200 hover:border-[#ac0053]/40 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-800 transition-all shadow-2xs group"
          >
            <span className="w-5 h-5 rounded-md bg-[#ac0053] text-white flex items-center justify-center text-[10px] font-black shrink-0">
              {displayStepNumber.toString().padStart(2, '0')}
            </span>
            <div className="text-left hidden xs:block sm:block max-w-[140px] md:max-w-[200px] truncate">
              <span className="font-bold text-gray-900 block truncate">{currentScreen.title}</span>
            </div>
            <span className="text-[10px] font-bold text-[#ac0053] bg-[#ffd9e1]/70 px-1.5 py-0.5 rounded-sm">
              16 Screens
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 group-hover:text-[#ac0053] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* SCREEN SELECTOR POPUP MENU */}
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 mt-2 w-[340px] md:w-[420px] max-h-[540px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden"
              >
                {/* Modal Header & Search */}
                <div className="p-3.5 border-b border-gray-100 bg-gray-50/80 shrink-0">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                      <Layers className="w-4 h-4 text-[#ac0053]" />
                      <span>All 16 App Screens & Modules</span>
                    </div>
                    <span className="text-[11px] font-bold text-[#ac0053] bg-[#ffd9e1]/60 px-2 py-0.5 rounded-full">
                      16 Screens Complete
                    </span>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={e => setSearchFilter(e.target.value)}
                      placeholder="Search screens (e.g. Team, AI, Preview, Staff)..."
                      className="w-full pl-8 pr-8 py-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-[#ac0053] focus:ring-1 focus:ring-[#ac0053]/20"
                      autoFocus
                    />
                    {searchFilter && (
                      <button 
                        onClick={() => setSearchFilter('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Screens List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar max-h-[380px]">
                  {filteredScreens.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-500">
                      No screens found matching "{searchFilter}"
                    </div>
                  ) : (
                    filteredScreens.map((s) => {
                      const isActive = s.id === currentScreenIndex;
                      return (
                        <button
                          key={s.id}
                          onClick={() => handleSelectScreen(s.id)}
                          className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between gap-3 transition-all ${
                            isActive 
                              ? 'bg-[#ffd9e1]/40 border border-[#ac0053]/40 text-[#3f001a]' 
                              : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${
                              isActive 
                                ? 'bg-[#ac0053] text-white shadow-xs' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {s.screenNumber.toString().padStart(2, '0')}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-xs font-bold truncate ${isActive ? 'text-[#ac0053]' : 'text-gray-900'}`}>
                                  {s.title}
                                </span>
                                <span className="text-[9px] font-semibold uppercase px-1.5 py-0.2 bg-gray-100 text-gray-500 rounded">
                                  {s.category}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-500 truncate">{s.description}</p>
                            </div>
                          </div>

                          {isActive ? (
                            <span className="text-[10px] font-bold text-[#ac0053] bg-white px-2 py-0.5 rounded-md shadow-2xs shrink-0">
                              Active
                            </span>
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Footer Quick Links */}
                <div className="p-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 shrink-0">
                  <span>Click any screen to jump immediately</span>
                  <button 
                    onClick={() => handleSelectScreen(15)}
                    className="font-bold text-[#ac0053] hover:underline flex items-center gap-1"
                  >
                    Staff Module (Screen 16) →
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* MODULE QUICK SWITCHER BUTTONS */}
        <div className="hidden lg:flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-semibold">
          <button
            onClick={() => {
              setActiveModule('wizard');
              if (step === 15) goToStep(2);
            }}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeModule === 'wizard' ? 'bg-white text-[#ac0053] shadow-xs' : 'text-gray-600 hover:text-black'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" /> Website Builder (15 Steps)
          </button>
          <button
            onClick={() => goToStep(15)}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeModule === 'staff-management' || currentScreenIndex === 15 ? 'bg-white text-[#ac0053] shadow-xs' : 'text-gray-600 hover:text-black'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Staff Management (Screen 16)
          </button>
        </div>

      </div>
      
      {/* RIGHT SECTION: SAVE STATUS, PREV/NEXT, STEP PROGRESS */}
      <div className="flex items-center gap-2 md:gap-4">
        
        {/* Quick Screen Step Prev / Next navigation */}
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5 border border-gray-200">
          <button
            onClick={() => goToStep(Math.max(0, currentScreenIndex - 1))}
            disabled={currentScreenIndex <= 0}
            className="p-1.5 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:hover:text-gray-600 rounded-md transition-colors"
            title="Previous Screen"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-bold text-gray-700 px-1.5 select-none font-mono">
            {displayStepNumber}/{TOTAL_SCREENS_COUNT}
          </span>
          <button
            onClick={() => goToStep(Math.min(TOTAL_SCREENS_COUNT - 1, currentScreenIndex + 1))}
            disabled={currentScreenIndex >= TOTAL_SCREENS_COUNT - 1}
            className="p-1.5 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:hover:text-gray-600 rounded-md transition-colors"
            title="Next Screen"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Auto-save status pill */}
        <div className="hidden sm:flex items-center gap-1.5 text-sm font-medium bg-[#ffd9e1]/25 px-2.5 py-1 rounded-lg border border-[#ffd9e1]/60 shrink-0">
          {saveStatus === 'saving' ? (
            <>
              <Loader2 className="w-3.5 h-3.5 text-[#ac0053] animate-spin" />
              <span className="text-[11px] font-semibold text-[#ac0053]">Saving...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[11px] font-semibold text-emerald-700">Saved ✓</span>
            </>
          )}
        </div>
        
        {/* Progress Bar */}
        <div className="flex flex-col gap-1 items-end shrink-0">
          <div className="flex items-center gap-1 text-[11px] font-bold text-gray-600">
            <span>Screen {displayStepNumber}</span>
            <span className="text-gray-400">of {TOTAL_SCREENS_COUNT}</span>
          </div>
          <div className="w-16 sm:w-24 md:w-28 h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200/60">
            <div 
              className="h-full bg-[#ac0053] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

      </div>
    </header>
  );
}
