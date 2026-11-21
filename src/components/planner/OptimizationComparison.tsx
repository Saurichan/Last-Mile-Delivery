import React from 'react';
import { RouteMetrics } from '../../types';
import { calculateSavingsComparison } from '../../services/costCalculator';
import {
  TrendingDown,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';

interface OptimizationComparisonProps {
  originalMetrics?: RouteMetrics;
  optimizedMetrics?: RouteMetrics;
  currency?: string;
  onShowExplanation?: () => void;
}

export const OptimizationComparison: React.FC<OptimizationComparisonProps> = ({
  originalMetrics,
  optimizedMetrics,
  currency = '₹',
  onShowExplanation,
}) => {
  if (!optimizedMetrics) return null;

  const savings = calculateSavingsComparison(originalMetrics, optimizedMetrics);

  const beforeDist = originalMetrics?.totalDistanceKm || (optimizedMetrics.totalDistanceKm + savings.distanceSavedKm);
  const beforeDur = originalMetrics?.totalDurationMin || (optimizedMetrics.totalDurationMin + savings.timeSavedMin);
  const beforeLate = originalMetrics?.lateOrdersCount ?? 2;
  const beforeCost = originalMetrics?.estimatedTotalCost || (optimizedMetrics.estimatedTotalCost + savings.costSaved);

  return (
    <div className="bg-white dark:bg-[#33383F] border border-[#EAECEA] dark:border-[#495059] rounded-3xl p-5 shadow-card space-y-4 font-sans">
      {/* Title Bar */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#B4B6B7]">
            Optimization Impact
          </span>
          <h3 className="text-sm font-bold text-[#292D32] dark:text-white">
            Delivery Sequence & Savings
          </h3>
        </div>

        {onShowExplanation && (
          <button
            onClick={onShowExplanation}
            className="px-3 py-1.5 bg-[#F7F8F7] hover:bg-[#E8F6F1] dark:bg-[#292D32] dark:hover:bg-[#3A4048] text-zinc-700 dark:text-zinc-200 border border-[#EAECEA] dark:border-[#495059] rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#168E6A]" />
            <span>Why This Route?</span>
          </button>
        )}
      </div>

      {/* BEFORE / AFTER / SAVED Three-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 1. BEFORE */}
        <div className="p-3.5 bg-[#F7F8F7] dark:bg-[#292D32] rounded-2xl border border-[#EAECEA] dark:border-[#495059] space-y-2">
          <div className="text-[10px] font-bold text-[#B4B6B7] uppercase tracking-wider">
            Before (Manual Sequence)
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
              <span>Distance:</span>
              <span className="font-semibold text-[#292D32] dark:text-white">{beforeDist.toFixed(1)} km</span>
            </div>
            <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
              <span>Duration:</span>
              <span className="font-semibold text-[#292D32] dark:text-white">{Math.round(beforeDur)} min</span>
            </div>
            <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
              <span>Late Deliveries:</span>
              <span className={`font-semibold ${beforeLate > 0 ? 'text-rose-600' : 'text-zinc-600'}`}>
                {beforeLate} late
              </span>
            </div>
            <div className="flex justify-between text-zinc-600 dark:text-zinc-400 pt-1 border-t border-[#EAECEA] dark:border-[#495059]">
              <span>Est. Cost:</span>
              <span className="font-bold text-[#292D32] dark:text-white">{currency}{Math.round(beforeCost)}</span>
            </div>
          </div>
        </div>

        {/* 2. AFTER */}
        <div className="p-3.5 bg-[#E8F6F1] dark:bg-[#168E6A]/20 rounded-2xl border border-[#168E6A]/40 space-y-2">
          <div className="text-[10px] font-bold text-[#168E6A] uppercase tracking-wider flex items-center justify-between">
            <span>After (Optimized)</span>
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#168E6A] text-white">READY</span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-zinc-700 dark:text-zinc-300">
              <span>Distance:</span>
              <span className="font-bold text-[#168E6A]">{optimizedMetrics.totalDistanceKm} km</span>
            </div>
            <div className="flex justify-between text-zinc-700 dark:text-zinc-300">
              <span>Duration:</span>
              <span className="font-bold text-[#292D32] dark:text-white">{optimizedMetrics.totalDurationMin} min</span>
            </div>
            <div className="flex justify-between text-zinc-700 dark:text-zinc-300">
              <span>Late Deliveries:</span>
              <span className="font-bold text-[#168E6A]">
                {optimizedMetrics.lateOrdersCount} late
              </span>
            </div>
            <div className="flex justify-between text-zinc-700 dark:text-zinc-300 pt-1 border-t border-[#168E6A]/30">
              <span>Est. Cost:</span>
              <span className="font-bold text-[#292D32] dark:text-white">{currency}{Math.round(optimizedMetrics.estimatedTotalCost)}</span>
            </div>
          </div>
        </div>

        {/* 3. SAVINGS */}
        <div className="p-3.5 bg-[#FFF7EB] dark:bg-[#292D32] rounded-2xl border border-[#FBB03B]/40 space-y-2">
          <div className="text-[10px] font-bold text-[#C47D1A] dark:text-[#FBB03B] uppercase tracking-wider flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>You Saved</span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-zinc-700 dark:text-zinc-300">
              <span>Distance Saved:</span>
              <span className="font-bold text-[#168E6A]">
                {savings.distanceSavedKm > 0 ? `-${savings.distanceSavedKm} km` : '0 km'}
              </span>
            </div>
            <div className="flex justify-between text-zinc-700 dark:text-zinc-300">
              <span>Time Saved:</span>
              <span className="font-bold text-[#C47D1A] dark:text-[#FBB03B]">
                {savings.timeSavedMin > 0 ? `-${savings.timeSavedMin} min` : '0 min'}
              </span>
            </div>
            <div className="flex justify-between text-zinc-700 dark:text-zinc-300">
              <span>Road Reduction:</span>
              <span className="font-bold text-[#168E6A]">
                {savings.percentDistanceSaved}%
              </span>
            </div>
            <div className="flex justify-between text-zinc-700 dark:text-zinc-300 pt-1 border-t border-[#FBB03B]/30">
              <span>Fuel & Labor Saved:</span>
              <span className="font-black text-[#C47D1A] dark:text-[#FBB03B]">
                {currency}{savings.costSaved > 0 ? Math.round(savings.costSaved) : 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
