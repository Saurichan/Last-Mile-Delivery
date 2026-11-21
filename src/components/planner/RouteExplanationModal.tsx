import React from 'react';
import { RoutePlan } from '../../types';
import {
  X,
  HelpCircle,
  MapPin,
  Clock,
  ArrowDown,
  Lock,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface RouteExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  routePlan: RoutePlan | null;
}

export const RouteExplanationModal: React.FC<RouteExplanationModalProps> = ({
  isOpen,
  onClose,
  routePlan,
}) => {
  if (!isOpen || !routePlan) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#13251E] border border-[#D8E2DC] dark:border-[#1F3A2E] rounded-3xl shadow-modal p-6 text-zinc-900 dark:text-zinc-100 max-h-[88vh] overflow-y-auto space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-black dark:hover:text-white rounded-xl hover:bg-[#F4F7F5] dark:hover:bg-[#182E25] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1E5B44] text-white rounded-2xl flex items-center justify-center font-bold shadow-sm">
            <HelpCircle className="w-5 h-5 text-[#F7A838]" />
          </div>
          <div>
            <h2 className="text-base font-black text-[#111C16] dark:text-white">Why This Route? Sequence Rationale</h2>
            <p className="text-xs text-[#6C7D74]">
              Deterministic reasoning and time window compliance behind each delivery stop
            </p>
          </div>
        </div>

        {/* Depot Start */}
        <div className="p-3 bg-[#E8F5EF] dark:bg-[#1E5B44]/20 border border-[#238B5E]/40 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#1E5B44] text-white flex items-center justify-center text-xs font-bold">
              0
            </div>
            <div>
              <div className="text-xs font-bold text-[#1E5B44] dark:text-[#2FA872]">Depot Departure</div>
              <div className="text-[11px] text-[#6C7D74]">{routePlan.depot.name}</div>
            </div>
          </div>
          <div className="text-xs font-bold text-[#111C16] dark:text-white">
            08:30 Departure
          </div>
        </div>

        {/* Stops Sequence Explanations */}
        <div className="space-y-2">
          {routePlan.stops.map((stop) => (
            <div key={stop.orderId} className="space-y-1">
              <div className="flex justify-center text-[#6C7D74]">
                <ArrowDown className="w-3.5 h-3.5" />
              </div>

              <div className="p-3 bg-[#F4F7F5] dark:bg-[#182E25] border border-[#D8E2DC]/80 dark:border-[#1F3A2E] rounded-2xl space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#1E5B44] text-white flex items-center justify-center font-bold text-xs">
                      #{stop.stopIndex}
                    </span>
                    <span className="font-bold text-[#111C16] dark:text-white">
                      {stop.order.customer.name} (Order #{stop.order.orderNumber})
                    </span>
                    {stop.isLocked && <span className="text-xs text-[#F7A838]">🔒</span>}
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-[#238B5E]">{stop.estimatedArrival}</span>
                    <span className="text-[10px] text-[#6C7D74] block">+{stop.travelDistanceKm} km</span>
                  </div>
                </div>

                <div className="text-[11px] text-[#6C7D74] dark:text-zinc-300 pl-8 leading-relaxed">
                  {stop.rationale || `${stop.order.priority === 'critical' ? 'High-priority express' : 'Optimized sequence'} stop with ${stop.travelDistanceKm}km transit and scheduled arrival at ${stop.estimatedArrival}.`}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-[#D8E2DC] dark:border-[#1F3A2E]">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#1E5B44] text-white hover:bg-[#144332] rounded-xl text-xs font-bold shadow-sm"
          >
            Close Rationale
          </button>
        </div>
      </div>
    </div>
  );
};
