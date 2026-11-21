import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { ProofOfDeliveryModal } from './ProofOfDeliveryModal';
import { FailedDeliveryModal } from './FailedDeliveryModal';
import { Order, RouteStop } from '../../types';
import {
  Truck,
  Navigation,
  CheckCircle2,
  XCircle,
  MapPin,
  Phone,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Compass,
} from 'lucide-react';

export const DriverView: React.FC = () => {
  const {
    business,
    currentRoutePlan,
    orders,
    driverSim,
    markOrderDelivered,
    markOrderFailed,
    reoptimizeRemainingRoute,
    addExpressOrder,
    isOptimizing,
  } = useStore();

  const [activePodOrder, setActivePodOrder] = useState<Order | null>(null);
  const [activeFailedOrder, setActiveFailedOrder] = useState<Order | null>(null);
  const [arrivedStopIds, setArrivedStopIds] = useState<Set<string>>(new Set());
  const [reoptFeedback, setReoptFeedback] = useState<string | null>(null);

  // Filter stops that need delivery
  const stops: RouteStop[] = currentRoutePlan?.stops || [];
  const activeStopIndex = stops.findIndex((s) => !s.isCompleted && s.order.status !== 'failed');
  const currentStop = activeStopIndex !== -1 ? stops[activeStopIndex] : null;
  const upcomingStops = activeStopIndex !== -1 ? stops.slice(activeStopIndex + 1, activeStopIndex + 4) : [];

  const completedCount = stops.filter((s) => s.isCompleted).length;
  const totalCount = stops.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleArrived = (stopId: string) => {
    setArrivedStopIds((prev) => new Set([...prev, stopId]));
  };

  const handleNavigate = (address: string, lat: number, lng: number) => {
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(address)}`;
    window.open(mapsUrl, '_blank');
  };

  const handleTriggerReopt = async (reason: string) => {
    if (reason === 'urgent') {
      await addExpressOrder();
    }
    const updated = await reoptimizeRemainingRoute(reason);
    if (updated) {
      setReoptFeedback('Route updated. Sequence dynamically adjusted.');
      setTimeout(() => setReoptFeedback(null), 3000);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-4 pb-20 font-sans">
      {/* Proof of Delivery Modal */}
      <ProofOfDeliveryModal
        isOpen={!!activePodOrder}
        onClose={() => setActivePodOrder(null)}
        order={activePodOrder}
        onCompleteDelivery={markOrderDelivered}
      />

      {/* Failed Delivery Modal */}
      <FailedDeliveryModal
        isOpen={!!activeFailedOrder}
        onClose={() => setActiveFailedOrder(null)}
        order={activeFailedOrder}
        onReportFailed={markOrderFailed}
      />

      {/* Top Cockpit Header */}
      <div className="bg-white dark:bg-[#33383F] border border-[#EAECEA] dark:border-[#495059] rounded-3xl p-5 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#168E6A] text-white flex items-center justify-center font-bold shadow-sm ring-2 ring-[#E8F6F1] dark:ring-[#168E6A]/30">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#168E6A] tracking-wider">
                Courier Navigation Cockpit
              </span>
              <h1 className="text-sm font-black text-[#292D32] dark:text-white">{business.name}</h1>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-[#B4B6B7] block">Active Route</span>
            <span className="text-xs font-bold text-[#168E6A]">{completedCount}/{totalCount} Completed</span>
          </div>
        </div>

        {/* Route Progress Bar */}
        <div className="w-full h-2 bg-[#F7F8F7] dark:bg-[#292D32] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#168E6A] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Re-optimization Alert */}
      {reoptFeedback && (
        <div className="p-3 bg-[#E8F6F1] text-[#168E6A] border border-[#168E6A]/40 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in">
          <Zap className="w-4 h-4" />
          <span>{reoptFeedback}</span>
        </div>
      )}

      {/* 1. CURRENT / NEXT DELIVERY HERO CARD (Requirement #27) */}
      {currentStop ? (
        <div className="bg-white dark:bg-[#33383F] border-2 border-[#168E6A]/60 rounded-3xl p-5 sm:p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-[#EAECEA] dark:border-[#495059] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#168E6A] text-white font-black text-xs flex items-center justify-center">
                #{currentStop.stopIndex}
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-[#168E6A]">
                NEXT DELIVERY
              </span>
            </div>
            <span className="text-xs font-bold text-[#B4B6B7]">
              Order #{currentStop.order.orderNumber}
            </span>
          </div>

          {/* Customer & Address */}
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-[#292D32] dark:text-white">
                {currentStop.order.customer.name}
              </h2>
              <a
                href={`tel:${currentStop.order.customer.phone}`}
                className="flex items-center gap-1 text-xs px-3 py-1.5 bg-[#F7F8F7] hover:bg-[#E8F6F1] dark:bg-[#292D32] text-[#168E6A] font-bold rounded-xl border border-[#EAECEA] dark:border-[#495059]"
              >
                <Phone className="w-3.5 h-3.5" />
                Call Customer
              </a>
            </div>

            <div className="text-xs font-medium text-zinc-600 dark:text-zinc-300 flex items-start gap-1.5 mt-1.5">
              <MapPin className="w-4 h-4 text-[#168E6A] shrink-0 mt-0.5" />
              <span>{currentStop.order.customer.address}</span>
            </div>
          </div>

          {/* Key Metrics: ETA, Distance, Window */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-[#F7F8F7] dark:bg-[#292D32] rounded-2xl border border-[#EAECEA] dark:border-[#495059] text-center">
            <div>
              <span className="text-[10px] text-[#B4B6B7] block">ETA</span>
              <span className="font-black text-sm text-[#168E6A]">
                {currentStop.estimatedArrival}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#B4B6B7] block">Distance</span>
              <span className="font-black text-sm text-[#292D32] dark:text-white">
                {currentStop.travelDistanceKm} km
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#B4B6B7] block">Window</span>
              <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200">
                {currentStop.order.timeWindow
                  ? `${currentStop.order.timeWindow.start} - ${currentStop.order.timeWindow.end}`
                  : 'Flexible'}
              </span>
            </div>
          </div>

          {/* Special Instructions if present */}
          {currentStop.order.specialInstructions && (
            <div className="p-3 bg-[#FFF7EB] dark:bg-[#292D32] border border-[#FBB03B]/40 rounded-2xl text-xs text-[#C47D1A] dark:text-[#FBB03B]">
              <strong>Instructions:</strong> {currentStop.order.specialInstructions}
            </div>
          )}

          {/* Touch-Friendly Action Buttons (Requirement #27: Large Touch Targets) */}
          <div className="space-y-2 pt-1">
            {/* Row 1: Navigate & Arrived */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() =>
                  handleNavigate(
                    currentStop.order.customer.address,
                    currentStop.order.customer.lat,
                    currentStop.order.customer.lng
                  )
                }
                className="py-3.5 px-4 bg-[#FBB03B] hover:bg-[#E69F30] text-[#292D32] font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm active:scale-95 transition"
              >
                <Compass className="w-4 h-4" />
                <span>NAVIGATE</span>
              </button>

              <button
                onClick={() => handleArrived(currentStop.orderId)}
                className={`py-3.5 px-4 font-black rounded-2xl text-xs flex items-center justify-center gap-2 transition active:scale-95 ${
                  arrivedStopIds.has(currentStop.orderId)
                    ? 'bg-[#168E6A] text-white'
                    : 'bg-[#F7F8F7] dark:bg-[#292D32] hover:bg-[#E8F6F1] text-[#292D32] dark:text-white border border-[#EAECEA] dark:border-[#495059]'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{arrivedStopIds.has(currentStop.orderId) ? 'ARRIVED ✓' : 'ARRIVED'}</span>
              </button>
            </div>

            {/* Row 2: Complete Delivery (Signature) & Report Issue */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setActivePodOrder(currentStop.order)}
                className="py-3.5 px-4 bg-[#168E6A] hover:bg-[#127355] text-white font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm active:scale-95 transition"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>DELIVERED (POD)</span>
              </button>

              <button
                onClick={() => setActiveFailedOrder(currentStop.order)}
                className="py-3.5 px-4 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition active:scale-95"
              >
                <XCircle className="w-4 h-4" />
                <span>FAILED / ISSUE</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#33383F] border border-[#EAECEA] dark:border-[#495059] rounded-3xl p-8 text-center space-y-3 shadow-card">
          <div className="w-14 h-14 rounded-full bg-[#E8F6F1] text-[#168E6A] mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-black text-[#292D32] dark:text-white">
            All Deliveries Completed!
          </h2>
          <p className="text-xs text-[#B4B6B7]">
            Great job! You have successfully completed all scheduled stops on this Tumakuru route.
          </p>
        </div>
      )}

      {/* 2. UPCOMING STOPS QUEUE (Requirement #27: Next: Priya, Anil, Sahana) */}
      {upcomingStops.length > 0 && (
        <div className="bg-white dark:bg-[#33383F] border border-[#EAECEA] dark:border-[#495059] rounded-3xl p-4 shadow-card space-y-2">
          <span className="text-[10px] font-bold text-[#B4B6B7] uppercase tracking-wider px-1">
            Next in Sequence
          </span>
          <div className="space-y-1.5">
            {upcomingStops.map((s) => (
              <div
                key={s.orderId}
                className="flex items-center justify-between p-3 bg-[#F7F8F7] dark:bg-[#292D32] rounded-2xl border border-[#EAECEA] dark:border-[#495059] text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#E8F6F1] text-[#168E6A] font-bold text-xs flex items-center justify-center">
                    #{s.stopIndex}
                  </span>
                  <div>
                    <div className="font-bold text-xs text-[#292D32] dark:text-white">
                      {s.order.customer.name}
                    </div>
                    <div className="text-[10px] text-[#B4B6B7] truncate max-w-[200px]">
                      {s.order.customer.address}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-[#168E6A]">
                    {s.estimatedArrival}
                  </div>
                  <div className="text-[10px] text-[#B4B6B7]">+{s.travelDistanceKm} km</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. SOMETHING CHANGED? RE-OPTIMIZATION (Requirement #30) */}
      <div className="bg-white dark:bg-[#33383F] border border-[#EAECEA] dark:border-[#495059] rounded-3xl p-4 shadow-card space-y-2">
        <span className="text-[10px] font-bold text-[#B4B6B7] uppercase tracking-wider px-1">
          Something Changed?
        </span>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            disabled={isOptimizing}
            onClick={() => handleTriggerReopt('urgent')}
            className="p-2.5 bg-[#FFF7EB] hover:bg-[#FDE6BE] text-[#C47D1A] dark:text-[#FBB03B] dark:bg-[#292D32] border border-[#FBB03B]/40 rounded-2xl text-left transition flex flex-col justify-between text-xs"
          >
            <Plus className="w-4 h-4 mb-1" />
            <span className="font-bold text-[11px] leading-tight">+ Add Urgent Order</span>
          </button>

          <button
            disabled={isOptimizing}
            onClick={() => handleTriggerReopt('unavailable')}
            className="p-2.5 bg-[#F7F8F7] hover:bg-[#E8F6F1] dark:bg-[#292D32] text-zinc-700 dark:text-zinc-300 border border-[#EAECEA] dark:border-[#495059] rounded-2xl text-left transition flex flex-col justify-between text-xs"
          >
            <AlertTriangle className="w-4 h-4 text-[#FBB03B] mb-1" />
            <span className="font-bold text-[11px] leading-tight">Customer Unavailable</span>
          </button>

          <button
            disabled={isOptimizing}
            onClick={() => handleTriggerReopt('road_blocked')}
            className="p-2.5 bg-[#F7F8F7] hover:bg-[#E8F6F1] dark:bg-[#292D32] text-zinc-700 dark:text-zinc-300 border border-[#EAECEA] dark:border-[#495059] rounded-2xl text-left transition flex flex-col justify-between text-xs"
          >
            <Zap className="w-4 h-4 text-[#168E6A] mb-1" />
            <span className="font-bold text-[11px] leading-tight">Road Blocked</span>
          </button>
        </div>
      </div>
    </div>
  );
};
