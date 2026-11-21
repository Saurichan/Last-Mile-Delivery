import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { Order, OrderPriority } from '../../types';
import { searchAddress, GeocodingResult } from '../../services/geocodingService';
import {
  X,
  MapPin,
  Clock,
  Package,
  Search,
  Check,
  ChevronDown,
  User,
  Phone,
} from 'lucide-react';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  editOrder?: Order | null;
}

export const OrderModal: React.FC<OrderModalProps> = ({ isOpen, onClose, editOrder }) => {
  const { business, addOrder, updateOrder } = useStore();

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressQuery, setAddressQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{
    address: string;
    lat: number;
    lng: number;
  }>({
    address: '',
    lat: business.depot.lat + 0.005,
    lng: business.depot.lng + 0.005,
  });

  const [category, setCategory] = useState('Fresh Bakery Box');
  const [weightKg, setWeightKg] = useState('1.5');
  const [priority, setPriority] = useState<OrderPriority>('normal');
  const [hasTimeWindow, setHasTimeWindow] = useState(false);
  const [timeWindowStart, setTimeWindowStart] = useState('10:00');
  const [timeWindowEnd, setTimeWindowEnd] = useState('11:30');
  const [isFragile, setIsFragile] = useState(false);
  const [isTemperatureSensitive, setIsTemperatureSensitive] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Geocoding search state
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (editOrder) {
      setCustomerName(editOrder.customer.name);
      setPhone(editOrder.customer.phone);
      setAddressQuery(editOrder.customer.address);
      setSelectedLocation({
        address: editOrder.customer.address,
        lat: editOrder.customer.lat,
        lng: editOrder.customer.lng,
      });
      setCategory(editOrder.category);
      setWeightKg(String(editOrder.weightKg));
      setPriority(editOrder.priority);
      if (editOrder.timeWindow) {
        setHasTimeWindow(true);
        setTimeWindowStart(editOrder.timeWindow.start);
        setTimeWindowEnd(editOrder.timeWindow.end);
      }
      setIsFragile(!!editOrder.isFragile);
      setIsTemperatureSensitive(!!editOrder.isTemperatureSensitive);
      setSpecialInstructions(editOrder.specialInstructions || '');
    } else {
      setCustomerName('');
      setPhone('+91 98450 ');
      setAddressQuery('');
      setSelectedLocation({
        address: 'MG Road, Tumakuru',
        lat: business.depot.lat + 0.006,
        lng: business.depot.lng + 0.004,
      });
      setCategory('Fresh Bakery Box');
      setWeightKg('1.5');
      setPriority('normal');
      setHasTimeWindow(false);
      setIsFragile(false);
      setIsTemperatureSensitive(false);
      setSpecialInstructions('');
      setShowAdvanced(false);
    }
  }, [editOrder, isOpen, business.depot]);

  const handleSearch = async (query: string) => {
    setAddressQuery(query);
    if (query.trim().length < 3) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await searchAddress(query);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectLocation = (res: GeocodingResult) => {
    setSelectedLocation({
      address: res.displayName,
      lat: res.lat,
      lng: res.lng,
    });
    setAddressQuery(res.displayName);
    setSearchResults([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !addressQuery) {
      alert('Please enter customer name and delivery address.');
      return;
    }

    if (editOrder) {
      updateOrder(editOrder.id, {
        customer: {
          id: editOrder.customer.id,
          name: customerName,
          phone,
          address: selectedLocation.address || addressQuery,
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
        },
        category,
        weightKg: parseFloat(weightKg) || 1.0,
        priority,
        timeWindow: hasTimeWindow
          ? { start: timeWindowStart, end: timeWindowEnd }
          : undefined,
        serviceTimeMinutes: 3,
        isFragile,
        isTemperatureSensitive,
        specialInstructions: specialInstructions || undefined,
      });
    } else {
      addOrder({
        orderNumber: `ORD-${Math.floor(100 + Math.random() * 900)}`,
        customer: {
          id: `c-${Date.now()}`,
          name: customerName,
          phone,
          address: selectedLocation.address || addressQuery,
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
        },
        category,
        weightKg: parseFloat(weightKg) || 1.0,
        priority,
        status: 'pending',
        timeWindow: hasTimeWindow
          ? { start: timeWindowStart, end: timeWindowEnd }
          : undefined,
        serviceTimeMinutes: 3,
        isFragile,
        isTemperatureSensitive,
        specialInstructions: specialInstructions || undefined,
      });
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto font-sans">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#33383F] border border-[#EAECEA] dark:border-[#495059] rounded-3xl shadow-modal p-6 text-[#292D32] dark:text-[#F1F3F2] max-h-[90vh] overflow-y-auto space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-[#292D32] dark:hover:text-white rounded-xl hover:bg-[#F7F8F7] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#168E6A] text-white rounded-2xl flex items-center justify-center font-bold shadow-sm">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-[#292D32] dark:text-white">
              {editOrder ? `Edit Order #${editOrder.orderNumber}` : 'Add New Delivery Order'}
            </h2>
            <p className="text-xs text-[#B4B6B7]">
              {editOrder ? 'Update delivery destination & preferences' : 'Add a customer stop to today’s Tumakuru dispatch queue'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* STEP 1: Customer (Name, Phone) */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#B4B6B7] uppercase tracking-wider">Step 1: Customer Details</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Rahul Kumar"
                  className="w-full bg-[#F7F8F7] dark:bg-[#292D32] border border-[#EAECEA] dark:border-[#495059] rounded-xl px-3 py-2 text-xs text-[#292D32] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#168E6A]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98450 12345"
                  className="w-full bg-[#F7F8F7] dark:bg-[#292D32] border border-[#EAECEA] dark:border-[#495059] rounded-xl px-3 py-2 text-xs text-[#292D32] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#168E6A]"
                />
              </div>
            </div>
          </div>

          {/* STEP 2: Delivery Location (Tumakuru Address) */}
          <div className="space-y-1 relative">
            <span className="text-[10px] font-bold text-[#B4B6B7] uppercase tracking-wider">Step 2: Delivery Location</span>
            <div className="relative">
              <input
                type="text"
                required
                value={addressQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Type location in Tumakuru (e.g. SIT Main Road, SS Puram, MG Road)..."
                className="w-full bg-[#F7F8F7] dark:bg-[#292D32] border border-[#EAECEA] dark:border-[#495059] rounded-xl pl-9 pr-3 py-2 text-xs text-[#292D32] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#168E6A]"
              />
              <MapPin className="w-4 h-4 text-[#168E6A] absolute left-3 top-2.5" />
            </div>

            {/* Live Autocomplete Results */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#33383F] border border-[#EAECEA] dark:border-[#495059] rounded-xl shadow-modal p-1 space-y-1">
                {searchResults.map((res, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectLocation(res)}
                    className="w-full text-left px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-[#E8F6F1] dark:hover:bg-[#292D32] rounded-lg transition"
                  >
                    {res.displayName}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* STEP 3: Delivery Preference (Anytime vs Time Window) */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#B4B6B7] uppercase tracking-wider">Step 3: Delivery Preference</span>
            <div className="p-3 bg-[#F7F8F7] dark:bg-[#292D32] rounded-2xl border border-[#EAECEA] dark:border-[#495059] space-y-2">
              <label className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer">
                <span>Specific Customer Time Window</span>
                <input
                  type="checkbox"
                  checked={hasTimeWindow}
                  onChange={(e) => setHasTimeWindow(e.target.checked)}
                  className="rounded text-[#168E6A] w-4 h-4"
                />
              </label>

              {hasTimeWindow && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] text-[#B4B6B7] block mb-0.5">Start Time</label>
                    <input
                      type="time"
                      value={timeWindowStart}
                      onChange={(e) => setTimeWindowStart(e.target.value)}
                      className="w-full bg-white dark:bg-[#33383F] border border-[#EAECEA] dark:border-[#495059] rounded-xl px-2 py-1.5 text-xs text-[#292D32] dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#B4B6B7] block mb-0.5">End Time</label>
                    <input
                      type="time"
                      value={timeWindowEnd}
                      onChange={(e) => setTimeWindowEnd(e.target.value)}
                      className="w-full bg-white dark:bg-[#33383F] border border-[#EAECEA] dark:border-[#495059] rounded-xl px-2 py-1.5 text-xs text-[#292D32] dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* STEP 4: Order Details (Weight & Priority) */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#B4B6B7] uppercase tracking-wider">Step 4: Package Details</span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Item Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#F7F8F7] dark:bg-[#292D32] border border-[#EAECEA] dark:border-[#495059] rounded-xl px-3 py-2 text-xs text-[#292D32] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#168E6A]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full bg-[#F7F8F7] dark:bg-[#292D32] border border-[#EAECEA] dark:border-[#495059] rounded-xl px-3 py-2 text-xs text-[#292D32] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#168E6A]"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Delivery Priority</label>
              <div className="grid grid-cols-4 gap-2">
                {(['flexible', 'normal', 'high', 'critical'] as OrderPriority[]).map((prio) => (
                  <button
                    key={prio}
                    type="button"
                    onClick={() => setPriority(prio)}
                    className={`py-2 px-1 text-[11px] font-bold rounded-xl border capitalize transition ${
                      priority === prio
                        ? 'bg-[#168E6A] text-white border-[#127355] shadow-xs'
                        : 'bg-[#F7F8F7] dark:bg-[#292D32] text-zinc-600 dark:text-zinc-400 border-[#EAECEA] dark:border-[#495059]'
                    }`}
                  >
                    {prio === 'critical' ? 'Express' : prio}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Advanced Options Toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-bold text-[#168E6A] flex items-center gap-1 hover:underline"
            >
              <span>{showAdvanced ? 'Hide Advanced Options' : '+ Advanced Options (Instructions, Fragile)'}</span>
            </button>

            {showAdvanced && (
              <div className="mt-2 p-3 bg-[#F7F8F7] dark:bg-[#292D32] border border-[#EAECEA] dark:border-[#495059] rounded-2xl space-y-2 animate-fade-in">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Special Driver Instructions
                  </label>
                  <input
                    type="text"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="e.g. Ring bell, handle fresh cake carefully"
                    className="w-full bg-white dark:bg-[#33383F] border border-[#EAECEA] dark:border-[#495059] rounded-xl px-3 py-2 text-xs text-[#292D32] dark:text-white"
                  />
                </div>

                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFragile}
                      onChange={(e) => setIsFragile(e.target.checked)}
                      className="rounded text-[#168E6A] w-4 h-4"
                    />
                    <span>Fragile Goods</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isTemperatureSensitive}
                      onChange={(e) => setIsTemperatureSensitive(e.target.checked)}
                      className="rounded text-[#168E6A] w-4 h-4"
                    />
                    <span>Temperature Sensitive</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* STEP 5: SAVE ORDER (Requirement #19) */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EAECEA] dark:border-[#495059]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-[#F7F8F7] hover:bg-[#E8F6F1] dark:bg-[#292D32] text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#168E6A] hover:bg-[#127355] text-white rounded-xl text-xs font-black shadow-sm transition active:scale-95"
            >
              {editOrder ? 'Save Changes' : 'Save Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
