import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { DeliveryMap } from '../map/DeliveryMap';
import {
  CheckCircle2,
  Phone,
  Clock,
  MapPin,
  Truck,
  ShieldCheck,
} from 'lucide-react';

export const CustomerTracking: React.FC = () => {
  const { orders, business, drivers } = useStore();

  const activeOrders = orders.filter((o) => o.status !== 'cancelled');
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    activeOrders[0]?.id || ''
  );

  const selectedOrder =
    orders.find((o) => o.id === selectedOrderId) || activeOrders[0] || orders[0];

  const assignedDriver = drivers[0];

  const steps = [
    { title: 'Order confirmed', desc: 'Order received at bakery', done: true, time: '08:30 AM' },
    { title: 'Picked up', desc: 'Loaded into delivery bike', done: true, time: '09:05 AM' },
    { title: 'On the way', desc: 'In transit along optimized route', done: true, current: true, time: '09:20 AM' },
    { title: 'Arriving', desc: 'Courier is within 2 km radius', done: false, time: 'Est. 09:40 AM' },
    { title: 'Delivered', desc: 'Signed proof of delivery', done: false, time: 'Pending' },
  ];

  if (!selectedOrder) {
    return (
      <div className="p-12 text-center text-[#B4B6B7]">
        No deliveries currently scheduled for tracking.
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto pb-16 font-sans">
      {/* 1. Header & Tracking Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAECEA] dark:border-[#495059] pb-3">
        <div>
          <span className="text-[10px] uppercase font-bold text-[#168E6A] tracking-wider">
            Customer Tracking
          </span>
          <h1 className="text-xl font-black text-[#292D32] dark:text-white">Your Delivery</h1>
        </div>

        {/* Order Selector Dropdown */}
        <select
          value={selectedOrder.id}
          onChange={(e) => setSelectedOrderId(e.target.value)}
          className="bg-white dark:bg-[#33383F] border border-[#EAECEA] dark:border-[#495059] rounded-xl px-3 py-1.5 text-xs text-[#292D32] dark:text-zinc-200 font-bold focus:outline-none focus:ring-2 focus:ring-[#168E6A]"
        >
          {activeOrders.map((o) => (
            <option key={o.id} value={o.id}>
              Order #{o.orderNumber} – {o.customer.name}
            </option>
          ))}
        </select>
      </div>

      {/* 2. HERO TRACKING CARD (Requirement #29) */}
      <div className="bg-[#168E6A] text-white rounded-3xl p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between text-xs text-[#E8F6F1]">
          <span className="font-bold">YOUR DELIVERY</span>
          <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-bold text-[10px]">
            ORDER #{selectedOrder.orderNumber}
          </span>
        </div>

        <div>
          <div className="text-sm font-semibold text-[#E8F6F1]">{business.name}</div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-0.5">
            Arriving around: <span className="text-[#FBB03B]">5:42 PM</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#E8F6F1] mt-1">
            <span className="w-2 h-2 rounded-full bg-[#FBB03B] animate-pulse"></span>
            <span className="font-bold">2 stops away</span>
            <span>•</span>
            <span>{selectedOrder.customer.address}</span>
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE MAP */}
      <div className="bg-white dark:bg-[#33383F] border border-[#EAECEA] dark:border-[#495059] rounded-3xl p-3 shadow-card space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-[#292D32] dark:text-white px-2 pt-1">
          <span>Live Courier GPS Location</span>
          <span className="text-[10px] text-[#168E6A] font-bold">● Active</span>
        </div>
        <div className="h-60 rounded-2xl overflow-hidden border border-[#EAECEA] dark:border-[#495059]">
          <DeliveryMap interactive={true} />
        </div>
      </div>

      {/* 4. PACKAGE PROGRESS TIMELINE (Requirement #29) */}
      <div className="bg-white dark:bg-[#33383F] border border-[#EAECEA] dark:border-[#495059] rounded-3xl p-6 shadow-card space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#B4B6B7]">
          Delivery Progress
        </h2>

        <div className="space-y-4 relative pl-2">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-3 relative">
              {/* Timeline Connector Line */}
              {idx < steps.length - 1 && (
                <div
                  className={`absolute left-3 top-6 bottom-0 w-0.5 ${
                    step.done ? 'bg-[#168E6A]' : 'bg-[#EAECEA] dark:bg-[#495059]'
                  }`}
                  style={{ height: 'calc(100% + 4px)' }}
                ></div>
              )}

              {/* Step Circle */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10 ${
                  step.done
                    ? 'bg-[#168E6A] text-white shadow-xs'
                    : 'bg-[#F7F8F7] dark:bg-[#292D32] text-[#B4B6B7] border border-[#EAECEA] dark:border-[#495059]'
                }`}
              >
                {step.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
              </div>

              {/* Step Description */}
              <div className="min-w-0 flex-1 flex items-start justify-between">
                <div>
                  <div
                    className={`text-xs font-bold ${
                      step.current
                        ? 'text-[#168E6A]'
                        : step.done
                        ? 'text-[#292D32] dark:text-white'
                        : 'text-[#B4B6B7]'
                    }`}
                  >
                    {step.title}
                  </div>
                  <div className="text-[11px] text-[#B4B6B7] mt-0.5">{step.desc}</div>
                </div>
                <span className="text-[10px] font-semibold text-[#B4B6B7] shrink-0">{step.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. COURIER CONTACT CARD */}
      <div className="bg-white dark:bg-[#33383F] border border-[#EAECEA] dark:border-[#495059] rounded-3xl p-4 shadow-card flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FFF7EB] text-[#C47D1A] flex items-center justify-center font-bold text-sm border border-[#FBB03B]/30">
            🛵
          </div>
          <div>
            <div className="text-[10px] font-bold text-[#B4B6B7] uppercase tracking-wider">Your Courier</div>
            <div className="font-black text-xs sm:text-sm text-[#292D32] dark:text-white">
              {assignedDriver?.name || 'Vikas Gowda'}
            </div>
            <div className="text-[11px] text-[#B4B6B7]">Sweet Delights Fleet</div>
          </div>
        </div>

        <a
          href={`tel:${assignedDriver?.phone || '+919845012345'}`}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#168E6A] hover:bg-[#127355] text-white font-bold rounded-2xl text-xs shadow-xs transition"
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Call Driver</span>
        </a>
      </div>
    </div>
  );
};
