import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { supabase, isSupabaseConfigured, trackEvent } from '../../services/supabase';
import { syncProfileFromSupabaseUser } from '../../services/authService';
import { BusinessType } from '../../types';
import {
  Navigation,
  Mail,
  Lock,
  User,
  Building2,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  ChevronLeft,
  MapPin,
  Briefcase,
} from 'lucide-react';

export type AuthMode = 'login' | 'signup' | 'forgot' | 'reset';

interface AuthViewProps {
  initialMode?: AuthMode;
  onSuccess?: () => void;
}

const BUSINESS_TYPE_OPTIONS: { id: BusinessType; label: string }[] = [
  { id: 'bakery', label: 'Bakery & Confectionery' },
  { id: 'restaurant', label: 'Restaurant & Dining' },
  { id: 'cloud_kitchen', label: 'Cloud Kitchen' },
  { id: 'tiffin_service', label: 'Tiffin & Meal Delivery' },
  { id: 'cafe', label: 'Cafe & Beverages' },
  { id: 'dairy', label: 'Dairy & Fresh Milk' },
  { id: 'pharmacy', label: 'Pharmacy & Healthcare' },
  { id: 'medical_supplies', label: 'Medical Supplies & Equipment' },
  { id: 'diagnostic_samples', label: 'Diagnostic Samples & Labs' },
  { id: 'grocery', label: 'Supermarket & Grocery' },
  { id: 'flower_shop', label: 'Flower Shop & Florist' },
  { id: 'stationery', label: 'Books & Stationery' },
  { id: 'boutique', label: 'Fashion Boutique & Apparel' },
  { id: 'electronics', label: 'Electronics & Gadgets' },
  { id: 'general_store', label: 'General Retail Store' },
  { id: 'laundry', label: 'Laundry & Dry Cleaning' },
  { id: 'custom_business', label: 'Other Local Delivery Business' },
];

