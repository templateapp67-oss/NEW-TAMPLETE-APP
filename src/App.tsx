/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import Landing from './screens/Landing';
import HeroSplit from './screens/HeroSplit';
import StepTemplate from './screens/StepTemplate';
import StepDetails from './screens/StepDetails';
import StepServices from './screens/StepServices';
import StepTeam from './screens/StepTeam';
import StepPhotos from './screens/StepPhotos';
import StepSocials from './screens/StepSocials';
import StepLocation from './screens/StepLocation';
import StepContactBooking from './screens/StepContactBooking';
import StepPublish from './screens/StepPublish';
import StepAIContentReview from './screens/StepAIContentReview';
import StepFullWebsitePreview from './screens/StepFullWebsitePreview';
import StepPublishSetup from './screens/StepPublishSetup';
import StepPublishSuccess from './screens/StepPublishSuccess';
import StaffManagementModule from './components/StaffManagementModule';
import TopBar from './components/TopBar';
import { initialData, SalonData } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, ArrowRight } from 'lucide-react';

const STORAGE_KEY = 'nexora_onboarding_state';
const TOTAL_STEPS = 15;
const MAX_STEP_INDEX = 14; // 0-based: 0..14 => 1..15

export default function App() {
  const [step, setStep] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.step === 'number' && parsed.step >= 0 && parsed.step <= MAX_STEP_INDEX) {
          return parsed.step;
        }
      }
    } catch (e) {
      console.error('Failed to parse saved onboarding state', e);
    }
    return 0;
  });

  const [data, setData] = useState<SalonData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.data) {
          return { ...initialData, ...parsed.data };
        }
      }
    } catch (e) {
      console.error('Failed to parse saved salon data', e);
    }
    return initialData;
  });

  const [activeModule, setActiveModule] = useState<'wizard' | 'staff-management'>('wizard');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [showResumeBanner, setShowResumeBanner] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return typeof parsed.step === 'number' && parsed.step > 0;
      }
    } catch (e) {
      // fallback
    }
    return false;
  });

  const isInitialMount = useRef(true);

  // Auto save state to localStorage whenever step or data changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setSaveStatus('saving');
    const timer = setTimeout(() => {
      try {
        const lastCompletedStep = Math.max(data.lastCompletedStep || 0, step > 0 ? step - 1 : 0);
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            step,
            data: { ...data, lastCompletedStep },
            lastSaved: new Date().toISOString(),
            onboarding_progress: `Step ${step + 1} of ${TOTAL_STEPS}`,
            lastCompletedStep,
            selectedTemplate: data.templateId,
            websiteAppearance: data.websiteAppearance,
            reviewedContent: data.reviewedContent,
            publishState: data.publishState,
            currentStep: step + 1
          })
        );
      } catch (e) {
        console.error('Failed to save onboarding state', e);
      }
      setSaveStatus('saved');
    }, 400);

    return () => clearTimeout(timer);
  }, [step, data]);

  const nextStep = () => setStep(s => {
    const next = Math.min(MAX_STEP_INDEX, s + 1);
    // update lastCompletedStep instantly in data for persistence
    setData(prev => ({ ...prev, lastCompletedStep: Math.max(prev.lastCompletedStep || 0, s) }));
    return next;
  });
  const prevStep = () => setStep(s => Math.max(0, s - 1));

  const goToStep = (target: number) => setStep(Math.min(MAX_STEP_INDEX, Math.max(0, target)));

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSave = () => {
    setSaveStatus('saving');
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          step,
          data,
          lastSaved: new Date().toISOString(),
          onboarding_progress: `Step ${step + 1} of ${TOTAL_STEPS}`,
          lastCompletedStep: data.lastCompletedStep,
          selectedTemplate: data.templateId,
          websiteAppearance: data.websiteAppearance,
          reviewedContent: data.reviewedContent,
          publishState: data.publishState,
          currentStep: step + 1
        })
      );
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => {
      setSaveStatus('saved');
      showToast('Changes Saved');
    }, 200);
  };

  const handleDashboard = () => {
    // Do NOT reset to Screen 01 automatically unless user explicitly wants dashboard.
    // For this app, Go to Dashboard will take them to Landing (step 0) but preserve data.
    // According to spec, do not return to onboarding after successful publish unless explicit — user clicked Go to Dashboard, so it's explicit.
    setStep(0);
    setShowResumeBanner(false);
  };

  if (step === 0) return <Landing onNext={nextStep} />;
  if (step === 1) return <HeroSplit onNext={nextStep} />;

  // Determine if TopBar should show (for wizard steps, not for landing/hero/success? spec says show progress)
  // Show for steps 2..13 (Step 3-14 of 15). For Step 15 success, hide or show minimal.
  const showTopBar = step >= 2 && step < 14 && activeModule === 'wizard';

  return (
    <div className="h-screen bg-[#f9f9f9] flex flex-col font-sans text-gray-900 overflow-hidden relative">
      {showTopBar && (
        <TopBar 
          step={step} 
          activeModule={activeModule} 
          setActiveModule={setActiveModule} 
          saveStatus={saveStatus}
        />
      )}

      {/* Resume Welcome Back Banner - Fixed to show correct step and actually render correct screen below */}
      <AnimatePresence>
        {showResumeBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-[#3f001a] text-white px-6 py-3 border-b border-[#ac0053]/40 flex items-center justify-between gap-4 z-40 shrink-0 text-xs sm:text-sm"
          >
            <div className="flex items-center gap-2">
              <span className="font-bold bg-[#ffd9e1] text-[#ac0053] px-2 py-0.5 rounded text-[11px] uppercase tracking-wider">
                Welcome back
              </span>
              <span>Your website setup is saved. Resuming from Step {step + 1} of {TOTAL_STEPS}.</span>
            </div>
            <button
              onClick={() => setShowResumeBanner(false)}
              className="bg-[#ac0053] hover:bg-[#ba005b] text-white px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 shrink-0 transition-colors"
            >
              Continue Setup <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      <main className="flex-1 flex overflow-hidden">
        {activeModule === 'staff-management' ? (
          <StaffManagementModule
            data={data}
            setData={setData}
            onSave={handleSave}
            onBackToWizard={() => setActiveModule('wizard')}
          />
        ) : (
          <>
            {step === 2 && <StepTemplate data={data} setData={setData} onNext={nextStep} onPrev={prevStep} onSave={handleSave} />}
            {step === 3 && <StepDetails data={data} setData={setData} onNext={nextStep} onPrev={prevStep} onSave={handleSave} />}
            {step === 4 && <StepServices data={data} setData={setData} onNext={nextStep} onPrev={prevStep} onSave={handleSave} />}
            {step === 5 && (
              <StepTeam 
                data={data} 
                setData={setData} 
                onNext={nextStep} 
                onPrev={prevStep} 
                onSave={handleSave} 
                onOpenStaffManagement={() => setActiveModule('staff-management')}
              />
            )}
            {step === 6 && (
              <StepPhotos
                data={data}
                setData={setData}
                onNext={nextStep}
                onPrev={prevStep}
                onSave={handleSave}
              />
            )}
            {step === 7 && (
              <StepSocials
                data={data}
                setData={setData}
                onNext={nextStep}
                onPrev={prevStep}
                onSave={handleSave}
              />
            )}
            {step === 8 && (
              <StepLocation
                data={data}
                setData={setData}
                onNext={nextStep}
                onPrev={prevStep}
                onSave={handleSave}
              />
            )}
            {step === 9 && (
              <StepContactBooking
                data={data}
                setData={setData}
                onNext={nextStep}
                onPrev={prevStep}
                onSave={handleSave}
              />
            )}
            {/* Step 11 of 15 (index 10) - Template Appearance */}
            {step === 10 && <StepPublish data={data} setData={setData} onNext={nextStep} onPrev={prevStep} onSave={handleSave} />}
            
            {/* FIXED STEPS 12-15 - Previously not rendering */}
            {step === 11 && <StepAIContentReview data={data} setData={setData} onNext={nextStep} onPrev={prevStep} onSave={handleSave} />}
            {step === 12 && <StepFullWebsitePreview data={data} setData={setData} onNext={nextStep} onPrev={prevStep} onSave={handleSave} />}
            {step === 13 && <StepPublishSetup data={data} setData={setData} onNext={nextStep} onPrev={prevStep} onSave={handleSave} />}
            {step === 14 && <StepPublishSuccess data={data} setData={setData} onNext={handleDashboard} onSave={handleSave} />}

            {/* Fallback safety - should never hit if switch logic is correct, but prevent blank screen */}
            {step > 14 && (
              <div className="flex-1 flex items-center justify-center p-12">
                <div className="text-center space-y-4">
                  <h2 className="text-2xl font-bold">Step out of range — redirecting to resume point</h2>
                  <p className="text-sm text-gray-500">Current step {step} is beyond {MAX_STEP_INDEX}</p>
                  <button onClick={() => goToStep(11)} className="px-6 py-2 bg-[#ac0053] text-white rounded-lg text-sm">Go to Step 12 AI Review</button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-8 right-8 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span className="text-sm font-medium">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
