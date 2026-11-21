import React, { useState } from 'react';
import {
  Home,
  ListOrdered,
  MapPin,
  Truck,
  Users,
  BarChart3,
  Settings,
  MoreHorizontal,
  FlaskConical,
  Cpu,
  UserCheck,
  ShieldCheck,
  FileText,
  Sliders,
  X,
} from 'lucide-react';

export type NavigationTab =
  | 'dashboard'
  | 'orders'
  | 'planner'
  | 'driver'
  | 'fleet'
  | 'analytics'
  | 'settings'
  | 'rules'
  | 'whatif'
  | 'lab'
  | 'tracking'
  | 'privacy'
  | 'terms';

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const mainNavItems: { id: NavigationTab; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'orders', label: 'Orders', icon: ListOrdered },
    { id: 'planner', label: 'Route', icon: MapPin },
    { id: 'driver', label: 'Deliveries', icon: Truck },
    { id: 'fleet', label: 'Fleet', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const advancedNavItems: { id: NavigationTab; label: string; icon: any; desc: string }[] = [
    { id: 'rules', label: 'Delivery Rules', icon: Sliders, desc: 'Business priority weights & service time' },
    { id: 'whatif', label: 'What-If Simulator', icon: FlaskConical, desc: 'Simulate urgent orders & traffic spikes' },
    { id: 'lab', label: 'Algorithm Lab', icon: Cpu, desc: 'Benchmark 2-opt, Nearest Neighbor, GA' },
    { id: 'tracking', label: 'Customer Live Tracking', icon: UserCheck, desc: 'Preview customer tracking screen' },
    { id: 'privacy', label: 'Privacy Policy', icon: ShieldCheck, desc: 'Local Tumakuru data protection' },
    { id: 'terms', label: 'Terms of Service', icon: FileText, desc: 'Platform terms & conditions' },
  ];

  const isAdvancedActive = advancedNavItems.some((item) => item.id === activeTab);

  return (
    <>
      {/* Desktop Sidebar (Requirement #8 & #39) */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-[#EAECEA] dark:border-[#495059] bg-white dark:bg-[#292D32] p-3 select-none overflow-y-auto font-sans justify-between">
        <div className="space-y-6">
          {/* Main Primary Navigation */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-[#B4B6B7] uppercase tracking-wider px-3 pb-1.5">
              Menu
            </div>
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-[#168E6A] text-white font-bold shadow-subtle'
                      : 'text-[#292D32] dark:text-zinc-300 hover:text-[#168E6A] dark:hover:text-white hover:bg-[#E8F6F1] dark:hover:bg-[#33383F]'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#B4B6B7]'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Settings & Advanced Sub-section */}
          <div className="space-y-1 pt-2 border-t border-[#EAECEA] dark:border-[#495059]">
            <div className="text-[10px] font-bold text-[#B4B6B7] uppercase tracking-wider px-3 pb-1.5">
              Management
            </div>

            {/* Settings */}
            <button
              onClick={() => onSelectTab('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-150 ${
                activeTab === 'settings'
                  ? 'bg-[#168E6A] text-white font-bold shadow-subtle'
                  : 'text-[#292D32] dark:text-zinc-300 hover:text-[#168E6A] dark:hover:text-white hover:bg-[#E8F6F1] dark:hover:bg-[#33383F]'
              }`}
            >
              <Settings className={`w-4 h-4 shrink-0 ${activeTab === 'settings' ? 'text-white' : 'text-[#B4B6B7]'}`} />
              <span className="truncate">Settings</span>
            </button>

            {/* Advanced / More Toggle */}
            <div className="relative">
              <button
                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-150 ${
                  isAdvancedActive
                    ? 'bg-[#E8F6F1] dark:bg-[#33383F] text-[#168E6A] dark:text-[#E8F6F1] font-bold border border-[#168E6A]/30'
                    : 'text-[#292D32] dark:text-zinc-300 hover:bg-[#F7F8F7] dark:hover:bg-[#33383F]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <MoreHorizontal className={`w-4 h-4 shrink-0 ${isAdvancedActive ? 'text-[#168E6A]' : 'text-[#B4B6B7]'}`} />
                  <span>Advanced Tools</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#F1F3F2] dark:bg-[#495059] text-[#B4B6B7] dark:text-zinc-300 font-bold">
                  {advancedNavItems.length}
                </span>
              </button>

              {/* Advanced Submenu Drawer */}
              {isAdvancedOpen && (
                <div className="mt-2 p-2 bg-[#F7F8F7] dark:bg-[#33383F] border border-[#EAECEA] dark:border-[#495059] rounded-2xl space-y-1 animate-fade-in">
                  {advancedNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onSelectTab(item.id);
                          setIsAdvancedOpen(false);
                        }}
                        className={`w-full flex items-start gap-2 px-2.5 py-2 rounded-xl text-left transition ${
                          isActive
                            ? 'bg-[#168E6A] text-white font-bold shadow-xs'
                            : 'hover:bg-white dark:hover:bg-[#3A4048] text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isActive ? 'text-white' : 'text-[#168E6A]'}`} />
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-bold truncate">{item.label}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="pt-4 border-t border-[#EAECEA] dark:border-[#495059] text-[11px] text-[#B4B6B7] px-2 space-y-0.5">
          <div className="font-bold text-[#292D32] dark:text-zinc-300">LocalRoute</div>
          <div className="text-[10px]">Tumakuru, Karnataka • ₹ INR</div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (Requirement #38) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#292D32] border-t border-[#EAECEA] dark:border-[#495059] px-2 py-1.5 flex items-center justify-around shadow-modal font-sans">
        {[
          { id: 'dashboard' as NavigationTab, label: 'Home', icon: Home },
          { id: 'orders' as NavigationTab, label: 'Orders', icon: ListOrdered },
          { id: 'planner' as NavigationTab, label: 'Route', icon: MapPin },
          { id: 'driver' as NavigationTab, label: 'Deliver', icon: Truck },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl text-[10px] font-semibold transition ${
                isActive
                  ? 'text-[#168E6A] dark:text-[#FBB03B] font-bold'
                  : 'text-[#B4B6B7] dark:text-zinc-400 hover:text-zinc-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* More Button on Mobile */}
        <button
          onClick={() => setIsAdvancedOpen(true)}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl text-[10px] font-semibold transition ${
            isAdvancedActive || isAdvancedOpen ? 'text-[#168E6A] dark:text-[#FBB03B]' : 'text-[#B4B6B7] dark:text-zinc-400'
          }`}
        >
          <MoreHorizontal className="w-4 h-4" />
          <span>More</span>
        </button>
      </nav>

      {/* Mobile "More" Drawer */}
      {isAdvancedOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end animate-fade-in">
          <div className="bg-white dark:bg-[#33383F] rounded-t-3xl border-t border-[#EAECEA] dark:border-[#495059] p-5 max-h-[80vh] overflow-y-auto space-y-4 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between border-b border-[#EAECEA] dark:border-[#495059] pb-3">
              <div>
                <span className="font-bold text-sm text-[#292D32] dark:text-white">More Options & Tools</span>
                <p className="text-[11px] text-[#B4B6B7]">Fleet, Settings, and Advanced Simulation</p>
              </div>
              <button
                onClick={() => setIsAdvancedOpen(false)}
                className="p-1.5 text-zinc-500 hover:text-[#292D32] dark:hover:text-white rounded-xl hover:bg-[#F7F8F7]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onSelectTab('fleet');
                  setIsAdvancedOpen(false);
                }}
                className={`flex items-center gap-2 p-3 rounded-2xl text-xs font-bold transition ${
                  activeTab === 'fleet'
                    ? 'bg-[#168E6A] text-white shadow-sm'
                    : 'bg-[#F7F8F7] dark:bg-[#292D32] text-zinc-700 dark:text-zinc-200'
                }`}
              >
                <Users className="w-4 h-4 text-[#168E6A]" />
                <span>Fleet & Couriers</span>
              </button>

              <button
                onClick={() => {
                  onSelectTab('analytics');
                  setIsAdvancedOpen(false);
                }}
                className={`flex items-center gap-2 p-3 rounded-2xl text-xs font-bold transition ${
                  activeTab === 'analytics'
                    ? 'bg-[#168E6A] text-white shadow-sm'
                    : 'bg-[#F7F8F7] dark:bg-[#292D32] text-zinc-700 dark:text-zinc-200'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-[#168E6A]" />
                <span>Analytics & Savings</span>
              </button>

              <button
                onClick={() => {
                  onSelectTab('settings');
                  setIsAdvancedOpen(false);
                }}
                className={`flex items-center gap-2 p-3 rounded-2xl text-xs font-bold transition ${
                  activeTab === 'settings'
                    ? 'bg-[#168E6A] text-white shadow-sm'
                    : 'bg-[#F7F8F7] dark:bg-[#292D32] text-zinc-700 dark:text-zinc-200'
                }`}
              >
                <Settings className="w-4 h-4 text-[#168E6A]" />
                <span>Settings</span>
              </button>

              {advancedNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      setIsAdvancedOpen(false);
                    }}
                    className={`flex items-center gap-2 p-3 rounded-2xl text-xs font-bold transition ${
                      isActive
                        ? 'bg-[#168E6A] text-white shadow-sm'
                        : 'bg-[#F7F8F7] dark:bg-[#292D32] text-zinc-700 dark:text-zinc-200'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#168E6A]'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
