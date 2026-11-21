import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { optimizeRoute } from '../../services/optimizer/optimizer';
import { RouteMetrics, RoutePlan, Order } from '../../types';
import {
  FlaskConical,
  Zap,
  TrafficCone,
  AlertTriangle,
  PackageCheck,
  Check,
} from 'lucide-react';

export const WhatIfSimulator: React.FC = () => {
  const {
    business,
    orders,
    vehicles,
    currentRoutePlan,
    runOptimization,
    addExpressOrder,
  } = useStore();

  const [addExtraOrders, setAddExtraOrders] = useState(false);
  const [trafficMultiplier, setTrafficMultiplier] = useState(1.0);
  const [simulateRoadClosure, setSimulateRoadClosure] = useState(false);
  const [capacityReduction, setCapacityReduction] = useState(false);
  const [simulatedPlan, setSimulatedPlan] = useState<RoutePlan | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleRunSimulation = async () => {
    setIsSimulating(true);

    let scenarioOrders: Order[] = JSON.parse(JSON.stringify(orders));

    if (addExtraOrders) {
      scenarioOrders.push(
        {
          id: `sim-rush-1`,
          orderNumber: 'SIM-901',
          customer: {
            id: 'c-sim-1',
            name: 'Rush Catering Client',
            phone: '+91 98450 99001',
            address: 'SIT Main Road, Tumakuru',
            lat: business.depot.lat + 0.008,
            lng: business.depot.lng - 0.006,
          },
          category: 'Event Sweets Box',
          weightKg: 6.5,
          priority: 'critical',
          timeWindow: { start: '10:00', end: '11:00' },
          serviceTimeMinutes: 4,
          isFragile: true,
          isTemperatureSensitive: true,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: `sim-rush-2`,
          orderNumber: 'SIM-902',
          customer: {
            id: 'c-sim-2',
            name: 'Urgent Bank Office Order',
            phone: '+91 98450 99002',
            address: 'MG Road, Tumakuru',
            lat: business.depot.lat - 0.007,
            lng: business.depot.lng + 0.005,
          },
          category: 'Snack Assortment',
          weightKg: 3.0,
          priority: 'high',
          timeWindow: { start: '10:30', end: '11:30' },
          serviceTimeMinutes: 3,
          isFragile: false,
          isTemperatureSensitive: false,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );
    }

    const testVehicle = vehicles[0]
      ? {
          ...vehicles[0],
          maxWeightKg: capacityReduction ? vehicles[0].maxWeightKg * 0.5 : vehicles[0].maxWeightKg,
        }
      : undefined;

    try {
      const plan = await optimizeRoute(business, scenarioOrders, testVehicle, {
        algorithm: 'two_opt',
      });

      if (trafficMultiplier > 1.0) {
        plan.metrics.totalDurationMin = Number(
          (plan.metrics.totalDurationMin * trafficMultiplier).toFixed(1)
        );
        plan.metrics.totalTravelTimeMin = Number(
          (plan.metrics.totalTravelTimeMin * trafficMultiplier).toFixed(1)
        );
      }

      setSimulatedPlan(plan);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleApplyScenario = async () => {
    if (addExtraOrders) {
      await addExpressOrder();
    }
    await runOptimization('two_opt');
    setSimulatedPlan(null);
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-white dark:bg-[#13251E] border border-[#D8E2DC] dark:border-[#1F3A2E] rounded-3xl p-5 shadow-card space-y-1">
        <h1 className="text-lg font-black text-[#111C16] dark:text-white">Route Scenario Stress-Testing</h1>
        <p className="text-xs text-[#6C7D74]">
          Simulate express order spikes, traffic congestion in Tumakuru, or vehicle payload constraints
        </p>
      </div>

      {/* Scenario Parameters Card */}
      <div className="bg-white dark:bg-[#13251E] border border-[#D8E2DC] dark:border-[#1F3A2E] rounded-3xl p-5 space-y-4 shadow-card">
        <h2 className="text-xs font-bold text-[#6C7D74] uppercase tracking-wider">
          Configure Disruption Parameters
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Add Express Orders */}
          <div className="p-3.5 bg-[#F4F7F5] dark:bg-[#182E25] border border-[#D8E2DC]/80 dark:border-[#1F3A2E] rounded-2xl flex items-start justify-between">
            <div>
              <div className="text-xs font-bold text-[#111C16] dark:text-white flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#F7A838]" />
                <span>Add 2 Urgent Flash Express Orders</span>
              </div>
              <p className="text-[11px] text-[#6C7D74] mt-0.5">
                Injects 2 high-priority orders with tight delivery windows in Tumakuru.
              </p>
            </div>
            <input
              type="checkbox"
              checked={addExtraOrders}
              onChange={(e) => setAddExtraOrders(e.target.checked)}
              className="rounded border-[#D8E2DC] text-[#1E5B44] w-5 h-5 cursor-pointer mt-1"
            />
          </div>

          {/* Traffic Spikes */}
          <div className="p-3.5 bg-[#F4F7F5] dark:bg-[#182E25] border border-[#D8E2DC]/80 dark:border-[#1F3A2E] rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-[#111C16] dark:text-white flex items-center gap-1.5">
                <TrafficCone className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>Simulated Urban Traffic Congestion</span>
              </div>
              <span className="text-xs font-bold text-[#1E5B44] dark:text-[#2FA872]">
                +{Math.round((trafficMultiplier - 1.0) * 100)}% Duration
              </span>
            </div>
            <input
              type="range"
              min="1.0"
              max="1.8"
              step="0.1"
              value={trafficMultiplier}
              onChange={(e) => setTrafficMultiplier(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#D8E2DC] dark:bg-[#1F3A2E] rounded-lg cursor-pointer"
            />
          </div>

          {/* Vehicle Capacity Reduction */}
          <div className="p-3.5 bg-[#F4F7F5] dark:bg-[#182E25] border border-[#D8E2DC]/80 dark:border-[#1F3A2E] rounded-2xl flex items-start justify-between">
            <div>
              <div className="text-xs font-bold text-[#111C16] dark:text-white flex items-center gap-1.5">
                <PackageCheck className="w-4 h-4 text-[#238B5E]" />
                <span>Switch to Small E-Scooter (50% Capacity)</span>
              </div>
              <p className="text-[11px] text-[#6C7D74] mt-0.5">
                Halves payload limit to stress-test capacity feasibility.
              </p>
            </div>
            <input
              type="checkbox"
              checked={capacityReduction}
              onChange={(e) => setCapacityReduction(e.target.checked)}
              className="rounded border-[#D8E2DC] text-[#1E5B44] w-5 h-5 cursor-pointer mt-1"
            />
          </div>

          {/* Road Obstruction */}
          <div className="p-3.5 bg-[#F4F7F5] dark:bg-[#182E25] border border-[#D8E2DC]/80 dark:border-[#1F3A2E] rounded-2xl flex items-start justify-between">
            <div>
              <div className="text-xs font-bold text-[#111C16] dark:text-white flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-[#F7A838]" />
                <span>Simulate Ring Road Construction Closure</span>
              </div>
              <p className="text-[11px] text-[#6C7D74] mt-0.5">
                Forces rerouting around Batawadi / SS Puram corridors.
              </p>
            </div>
            <input
              type="checkbox"
              checked={simulateRoadClosure}
              onChange={(e) => setSimulateRoadClosure(e.target.checked)}
              className="rounded border-[#D8E2DC] text-[#1E5B44] w-5 h-5 cursor-pointer mt-1"
            />
          </div>
        </div>

        {/* Trigger Simulation */}
        <div className="flex justify-end pt-2">
          <button
            disabled={isSimulating}
            onClick={handleRunSimulation}
            className="px-5 py-2.5 bg-[#F7A838] hover:bg-[#E69727] text-[#111C16] rounded-xl text-xs font-black shadow-sm flex items-center gap-2 transition active:scale-95"
          >
            <FlaskConical className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Evaluating Matrix...' : 'Run Scenario Simulation'}</span>
          </button>
        </div>
      </div>

      {/* SIMULATED IMPACT RESULTS */}
      {simulatedPlan && (
        <div className="bg-white dark:bg-[#13251E] border-2 border-[#238B5E]/60 rounded-3xl p-5 space-y-4 shadow-card animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#238B5E]">
                Simulation Output Preview
              </span>
              <h3 className="text-base font-black text-[#111C16] dark:text-white">
                Live Active Route vs. Simulated Scenario
              </h3>
            </div>

            <button
              onClick={handleApplyScenario}
              className="px-4 py-2 bg-[#1E5B44] text-white hover:bg-[#144332] rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition"
            >
              <Check className="w-4 h-4 text-[#F7A838]" />
              <span>Apply Scenario to Live Route</span>
            </button>
          </div>

          {/* Comparison Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-[#F4F7F5] dark:bg-[#182E25] rounded-2xl border border-[#D8E2DC]/60 dark:border-[#1F3A2E]">
              <div className="text-[10px] text-[#6C7D74] font-medium">Total Stops</div>
              <div className="text-sm font-black text-[#111C16] dark:text-white mt-0.5">
                {currentRoutePlan?.stops.length || orders.length} → {simulatedPlan.stops.length}
              </div>
            </div>

            <div className="p-3 bg-[#F4F7F5] dark:bg-[#182E25] rounded-2xl border border-[#D8E2DC]/60 dark:border-[#1F3A2E]">
              <div className="text-[10px] text-[#6C7D74] font-medium">Total Duration</div>
              <div className="text-sm font-black text-[#1E5B44] dark:text-[#2FA872] mt-0.5">
                {currentRoutePlan?.metrics.totalDurationMin || 0}m → {simulatedPlan.metrics.totalDurationMin}m
              </div>
            </div>

            <div className="p-3 bg-[#F4F7F5] dark:bg-[#182E25] rounded-2xl border border-[#D8E2DC]/60 dark:border-[#1F3A2E]">
              <div className="text-[10px] text-[#6C7D74] font-medium">Late Deliveries</div>
              <div className={`text-sm font-black mt-0.5 ${simulatedPlan.metrics.lateOrdersCount > 0 ? 'text-rose-600' : 'text-[#238B5E]'}`}>
                {simulatedPlan.metrics.lateOrdersCount}
              </div>
            </div>

            <div className="p-3 bg-[#F4F7F5] dark:bg-[#182E25] rounded-2xl border border-[#D8E2DC]/60 dark:border-[#1F3A2E]">
              <div className="text-[10px] text-[#6C7D74] font-medium">Est. Route Cost</div>
              <div className="text-sm font-black text-[#111C16] dark:text-white mt-0.5">
                {business.currency}{Math.round(simulatedPlan.metrics.estimatedTotalCost)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
