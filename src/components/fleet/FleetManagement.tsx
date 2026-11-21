import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Driver, Vehicle, VehicleType } from '../../types';
import {
  Users,
  Truck,
  Plus,
  Phone,
  Mail,
  Gauge,
  CheckCircle2,
} from 'lucide-react';

export const FleetManagement: React.FC = () => {
  const { drivers, vehicles, business } = useStore();

  const [activeSubTab, setActiveSubTab] = useState<'vehicles' | 'drivers'>('vehicles');

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-white dark:bg-[#13251E] border border-[#D8E2DC] dark:border-[#1F3A2E] rounded-3xl p-5 shadow-card space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#238B5E] tracking-wider">
              Fleet & Courier Assets
            </span>
            <h1 className="text-lg font-black text-[#111C16] dark:text-white">Drivers & Vehicles</h1>
          </div>

          {/* Sub-tab switcher */}
          <div className="flex items-center bg-[#F4F7F5] dark:bg-[#182E25] p-1 rounded-2xl border border-[#D8E2DC] dark:border-[#1F3A2E]">
            <button
              onClick={() => setActiveSubTab('vehicles')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'vehicles'
                  ? 'bg-[#1E5B44] text-white font-black shadow-sm'
                  : 'text-[#6C7D74]'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              Vehicles ({vehicles.length})
            </button>
            <button
              onClick={() => setActiveSubTab('drivers')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'drivers'
                  ? 'bg-[#1E5B44] text-white font-black shadow-sm'
                  : 'text-[#6C7D74]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Drivers ({drivers.length})
            </button>
          </div>
        </div>

        <p className="text-xs text-[#6C7D74]">
          Delivery vehicles, load capacities, fuel economy and driver assignments in Tumakuru
        </p>
      </div>

      {/* Vehicles Grid */}
      {activeSubTab === 'vehicles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v) => {
            const assignedDriver = drivers.find((d) => d.id === v.assignedDriverId);
            return (
              <div
                key={v.id}
                className="bg-white dark:bg-[#13251E] border border-[#D8E2DC] dark:border-[#1F3A2E] rounded-3xl p-5 space-y-3 shadow-card"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{v.icon || '🚚'}</span>
                    <div>
                      <div className="font-bold text-xs text-[#111C16] dark:text-white">{v.name}</div>
                      <span className="text-[10px] text-[#6C7D74] capitalize">{v.type} • {v.fuelType}</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F5EF] text-[#1E5B44] border border-[#238B5E]/30">
                    Active
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-[#D8E2DC]/60 dark:border-[#1F3A2E]">
                  <div>
                    <span className="text-[10px] text-[#6C7D74] block">Capacity</span>
                    <span className="font-semibold text-[#111C16] dark:text-zinc-200">{v.maxWeightKg} kg max</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6C7D74] block">Mileage</span>
                    <span className="font-semibold text-[#111C16] dark:text-zinc-200">{v.mileageKmPerLiter} km/L</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
                  <span>Assigned Courier:</span>
                  <span className="font-bold text-[#111C16] dark:text-white">
                    {assignedDriver ? assignedDriver.name : 'Unassigned'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drivers Grid */}
      {activeSubTab === 'drivers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drivers.map((d) => (
            <div
              key={d.id}
              className="bg-white dark:bg-[#13251E] border border-[#D8E2DC] dark:border-[#1F3A2E] rounded-3xl p-5 space-y-3 shadow-card"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-[#F7A838] text-[#111C16] font-bold text-sm flex items-center justify-center shadow-sm">
                    {d.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-[#111C16] dark:text-white">{d.name}</div>
                    <span className="text-[10px] text-[#6C7D74] capitalize">{d.status}</span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F5EF] text-[#1E5B44] border border-[#238B5E]/30">
                  {business.currency}{d.hourlyWage}/hr
                </span>
              </div>

              <div className="space-y-1 text-xs text-[#6C7D74] pt-1">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#238B5E]" />
                  <span>{d.phone}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#238B5E]" />
                  <span className="truncate">{d.email}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
