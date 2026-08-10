import { Sparkles, CheckCircle2, Users, LayoutDashboard, Loader2 } from 'lucide-react';

interface Props {
  step: number;
  activeModule: 'wizard' | 'staff-management';
  setActiveModule: (m: 'wizard' | 'staff-management') => void;
  saveStatus?: 'saved' | 'saving';
}

export default function TopBar({ step, activeModule, setActiveModule, saveStatus = 'saved' }: Props) {
  // step 2 = Step 3, step 3 = Step 4, step 4 = Step 5
  // The user HTMLs show Step 3 of 15, Step 4 of 15, Step 5 of 15
  // so progress could just be based on that.
  const displayStep = step + 1; 
  const totalSteps = 15;
  const progress = Math.max(0, (displayStep / totalSteps) * 100);
  
  return (
    <header className="h-16 px-6 bg-white border-b border-gray-200 flex items-center justify-between shrink-0 z-50 sticky top-0">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-[#ac0053]">
          <Sparkles className="w-6 h-6" />
          <span className="font-bold text-xl tracking-tight">Nexora</span>
        </div>

        {/* Module switcher */}
        <div className="hidden sm:flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-semibold">
          <button
            onClick={() => setActiveModule('wizard')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeModule === 'wizard' ? 'bg-white text-[#ac0053] shadow-xs' : 'text-gray-600 hover:text-black'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" /> Website Builder
          </button>
          <button
            onClick={() => setActiveModule('staff-management')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeModule === 'staff-management' ? 'bg-white text-[#ac0053] shadow-xs' : 'text-gray-600 hover:text-black'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Staff Management
          </button>
        </div>
      </div>
      
      <div className="flex items-center gap-4 md:gap-6">
        <button
          onClick={() => setActiveModule(activeModule === 'wizard' ? 'staff-management' : 'wizard')}
          className="sm:hidden text-xs font-semibold text-[#ac0053] bg-[#ffd9e1]/50 px-2.5 py-1.5 rounded-lg flex items-center gap-1"
        >
          {activeModule === 'wizard' ? 'Staff Module' : 'Website Builder'}
        </button>

        <div className="hidden md:flex items-center gap-2 text-[#ac0053] text-sm font-medium bg-[#ffd9e1]/30 px-3 py-1.5 rounded-lg border border-[#ffd9e1]/60">
          {saveStatus === 'saving' ? (
            <>
              <Loader2 className="w-4 h-4 text-[#ac0053] animate-spin" />
              <span className="text-xs font-semibold">Saving...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700">Saved ✓</span>
            </>
          )}
        </div>
        
        {activeModule === 'wizard' && (
          <div className="flex flex-col gap-1.5 items-end">
            <span className="text-xs font-semibold text-gray-500">Step {displayStep} of {totalSteps}</span>
            <div className="w-24 md:w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#ac0053] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

