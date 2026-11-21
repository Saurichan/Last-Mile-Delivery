import React, { useState, useEffect } from 'react';
import { useStore } from './store/useStore';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavigationTab } from './components/layout/Sidebar';
import { Dashboard } from './components/dashboard/Dashboard';
import { RoutePlanner } from './components/planner/RoutePlanner';
import { OrderList } from './components/orders/OrderList';
import { OrderModal } from './components/orders/OrderModal';
import { DriverView } from './components/driver/DriverView';
import { CustomerTracking } from './components/customer/CustomerTracking';
import { WhatIfSimulator } from './components/simulation/WhatIfSimulator';
import { AlgorithmLab } from './components/lab/AlgorithmLab';
import { BusinessRulesConfig } from './components/business/BusinessRulesConfig';
import { FleetManagement } from './components/fleet/FleetManagement';
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard';
import { SettingsView } from './components/settings/SettingsView';
import { PrivacyPolicy } from './components/legal/PrivacyPolicy';
import { TermsOfService } from './components/legal/TermsOfService';
import { CookieConsent } from './components/common/CookieConsent';
import { AuthView } from './components/auth/AuthView';
import { Order } from './types';
import { initAuthListener } from './services/authService';

export const App: React.FC = () => {
  const { activeRole, theme, isAuthenticated } = useStore();
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Initialize live Supabase auth listener and sync profile
  useEffect(() => {
    const unsubscribe = initAuthListener();
    return () => {
      unsubscribe();
    };
  }, []);

  // Sync dark class on mount and theme change
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Sync role switch with tab view
  useEffect(() => {
    if (activeRole === 'driver') {
      setActiveTab('driver');
    } else if (activeRole === 'customer') {
      setActiveTab('tracking');
    } else if (activeRole === 'dispatcher' && activeTab === 'dashboard') {
      setActiveTab('planner');
    }
  }, [activeRole]);

  const handleOpenNewOrder = () => {
    setEditingOrder(null);
    setIsOrderModalOpen(true);
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setIsOrderModalOpen(true);
  };

  // If user signed out, display authentic authentication flow (Requirement #11)
  if (!isAuthenticated) {
    return <AuthView onSuccess={() => setActiveTab('dashboard')} />;
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors ${
      theme === 'dark' ? 'dark bg-[#292D32] text-[#F1F3F2]' : 'bg-[#F7F8F7] text-[#292D32]'
    }`}>
      {/* Top Navigation (Requirement #9) */}
      <Navbar
        onOpenNewOrder={handleOpenNewOrder}
        onOpenRules={() => setActiveTab('rules')}
        onOpenSettings={() => setActiveTab('settings')}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar & Mobile Nav (Requirement #8 & #38) */}
        <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

        {/* Content Area */}
        <main className="flex-1 p-3 sm:p-6 overflow-y-auto max-w-[1600px] mx-auto w-full">
          {activeTab === 'dashboard' && (
            <Dashboard
              onOpenNewOrder={handleOpenNewOrder}
              onNavigateTab={(t) => setActiveTab(t)}
            />
          )}

          {activeTab === 'planner' && (
            <RoutePlanner
              onOpenNewOrder={handleOpenNewOrder}
              onOpenDriverView={() => setActiveTab('driver')}
            />
          )}

          {activeTab === 'orders' && (
            <OrderList
              onOpenNewOrder={handleOpenNewOrder}
              onEditOrder={handleEditOrder}
            />
          )}

          {activeTab === 'driver' && <DriverView />}

          {activeTab === 'fleet' && <FleetManagement />}

          {activeTab === 'analytics' && <AnalyticsDashboard />}

          {activeTab === 'settings' && <SettingsView />}

          {activeTab === 'rules' && <BusinessRulesConfig />}

          {activeTab === 'whatif' && <WhatIfSimulator />}

          {activeTab === 'lab' && <AlgorithmLab />}

          {activeTab === 'tracking' && <CustomerTracking />}

          {activeTab === 'privacy' && <PrivacyPolicy />}

          {activeTab === 'terms' && <TermsOfService />}
        </main>
      </div>

      {/* Create / Edit Order Modal */}
      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => {
          setIsOrderModalOpen(false);
          setEditingOrder(null);
        }}
        editOrder={editingOrder}
      />

      {/* Cookie Consent Banner */}
      <CookieConsent />
    </div>
  );
};

export default App;
