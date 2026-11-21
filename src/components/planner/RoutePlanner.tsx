import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { DeliveryMap } from '../map/DeliveryMap';
import { OptimizationComparison } from './OptimizationComparison';
import { RouteExplanationModal } from './RouteExplanationModal';
import { VehicleSelector } from './VehicleSelector';
import { generateSmartBatches, DeliveryBatch } from '../../services/optimizer/batching';
import {
  Zap,
  Play,
  Pause,
  RotateCcw,
  Lock,
  Unlock,
  Layers,
  Clock,
  MapPin,
  Truck,
  Plus,
  ArrowRight,
  Package,
  HelpCircle,
} from 'lucide-react';

interface RoutePlannerProps {
  onOpenNewOrder: () => void;
  onOpenDriverView: () => void;
}

export const RoutePlanner: React.FC<RoutePlannerProps> = ({
  onOpenNewOrder,
  onOpenDriverView,
}) => {
  const {
    business,
    orders,
    vehicles,
    currentRoutePlan,
    isOptimizing,
    runOptimization,
    toggleLockStop,
    setSelectedOrderId,
    selectedOrderId,
    driverSim,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    setSimulationSpeed,
    advanceSimulationStep,
  } = useStore();

  const [showExplanation, setShowExplanation] = useState(false);
  const [activeBatches, setActiveBatches] = useState<DeliveryBatch[] | null>(null);

  // Simulation timer loop
  useEffect(() => {
    let interval: any;
    if (driverSim.isPlaying) {
      interval = setInterval(() => {
        advanceSimulationStep();
      }, 500 / driverSim.speedMultiplier);
    }
    return () => clearInterval(interval);
  }, [driverSim.isPlaying, driverSim.speedMultiplier, advanceSimulationStep]);

  // Initial optimization run if not yet generated
  useEffect(() => {
    if (!currentRoutePlan && orders.length > 0) {
      runOptimization();
    }
  }, []);

  const handleGenerateBatches = () => {
    const batches = generateSmartBatches(orders, vehicles, business.rules);
    setActiveBatches(batches);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-16 font-sans">
      {/* Explanation Modal */}
      <RouteExplanationModal
        isOpen={showExplanation}
        onClose={() => setShowExplanation(false)}
        routePlan={currentRoutePlan}
      />

      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-[#33383F] p-4 sm:p-5 rounded-3xl border border-[#EAECEA] dark:border-[#495059] shadow-card">
        <div>
          <h1 className="text-lg font-black text-[#292D32] dark:text-white flex items-center gap-2">
            <span>Route Planner</span>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#E8F6F1] text-[#168E6A] dark:bg-[#168E6A]/30 dark:text-[#E8F6F1] border border-[#168E6A]/30">
              Smart 2-Opt Sequence
            </span>
          </h1>
          <p className="text-xs text-[#B4B6B7] mt-0.5">
            Optimize multi-stop delivery routes in Tumakuru with customer windows and vehicle capacity
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Smart Batching */}
          <button
            onClick={handleGenerateBatches}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#F7F8F7] hover:bg-[#E8F6F1] dark:bg-[#292D32] dark:hover:bg-[#3A4048] text-[#292D32] dark:text-zinc-200 border border-[#EAECEA] dark:border-[#495059] rounded-2xl text-xs font-bold transition"
          >
            <Layers className="w-4 h-4 text-[#168E6A]" />
            <span>Smart Batches</span>
          </button>

          {/* Master Optimize Button (Requirement #17: ONE obvious primary action) */}
          <button
            disabled={isOptimizing || orders.length === 0}
            onClick={() => runOptimization('two_opt')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-black text-white shadow-subtle transition transform active:scale-95 ${
              isOptimizing
                ? 'bg-zinc-400 opacity-60 cursor-not-allowed'
                : 'bg-[#168E6A] hover:bg-[#127355]'
            }`}
          >
            <Zap className={`w-4 h-4 ${isOptimizing ? 'animate-spin' : ''}`} />
            <span>{isOptimizing ? 'Finding Best Order...' : 'Optimize Route'}</span>
          </button>

          {/* Switch to Driver View */}
          <button
            onClick={onOpenDriverView}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#FFF7EB] hover:bg-[#FDE6BE] text-[#C47D1A] dark:text-[#FBB03B] dark:bg-[#292D32] border border-[#FBB03B]/40 rounded-2xl text-xs font-bold transition"
          >
            <Truck className="w-4 h-4 text-[#FBB03B]" />
            <span>Driver View</span>
          </button>
        </div>
      </div>

      {/* Smart Batches Preview if activated (Requirement #24) */}
      {activeBatches && (
        <div className="p-4 bg-white dark:bg-[#33383F] border border-[#168E6A]/50 rounded-3xl space-y-3 animate-fade-in shadow-card">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#168E6A] uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Nearby Orders Combined ({activeBatches.length} Trips Suggested)
            </h3>
            <button
              onClick={() => setActiveBatches(null)}
              className="text-xs font-semibold text-[#B4B6B7] hover:text-[#292D32] dark:hover:text-white"
            >
              Dismiss
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeBatches.map((b) => (
              <div
                key={b.id}
                className="p-3.5 bg-[#F7F8F7] dark:bg-[#292D32] border border-[#EAECEA] dark:border-[#495059] rounded-2xl space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between font-bold text-[#292D32] dark:text-white">
                  <span>{b.name}</span>
                  <span className="text-[#168E6A] font-semibold">{b.totalWeightKg} kg</span>
                </div>
                <div className="text-[11px] text-[#B4B6B7] leading-relaxed">{b.rationale}</div>
                <div className="flex items-center justify-between text-[10px] text-[#B4B6B7] pt-1 border-t border-[#EAECEA] dark:border-[#495059]">
                  <span>Slot: {b.timeSpanFormatted}</span>
                  <span className="font-semibold text-[#292D32] dark:text-zinc-200 capitalize">{b.recommendedVehicleType}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Vehicle Selector (Requirement #20 & #21) */}
      <div className="bg-white dark:bg-[#33383F] p-4 sm:p-5 rounded-3xl border border-[#EAECEA] dark:border-[#495059] shadow-card">
        <VehicleSelector />
      </div>

      {/* 3. Main Split Grid (Left: Sequence & Controls; Right: Hero Map) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Panel: Sequence & Playback Controls (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Simulation Playback Bar */}
          <div className="p-3.5 bg-white dark:bg-[#33383F] border border-[#EAECEA] dark:border-[#495059] rounded-3xl space-y-2 shadow-card">
            <div className="flex items-center justify-between text-xs font-semibold text-[#292D32] dark:text-white">
              <span className="flex items-center gap-1.5 font-bold">
                <Truck className="w-3.5 h-3.5 text-[#168E6A]" />
                Driver GPS Route Playback
              </span>
              <span className="text-[10px] text-[#B4B6B7]">
                {Math.round(driverSim.progressPercent)}% • Stop #{driverSim.currentStopIndex}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-[#F7F8F7] dark:bg-[#292D32] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#168E6A] transition-all duration-300"
                style={{ width: `${driverSim.progressPercent}%` }}
              ></div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5">
                {!driverSim.isPlaying ? (
                  <button
                    onClick={startSimulation}
                    className="p-1.5 px-3 bg-[#E8F6F1] hover:bg-[#D1ECE3] text-[#168E6A] rounded-xl text-xs font-bold transition flex items-center gap-1"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Play
                  </button>
                ) : (
                  <button
                    onClick={pauseSimulation}
                    className="p-1.5 px-3 bg-[#FFF7EB] hover:bg-[#FDE6BE] text-[#C47D1A] rounded-xl text-xs font-bold transition flex items-center gap-1"
                  >
                    <Pause className="w-3.5 h-3.5 fill-current" /> Pause
                  </button>
                )}

                <button
                  onClick={resetSimulation}
                  className="p-1.5 bg-[#F7F8F7] hover:bg-[#E8F6F1] dark:bg-[#292D32] text-zinc-700 dark:text-zinc-300 rounded-xl text-xs transition"
                  title="Reset to Depot"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Speed Multipliers */}
              <div className="flex items-center gap-1">
                {[1, 2, 4].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setSimulationSpeed(spd)}
                    className={`px-2.5 py-0.5 rounded-xl text-[10px] font-bold transition ${
                      driverSim.speedMultiplier === spd
                        ? 'bg-[#168E6A] text-white'
                        : 'bg-[#F7F8F7] dark:bg-[#292D32] text-[#B4B6B7]'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Stop Sequence Queue */}
          <div className="bg-white dark:bg-[#33383F] border border-[#EAECEA] dark:border-[#495059] rounded-3xl p-4 space-y-3 shadow-card">
            <div className="flex items-center justify-between pb-2 border-b border-[#EAECEA] dark:border-[#495059]">
              <div className="flex items-center gap-2">
                <span className="font-black text-xs uppercase tracking-wider text-[#292D32] dark:text-white">
                  Stop Sequence
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E8F6F1] text-[#168E6A] font-bold">
                  {currentRoutePlan ? `${currentRoutePlan.stops.length} stops` : `${orders.length} stops`}
                </span>
              </div>

              <button
                onClick={() => setShowExplanation(true)}
                className="text-[11px] font-bold text-[#168E6A] hover:underline flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Why this sequence?</span>
              </button>
            </div>

            {/* Sequence List */}
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {/* Depot Start Pin */}
              <div className="p-3 bg-[#E8F6F1] dark:bg-[#168E6A]/20 border border-[#168E6A]/30 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#168E6A] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    0
                  </div>
                  <div>
                    <div className="font-bold text-[#168E6A] dark:text-[#E8F6F1]">{business.depot.name}</div>
                    <div className="text-[10px] text-[#B4B6B7]">Morning Departure • 08:30 AM</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#168E6A]">Depot</span>
              </div>

              {/* Delivery Stops */}
              {currentRoutePlan ? (
                currentRoutePlan.stops.map((stop) => {
                  const isSelected = selectedOrderId === stop.orderId;
                  return (
                    <div
                      key={stop.orderId}
                      onClick={() => setSelectedOrderId(stop.orderId)}
                      className={`p-3 rounded-2xl border transition cursor-pointer text-xs space-y-1.5 ${
                        isSelected
                          ? 'bg-[#E8F6F1] dark:bg-[#168E6A]/30 border-[#168E6A] ring-1 ring-[#168E6A]'
                          : 'bg-[#F7F8F7] dark:bg-[#292D32] border-[#EAECEA] dark:border-[#495059] hover:bg-white dark:hover:bg-[#3A4048]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#168E6A] text-white flex items-center justify-center text-xs font-black">
                            #{stop.stopIndex}
                          </span>
                          <span className="font-bold text-[#292D32] dark:text-white">
                            {stop.order.customer.name}
                          </span>
                          {stop.isLocked && <span className="text-xs text-[#FBB03B]">🔒</span>}
                        </div>

                        <div className="text-right">
                          <span className="font-bold text-[#168E6A]">{stop.estimatedArrival}</span>
                          <span className="text-[10px] text-[#B4B6B7] block">+{stop.travelDistanceKm} km</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-[#B4B6B7] flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-[#168E6A] shrink-0" />
                        <span className="truncate">{stop.order.customer.address}</span>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-[10px] text-[#B4B6B7] border-t border-[#EAECEA] dark:border-[#495059]">
                        <span>Window: {stop.order.timeWindow ? `${stop.order.timeWindow.start} - ${stop.order.timeWindow.end}` : 'Anytime'}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLockStop(stop.orderId);
                            }}
                            className="text-[#B4B6B7] hover:text-[#292D32] dark:hover:text-white"
                            title={stop.isLocked ? 'Unlock Position' : 'Lock Sequence Position'}
                          >
                            {stop.isLocked ? <Lock className="w-3.5 h-3.5 text-[#FBB03B]" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                orders.map((o, idx) => (
                  <div
                    key={o.id}
                    className="p-3 bg-[#F7F8F7] dark:bg-[#292D32] border border-[#EAECEA] dark:border-[#495059] rounded-2xl text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold text-[#292D32] dark:text-white">
                      <span>#{idx + 1} • {o.customer.name}</span>
                      <span className="text-[#168E6A]">{o.weightKg} kg</span>
                    </div>
                    <div className="text-[11px] text-[#B4B6B7] truncate">{o.customer.address}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Leaflet Hero Map (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-[#33383F] border border-[#EAECEA] dark:border-[#495059] rounded-3xl p-2 sm:p-3 shadow-card h-[520px] lg:h-[620px]">
            <DeliveryMap interactive={true} />
          </div>
        </div>
      </div>

      {/* 4. Bottom Comparison Panel (Requirement #22: Route Summary) */}
      <OptimizationComparison
        originalMetrics={currentRoutePlan?.originalMetrics}
        optimizedMetrics={currentRoutePlan?.metrics}
        currency={business.currency}
        onShowExplanation={() => setShowExplanation(true)}
      />
    </div>
  );
};
