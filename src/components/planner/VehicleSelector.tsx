import React from 'react';
import { useStore } from '../../store/useStore';
import { Vehicle } from '../../types';
import { AlertCircle, Check, Info } from 'lucide-react';

export const VehicleSelector: React.FC = () => {
  const { vehicles, selectedVehicleId, setSelectedVehicleId, orders } = useStore();

  const activeOrders = orders.filter((o) => o.status !== 'delivered' && o.status !== 'failed');
  const totalWeight = activeOrders.reduce((sum, o) => sum + (o.weightKg || 1), 0);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];
  const isOverCapacity = selectedVehicle && totalWeight > selectedVehicle.maxWeightKg;

  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-[#292D32] dark:text-white uppercase tracking-wider">
          Choose Delivery Vehicle
        </label>
        <span className="text-[11px] text-[#B4B6B7]">
          Current Load: <strong className="text-[#292D32] dark:text-white">{totalWeight.toFixed(1)} kg</strong>
        </span>
      </div>

      {/* Vehicle Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {vehicles.map((v) => {
          const isSelected = v.id === selectedVehicleId;
          const exceeds = totalWeight > v.maxWeightKg;

          return (
            <button
              key={v.id}
              type="button"
              onClick={() => setSelectedVehicleId(v.id)}
              className={`p-3 rounded-2xl text-left border transition-all duration-150 flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#168E6A] text-white border-[#127355] shadow-sm font-semibold ring-2 ring-[#168E6A]/40'
                  : 'bg-white dark:bg-[#33383F] hover:bg-[#E8F6F1] dark:hover:bg-[#3A4048] text-zinc-700 dark:text-zinc-300 border-[#EAECEA] dark:border-[#495059]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{v.icon || '🚚'}</span>
                {isSelected && (
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#FBB03B] text-[#292D32] shadow-xs">
                    SELECTED
                  </span>
                )}
              </div>

              <div className="mt-2.5 space-y-0.5">
                <div className={`font-bold text-xs truncate ${isSelected ? 'text-white' : 'text-[#292D32] dark:text-white'}`}>
                  {v.name}
                </div>
                <div className={`text-[10px] ${isSelected ? 'text-[#E8F6F1]' : 'text-[#B4B6B7]'}`}>
                  Cap: {v.maxWeightKg} kg • {v.mileageKmPerLiter > 100 ? 'Manual' : `${v.mileageKmPerLiter} km/L`}
                </div>
                <div className={`text-[10px] font-bold ${isSelected ? 'text-[#FBB03B]' : 'text-[#168E6A]'}`}>
                  ₹{v.estimatedCostPerKm || 2.5}/km est.
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Vehicle Capacity Warning (Requirement #21) */}
      {isOverCapacity && (
        <div className="p-3 bg-[#FFF7EB] text-[#C47D1A] border border-[#FBB03B]/60 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#FBB03B]" />
          <span>
            Vehicle capacity is insufficient for this route ({totalWeight.toFixed(1)} kg load &gt; {selectedVehicle.maxWeightKg} kg max). Try a larger vehicle like Cargo Auto or Mini Van.
          </span>
        </div>
      )}
    </div>
  );
};
