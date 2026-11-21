import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import {
  Navigation,
  Plus,
  User,
  ChevronDown,
  Cake,
  Pill,
  ShoppingBag,
  UtensilsCrossed,
  Sun,
  Moon,
  Settings,
  LogOut,
  Building2,
  Check,
  Bell,
  MapPin,
  Mail,
} from 'lucide-react';
import { getUserInitials, getUserFullName, formatUserTitle } from '../../utils/userProfile';

interface NavbarProps {
  onOpenNewOrder: () => void;
  onOpenRules: () => void;
  onOpenSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenNewOrder, onOpenRules, onOpenSettings }) => {
  const {
    business,
    theme,
    toggleTheme,
    setBusinessType,
    userProfile,
    logout,
  } = useStore();

  const [isBizDropdownOpen, setIsBizDropdownOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(true);

  const bizDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bizDropdownRef.current && !bizDropdownRef.current.contains(e.target as Node)) {
        setIsBizDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const demoOptions = [
    { key: 'bakery' as const, label: 'Sweet Delights Bakery', type: 'Bakery & Sweets', icon: Cake, desc: 'Freshness & Time Window Sensitive' },
    { key: 'pharmacy' as const, label: 'MediCare Express Pharmacy', type: 'Pharmacy & Health', icon: Pill, desc: 'Critical Urgency & Cold Pack Delivery' },
    { key: 'grocery' as const, label: 'FreshMart Supermarket', type: 'Grocery & Staples', icon: ShoppingBag, desc: 'Heavy Payload Batching & Van Trips' },
    { key: 'tiffin_service' as const, label: 'Annapurna Homestyle Tiffins', type: 'Tiffin Service', icon: UtensilsCrossed, desc: 'Hot Lunch/Dinner Slot Windows' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white dark:bg-[#292D32] border-b border-[#EAECEA] dark:border-[#495059] px-4 py-2.5 flex items-center justify-between transition-colors shadow-subtle font-sans">
      {/* 1. Left: Brand Logo & Exact Name (Requirement #6) */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-[#168E6A] flex items-center justify-center text-white shadow-sm ring-2 ring-[#E8F6F1] dark:ring-[#168E6A]/30 shrink-0">
          <Navigation className="w-4 h-4 fill-current" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm sm:text-base tracking-tight text-[#292D32] dark:text-white">
              LAST-MILE DELIVERY ROUTE OPTIMIZER
            </span>
          </div>
          <p className="hidden md:block text-[11px] font-medium text-[#B4B6B7] dark:text-zinc-400">
            Smart delivery planning for local businesses
          </p>
        </div>
      </div>

      {/* 2. Center: Location & Business Selector */}
      <div className="hidden lg:flex items-center gap-2" ref={bizDropdownRef}>
        <button
          onClick={() => setIsBizDropdownOpen(!isBizDropdownOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F7F8F7] hover:bg-[#E8F6F1] dark:bg-[#33383F] dark:hover:bg-[#3A4048] border border-[#EAECEA] dark:border-[#495059] text-xs font-semibold text-[#292D32] dark:text-zinc-200 transition"
        >
          <MapPin className="w-3.5 h-3.5 text-[#168E6A]" />
          <span className="font-bold text-[#292D32] dark:text-white">{business?.name || 'Sweet Delights Bakery'}</span>
          <span className="text-[#B4B6B7]">• Tumakuru, KA</span>
          <ChevronDown className="w-3.5 h-3.5 text-[#B4B6B7]" />
        </button>

        {isBizDropdownOpen && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 mt-1 w-80 bg-white dark:bg-[#33383F] border border-[#EAECEA] dark:border-[#495059] rounded-2xl shadow-modal p-2 z-50 animate-fade-in">
            <div className="px-2.5 py-1.5 text-[11px] font-bold text-[#B4B6B7] uppercase tracking-wider">
              Switch Demo Business (Tumakuru)
            </div>
            <div className="space-y-1 mt-1">
              {demoOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = business.type === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => {
                      setBusinessType(opt.key);
                      setIsBizDropdownOpen(false);
                    }}
                    className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-xl text-left transition ${
                      isSelected
                        ? 'bg-[#E8F6F1] dark:bg-[#168E6A]/20 text-[#168E6A] dark:text-[#E8F6F1] font-bold border border-[#168E6A]/40'
                        : 'hover:bg-[#F7F8F7] dark:hover:bg-[#3A4048] text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mt-0.5 text-[#168E6A] shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-[#292D32] dark:text-white flex items-center justify-between">
                        <span className="truncate">{opt.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#168E6A]" />}
                      </div>
                      <div className="text-[10px] text-[#B4B6B7] truncate">{opt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. Right: Quick Add, Notifications, Theme & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Add Order Button - Primary Green CTA */}
        <button
          onClick={onOpenNewOrder}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#168E6A] hover:bg-[#127355] text-white rounded-xl text-xs font-bold transition shadow-subtle active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Order</span>
        </button>

        {/* Notifications Bell */}
        <button
          onClick={() => setHasNotifications(false)}
          className="relative p-2 bg-[#F7F8F7] hover:bg-[#E8F6F1] dark:bg-[#33383F] dark:hover:bg-[#3A4048] text-zinc-700 dark:text-zinc-300 rounded-xl border border-[#EAECEA] dark:border-[#495059] transition"
          title="Notifications"
        >
          <Bell className="w-4 h-4 text-[#292D32] dark:text-zinc-200" />
          {hasNotifications && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FBB03B] ring-2 ring-white dark:ring-[#292D32]"></span>
          )}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 bg-[#F7F8F7] hover:bg-[#E8F6F1] dark:bg-[#33383F] dark:hover:bg-[#3A4048] text-zinc-700 dark:text-zinc-300 rounded-xl border border-[#EAECEA] dark:border-[#495059] transition"
          title="Toggle Light / Dark Mode"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-[#FBB03B]" /> : <Moon className="w-4 h-4 text-[#168E6A]" />}
        </button>

        {/* 4. USER PROFILE - Circular Avatar & Dropdown (Requirement #10) */}
        <div className="relative" ref={profileDropdownRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-xl hover:bg-[#F7F8F7] dark:hover:bg-[#33383F] border border-transparent hover:border-[#EAECEA] dark:hover:border-[#495059] transition"
            aria-label="User profile menu"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#168E6A] to-[#2FA872] text-white font-black text-xs flex items-center justify-center shadow-sm ring-2 ring-[#E8F6F1] dark:ring-[#168E6A]/30 shrink-0 overflow-hidden">
              {userProfile.avatarUrl ? (
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.name || 'User'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{getUserInitials(userProfile.name, 'U')}</span>
              )}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-[#292D32] dark:text-white leading-tight">
                {userProfile.name ? userProfile.name : 'Welcome!'}
              </span>
              <span className="text-[10px] text-[#B4B6B7] dark:text-zinc-400 leading-tight">
                {formatUserTitle(userProfile)}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#B4B6B7] hidden sm:block" />
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#33383F] border border-[#EAECEA] dark:border-[#495059] rounded-2xl shadow-modal p-3 z-50 animate-fade-in text-[#292D32] dark:text-white">
              {/* Profile Card Header */}
              <div className="p-3 bg-[#E8F6F1] dark:bg-[#168E6A]/20 rounded-xl border border-[#168E6A]/20 space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#168E6A] to-[#2FA872] text-white flex items-center justify-center font-black text-sm shadow-sm overflow-hidden shrink-0">
                    {userProfile.avatarUrl ? (
                      <img
                        src={userProfile.avatarUrl}
                        alt={userProfile.name || 'User'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{getUserInitials(userProfile.name, 'U')}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-[#292D32] dark:text-white truncate">
                      {userProfile.name ? userProfile.name : 'Welcome!'}
                    </div>
                    <div className="text-[11px] font-semibold text-[#168E6A] dark:text-[#2FA872] truncate">
                      {formatUserTitle(userProfile)}
                    </div>
                    <div className="text-[10px] text-[#B4B6B7] dark:text-zinc-400 truncate flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3 shrink-0" />
                      <span className="truncate">{userProfile.email || 'No email configured'}</span>
                    </div>
                  </div>
                </div>
                <div className="pt-1.5 flex items-center justify-between text-[10px] text-[#B4B6B7] dark:text-zinc-400 border-t border-[#EAECEA] dark:border-[#495059]">
                  <span className="truncate max-w-[150px]">
                    📍 {userProfile.businessLocation || `${userProfile.city}, ${userProfile.state}`}
                  </span>
                  <span className="font-bold text-[#168E6A] shrink-0">● Active Account</span>
                </div>
              </div>

              {/* Menu Links */}
              <div className="space-y-1 pt-2">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    if (onOpenSettings) onOpenSettings();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium hover:bg-[#F7F8F7] dark:hover:bg-[#3A4048] text-zinc-700 dark:text-zinc-200 transition"
                >
                  <User className="w-4 h-4 text-[#B4B6B7]" />
                  <span>Profile & Account</span>
                </button>

                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onOpenRules();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium hover:bg-[#F7F8F7] dark:hover:bg-[#3A4048] text-zinc-700 dark:text-zinc-200 transition"
                >
                  <Building2 className="w-4 h-4 text-[#B4B6B7]" />
                  <span>Business & Delivery Rules</span>
                </button>

                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    if (onOpenSettings) onOpenSettings();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium hover:bg-[#F7F8F7] dark:hover:bg-[#3A4048] text-zinc-700 dark:text-zinc-200 transition"
                >
                  <Settings className="w-4 h-4 text-[#B4B6B7]" />
                  <span>Settings & Preferences</span>
                </button>
              </div>

              {/* Footer / Logout */}
              <div className="pt-2 mt-2 border-t border-[#EAECEA] dark:border-[#495059]">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