export const AuthView: React.FC<AuthViewProps> = ({ initialMode = 'login', onSuccess }) => {
  const { userProfile, updateUserProfile, setBusiness, business, setIsAuthenticated } = useStore();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType>('bakery');
  const [businessLocation, setBusinessLocation] = useState('Tumakuru, Karnataka');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Quick Demo Access without hardcoded personal names (Requirement #9)
  const handleQuickDemoLogin = (role: 'dispatcher' | 'driver') => {
    if (role === 'dispatcher') {
      updateUserProfile({
        name: '', // Empty by default so "Welcome!" is displayed (Requirement #6)
        businessName: 'Express Local Delivery',
        businessType: 'bakery',
        businessLocation: 'Tumakuru, Karnataka',
        role: 'Business Owner',
        email: 'dispatcher@localbusiness.in',
        city: 'Tumakuru',
        state: 'Karnataka',
      });
      setBusiness({
        ...business,
        name: 'Express Local Delivery',
        type: 'bakery',
      });
      setIsAuthenticated(true);
      trackEvent('login_completed', { method: 'quick_demo_dispatcher' });
    } else {
      updateUserProfile({
        name: '',
        businessName: 'Express Local Delivery',
        businessType: 'bakery',
        businessLocation: 'Tumakuru, Karnataka',
        role: 'Courier Driver',
        email: 'driver@localbusiness.in',
        city: 'Tumakuru',
        state: 'Karnataka',
      });
      setIsAuthenticated(true);
      trackEvent('login_completed', { method: 'quick_demo_driver' });
    }
    if (onSuccess) onSuccess();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (mode === 'login') {
        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail) {
          throw new Error('Please enter your email address.');
        }

        if (isSupabaseConfigured && supabase) {
          const { data: authData, error } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });
          if (error) throw error;

          if (authData.user) {
            await syncProfileFromSupabaseUser(authData.user);
            setIsAuthenticated(true);
            trackEvent('login_completed', { email: cleanEmail });
            if (onSuccess) onSuccess();
            return;
          }
        }

        // Local / Offline Sign In
        updateUserProfile({
          email: cleanEmail,
          name: name.trim() || userProfile.name,
          businessName: businessName.trim() || userProfile.businessName,
        });
        setIsAuthenticated(true);
        trackEvent('login_completed', { email: cleanEmail });
        if (onSuccess) onSuccess();
      } else if (mode === 'signup') {
        // Requirement #1: Collect Full Name, Email, Password, Business Name, Business Type, Business Location
        const cleanEmail = email.trim().toLowerCase();
        const cleanName = name.trim();
        const cleanBizName = businessName.trim();
        const cleanLocation = businessLocation.trim() || 'Tumakuru, Karnataka';

        if (!cleanEmail || !password) {
          throw new Error('Please provide an email address and password.');
        }

        // Parse city/state from location string
        const locParts = cleanLocation.split(',').map((p) => p.trim());
        const city = locParts[0] || 'Tumakuru';
        const state = locParts[1] || 'Karnataka';

        // 1. Supabase Signup & Profile Persistence (Requirement #2 & #7)
        if (isSupabaseConfigured && supabase) {
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
              data: {
                full_name: cleanName,
                name: cleanName,
                business_name: cleanBizName,
                business_type: businessType,
                business_location: cleanLocation,
                role: 'admin',
              },
            },
          });
          if (authError) throw authError;

          if (authData.user) {
            try {
              // Store user's full name and profile in Supabase profiles table
              await supabase.from('profiles').upsert({
                id: authData.user.id,
                email: cleanEmail,
                full_name: cleanName,
                role: 'admin',
                updated_at: new Date().toISOString(),
              });
            } catch (pErr) {
              console.warn('Supabase profiles upsert notice:', pErr);
            }
          }
        }

        // 2. Synchronize to store and persistent state (Requirement #3, #6, #8)
        updateUserProfile({
          name: cleanName,
          email: cleanEmail,
          role: 'Business Owner',
          businessName: cleanBizName || 'My Delivery Business',
          businessType: businessType,
          businessLocation: cleanLocation,
          city: city,
          state: state,
        });

        setBusiness({
          ...business,
          name: cleanBizName || business.name,
          type: businessType,
          depot: {
            ...business.depot,
            address: cleanLocation,
          },
        });

        setIsAuthenticated(true);
        trackEvent('signup_completed', { email: cleanEmail, businessName: cleanBizName, businessType });
        if (onSuccess) onSuccess();
      } else if (mode === 'forgot') {
        if (isSupabaseConfigured && supabase) {
          const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
          if (error) throw error;
        }
        setSuccessMsg(`Password reset link sent to ${email}. Check your inbox.`);
      } else if (mode === 'reset') {
        if (isSupabaseConfigured && supabase) {
          const { error } = await supabase.auth.updateUser({ password });
          if (error) throw error;
        }
        setSuccessMsg('Password successfully updated. You can now sign in.');
        setMode('login');
      }
    } catch (err: any) {
      console.warn('Auth Error:', err);
      if (!isSupabaseConfigured && mode === 'login') {
        // Friendly local fallback
        setIsAuthenticated(true);
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg(err.message || 'Authentication failed. Please verify your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8F7] dark:bg-[#292D32] flex items-center justify-center p-4 selection:bg-[#168E6A] selection:text-white font-sans">
      <div className="w-full max-w-lg bg-white dark:bg-[#33383F] border border-[#EAECEA] dark:border-[#495059] rounded-3xl shadow-modal p-6 sm:p-8 space-y-6 text-[#292D32] dark:text-[#F1F3F2] animate-slide-up">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#168E6A] text-white flex items-center justify-center shadow-sm ring-4 ring-[#E8F6F1] dark:ring-[#168E6A]/20">
            <Navigation className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-[#292D32] dark:text-white">
              LAST-MILE DELIVERY ROUTE OPTIMIZER
            </h1>
            <p className="text-xs text-[#B4B6B7] dark:text-zinc-400 mt-0.5">
              Smart delivery planning for local businesses
            </p>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex bg-[#F1F3F2] dark:bg-[#292D32] p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
              mode === 'login'
                ? 'bg-white dark:bg-[#3A4048] text-[#168E6A] dark:text-white shadow-sm'
                : 'text-[#B4B6B7] hover:text-[#292D32] dark:hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
              mode === 'signup'
                ? 'bg-white dark:bg-[#3A4048] text-[#168E6A] dark:text-white shadow-sm'
                : 'text-[#B4B6B7] hover:text-[#292D32] dark:hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error / Success Alerts */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-[#E8F6F1] text-[#168E6A] border border-[#168E6A]/30 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Quick Demo Access (Requirement #9: No hardcoded person names as account identity) */}
        {mode === 'login' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#B4B6B7] uppercase tracking-wider">
              <span>Quick Demo Sign In</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('dispatcher')}
                className="p-3 bg-[#E8F6F1] hover:bg-[#D1ECE3] dark:bg-[#292D32] border border-[#168E6A]/30 rounded-2xl text-left transition text-xs"
              >
                <div className="font-bold text-[#168E6A] dark:text-[#2FA872] flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> Store Dispatcher
                </div>
                <div className="text-[10px] text-[#B4B6B7] mt-0.5">Route Manager & Admin</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('driver')}
                className="p-3 bg-[#FFF7EB] hover:bg-[#FDE6BE] dark:bg-[#292D32] border border-[#FBB03B]/40 rounded-2xl text-left transition text-xs"
              >
                <div className="font-bold text-[#C47D1A] dark:text-[#FBB03B] flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5" /> Courier Driver
                </div>
                <div className="text-[10px] text-[#B4B6B7] mt-0.5">Mobile Driver Cockpit</div>
              </button>
            </div>
          </div>
        )}

        {/* Main Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <>
              {/* 1. Full Name */}
              <div>
                <label className="text-xs font-bold text-[#292D32] dark:text-zinc-300 block mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full bg-[#F7F8F7] dark:bg-[#292D32] border border-[#EAECEA] dark:border-[#495059] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#292D32] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#168E6A]"
                  />
                  <User className="w-4 h-4 text-[#B4B6B7] absolute left-3 top-3" />
                </div>
              </div>

              {/* 4. Business Name */}
              <div>
                <label className="text-xs font-bold text-[#292D32] dark:text-zinc-300 block mb-1">
                  Business Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Apex Fresh Foods"
                    className="w-full bg-[#F7F8F7] dark:bg-[#292D32] border border-[#EAECEA] dark:border-[#495059] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#292D32] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#168E6A]"
                  />
                  <Building2 className="w-4 h-4 text-[#B4B6B7] absolute left-3 top-3" />
                </div>
              </div>

              {/* 5. Business Type */}
              <div>
                <label className="text-xs font-bold text-[#292D32] dark:text-zinc-300 block mb-1">
                  Business Type <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value as BusinessType)}
                    className="w-full bg-[#F7F8F7] dark:bg-[#292D32] border border-[#EAECEA] dark:border-[#495059] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#292D32] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#168E6A] appearance-none cursor-pointer"
                  >
                    {BUSINESS_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <Briefcase className="w-4 h-4 text-[#B4B6B7] absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* 6. Business Location */}
              <div>
                <label className="text-xs font-bold text-[#292D32] dark:text-zinc-300 block mb-1">
                  Business Location / Depot <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={businessLocation}
                    onChange={(e) => setBusinessLocation(e.target.value)}
                    placeholder="e.g. MG Road, Tumakuru, Karnataka"
                    className="w-full bg-[#F7F8F7] dark:bg-[#292D32] border border-[#EAECEA] dark:border-[#495059] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#292D32] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#168E6A]"
                  />
                  <MapPin className="w-4 h-4 text-[#B4B6B7] absolute left-3 top-3" />
                </div>
              </div>
            </>
          )}

          {/* 2. Email Address */}
          <div>
            <label className="text-xs font-bold text-[#292D32] dark:text-zinc-300 block mb-1">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@yourbusiness.in"
                className="w-full bg-[#F7F8F7] dark:bg-[#292D32] border border-[#EAECEA] dark:border-[#495059] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#292D32] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#168E6A]"
              />
              <Mail className="w-4 h-4 text-[#B4B6B7] absolute left-3 top-3" />
            </div>
          </div>

          {/* 3. Password */}
          {(mode === 'login' || mode === 'signup' || mode === 'reset') && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#292D32] dark:text-zinc-300">
                  Password <span className="text-rose-500">*</span>
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] font-semibold text-[#168E6A] hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#F7F8F7] dark:bg-[#292D32] border border-[#EAECEA] dark:border-[#495059] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#292D32] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#168E6A]"
                />
                <Lock className="w-4 h-4 text-[#B4B6B7] absolute left-3 top-3" />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-[#168E6A] hover:bg-[#127355] text-white rounded-2xl text-xs font-black transition flex items-center justify-center gap-2 shadow-sm active:scale-95 mt-3"
          >
            <span>
              {loading
                ? 'Processing...'
                : mode === 'login'
                ? 'Sign In to Dashboard'
                : mode === 'signup'
                ? 'Create Business Account'
                : mode === 'forgot'
                ? 'Send Reset Link'
                : 'Update Password'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Back Link for forgot password */}
        {mode === 'forgot' && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => setMode('login')}
              className="text-xs font-bold text-[#168E6A] hover:underline flex items-center justify-center gap-1 mx-auto"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Back to Sign In
            </button>
          </div>
        )}

        {/* Location & Trust Footer */}
        <div className="pt-3 border-t border-[#EAECEA] dark:border-[#495059] flex items-center justify-between text-[11px] text-[#B4B6B7]">
          <span>📍 Local Delivery Logistics</span>
          <span className="flex items-center gap-1 text-[#168E6A] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" /> Secured Logistics
          </span>
        </div>
      </div>
    </div>
  );
};
