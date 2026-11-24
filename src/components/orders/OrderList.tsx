import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Order, OrderPriority, OrderStatus } from '../../types';
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  Lock,
  Unlock,
  Phone,
  Clock,
  MapPin,
  Package,
  Calendar,
  CheckCircle2,
  XCircle,
  Truck,
  Zap,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface OrderListProps {
  onOpenNewOrder: () => void;
  onEditOrder: (order: Order) => void;
}

export const OrderList: React.FC<OrderListProps> = ({
  onOpenNewOrder,
  onEditOrder,
}) => {
  const { orders, deleteOrder, toggleLockStop, setSelectedOrderId, selectedOrderId, ordersError, isSyncingOrders } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPriority = priorityFilter === 'all' || o.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;

    return matchesSearch && matchesPriority && matchesStatus;
  });

  const getPriorityBadge = (prio: OrderPriority) => {
    switch (prio) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF7EB] text-[#C47D1A] dark:text-[#FBB03B] border border-[#FBB03B]/40">
            <Zap className="w-3 h-3" /> Express
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF7EB] text-[#C47D1A] dark:text-[#FBB03B] border border-[#FBB03B]/40">
            High Priority
          </span>
        );
      case 'normal':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#E8F6F1] text-[#168E6A] border border-[#168E6A]/30">
            Normal
          </span>
        );
      case 'flexible':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#F7F8F7] dark:bg-[#292D32] text-[#B4B6B7] border border-[#EAECEA] dark:border-[#495059]">
            Flexible
          </span>
        );
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F6F1] text-[#168E6A] border border-[#168E6A]/40">
            <CheckCircle2 className="w-3 h-3" /> Delivered
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" /> Failed
          </span>
        );
      case 'rescheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Calendar className="w-3 h-3" /> Rescheduled
          </span>
        );
      case 'en_route':
      case 'arriving':
      case 'picked_up':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF7EB] text-[#C47D1A] dark:text-[#FBB03B] border border-[#FBB03B]/50">
            <Truck className="w-3 h-3" /> On the way
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#F7F8F7] dark:bg-[#292D32] text-[#B4B6B7] border border-[#EAECEA] dark:border-[#495059]">
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-16 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-[#33383F] p-4 sm:p-5 rounded-3xl border border-[#EAECEA] dark:border-[#495059] shadow-card">
        <div>
          <h1 className="text-lg font-black text-[#292D32] dark:text-white flex items-center gap-2">
            <span>Orders Queue</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#E8F6F1] text-[#168E6A] font-bold">
              {filteredOrders.length} orders
            </span>
          </h1>
          <p className="text-xs text-[#B4B6B7] mt-0.5">
            Customer delivery destinations, scheduled time windows, and priority
          </p>
        </div>

        <button
          onClick={onOpenNewOrder}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#168E6A] hover:bg-[#127355] text-white rounded-2xl text-xs font-bold shadow-subtle transition transform active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Order
        </button>
      </div>

      {/* Supabase Sync Error / Loading Banner */}
      {ordersError && (
        <div className="flex items-start gap-2 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs text-rose-700 dark:text-rose-300">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Supabase Error:</span>{' '}
            <span className="break-all">{ordersError}</span>
          </div>
        </div>
      )}
      {isSyncingOrders && (
        <div className="flex items-center gap-2 p-2 text-xs text-[#B4B6B7]">
          <RefreshCw className="w-3 h-3 animate-spin" />
          Loading live orders from Supabase...
        </div>
      )}

      {/* Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order #, customer, address in Tumakuru..."
            className="w-full bg-white dark:bg-[#33383F] border border-[#EAECEA] dark:border-[#495059] rounded-2xl pl-9 pr-3 py-2 text-xs text-[#292D32] dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#168E6A]"
          />
          <Search className="w-4 h-4 text-[#B4B6B7] absolute left-3 top-2.5" />
        </div>

        <div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full bg-white dark:bg-[#33383F] border border-[#EAECEA] dark:border-[#495059] rounded-2xl px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#168E6A]"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Express / Critical</option>
            <option value="high">High Priority</option>
            <option value="normal">Normal</option>
            <option value="flexible">Flexible</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-white dark:bg-[#33383F] border border-[#EAECEA] dark:border-[#495059] rounded-2xl px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#168E6A]"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="en_route">On the way</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed Delivery</option>
            <option value="rescheduled">Rescheduled</option>
          </select>
        </div>
      </div>

      {/* 1. Mobile Cards View (Requirement #18: Clean stacked cards on mobile) */}
      <div className="block lg:hidden space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-[#B4B6B7] bg-white dark:bg-[#33383F] rounded-3xl border border-[#EAECEA] dark:border-[#495059]">
            <Package className="w-8 h-8 mx-auto text-zinc-400 mb-2" />
            <div className="font-bold text-xs">No orders matching filter criteria</div>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => setSelectedOrderId(order.id)}
              className={`p-4 rounded-3xl border transition bg-white dark:bg-[#33383F] shadow-card space-y-2.5 ${
                selectedOrderId === order.id
                  ? 'border-[#168E6A] ring-1 ring-[#168E6A]'
                  : 'border-[#EAECEA] dark:border-[#495059]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-black text-xs text-[#292D32] dark:text-white">
                    #{order.orderNumber}
                  </span>
                  {order.isLocked && <span className="text-xs">🔒</span>}
                </div>
                <div>{getPriorityBadge(order.priority)}</div>
              </div>

              <div>
                <div className="font-bold text-sm text-[#292D32] dark:text-white">
                  {order.customer.name}
                </div>
                <div className="text-xs text-[#B4B6B7] flex items-start gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#168E6A]" />
                  <span>{order.customer.address}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs py-1.5 border-y border-[#EAECEA] dark:border-[#495059] text-zinc-600 dark:text-zinc-400">
                <div>
                  <span className="text-[10px] text-[#B4B6B7] block">Window:</span>
                  <span className="font-semibold text-[#292D32] dark:text-zinc-200">
                    {order.timeWindow ? `${order.timeWindow.start} - ${order.timeWindow.end}` : 'Anytime'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#B4B6B7] block">Weight:</span>
                  <span className="font-semibold text-[#292D32] dark:text-zinc-200">{order.weightKg} kg</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>{getStatusBadge(order.status)}</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditOrder(order);
                    }}
                    className="px-3.5 py-1.5 bg-[#F7F8F7] hover:bg-[#E8F6F1] dark:bg-[#292D32] text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-bold transition"
                  >
                    View / Edit
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 2. Desktop Table View (Requirement #18: Clean table on desktop) */}
      <div className="hidden lg:block bg-white dark:bg-[#33383F] border border-[#EAECEA] dark:border-[#495059] rounded-3xl overflow-hidden shadow-card">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-[#B4B6B7] space-y-2">
            <Package className="w-10 h-10 mx-auto text-zinc-400" />
            <div className="font-semibold text-xs">No orders matching filter criteria</div>
          </div>
        ) : (
          <table className="w-full text-left text-xs text-zinc-700 dark:text-zinc-300">
            <thead className="bg-[#F7F8F7] dark:bg-[#292D32] text-[#B4B6B7] font-bold border-b border-[#EAECEA] dark:border-[#495059] uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Order & Customer</th>
                <th className="py-3.5 px-4">Address (Tumakuru)</th>
                <th className="py-3.5 px-4">Time Window</th>
                <th className="py-3.5 px-4">Weight</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAECEA] dark:divide-[#495059]">
              {filteredOrders.map((order) => {
                const isSelected = selectedOrderId === order.id;
                return (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`hover:bg-[#E8F6F1]/50 dark:hover:bg-[#292D32] transition cursor-pointer ${
                      isSelected ? 'bg-[#E8F6F1] dark:bg-[#168E6A]/20' : ''
                    }`}
                  >
                    {/* Order & Customer */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#292D32] dark:text-white text-xs">{order.orderNumber}</span>
                        {order.isLocked && <span title="Locked Stop Position" className="text-xs">🔒</span>}
                      </div>
                      <div className="font-medium text-[#292D32] dark:text-white">{order.customer.name}</div>
                      <div className="text-[11px] text-[#B4B6B7] flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-[#168E6A]" />
                        <span>{order.customer.phone}</span>
                      </div>
                    </td>

                    {/* Address */}
                    <td className="py-3 px-4 max-w-[220px]">
                      <div className="truncate text-[#292D32] dark:text-zinc-200" title={order.customer.address}>
                        {order.customer.address}
                      </div>
                      <div className="text-[10px] text-[#B4B6B7]">{order.category}</div>
                    </td>

                    {/* Window */}
                    <td className="py-3 px-4">
                      {order.timeWindow ? (
                        <div className="flex items-center gap-1 text-zinc-800 dark:text-zinc-200 font-medium">
                          <Clock className="w-3.5 h-3.5 text-[#168E6A]" />
                          <span>{order.timeWindow.start} - {order.timeWindow.end}</span>
                        </div>
                      ) : (
                        <span className="text-[#B4B6B7] italic">Anytime</span>
                      )}
                      <div className="text-[10px] text-[#B4B6B7]">
                        {order.serviceTimeMinutes}m service stop
                      </div>
                    </td>

                    {/* Weight */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#292D32] dark:text-zinc-100">{order.weightKg} kg</div>
                      {order.isFragile && <div className="text-[10px] text-[#C47D1A] font-bold">Fragile</div>}
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-4">{getPriorityBadge(order.priority)}</td>

                    {/* Status */}
                    <td className="py-3 px-4">{getStatusBadge(order.status)}</td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLockStop(order.id);
                          }}
                          className="p-1.5 rounded-xl border border-[#EAECEA] dark:border-[#495059] bg-white dark:bg-[#292D32] text-[#B4B6B7] hover:text-[#292D32] dark:hover:text-white"
                          title={order.isLocked ? 'Unlock Stop' : 'Lock Stop'}
                        >
                          {order.isLocked ? <Lock className="w-3.5 h-3.5 text-[#FBB03B]" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditOrder(order);
                          }}
                          className="p-1.5 rounded-xl border border-[#EAECEA] dark:border-[#495059] bg-white dark:bg-[#292D32] text-[#B4B6B7] hover:text-[#292D32] dark:hover:text-white"
                          title="Edit Order"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete order #${order.orderNumber}?`)) {
                              deleteOrder(order.id);
                            }
                          }}
                          className="p-1.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-rose-600 hover:bg-rose-100"
                          title="Delete Order"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
