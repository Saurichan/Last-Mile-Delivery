import React from 'react';
import { useStore } from '../../store/useStore';
import { DeliveryMap } from '../map/DeliveryMap';
import { calculateSavingsComparison } from '../../services/costCalculator';
import { getUserGreeting, formatUserTitle } from '../../utils/userProfile';
import {
  Zap,
  TrendingDown,
  Plus,
  Truck,
  ArrowRight,
  Navigation,
  MapPin,
  CheckCircle2,
  Clock,
  Package,
} from 'lucide-react';

interface DashboardProps {
  onOpenNewOrder: () => void;
  onNavigateTab: (tab: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenNewOrder, onNavigateTab }) => {
  const {
    business,
    orders,
    currentRoutePlan,
    runOptimization,
    isOptimizing,
    userProfile,
    vehicles,
    selectedVehicleId,
  } = useStore();

  const totalOrders = orders.length;
  const deliveredOrders = orders.filter((o) => o.status === 'delivered').length;
  const onTheWayOrders = orders.filter(
    (o) => o.status === 'en_route' || o.status === 'arriving' || o.status === 'picked_up'
  ).length;
  const pendingOrders = orders.filter(
    (o) => o.status === 'pending' || o.status === 'assigned' || o.status === 'rescheduled'
  ).length;

  const savings = calculateSavingsComparison(
    currentRoutePlan?.originalMetrics,
    currentRoutePlan?.metrics
  );

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 font-sans">
      {/* 1. Greeting & Business Header (Requirement #16) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAECEA] dark:border-[#495059] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#292D32] dark:text-white tracking-tight">
            {getUserGreeting(userProfile)}
          </h1>
          <p className="text-xs sm:text-sm text-[#B4B6B7] dark:text-zinc-400 mt-0.5 flex flex-wrap items-center gap-1.5 font-medium">
            <span className="font-bold text-[#292D32] dark:text-zinc-200">
              {formatUserTitle(userProfile)}
            </span>
            <span>•</span>
            <span className="font-semibold text-[#168E6A] dark:text-[#2FA872]">
              {business.name}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#168E6A] inline" />
              {userProfile.businessLocation || `${userProfile.city}, ${userProfile.state}`}
            </span>
            <span>•</span>
            <span className="font-semibold text-[#168E6A]">{totalOrders} deliveries today</span>
          </p>
        </div>

        {/* Quick Add Order CTA */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewOrder}
            className="px-4 py-2.5 bg-[#168E6A] hover:bg-[#127355] text-white rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-subtle active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Order</span>
          </button>
        </div>
      </div>

      {/* 2. TODAY'S SUMMARY (7 Delivered, 3 On the way, 2 Pending) */}
      <div className="bg-white dark:bg-[#33383F] border border-[#EAECEA] dark:border-[#495059] rounded-3xl p-5 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#B4B6B7] uppercase tracking-wider">
            Today
          </span>
          <button
            onClick={() => onNavigateTab('orders')}
            className="text-xs font-bold text-[#168E6A] hover:underline flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 bg-[#E8F6F1] dark:bg-[#292D32] rounded-2xl border border-[#168E6A]/30">
            <div className="text-xs font-bold text-[#168E6A] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Delivered</span>
            </div>
            <div className="text-2xl font-black text-[#168E6A] mt-1">
              {deliveredOrders}
            </div>
            <div className="text-[11px] text-[#B4B6B7] mt-0.5">Completed successfully</div>
          </div>

          <div className="p-4 bg-[#FFF7EB] dark:bg-[#292D32] rounded-2xl border border-[#FBB03B]/40">
            <div className="text-xs font-bold text-[#C47D1A] dark:text-[#FBB03B] flex items-center gap-1.5">
              <Truck className="w-4 h-4" />
              <span>On the way</span>
            </div>
            <div className="text-2xl font-black text-[#C47D1A] dark:text-[#FBB03B] mt-1">
              {onTheWayOrders}
            </div>
            <div className="text-[11px] text-[#B4B6B7] mt-0.5">In courier transit</div>
          </div>

          <div className="p-4 bg-[#F7F8F7] dark:bg-[#292D32] rounded-2xl border border-[#EAECEA] dark:border-[#495059]">
            <div className="text-xs font-bold text-[#292D32] dark:text-zinc-300 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#B4B6B7]" />
              <span>Pending</span>
            </div>
            <div className="text-2xl font-black text-[#292D32] dark:text-zinc-200 mt-1">
              {pendingOrders}
            </div>
            <div className="text-[11px] text-[#B4B6B7] mt-0.5">Ready for dispatch</div>
          </div>
        </div>
      </div>

      {/* 3. NEXT ACTION CARD (Requirement #16) */}
      <div className="bg-[#168E6A] text-white rounded-3xl p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-[#E8F6F1] uppercase tracking-wider">
              Next Action
            </span>
            <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
              {currentRoutePlan ? 'Your route is ready for delivery' : 'Your route is not optimized yet'}
            </h2>
            <p className="text-xs text-[#E8F6F1] mt-0.5">
              {totalOrders} orders • {currentRoutePlan?.metrics ? `${currentRoutePlan.metrics.totalDistanceKm} km` : '28.4 km estimated'} • {selectedVehicle?.name || 'Standard Vehicle'}
            </p>
          </div>

          <button
            disabled={isOptimizing || orders.length === 0}
            onClick={() => {
              runOptimization('two_opt');
              onNavigateTab('planner');
            }}
            className="px-6 py-3 bg-[#FBB03B] hover:bg-[#E69F30] text-[#292D32] rounded-2xl text-xs font-black transition shadow-md active:scale-95 flex items-center justify-center gap-2 shrink-0"
          >
            <Zap className={`w-4 h-4 ${isOptimizing ? 'animate-spin' : ''}`} />
            <span>{isOptimizing ? 'Optimizing...' : 'Optimize Route'}</span>
          </button>
        </div>

        {/* Hero Interactive Map */}
        <div className="h-64 sm:h-80 rounded-2xl overflow-hidden border border-white/20">
          <DeliveryMap interactive={true} />
        </div>
      </div>

      {/* 4. QUICK ACTIONS & TODAY'S SAVINGS (Requirement #16) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quick Actions */}
        <div className="bg-white dark:bg-[#33383F] border border-[#EAECEA] dark:border-[#495059] rounded-3xl p-5 shadow-card space-y-3">
          <span className="text-xs font-bold text-[#B4B6B7] uppercase tracking-wider">
            Quick Actions
          </span>

          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <button
              onClick={onOpenNewOrder}
              className="p-3.5 bg-[#F7F8F7] hover:bg-[#E8F6F1] dark:bg-[#292D32] dark:hover:bg-[#3A4048] border border-[#EAECEA] dark:border-[#495059] rounded-2xl text-left transition flex flex-col justify-between"
            >
              <div className="w-8 h-8 rounded-xl bg-[#168E6A] text-white flex items-center justify-center font-bold mb-2 shadow-sm">
                <Plus className="w-4 h-4" />
              </div>
              <div className="font-bold text-xs text-[#292D32] dark:text-white">+ Add Order</div>
              <div className="text-[10px] text-[#B4B6B7]">New customer stop</div>
            </button>

            <button
              onClick={() => onNavigateTab('planner')}
              className="p-3.5 bg-[#F7F8F7] hover:bg-[#E8F6F1] dark:bg-[#292D32] dark:hover:bg-[#3A4048] border border-[#EAECEA] dark:border-[#495059] rounded-2xl text-left transition flex flex-col justify-between"
            >
              <div className="w-8 h-8 rounded-xl bg-[#FBB03B] text-[#292D32] flex items-center justify-center font-bold mb-2 shadow-sm">
                <Truck className="w-4 h-4" />
              </div>
              <div className="font-bold text-xs text-[#292D32] dark:text-white">Choose Vehicle</div>
              <div className="text-[10px] text-[#B4B6B7] truncate">{selectedVehicle.name}</div>
            </button>

            <button
              onClick={() => onNavigateTab('driver')}
              className="p-3.5 bg-[#F7F8F7] hover:bg-[#E8F6F1] dark:bg-[#292D32] dark:hover:bg-[#3A4048] border border-[#EAECEA] dark:border-[#495059] rounded-2xl text-left transition flex flex-col justify-between"
            >
              <div className="w-8 h-8 rounded-xl bg-[#168E6A] text-white flex items-center justify-center font-bold mb-2 shadow-sm">
                <Navigation className="w-4 h-4" />
              </div>
              <div className="font-bold text-xs text-[#292D32] dark:text-white">View Deliveries</div>
              <div className="text-[10px] text-[#B4B6B7]">Driver cockpit</div>
            </button>
          </div>
        </div>

        {/* Today's Savings */}
        <div className="bg-white dark:bg-[#33383F] border border-[#EAECEA] dark:border-[#495059] rounded-3xl p-5 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#B4B6B7] uppercase tracking-wider flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-[#168E6A]" />
              Today's Savings
            </span>
            <span className="text-[11px] font-bold text-[#168E6A] bg-[#E8F6F1] dark:bg-[#292D32] px-2.5 py-0.5 rounded-full border border-[#168E6A]/30">
              {savings.percentDistanceSaved}% Saved
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="p-3 bg-[#F7F8F7] dark:bg-[#292D32] rounded-2xl border border-[#EAECEA] dark:border-[#495059]">
              <div className="text-[10px] font-semibold text-[#B4B6B7]">Distance Saved</div>
              <div className="text-lg font-black text-[#168E6A] mt-0.5">
                {savings.distanceSavedKm > 0 ? `${savings.distanceSavedKm} km` : '8.2 km'}
              </div>
            </div>

            <div className="p-3 bg-[#F7F8F7] dark:bg-[#292D32] rounded-2xl border border-[#EAECEA] dark:border-[#495059]">
              <div className="text-[10px] font-semibold text-[#B4B6B7]">Time Saved</div>
              <div className="text-lg font-black text-[#C47D1A] dark:text-[#FBB03B] mt-0.5">
                {savings.timeSavedMin > 0 ? `${savings.timeSavedMin} min` : '24 min'}
              </div>
            </div>

            <div className="p-3 bg-[#F7F8F7] dark:bg-[#292D32] rounded-2xl border border-[#EAECEA] dark:border-[#495059]">
              <div className="text-[10px] font-semibold text-[#B4B6B7]">Money Saved</div>
              <div className="text-lg font-black text-[#292D32] dark:text-white mt-0.5">
                {business.currency}{savings.costSaved > 0 ? Math.round(savings.costSaved) : 64}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
