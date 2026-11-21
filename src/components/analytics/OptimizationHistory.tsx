import React from 'react';
import { useStore } from '../../store/useStore';
import {
  History,
  Calendar,
  Zap,
  Gauge,
  Clock,
  DollarSign,
  TrendingDown,
} from 'lucide-react';

export const OptimizationHistory: React.FC = () => {
  const { optimizationHistory, business } = useStore();

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-12">
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
            <History className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
              Audit & Execution Log
            </span>
            <h1 className="text-xl font-extrabold text-white">Optimization History Log</h1>
          </div>
        </div>
        <p className="text-xs text-slate-400">
          Historical record of every optimization run, algorithm efficiency benchmarks, and cumulative resource savings.
        </p>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {optimizationHistory.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No optimization runs recorded yet. Run route optimization to log history.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Orders</th>
                  <th className="py-3 px-4">Algorithm</th>
                  <th className="py-3 px-4">Distance (Before → After)</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Cost Saved</th>
                  <th className="py-3 px-4">CO₂ Saved</th>
                  <th className="py-3 px-4 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {optimizationHistory.map((run) => (
                  <tr key={run.id} className="hover:bg-slate-800/50 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">
                        {new Date(run.timestamp).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(run.timestamp).toLocaleTimeString()}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-200">
                      {run.orderCount} stops
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                        {run.algorithmUsed.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-slate-400">
                        {run.beforeDistanceKm} km →{' '}
                        <span className="font-bold text-emerald-400">{run.afterDistanceKm} km</span>
                      </div>
                      <div className="text-[10px] text-emerald-400 font-medium">
                        -{run.distanceSavedKm} km ({run.percentDistanceSaved}%)
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-slate-400">
                        {run.beforeDurationMin}m →{' '}
                        <span className="font-bold text-indigo-400">{run.afterDurationMin}m</span>
                      </div>
                      <div className="text-[10px] text-indigo-400 font-medium">
                        -{run.timeSavedMin} min
                      </div>
                    </td>

                    <td className="py-3 px-4 font-extrabold text-amber-400">
                      +{business.currency}{run.costSaved.toFixed(2)}
                    </td>

                    <td className="py-3 px-4 font-semibold text-emerald-400">
                      -{run.co2SavedKg} kg
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-300">
                      {run.score}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
