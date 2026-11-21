import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { BusinessType } from '../../types';
import { BUSINESS_TYPE_METADATA } from '../../services/businessRules';
import {
  Sliders,
  Building2,
  MapPin,
  Clock,
  Check,
  Shield,
  Save,
} from 'lucide-react';

export const BusinessRulesConfig: React.FC = () => {
  const { business, setBusiness, setBusinessType, updateBusinessRules } = useStore();

  const [name, setName] = useState(business.name);
  const [tagline, setTagline] = useState(business.tagline || '');
  const [depotName, setDepotName] = useState(business.depot.name);
  const [depotAddress, setDepotAddress] = useState(business.depot.address);
  const [currency, setCurrency] = useState(business.currency || '₹');
  const [fuelPrice, setFuelPrice] = useState(String(business.fuelPricePerLiter || 102.50));
  const [maxDurationHours, setMaxDurationHours] = useState(
    String(Math.round((business.maxRouteDurationMinutes || 300) / 60))
  );
  const [startTime, setStartTime] = useState(business.defaultStartTime || '08:30');

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleBusinessTypeChange = (type: BusinessType) => {
    setBusinessType(type);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setBusiness({
      ...business,
      name,
      tagline,
      depot: {
        ...business.depot,
        name: depotName,
        address: depotAddress,
      },
      currency,
      fuelPricePerLiter: parseFloat(fuelPrice) || 102.50,
      maxRouteDurationMinutes: (parseInt(maxDurationHours) || 5) * 60,
      defaultStartTime: startTime,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const bizTypes: BusinessType[] = ['bakery', 'pharmacy', 'grocery', 'tiffin_service'];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Top Header */}
      <div className="bg-white dark:bg-[#13251E] border border-[#D8E2DC] dark:border-[#1F3A2E] rounded-3xl p-5 shadow-card space-y-1">
        <h1 className="text-lg font-black text-[#111C16] dark:text-white">Business Archetype & Delivery Rules</h1>
        <p className="text-xs text-[#6C7D74]">
          Tailor optimization parameters to your local Tumakuru industry constraints
        </p>
      </div>

      {/* Archetype Selector Cards */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-[#6C7D74]">
          Select Business Archetype
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {bizTypes.map((type) => {
            const meta = BUSINESS_TYPE_METADATA[type];
            const isSelected = business.type === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => handleBusinessTypeChange(type)}
                className={`p-4 rounded-3xl border text-left transition ${
                  isSelected
                    ? 'bg-[#1E5B44] text-white border-[#144332] shadow-sm font-bold ring-2 ring-[#238B5E]/50'
                    : 'bg-white dark:bg-[#13251E] hover:bg-[#E8F5EF] dark:hover:bg-[#182E25] text-zinc-700 dark:text-zinc-300 border-[#D8E2DC] dark:border-[#1F3A2E]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{meta.icon}</span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-[#F7A838]"></span>
                  )}
                </div>
                <div className={`font-bold text-xs ${isSelected ? 'text-white' : 'text-[#111C16] dark:text-white'}`}>
                  {meta.label}
                </div>
                <div className={`text-[10px] mt-1 line-clamp-2 ${isSelected ? 'text-[#D4ECE1]' : 'text-[#6C7D74]'}`}>
                  {meta.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Rules Tuning Form */}
      <form onSubmit={handleSaveProfile} className="space-y-4">
        <div className="bg-white dark:bg-[#13251E] border border-[#D8E2DC] dark:border-[#1F3A2E] rounded-3xl p-6 shadow-card space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#111C16] dark:text-white border-b border-[#D8E2DC] dark:border-[#1F3A2E] pb-3">
            Core Operating Parameters
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Business Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#F4F7F5] dark:bg-[#182E25] border border-[#D8E2DC] dark:border-[#1F3A2E] rounded-xl px-3 py-2 text-xs text-[#111C16] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#238B5E]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Depot Location
              </label>
              <input
                type="text"
                value={depotAddress}
                onChange={(e) => setDepotAddress(e.target.value)}
                className="w-full bg-[#F4F7F5] dark:bg-[#182E25] border border-[#D8E2DC] dark:border-[#1F3A2E] rounded-xl px-3 py-2 text-xs text-[#111C16] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#238B5E]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Fuel Price (₹ / Litre)
              </label>
              <input
                type="number"
                step="0.1"
                value={fuelPrice}
                onChange={(e) => setFuelPrice(e.target.value)}
                className="w-full bg-[#F4F7F5] dark:bg-[#182E25] border border-[#D8E2DC] dark:border-[#1F3A2E] rounded-xl px-3 py-2 text-xs text-[#111C16] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#238B5E]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Default Morning Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-[#F4F7F5] dark:bg-[#182E25] border border-[#D8E2DC] dark:border-[#1F3A2E] rounded-xl px-3 py-2 text-xs text-[#111C16] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#238B5E]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-[#D8E2DC] dark:border-[#1F3A2E]">
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#F7A838] hover:bg-[#E69727] text-[#111C16] rounded-xl text-xs font-black shadow-sm transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Rules</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
