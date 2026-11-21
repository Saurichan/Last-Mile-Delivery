import React, { useState } from 'react';
import { Order } from '../../types';
import {
  X,
  AlertTriangle,
  RotateCcw,
  Calendar,
  XCircle,
} from 'lucide-react';

interface FailedDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onReportFailed: (orderId: string, reason: string, notes?: string, rescheduleDate?: string) => void;
}

export const FailedDeliveryModal: React.FC<FailedDeliveryModalProps> = ({
  isOpen,
  onClose,
  order,
  onReportFailed,
}) => {
  const [reason, setReason] = useState('Customer Unavailable');
  const [notes, setNotes] = useState('');
  const [actionType, setActionType] = useState<'reschedule' | 'return_pool'>('reschedule');
  const [rescheduleDate, setRescheduleDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );

  const failureReasons = [
    'Customer Unavailable / Phone Unreachable',
    'Incorrect or Inaccessible Address in Tumakuru',
    'Customer Requested Alternate Delivery Slot',
    'Refused Delivery / Item Not Required',
    'Damaged Package in Transit',
    'Severe Road Obstruction / Weather',
    'Other Operational Issue',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    onReportFailed(
      order.id,
      reason,
      notes,
      actionType === 'reschedule' ? rescheduleDate : undefined
    );
    onClose();
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md bg-white dark:bg-[#13251E] border border-[#D8E2DC] dark:border-[#1F3A2E] rounded-3xl shadow-modal p-6 text-zinc-900 dark:text-zinc-100 max-h-[90vh] overflow-y-auto space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-black dark:hover:text-white rounded-xl hover:bg-[#F4F7F5] dark:hover:bg-[#182E25] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 rounded-2xl flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-[#111C16] dark:text-white">Report Delivery Issue</h2>
            <p className="text-xs text-[#6C7D74]">
              Record reason for incomplete delivery & reschedule or return to pool
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Order Snapshot */}
          <div className="p-3 bg-[#F4F7F5] dark:bg-[#182E25] border border-[#D8E2DC]/60 dark:border-[#1F3A2E] rounded-2xl text-xs space-y-1">
            <div className="font-bold text-[#111C16] dark:text-white">
              Order #{order.orderNumber} • {order.customer.name}
            </div>
            <div className="text-[#6C7D74]">{order.customer.address}</div>
          </div>

          {/* Reason Selection */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Primary Reason *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-[#F4F7F5] dark:bg-[#182E25] border border-[#D8E2DC] dark:border-[#1F3A2E] rounded-xl px-3 py-2 text-xs text-[#111C16] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#238B5E]"
            >
              {failureReasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Action Choice */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Resolution Action
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActionType('reschedule')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                  actionType === 'reschedule'
                    ? 'bg-[#1E5B44] text-white border-[#144332]'
                    : 'bg-[#F4F7F5] dark:bg-[#182E25] text-zinc-600 dark:text-zinc-400 border-[#D8E2DC] dark:border-[#1F3A2E]'
                }`}
              >
                Reschedule Date
              </button>

              <button
                type="button"
                onClick={() => setActionType('return_pool')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                  actionType === 'return_pool'
                    ? 'bg-[#1E5B44] text-white border-[#144332]'
                    : 'bg-[#F4F7F5] dark:bg-[#182E25] text-zinc-600 dark:text-zinc-400 border-[#D8E2DC] dark:border-[#1F3A2E]'
                }`}
              >
                Return to Depot Pool
              </button>
            </div>
          </div>

          {/* Reschedule Date picker */}
          {actionType === 'reschedule' && (
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                New Target Delivery Date
              </label>
              <input
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="w-full bg-[#F4F7F5] dark:bg-[#182E25] border border-[#D8E2DC] dark:border-[#1F3A2E] rounded-xl px-3 py-2 text-xs text-[#111C16] dark:text-white"
              />
            </div>
          )}

          {/* Detailed Notes */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Driver Operational Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Called customer twice, gate locked."
              className="w-full bg-[#F4F7F5] dark:bg-[#182E25] border border-[#D8E2DC] dark:border-[#1F3A2E] rounded-xl px-3 py-2 text-xs text-[#111C16] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#238B5E]"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D8E2DC] dark:border-[#1F3A2E]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#F4F7F5] hover:bg-[#E8F5EF] dark:bg-[#182E25] text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
