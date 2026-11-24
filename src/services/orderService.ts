import { supabase, isSupabaseConfigured } from './supabase';
import { Order, Customer, OrderPriority, OrderStatus } from '../types';

let cachedBusinessId: string | null = null;

/**
 * Resolves or fetches the active business UUID in Supabase
 */
export async function getActiveBusinessId(): Promise<string | null> {
  if (cachedBusinessId) return cachedBusinessId;
  if (!supabase || !isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('id')
      .limit(1);

    if (error) {
      console.warn('Error fetching business ID from Supabase:', error.message);
      return null;
    }

    if (data && data.length > 0) {
      cachedBusinessId = data[0].id;
      return cachedBusinessId;
    }

    // If no business exists yet, create default
    const { data: newBiz, error: createError } = await supabase
      .from('businesses')
      .insert({
        name: 'Sweet Delights Bakery',
        category: 'food_beverage',
        type: 'bakery',
        depot_name: 'Main Depot',
        depot_address: 'MG Road, Tumakuru, Karnataka',
        depot_lat: 13.3409,
        depot_lng: 77.1012,
      })
      .select('id')
      .single();

    if (!createError && newBiz) {
      cachedBusinessId = newBiz.id;
      return cachedBusinessId;
    }
  } catch (err) {
    console.warn('getActiveBusinessId exception:', err);
  }

  return null;
}

/**
 * Maps a raw Supabase order row (with joined customer) to the frontend Order interface
 */
export function mapRowToOrder(row: any): Order {
  const cust = row.customer || {};
  return {
    id: row.id,
    orderNumber: row.order_number,
    category: row.category || 'General',
    weightKg: parseFloat(row.weight_kg) || 1.0,
    volumeM3: row.volume_m3 ? parseFloat(row.volume_m3) : 0.02,
    packageCount: row.package_count || 1,
    priority: (['critical', 'high', 'normal', 'flexible'].includes(row.priority)
      ? row.priority
      : 'normal') as OrderPriority,
    timeWindow: row.time_window_start && row.time_window_end
      ? { start: row.time_window_start, end: row.time_window_end }
      : undefined,
    deadline: row.deadline || undefined,
    serviceTimeMinutes: row.service_time_minutes || 4,
    isFragile: Boolean(row.is_fragile),
    isTemperatureSensitive: Boolean(row.is_temperature_sensitive),
    specialInstructions: row.special_instructions || undefined,
    assignedDriverId: row.assigned_driver_id || undefined,
    assignedVehicleId: row.assigned_vehicle_id || undefined,
    status: (row.status || 'pending') as OrderStatus,
    isLocked: Boolean(row.is_locked),
    lockedPosition: row.locked_position || undefined,
    failureReason: row.failure_reason || undefined,
    failureNotes: row.failure_notes || undefined,
    rescheduledDate: row.rescheduled_date || undefined,
    completedAt: row.completed_at || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    customer: {
      id: cust.id || row.customer_id || `cust-${Date.now()}`,
      name: cust.name || 'Customer',
      phone: cust.phone || '',
      email: cust.email || '',
      address: cust.address || 'Tumakuru, Karnataka',
      lat: typeof cust.lat === 'number' ? cust.lat : 13.3409,
      lng: typeof cust.lng === 'number' ? cust.lng : 77.1012,
    },
  };
}

/**
 * Fetches all orders from Supabase with joined customer details
 */
export async function fetchOrdersFromSupabase(): Promise<Order[]> {
  if (!supabase || !isSupabaseConfigured) return [];

  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        business_id,
        order_number,
        customer_id,
        category,
        weight_kg,
        volume_m3,
        package_count,
        priority,
        time_window_start,
        time_window_end,
        deadline,
        service_time_minutes,
        is_fragile,
        is_temperature_sensitive,
        special_instructions,
        assigned_driver_id,
        assigned_vehicle_id,
        status,
        is_locked,
        locked_position,
        failure_reason,
        failure_notes,
        rescheduled_date,
        completed_at,
        created_at,
        updated_at,
        customer:customers (
          id,
          name,
          phone,
          email,
          address,
          lat,
          lng
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Failed to fetch orders from Supabase:', error.message);
      return [];
    }

    if (!data) return [];
    return data.map(mapRowToOrder);
  } catch (err) {
    console.warn('fetchOrdersFromSupabase exception:', err);
    return [];
  }
}

/**
 * Fetches a single order by ID with joined customer
 */
