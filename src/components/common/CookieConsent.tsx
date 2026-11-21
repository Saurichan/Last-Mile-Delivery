import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { Shield, Settings, Check, X } from 'lucide-react';

export const CookieConsent: React.FC = () => {
  const { cookiePreferences, setCookiePreferences } = useStore();
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);

  const [analytics, setAnalytics] = useState(cookiePreferences.analytics);
  const [optional, setOptional] = useState(cookiePreferences.optional);

  useEffect(() => {
    const consentGiven = localStorage.getItem('optimizer_cookie_consent_given');
    if (!consentGiven) {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    setCookiePreferences({ essential: true, analytics: true, optional: true });
    localStorage.setItem('optimizer_cookie_consent_given', 'true');
    setIsVisible(false);
  };

  const handleRejectNonEssential = () => {
    setCookiePreferences({ essential: true, analytics: false, optional: false });
    localStorage.setItem('optimizer_cookie_consent_given', 'true');
    setIsVisible(false);
  };

  const handleSaveCustom = () => {
    setCookiePreferences({ essential: true, analytics, optional });
    localStorage.setItem('optimizer_cookie_consent_given', 'true');
    setShowPreferencesModal(false);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Banner */}
      <div className="fixed bottom-16 sm:bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-50 max-w-md bg-white dark:bg-[#13251E] border border-[#D8E2DC] dark:border-[#1F3A2E] rounded-3xl shadow-modal p-4 text-[#111C16] dark:text-zinc-100 backdrop-blur-md animate-slide-up">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#1E5B44] text-white flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-[#F7A838]" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-[#111C16] dark:text-white">Privacy & Local Storage</h3>
            <p className="text-[11px] text-[#6C7D74] leading-relaxed">
              We store dispatch routes and business preferences locally in your browser for fast load times in Tumakuru.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={handleAcceptAll}
                className="px-3 py-1.5 bg-[#F7A838] hover:bg-[#E69727] text-[#111C16] rounded-xl text-xs font-black transition shadow-sm"
              >
                Accept All
              </button>
              <button
                onClick={handleRejectNonEssential}
                className="px-3 py-1.5 bg-[#F4F7F5] hover:bg-[#E8F5EF] dark:bg-[#182E25] text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-semibold transition"
              >
                Essential Only
              </button>
              <button
                onClick={() => setShowPreferencesModal(true)}
                className="text-[11px] text-[#6C7D74] hover:text-[#111C16] dark:hover:text-white underline ml-1"
              >
                Customize
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences Modal */}
      {showPreferencesModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-[#13251E] border border-[#D8E2DC] dark:border-[#1F3A2E] rounded-3xl shadow-modal p-6 text-zinc-900 dark:text-zinc-100 space-y-4">
            <button
              onClick={() => setShowPreferencesModal(false)}
              className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-black dark:hover:text-white rounded-xl hover:bg-[#F4F7F5] transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-[#238B5E]" />
              <h2 className="text-sm font-black text-[#111C16] dark:text-white">Customize Preferences</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#F4F7F5] dark:bg-[#182E25] rounded-2xl border border-[#D8E2DC]/60 dark:border-[#1F3A2E] flex justify-between items-center">
                <div>
                  <div className="font-bold text-[#111C16] dark:text-white">Essential Session Storage</div>
                  <div className="text-[11px] text-[#6C7D74]">Route plans and order queue</div>
                </div>
                <span className="text-[10px] font-bold text-[#6C7D74]">Required</span>
              </div>

              <div className="p-3 bg-[#F4F7F5] dark:bg-[#182E25] rounded-2xl border border-[#D8E2DC]/60 dark:border-[#1F3A2E] flex justify-between items-center">
                <div>
                  <div className="font-bold text-[#111C16] dark:text-white">Analytics & Heuristic Stats</div>
                  <div className="text-[11px] text-[#6C7D74]">Algorithm execution time benchmarks</div>
                </div>
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="rounded text-[#1E5B44] w-4 h-4"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#D8E2DC] dark:border-[#1F3A2E]">
              <button
                onClick={handleSaveCustom}
                className="px-5 py-2 bg-[#F7A838] hover:bg-[#E69727] text-[#111C16] rounded-xl text-xs font-black"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
