import React, { useState, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { saveUserProfileToSupabase, updateUserEmailWithVerification } from '../../services/authService';
import { getUserInitials, getUserGreeting, formatUserTitle } from '../../utils/userProfile';
import { BusinessType } from '../../types';
import {
  User,
  Building2,
  Sliders,
  Sun,
  Moon,
  Monitor,
  Shield,
  Bell,
  Check,
  Save,
  Truck,
  MapPin,
  Camera,
  Upload,
  Trash2,
  Mail,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
  Phone,
  Briefcase,
} from 'lucide-react';

const PRESET_AVATARS = [
  {
    id: 'av-1',
    label: 'Corporate',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-2',
    label: 'Merchant',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-3',
    label: 'Executive',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-4',
    label: 'Logistics',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
];

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

export const SettingsView: React.FC = () => {
  const {
    userProfile,
    business,
    setBusiness,
    theme,
    setThemeMode,
  } = useStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileForm, setProfileForm] = useState({
    name: userProfile.name || '',
    role: userProfile.role || 'Business Owner',
    email: userProfile.email || '',
    phone: userProfile.phone || '',
    avatarUrl: userProfile.avatarUrl || '',
    city: userProfile.city || 'Tumakuru',
    state: userProfile.state || 'Karnataka',
    businessLocation: userProfile.businessLocation || business.depot.address || 'Tumakuru, Karnataka',
  });

  const [bizForm, setBizForm] = useState({
    name: business.name || 'My Delivery Business',
    type: business.type || ('bakery' as BusinessType),
    tagline: business.tagline || '',
    depotName: business.depot.name || 'Main Delivery Hub',
    depotAddress: business.depot.address || 'Tumakuru, Karnataka',
    defaultStartTime: business.defaultStartTime || '08:30',
    fuelPricePerLiter: business.fuelPricePerLiter || 102.5,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [emailVerificationStatus, setEmailVerificationStatus] = useState<string | null>(null);
  const [emailVerificationLoading, setEmailVerificationLoading] = useState(false);

  // Profile Picture File Upload Handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProfileForm((prev) => ({ ...prev, avatarUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Email Verification Handler (Requirement #5)
  const handleVerifyEmail = async () => {
    if (!profileForm.email.trim()) {
      setEmailVerificationStatus('Please enter an email address first.');
      return;
    }

    setEmailVerificationLoading(true);
    setEmailVerificationStatus(null);
    try {
      const res = await updateUserEmailWithVerification(profileForm.email);
      setEmailVerificationStatus(res.message);
    } catch (err: any) {
      setEmailVerificationStatus(err.message || 'Failed to initiate email verification.');
    } finally {
      setEmailVerificationLoading(false);
    }
  };

  // Save All Settings Handler (Requirement #2, #5, #7, #8)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // 1. Save profile to Supabase & local store reactively
      await saveUserProfileToSupabase({
        name: profileForm.name.trim(),
        role: profileForm.role.trim() || 'Business Owner',
        email: profileForm.email.trim().toLowerCase(),
        phone: profileForm.phone.trim(),
        avatarUrl: profileForm.avatarUrl,
        city: profileForm.city.trim(),
        state: profileForm.state.trim(),
        businessName: bizForm.name.trim(),
        businessType: bizForm.type,
        businessLocation: bizForm.depotAddress.trim(),
      });

      // 2. Save business details
      setBusiness({
        ...business,
        name: bizForm.name.trim(),
        type: bizForm.type,
        tagline: bizForm.tagline.trim(),
        defaultStartTime: bizForm.defaultStartTime,
        fuelPricePerLiter: Number(bizForm.fuelPricePerLiter),
        depot: {
          ...business.depot,
          name: bizForm.depotName.trim(),
          address: bizForm.depotAddress.trim(),
        },
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.warn('Error saving settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 font-sans">
      {/* Header */}
      <div className="bg-white dark:bg-[#33383F] border border-[#EAECEA] dark:border-[#495059] rounded-3xl p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-black text-[#292D32] dark:text-white">Settings & User Profile</h1>
          <p className="text-xs text-[#B4B6B7] mt-0.5">
            Manage your personal profile, business identity, avatar, and system preferences
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E8F6F1] text-[#168E6A] border border-[#168E6A]/40 rounded-2xl text-xs font-bold animate-fade-in shrink-0">
            <Check className="w-4 h-4" />
            <span>Profile & Business Updated Everywhere!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* 1. Account Profile & Picture Section (Requirement #5) */}
        <div className="bg-white dark:bg-[#33383F] border border-[#EAECEA] dark:border-[#495059] rounded-3xl p-6 shadow-card space-y-6">
          <div className="flex items-center justify-between border-b border-[#EAECEA] dark:border-[#495059] pb-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#168E6A]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#292D32] dark:text-white">
                Personal Profile & Picture
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-[#168E6A] bg-[#E8F6F1] dark:bg-[#168E6A]/20 px-2.5 py-1 rounded-xl">
              Live Synchronized
            </span>
          </div>

          {/* Profile Picture Management */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-[#F7F8F7] dark:bg-[#292D32] rounded-2xl border border-[#EAECEA] dark:border-[#495059]">
            {/* Avatar Preview */}
            <div className="relative group">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#168E6A] to-[#2FA872] text-white flex items-center justify-center font-black text-2xl shadow-md ring-4 ring-white dark:ring-[#33383F] overflow-hidden shrink-0">
                {profileForm.avatarUrl ? (
                  <img
                    src={profileForm.avatarUrl}
                    alt={profileForm.name || 'User Avatar'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{getUserInitials(profileForm.name, 'U')}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-1.5 bg-[#168E6A] text-white rounded-full shadow-md hover:bg-[#127355] transition"
                title="Change Photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Avatar Controls */}
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <div className="font-bold text-xs text-[#292D32] dark:text-white">
                Profile Photo & Initials
              </div>
              <p className="text-[11px] text-[#B4B6B7] dark:text-zinc-400">
                Upload your picture or select a preset avatar. If no photo is selected, dynamic initials are shown.
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-white dark:bg-[#3A4048] hover:bg-[#E8F6F1] text-zinc-700 dark:text-zinc-200 border border-[#EAECEA] dark:border-[#495059] rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5 text-[#168E6A]" />
                  <span>Upload Picture</span>
                </button>

                {profileForm.avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setProfileForm((prev) => ({ ...prev, avatarUrl: '' }))}
                    className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Photo</span>
                  </button>
                )}
              </div>

              {/* Preset Avatars Selection */}
              <div className="pt-2 flex items-center gap-2 justify-center sm:justify-start">
                <span className="text-[10px] text-[#B4B6B7] font-bold uppercase tracking-wider">Presets:</span>
                <div className="flex items-center gap-1.5">
                  {PRESET_AVATARS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setProfileForm((prev) => ({ ...prev, avatarUrl: av.url }))}
                      className="w-7 h-7 rounded-full overflow-hidden border-2 border-transparent hover:border-[#168E6A] transition hover:scale-105"
                      title={av.label}
                    >
                      <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Form Fields: Name, Role, Email, Phone, City, State */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-[#168E6A] font-semibold">
                  Preview: {profileForm.name.trim() ? profileForm.name : 'Welcome!'}
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="Enter your full name"
                  className="w-full bg-[#F7F8F7] dark:bg-[#292D32] border border-[#EAECEA] dark:border-[#495059] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#292D32] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#168E6A]"
                />
                <User className="w-4 h-4 text-[#B4B6B7] absolute left-3 top-3" />
              </div>
              <p className="text-[10px] text-[#B4B6B7] mt-1">
                Updates greeting ("{getUserGreeting({ name: profileForm.name })}") & top navbar dynamically.
              </p>
            </div>

            {/* Role / Title */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Account Role / Title
                </label>
                <span className="text-[10px] text-[#B4B6B7]">
                  {formatUserTitle({ name: profileForm.name, role: profileForm.role })}
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={profileForm.role}
                  onChange={(e) => setProfileForm({ ...profileForm, role: e.target.value })}
                  placeholder="e.g. Business Owner"
                  className="w-full bg-[#F7F8F7] dark:bg-[#292D32] border border-[#EAECEA] dark:border-[#495059] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#292D32] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#168E6A]"
                />
                <Briefcase className="w-4 h-4 text-[#B4B6B7] absolute left-3 top-3" />
              </div>
            </div>

            {/* Email Address with Verification (Requirement #5) */}
            <div className="sm:col-span-2 space-y-2 p-3 bg-[#F7F8F7] dark:bg-[#292D32] rounded-2xl border border-[#EAECEA] dark:border-[#495059]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#168E6A]" />
                  <span>Email Address & Authentication Verification</span>
                </label>
                <span className="flex items-center gap-1 text-[11px] font-bold text-[#168E6A]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Secured
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  placeholder="name@business.in"
                  className="flex-1 bg-white dark:bg-[#33383F] border border-[#EAECEA] dark:border-[#495059] rounded-xl px-3 py-2 text-xs text-[#292D32] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#168E6A]"
                />
                <button
                  type="button"
                  onClick={handleVerifyEmail}
                  disabled={emailVerificationLoading}
                  className="px-3.5 py-2 bg-[#168E6A] hover:bg-[#127355] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm shrink-0 active:scale-95"
                >
                  {emailVerificationLoading ? (
                    <span>Verifying...</span>
                  ) : (
                    <>
                      <Mail className="w-3.5 h-3.5" />
                      <span>Verify & Update Email</span>
                    </>
                  )}
                </button>
              </div>

              {emailVerificationStatus && (
                <div className="p-2.5 bg-[#E8F6F1] text-[#168E6A] dark:bg-[#168E6A]/20 dark:text-white rounded-xl text-xs font-medium flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0 text-[#168E6A]" />
                  <span>{emailVerificationStatus}</span>
                </div>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="+91 98000 00000"
                  className="w-full bg-[#F7F8F7] dark:bg-[#292D32] border border-[#EAECEA] dark:border-[#495059] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#292D32] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#168E6A]"
                />
                <Phone className="w-4 h-4 text-[#B4B6B7] absolute left-3 top-3" />
              </div>
            </div>

            {/* City */}
            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                City
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={profileForm.city}
                  onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  placeholder="e.g. Tumakuru"
                  className="w-full bg-[#F7F8F7] dark:bg-[#292D32] border border-[#EAECEA] dark:border-[#495059] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#292D32] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#168E6A]"
                />
                <MapPin className="w-4 h-4 text-[#B4B6B7] absolute left-3 top-3" />
              </div>
            </div>

            {/* State */}
            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                State / Region
              </label>
              <input
                type="text"
                value={profileForm.state}
                onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                placeholder="e.g. Karnataka"
                className="w-full bg-[#F7F8F7] dark:bg-[#292D32] border border-[#EAECEA] dark:border-[#495059] rounded-xl px-3 py-2.5 text-xs text-[#292D32] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#168E6A]"
              />
            </div>

            {/* Business Location */}
            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Business Location Tag
              </label>
              <input
                type="text"
                value={profileForm.businessLocation}
                onChange={(e) => setProfileForm({ ...profileForm, businessLocation: e.target.value })}
                placeholder="e.g. Tumakuru, Karnataka"
                className="w-full bg-[#F7F8F7] dark:bg-[#292D32] border border-[#EAECEA] dark:border-[#495059] rounded-xl px-3 py-2.5 text-xs text-[#292D32] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#168E6A]"
              />
            </div>
          </div>
        </div>

        {/* 2. Business Information Section (Requirement #5: Update business information) */}
        <div className="bg-white dark:bg-[#33383F] border border-[#EAECEA] dark:border-[#495059] rounded-3xl p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 border-b border-[#EAECEA] dark:border-[#495059] pb-3">
            <Building2 className="w-4 h-4 text-[#168E6A]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#292D32] dark:text-white">
              Business Information & Logistics Depot
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Business Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={bizForm.name}
                  onChange={(e) => setBizForm({ ...bizForm, name: e.target.value })}
                  className="w-full bg-[#F7F8F7] dark:bg-[#292D32] border border-[#EAECEA] dark:border-[#495059] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#292D32] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#168E6A]"
                  required
                />
                <Building2 className="w-4 h-4 text-[#B4B6B7] absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Business Category & Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={bizForm.type}
                onChange={(e) => setBizForm({ ...bizForm, type: e.target.value as BusinessType })}
                className="w-full bg-[#F7F8F7] dark:bg-[#292D32] border border-[#EAECEA] dark:border-[#495059] rounded-xl px-3 py-2.5 text-xs text-[#292D32] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#168E6A]"
              >
                {BUSINESS_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Business Tagline
              </label>
              <input
                type="text"
                value={bizForm.tagline}
                onChange={(e) => setBizForm({ ...bizForm, tagline: e.target.value })}
                placeholder="e.g. Reliable daily last-mile deliveries"
                className="w-full bg-[#F7F8F7] dark:bg-[#292D32] border border-[#EAECEA] dark:border-[#495059] rounded-xl px-3 py-2.5 text-xs text-[#292D32] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#168E6A]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Depot / Dispatch Address
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={bizForm.depotAddress}
                  onChange={(e) => setBizForm({ ...bizForm, depotAddress: e.target.value })}
                  placeholder="e.g. MG Road, Tumakuru, Karnataka 572101"
                  className="w-full bg-[#F7F8F7] dark:bg-[#292D32] border border-[#EAECEA] dark:border-[#495059] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#292D32] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#168E6A]"
                  required
                />
                <MapPin className="w-4 h-4 text-[#B4B6B7] absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Default Route Start Time
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={bizForm.defaultStartTime}
                  onChange={(e) => setBizForm({ ...bizForm, defaultStartTime: e.target.value })}
                  className="w-full bg-[#F7F8F7] dark:bg-[#292D32] border border-[#EAECEA] dark:border-[#495059] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#292D32] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#168E6A]"
                />
                <Clock className="w-4 h-4 text-[#B4B6B7] absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Fuel Price (₹ / Litre)
              </label>
              <input
                type="number"
                step="0.1"
                value={bizForm.fuelPricePerLiter}
                onChange={(e) => setBizForm({ ...bizForm, fuelPricePerLiter: parseFloat(e.target.value) || 102.5 })}
                className="w-full bg-[#F7F8F7] dark:bg-[#292D32] border border-[#EAECEA] dark:border-[#495059] rounded-xl px-3 py-2.5 text-xs text-[#292D32] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#168E6A]"
              />
            </div>
          </div>
        </div>

        {/* 3. Appearance & Theme Section */}
        <div className="bg-white dark:bg-[#33383F] border border-[#EAECEA] dark:border-[#495059] rounded-3xl p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 border-b border-[#EAECEA] dark:border-[#495059] pb-3">
            <Sun className="w-4 h-4 text-[#FBB03B]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#292D32] dark:text-white">
              Appearance & Theme
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setThemeMode('light')}
              className={`p-4 rounded-2xl border text-center transition flex flex-col items-center gap-2 ${
                theme === 'light'
                  ? 'bg-[#E8F6F1] text-[#168E6A] border-[#168E6A] font-bold ring-2 ring-[#168E6A]/30'
                  : 'bg-[#F7F8F7] dark:bg-[#292D32] text-[#B4B6B7] border-[#EAECEA] dark:border-[#495059]'
              }`}
            >
              <Sun className="w-5 h-5 text-[#FBB03B]" />
              <span className="text-xs font-bold">Light Mode</span>
            </button>

            <button
              type="button"
              onClick={() => setThemeMode('dark')}
              className={`p-4 rounded-2xl border text-center transition flex flex-col items-center gap-2 ${
                theme === 'dark'
                  ? 'bg-[#168E6A] text-white border-[#127355] font-bold ring-2 ring-[#168E6A]/50'
                  : 'bg-[#F7F8F7] dark:bg-[#292D32] text-[#B4B6B7] border-[#EAECEA] dark:border-[#495059]'
              }`}
            >
              <Moon className="w-5 h-5 text-[#E8F6F1]" />
              <span className="text-xs font-bold">Dark Mode</span>
            </button>

            <button
              type="button"
              onClick={() => setThemeMode('light')}
              className="p-4 rounded-2xl border text-center transition flex flex-col items-center gap-2 bg-[#F7F8F7] dark:bg-[#292D32] text-[#B4B6B7] border-[#EAECEA] dark:border-[#495059]"
            >
              <Monitor className="w-5 h-5 text-[#B4B6B7]" />
              <span className="text-xs font-bold">System Default</span>
            </button>
          </div>
        </div>

        {/* Save Footer Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-[#168E6A] hover:bg-[#127355] text-white rounded-2xl text-xs font-black shadow-subtle transition flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {isSaving ? (
              <span>Saving Profile...</span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save All Settings & Profile</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