export async function fetchOrderById(orderId: string): Promise<Order | null> {
  if (!supabase || !isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers (*)
      `)
      .eq('id', orderId)
      .single();

    if (error || !data) return null;
    return mapRowToOrder(data);
  } catch {
    return null;
  }
}

/**
 * Inserts a customer and an order into Supabase
 */
export async function insertOrderToSupabase(
  orderInput: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Order | null> {
  if (!supabase || !isSupabaseConfigured) return null;

  try {
    const businessId = await getActiveBusinessId();

    // 1. Insert customer into public.customers
    let customerId: string | null = null;
    const cust = orderInput.customer;

    const { data: custData, error: custError } = await supabase
      .from('customers')
      .insert({
        business_id: businessId,
        name: cust.name,
        phone: cust.phone || '',
        email: cust.email || null,
        address: cust.address,
        lat: cust.lat,
        lng: cust.lng,
      })
      .select('id')
      .single();

    if (custError) {
      console.warn('Failed to insert customer into Supabase:', custError.message);
    } else if (custData) {
      customerId = custData.id;
    }

    // 2. Insert order into public.orders
    const orderPayload: Record<string, any> = {
      order_number: orderInput.orderNumber,
      category: orderInput.category || 'General',
      weight_kg: orderInput.weightKg,
      volume_m3: orderInput.volumeM3 || 0.02,
      package_count: orderInput.packageCount || 1,
      priority: orderInput.priority || 'normal',
      time_window_start: orderInput.timeWindow?.start || null,
      time_window_end: orderInput.timeWindow?.end || null,
      deadline: orderInput.deadline || null,
      service_time_minutes: orderInput.serviceTimeMinutes || 4,
      is_fragile: !!orderInput.isFragile,
      is_temperature_sensitive: !!orderInput.isTemperatureSensitive,
      special_instructions: orderInput.specialInstructions || null,
      status: orderInput.status || 'pending',
      is_locked: !!orderInput.isLocked,
    };

    if (businessId) orderPayload.business_id = businessId;
    if (customerId) orderPayload.customer_id = customerId;

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert(orderPayload)
      .select(`
        *,
        customer:customers (*)
      `)
      .single();

    if (orderError) {
      console.error('Failed to insert order into Supabase:', orderError.message);
      return null;
    }

    return mapRowToOrder(orderData);
  } catch (err) {
    console.error('insertOrderToSupabase exception:', err);
    return null;
  }
}

/**
 * Updates an order in Supabase
 */
export async function updateOrderInSupabase(
  orderId: string,
  updates: Partial<Order>
): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) return false;

  try {
    const dbUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.orderNumber !== undefined) dbUpdates.order_number = updates.orderNumber;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.weightKg !== undefined) dbUpdates.weight_kg = updates.weightKg;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.isLocked !== undefined) dbUpdates.is_locked = updates.isLocked;
    if (updates.lockedPosition !== undefined) dbUpdates.locked_position = updates.lockedPosition;
    if (updates.failureReason !== undefined) dbUpdates.failure_reason = updates.failureReason;
    if (updates.failureNotes !== undefined) dbUpdates.failure_notes = updates.failureNotes;
    if (updates.rescheduledDate !== undefined) dbUpdates.rescheduled_date = updates.rescheduledDate;
    if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;
    if (updates.assignedDriverId !== undefined) dbUpdates.assigned_driver_id = updates.assignedDriverId;
    if (updates.assignedVehicleId !== undefined) dbUpdates.assigned_vehicle_id = updates.assignedVehicleId;

    if (updates.timeWindow !== undefined) {
      dbUpdates.time_window_start = updates.timeWindow?.start || null;
      dbUpdates.time_window_end = updates.timeWindow?.end || null;
    }

    // Only update if it's a valid UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    if (!isUUID) return false;

    const { error } = await supabase
      .from('orders')
      .update(dbUpdates)
      .eq('id', orderId);

    if (error) {
      console.warn('Failed to update order in Supabase:', error.message);
      return false;
    }

    // If customer details were updated, update customers table
    if (updates.customer && isUUID) {
      const { data: orderRow } = await supabase
        .from('orders')
        .select('customer_id')
        .eq('id', orderId)
        .single();

      if (orderRow?.customer_id) {
        await supabase
          .from('customers')
          .update({
            name: updates.customer.name,
            phone: updates.customer.phone,
            email: updates.customer.email,
            address: updates.customer.address,
            lat: updates.customer.lat,
            lng: updates.customer.lng,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderRow.customer_id);
      }
    }

    return true;
  } catch (err) {
    console.warn('updateOrderInSupabase exception:', err);
    return false;
  }
}

/**
 * Deletes an order from Supabase
 */
export async function deleteOrderFromSupabase(orderId: string): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) return false;

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
  if (!isUUID) return false;

  try {
    const { error } = await supabase.from('orders').delete().eq('id', orderId);
    if (error) {
      console.warn('Failed to delete order from Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('deleteOrderFromSupabase exception:', err);
    return false;
  }
}

/**
 * Sets up a Realtime subscription on the orders table
 */
export function subscribeToRealtimeOrders(
  onInsert: (order: Order) => void,
  onUpdate: (order: Order) => void,
  onDelete: (deletedId: string) => void
): () => void {
  if (!supabase || !isSupabaseConfigured) return () => {};

  const channel = supabase
    .channel('public:orders_feed')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'orders' },
      async (payload) => {
        if (payload.new && payload.new.id) {
          const fullOrder = await fetchOrderById(payload.new.id);
          if (fullOrder) {
            onInsert(fullOrder);
          }
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'orders' },
      async (payload) => {
        if (payload.new && payload.new.id) {
          const fullOrder = await fetchOrderById(payload.new.id);
          if (fullOrder) {
            onUpdate(fullOrder);
          }
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'orders' },
      (payload) => {
        if (payload.old && payload.old.id) {
          onDelete(payload.old.id);
        }
      }
    )
    .subscribe((status) => {
      console.log('Supabase orders realtime status:', status);
    });

  return () => {
    if (supabase) {
      supabase.removeChannel(channel);
    }
  };
}
