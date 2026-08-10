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
import { initialData, SalonData, TOTAL_SCREENS_COUNT } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, ArrowRight } from 'lucide-react';

const STORAGE_KEY = 'nexora_onboarding_state';
const MAX_STEP_INDEX = 15; // 0-based: 0..15 => Screens 1..16

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

  const [activeModule, setActiveModule] = useState<'wizard' | 'staff-management'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.activeModule === 'staff-management' || parsed.step === 15) {
          return 'staff-management';
        }
      }
    } catch (e) {
      // fallback
    }
    return 'wizard';
  });

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

  // Auto save state to localStorage whenever step, data or activeModule changes
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
            activeModule,
            data: { ...data, lastCompletedStep },
            lastSaved: new Date().toISOString(),
            onboarding_progress: `Screen ${step + 1} of ${TOTAL_SCREENS_COUNT}`,
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
  }, [step, data, activeModule]);

  const nextStep = () => {
    setStep(s => {
      const next = Math.min(MAX_STEP_INDEX, s + 1);
      setData(prev => ({ ...prev, lastCompletedStep: Math.max(prev.lastCompletedStep || 0, s) }));
      if (next === 15) {
        setActiveModule('staff-management');
      } else {
        setActiveModule('wizard');
      }
      return next;
    });
  };

  const prevStep = () => {
    setStep(s => {
      const prev = Math.max(0, s - 1);
      if (prev < 15) {
        setActiveModule('wizard');
      }
      return prev;
    });
  };

  const goToStep = (target: number) => {
    const validTarget = Math.min(MAX_STEP_INDEX, Math.max(0, target));
    if (validTarget === 15) {
      setActiveModule('staff-management');
    } else {
      setActiveModule('wizard');
    }
    setStep(validTarget);
  };

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
          activeModule,
          data,
          lastSaved: new Date().toISOString(),
          onboarding_progress: `Screen ${step + 1} of ${TOTAL_SCREENS_COUNT}`,
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
    goToStep(0);
    setShowResumeBanner(false);
  };

  return (
    <div className="h-screen bg-[#f9f9f9] flex flex-col font-sans text-gray-900 overflow-hidden relative">
      
      {/* Universal TopBar with Screen Navigator & Progress */}
      <TopBar 
        step={step} 
        activeModule={activeModule} 
        setActiveModule={(mod) => {
          setActiveModule(mod);
          if (mod === 'staff-management') {
            setStep(15);
          } else if (step === 15) {
            setStep(2);
          }
        }} 
        goToStep={goToStep}
        onNext={nextStep}
        onPrev={prevStep}
        saveStatus={saveStatus}
      />

      {/* Resume Welcome Back Banner */}
      <AnimatePresence>
        {showResumeBanner && step > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-[#3f001a] text-white px-6 py-2.5 border-b border-[#ac0053]/40 flex items-center justify-between gap-4 z-40 shrink-0 text-xs sm:text-sm"
          >
            <div className="flex items-center gap-2">
              <span className="font-bold bg-[#ffd9e1] text-[#ac0053] px-2 py-0.5 rounded text-[11px] uppercase tracking-wider">
                Welcome back
              </span>
              <span>Your website setup is saved. Resuming from Screen {step + 1} of {TOTAL_SCREENS_COUNT}.</span>
            </div>
            <button
              onClick={() => setShowResumeBanner(false)}
              className="bg-[#ac0053] hover:bg-[#ba005b] text-white px-3 py-1 rounded-lg font-semibold flex items-center gap-1 shrink-0 transition-colors"
            >
              Dismiss <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      <main className="flex-1 flex overflow-hidden relative">
        {/* Screen 16: Staff Management Module */}
        {activeModule === 'staff-management' || step === 15 ? (
          <StaffManagementModule
            data={data}
            setData={setData}
            onSave={handleSave}
            onBackToWizard={() => {
              setActiveModule('wizard');
              setStep(5); // Go back to Screen 06 (Team Setup)
            }}
          />
        ) : (
          <>
            {/* Screen 01: Landing Page */}
            {step === 0 && <Landing onNext={nextStep} />}

            {/* Screen 02: Hero Split Screen */}
            {step === 1 && <HeroSplit onNext={nextStep} />}

            {/* Screen 03: Template Selection */}
            {step === 2 && (
              <StepTemplate 
                data={data} 
                setData={setData} 
                onNext={nextStep} 
                onPrev={prevStep} 
                onSave={handleSave} 
              />
            )}

            {/* Screen 04: Salon Details & Hero */}
            {step === 3 && (
              <StepDetails 
                data={data} 
                setData={setData} 
                onNext={nextStep} 
                onPrev={prevStep} 
                onSave={handleSave} 
              />
            )}

            {/* Screen 05: Services & Packages */}
            {step === 4 && (
              <StepServices 
                data={data} 
                setData={setData} 
                onNext={nextStep} 
                onPrev={prevStep} 
                onSave={handleSave} 
              />
            )}

            {/* Screen 06: Team & Staff Setup */}
            {step === 5 && (
              <StepTeam 
                data={data} 
                setData={setData} 
                onNext={nextStep} 
                onPrev={prevStep} 
                onSave={handleSave} 
                onOpenStaffManagement={() => {
                  setActiveModule('staff-management');
                  setStep(15);
                }}
              />
            )}

            {/* Screen 07: Photo Gallery */}
            {step === 6 && (
              <StepPhotos
                data={data}
                setData={setData}
                onNext={nextStep}
                onPrev={prevStep}
                onSave={handleSave}
              />
            )}

            {/* Screen 08: Socials & Video Reels */}
            {step === 7 && (
              <StepSocials
                data={data}
                setData={setData}
                onNext={nextStep}
                onPrev={prevStep}
                onSave={handleSave}
              />
            )}

            {/* Screen 09: Location & Business Hours */}
            {step === 8 && (
              <StepLocation
                data={data}
                setData={setData}
                onNext={nextStep}
                onPrev={prevStep}
                onSave={handleSave}
              />
            )}

            {/* Screen 10: Contact & Booking Rules */}
            {step === 9 && (
              <StepContactBooking
                data={data}
                setData={setData}
                onNext={nextStep}
                onPrev={prevStep}
                onSave={handleSave}
              />
            )}

            {/* Screen 11: Template Appearance (Light/Dark Theme) */}
            {step === 10 && (
              <StepPublish 
                data={data} 
                setData={setData} 
                onNext={nextStep} 
                onPrev={prevStep} 
                onSave={handleSave} 
              />
            )}
            
            {/* Screen 12: AI Content Review (Gemini AI) */}
            {step === 11 && (
              <StepAIContentReview 
                data={data} 
                setData={setData} 
                onNext={nextStep} 
                onPrev={prevStep} 
                onSave={handleSave} 
              />
            )}

            {/* Screen 13: Full Interactive Website Preview */}
            {step === 12 && (
              <StepFullWebsitePreview 
                data={data} 
                setData={setData} 
                onNext={nextStep} 
                onPrev={prevStep} 
                onSave={handleSave} 
              />
            )}

            {/* Screen 14: Publish Setup & Custom Slug */}
            {step === 13 && (
              <StepPublishSetup 
                data={data} 
                setData={setData} 
                onNext={nextStep} 
                onPrev={prevStep} 
                onSave={handleSave} 
              />
            )}

            {/* Screen 15: Website Published & QR Code */}
            {step === 14 && (
              <StepPublishSuccess 
                data={data} 
                setData={setData} 
                onNext={handleDashboard} 
                onPrev={prevStep}
                onSave={handleSave} 
              />
            )}

            {/* Out of range fallback */}
            {step > 15 && (
              <div className="flex-1 flex items-center justify-center p-12">
                <div className="text-center space-y-4">
                  <h2 className="text-2xl font-bold">Screen index out of range</h2>
                  <button onClick={() => goToStep(0)} className="px-6 py-2 bg-[#ac0053] text-white rounded-lg text-sm">
                    Go to Screen 01 (Landing)
                  </button>
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
