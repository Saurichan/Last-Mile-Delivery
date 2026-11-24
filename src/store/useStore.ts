import { create } from 'zustand';
import {
  Business,
  BusinessType,
  Order,
  Driver,
  Vehicle,
  RoutePlan,
  OptimizationRun,
  UserRole,
  CookiePreferences,
  ProofOfDelivery,
  BusinessRules,
  UserProfile,
  BakeryProduct,
  Customer,
} from '../types';
import {
  DEFAULT_BUSINESS,
  DEFAULT_USER_PROFILE,
  DEFAULT_VEHICLES,
  INITIAL_DRIVERS,
  INITIAL_ORDERS,
  INITIAL_OPTIMIZATION_HISTORY,
  INITIAL_PRODUCTS,
  DEMO_BUSINESSES,
  DEMO_ORDERS_BY_BIZ,
} from '../data/demoData';
import { getDefaultRulesForType } from '../services/businessRules';
import { optimizeRoute } from '../services/optimizer/optimizer';
import { calculateSavingsComparison } from '../services/costCalculator';
import { trackEvent, supabase, isSupabaseConfigured } from '../services/supabase';
import {
  fetchOrdersFromSupabase,
  insertOrderToSupabase,
  updateOrderInSupabase,
  deleteOrderFromSupabase,
} from '../services/orderService';

interface DriverSimulationState {
  isPlaying: boolean;
  progressPercent: number; // 0 to 100
  speedMultiplier: number; // 1x, 2x, 4x
  currentLat: number;
  currentLng: number;
  currentStopIndex: number; // 0 = depot, 1..N = stops
}

interface AppStore {
  // User Profile
  userProfile: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => void;

  // Business
  business: Business;
  setBusiness: (business: Business) => void;
  setBusinessType: (type: BusinessType) => void;
  updateBusinessRules: (rules: Partial<BusinessRules>) => void;

  // Bakery Products Catalog
  products: BakeryProduct[];
  addProduct: (product: Omit<BakeryProduct, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<BakeryProduct>) => void;
  deleteProduct: (id: string) => void;
  toggleProductAvailability: (id: string) => void;

  // Customers
  customers: Customer[];
  addCustomer: (customer: Customer) => void;

  // Fleet & Orders
  orders: Order[];
  drivers: Driver[];
  vehicles: Vehicle[];
  selectedVehicleId: string;
  setSelectedVehicleId: (id: string) => void;
  selectedOrderId: string | null;
  setSelectedOrderId: (id: string | null) => void;

  // Driver CRUD
  addDriver: (driver: Omit<Driver, 'id'>) => void;
  updateDriver: (id: string, updates: Partial<Driver>) => void;
  deleteDriver: (id: string) => void;

  // Order CRUD
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  cancelOrder: (id: string) => void;
  toggleLockStop: (orderId: string) => void;
  rescheduleOrder: (orderId: string, newDate: string, newTimeWindow?: { start: string; end: string }) => void;
  markOrderDelivered: (orderId: string, pod: ProofOfDelivery) => void;
  markOrderFailed: (orderId: string, reason: string, notes?: string, rescheduleDate?: string) => void;

  // Supabase Order Synchronization
  isSyncingOrders: boolean;
  syncOrdersFromSupabase: () => Promise<void>;
  upsertRealtimeOrder: (order: Order) => void;
  removeRealtimeOrder: (id: string) => void;

  // Route Optimization
  currentRoutePlan: RoutePlan | null;
  isOptimizing: boolean;
  optimizationHistory: OptimizationRun[];
  runOptimization: (algorithm?: 'two_opt' | 'nearest_neighbor' | 'genetic' | 'manual') => Promise<RoutePlan>;
  reoptimizeRemainingRoute: (reason?: string) => Promise<RoutePlan | null>;

  // Simulation & Driver cockpit
  driverSim: DriverSimulationState;
  startSimulation: () => void;
  pauseSimulation: () => void;
  resetSimulation: () => void;
  setSimulationSpeed: (speed: number) => void;
  advanceSimulationStep: () => void;

  // Express mid-route insertion
  addExpressOrder: () => Promise<Order>;

  // Role & Theme & Auth
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
  loginAs: (profile: Partial<UserProfile>, role: UserRole) => void;
  logout: () => void;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  setThemeMode: (theme: 'dark' | 'light') => void;

  // Compliance
  cookiePreferences: CookiePreferences;
  setCookiePreferences: (prefs: Partial<CookiePreferences>) => void;

  // Clean data management
  clearAllOrders: () => void;
}

const LOCAL_STORAGE_KEY = 'last_mile_optimizer_prod_v3';

// Initial state loader with localStorage persistence
function getInitialState() {
  const defaultBiz = DEFAULT_BUSINESS;
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const business =
          parsed.business &&
          parsed.business.depot &&
          typeof parsed.business.depot.lat === 'number' &&
          typeof parsed.business.depot.lng === 'number' &&
          parsed.business.rules
            ? parsed.business
            : defaultBiz;

        const rawOrders = Array.isArray(parsed.orders) ? parsed.orders : INITIAL_ORDERS;
        const validOrders = rawOrders.filter(
          (o: any) => o && o.customer && typeof o.customer.lat === 'number' && typeof o.customer.lng === 'number'
        );
        const orders = validOrders.length > 0 ? validOrders : INITIAL_ORDERS;
        const products = Array.isArray(parsed.products) && parsed.products.length > 0
          ? parsed.products
          : INITIAL_PRODUCTS;
        const customers = Array.isArray(parsed.customers) ? parsed.customers : [];
        const drivers = Array.isArray(parsed.drivers) ? parsed.drivers : INITIAL_DRIVERS;
        const vehicles = Array.isArray(parsed.vehicles) && parsed.vehicles.length > 0
          ? parsed.vehicles
          : DEFAULT_VEHICLES;
        const optimizationHistory = Array.isArray(parsed.optimizationHistory)
          ? parsed.optimizationHistory
          : INITIAL_OPTIMIZATION_HISTORY;

        const rawProfile = parsed.userProfile || DEFAULT_USER_PROFILE;
        const userProfile = {
          ...DEFAULT_USER_PROFILE,
          ...rawProfile,
          name: rawProfile.name === 'Ranjitha' ? '' : (rawProfile.name || ''),
          email: rawProfile.email === 'ranjitha@sweetdelights.in' ? '' : (rawProfile.email || ''),
        };
        const selectedVehicleId = parsed.selectedVehicleId || 'veh-1';
        const activeRole = parsed.activeRole || 'admin';
        const isAuthenticated = typeof parsed.isAuthenticated === 'boolean' ? parsed.isAuthenticated : true;

        return {
          userProfile,
          business,
          products,
          customers,
          orders,
          drivers,
          vehicles,
          selectedVehicleId,
          optimizationHistory,
          activeRole,
          isAuthenticated,
        };
      }
    }
  } catch (e) {
    console.warn('Failed to parse local storage state', e);
  }

  return {
    userProfile: DEFAULT_USER_PROFILE,
    business: defaultBiz,
    products: INITIAL_PRODUCTS,
    customers: [],
    orders: INITIAL_ORDERS,
    drivers: INITIAL_DRIVERS,
    vehicles: DEFAULT_VEHICLES,
    selectedVehicleId: 'veh-1',
    optimizationHistory: INITIAL_OPTIMIZATION_HISTORY,
    activeRole: 'admin' as UserRole,
    isAuthenticated: true,
  };
}

const initial = getInitialState();

export const useStore = create<AppStore>((set, get) => ({
  userProfile: initial.userProfile,
  business: initial.business,
  products: initial.products,
  customers: initial.customers,
  orders: initial.orders,
  drivers: initial.drivers,
  vehicles: initial.vehicles,
  selectedVehicleId: initial.selectedVehicleId,
  optimizationHistory: initial.optimizationHistory,
  selectedOrderId: null,
  currentRoutePlan: null,
  isOptimizing: false,
  isAuthenticated: initial.isAuthenticated,
  activeRole: initial.activeRole,
  theme: 'light',

  setIsAuthenticated: (val: boolean) => set({ isAuthenticated: val }),

  loginAs: (profileUpdates: Partial<UserProfile>, role: UserRole) => {
    set((state) => {
      const updatedProfile = { ...state.userProfile, ...profileUpdates, role };
      // Also register into customers table if customer role
      let updatedCustomers = state.customers;
      if (role === 'customer' && updatedProfile.name) {
        const existingIdx = updatedCustomers.findIndex(
          (c) => (updatedProfile.id && c.id === updatedProfile.id) || (updatedProfile.email && c.email === updatedProfile.email)
        );
        if (existingIdx === -1) {
          updatedCustomers = [
            ...updatedCustomers,
            {
              id: updatedProfile.id || `cust-${Date.now()}`,
              name: updatedProfile.name,
              phone: updatedProfile.phone || '',
              email: updatedProfile.email || '',
              address: updatedProfile.address || `${updatedProfile.city || 'Tumakuru'}, ${updatedProfile.state || 'Karnataka'}`,
              lat: state.business.depot.lat + 0.005,
              lng: state.business.depot.lng + 0.005,
            },
          ];
        }
      }

      return {
        userProfile: updatedProfile,
        activeRole: role,
        isAuthenticated: true,
        customers: updatedCustomers,
      };
    });
  },

  logout: () => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.signOut();
    }
    set({
      isAuthenticated: false,
      userProfile: DEFAULT_USER_PROFILE,
      activeRole: 'admin',
    });
  },

  driverSim: {
    isPlaying: false,
    progressPercent: 0,
    speedMultiplier: 1,
    currentLat: initial.business?.depot?.lat ?? 13.3409,
    currentLng: initial.business?.depot?.lng ?? 77.1012,
    currentStopIndex: 0,
  },

  cookiePreferences: {
    essential: true,
    analytics: true,
    optional: false,
    hasConsented: true,
  },

  updateUserProfile: (profileUpdates) => {
    set((state) => ({
      userProfile: { ...state.userProfile, ...profileUpdates },
    }));
  },

  // Products CRUD
  addProduct: (productData) => {
    const newProduct: BakeryProduct = {
      ...productData,
      id: `prod-${Date.now()}`,
    };
    set((state) => ({ products: [newProduct, ...state.products] }));
  },

  updateProduct: (id, updates) => {
    set((state) => ({
      products: state.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  },

  deleteProduct: (id) => {
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    }));
  },

  toggleProductAvailability: (id) => {
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id ? { ...p, isAvailable: !p.isAvailable } : p
      ),
    }));
  },

  // Customer Management
  addCustomer: (customer) => {
    set((state) => {
      const exists = state.customers.some((c) => c.id === customer.id || (customer.phone && c.phone === customer.phone));
      if (exists) return state;
      return { customers: [customer, ...state.customers] };
    });
  },

  // Driver Management
  addDriver: (driverData) => {
    const newDriver: Driver = {
      ...driverData,
      id: `driver-${Date.now()}`,
    };
    set((state) => ({ drivers: [newDriver, ...state.drivers] }));
  },

  updateDriver: (id, updates) => {
    set((state) => ({
      drivers: state.drivers.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    }));
  },

  deleteDriver: (id) => {
    set((state) => ({
      drivers: state.drivers.filter((d) => d.id !== id),
    }));
  },

  setSelectedVehicleId: (id) => {
    set({ selectedVehicleId: id });
    if (get().currentRoutePlan) {
      get().runOptimization();
    }
  },

  setSelectedOrderId: (id) => set({ selectedOrderId: id }),

  setBusiness: (business) => {
    set({ business });
    trackEvent('business_created', { name: business.name, type: business.type });
  },

  setBusinessType: (type: BusinessType) => {
    const preset = DEMO_BUSINESSES[type];
    const defaultRules = getDefaultRulesForType(type);
    const updatedBiz: Business = preset
      ? { ...preset, rules: defaultRules }
      : {
          ...get().business,
          type,
          rules: defaultRules,
        };

    const newOrders = (DEMO_ORDERS_BY_BIZ && DEMO_ORDERS_BY_BIZ[type])
      ? DEMO_ORDERS_BY_BIZ[type]
      : get().orders;

    // Update user profile with new business details
    const currentUserProfile = get().userProfile;
    const updatedProfile: UserProfile = {
      ...currentUserProfile,
      businessType: type,
      businessName: updatedBiz.name,
      businessLocation: updatedBiz.depot.address || 'Tumakuru, Karnataka',
      city: 'Tumakuru',
      state: 'Karnataka',
    };

    set({
      business: updatedBiz,
      orders: newOrders,
      userProfile: updatedProfile,
      currentRoutePlan: null,
      selectedOrderId: null,
    });

    trackEvent('business_created', { name: updatedBiz.name, type: updatedBiz.type });

    // Automatically re-run optimization for the new business type's orders
    setTimeout(() => {
      get().runOptimization();
    }, 50);
  },

  updateBusinessRules: (newRules) => {
    const biz = get().business;
    const updatedBiz: Business = {
      ...biz,
      rules: { ...biz.rules, ...newRules },
    };
    set({ business: updatedBiz });
  },

  addOrder: (orderData) => {
    const tempId = `ord-${Date.now()}`;
    const newOrder: Order = {
      ...orderData,
      id: tempId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => {
      // Auto register customer if new
      let updatedCustomers = state.customers;
      if (newOrder.customer && newOrder.customer.name) {
        const exists = updatedCustomers.some(
          (c) => (newOrder.customer.id && c.id === newOrder.customer.id) ||
                 (newOrder.customer.phone && c.phone === newOrder.customer.phone)
        );
        if (!exists) {
          updatedCustomers = [newOrder.customer, ...updatedCustomers];
        }
      }
      return {
        orders: [newOrder, ...state.orders],
        customers: updatedCustomers,
      };
    });

    trackEvent('order_created', { orderNumber: newOrder.orderNumber, category: newOrder.category });

    // Persist to Supabase asynchronously and replace local tempId with official UUID
    insertOrderToSupabase(orderData)
      .then((persistedOrder) => {
        if (persistedOrder) {
          set((state) => ({
            orders: state.orders.map((o) => (o.id === tempId ? persistedOrder : o)),
            selectedOrderId: state.selectedOrderId === tempId ? persistedOrder.id : state.selectedOrderId,
          }));
        }
      })
      .catch((err) => {
        console.warn('Background Supabase order insert failed:', err);
      });
  },

  updateOrder: (id, updates) => {
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === id ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o
      ),
    }));
    trackEvent('order_updated', { orderId: id, updates });
    updateOrderInSupabase(id, updates).catch((err) => {
      console.warn('Background Supabase order update failed:', err);
    });
  },

  deleteOrder: (id) => {
    set((state) => ({
      orders: state.orders.filter((o) => o.id !== id),
      selectedOrderId: state.selectedOrderId === id ? null : state.selectedOrderId,
    }));
    deleteOrderFromSupabase(id).catch((err) => {
      console.warn('Background Supabase order delete failed:', err);
    });
  },

  cancelOrder: (id) => {
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === id ? { ...o, status: 'cancelled' as const, updatedAt: new Date().toISOString() } : o
      ),
    }));
    trackEvent('order_updated', { orderId: id, status: 'cancelled' });
    updateOrderInSupabase(id, { status: 'cancelled' }).catch((err) => {
      console.warn('Background Supabase order cancellation failed:', err);
    });
  },

  clearAllOrders: () => {
    set({
      orders: [],
      currentRoutePlan: null,
      selectedOrderId: null,
      optimizationHistory: [],
    });
  },

  toggleLockStop: (orderId) => {
    const target = get().orders.find((o) => o.id === orderId);
    const newLockedState = target ? !target.isLocked : true;

    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, isLocked: !o.isLocked } : o
      ),
    }));
    updateOrderInSupabase(orderId, { isLocked: newLockedState }).catch((err) => {
      console.warn('Background Supabase order lock update failed:', err);
    });
  },

  rescheduleOrder: (orderId, newDate, newTimeWindow) => {
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'rescheduled',
              rescheduledDate: newDate,
              timeWindow: newTimeWindow || o.timeWindow,
              updatedAt: new Date().toISOString(),
            }
          : o
      ),
    }));
    updateOrderInSupabase(orderId, {
      status: 'rescheduled',
      rescheduledDate: newDate,
      timeWindow: newTimeWindow,
    }).catch((err) => {
      console.warn('Background Supabase order reschedule failed:', err);
    });
  },

  markOrderDelivered: (orderId, pod) => {
    const completedAt = new Date().toISOString();
    set((state) => {
      const updatedOrders = state.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'delivered' as const,
              completedAt,
              pod,
              updatedAt: completedAt,
            }
          : o
      );

      let updatedRoute = state.currentRoutePlan;
      if (updatedRoute) {
        updatedRoute = {
          ...updatedRoute,
          stops: updatedRoute.stops.map((s) =>
            s.orderId === orderId ? { ...s, isCompleted: true } : s
          ),
        };
      }

      return { orders: updatedOrders, currentRoutePlan: updatedRoute };
    });
    trackEvent('delivery_completed', { orderId });
    updateOrderInSupabase(orderId, {
      status: 'delivered',
      completedAt,
    }).catch((err) => {
      console.warn('Background Supabase order delivered update failed:', err);
    });
  },

  markOrderFailed: (orderId, reason, notes, rescheduleDate) => {
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'failed' as const,
              failureReason: reason,
              failureNotes: notes,
              rescheduledDate: rescheduleDate,
              updatedAt: new Date().toISOString(),
            }
          : o
      ),
    }));
    trackEvent('delivery_failed', { orderId, reason });
    updateOrderInSupabase(orderId, {
      status: 'failed',
      failureReason: reason,
      failureNotes: notes,
      rescheduledDate: rescheduleDate,
    }).catch((err) => {
      console.warn('Background Supabase order failed update failed:', err);
    });
  },

  // Supabase Order Synchronization
  isSyncingOrders: false,

  syncOrdersFromSupabase: async () => {
    set({ isSyncingOrders: true });
    try {
      const dbOrders = await fetchOrdersFromSupabase();
      if (dbOrders && dbOrders.length > 0) {
        set((state) => {
          // Merge customers
          const customerMap = new Map<string, Customer>();
          state.customers.forEach((c) => customerMap.set(c.id, c));
          dbOrders.forEach((o) => {
            if (o.customer && o.customer.id) {
              customerMap.set(o.customer.id, o.customer);
            }
          });

          return {
            orders: dbOrders,
            customers: Array.from(customerMap.values()),
            isSyncingOrders: false,
          };
        });
      } else {
        set({ isSyncingOrders: false });
      }
    } catch (err) {
      console.warn('syncOrdersFromSupabase error:', err);
      set({ isSyncingOrders: false });
    }
  },

  upsertRealtimeOrder: (order: Order) => {
    set((state) => {
      const exists = state.orders.some(
        (o) => o.id === order.id || o.orderNumber === order.orderNumber
      );
      let updatedOrders: Order[];
      if (exists) {
        updatedOrders = state.orders.map((o) =>
          o.id === order.id || o.orderNumber === order.orderNumber ? { ...o, ...order } : o
        );
      } else {
        updatedOrders = [order, ...state.orders];
      }

      let updatedCustomers = state.customers;
      if (order.customer && !updatedCustomers.some((c) => c.id === order.customer.id)) {
        updatedCustomers = [order.customer, ...updatedCustomers];
      }

      return {
        orders: updatedOrders,
        customers: updatedCustomers,
      };
    });
  },

  removeRealtimeOrder: (id: string) => {
    set((state) => ({
      orders: state.orders.filter((o) => o.id !== id),
      selectedOrderId: state.selectedOrderId === id ? null : state.selectedOrderId,
    }));
  },

  runOptimization: async (algorithm = 'two_opt') => {
    set({ isOptimizing: true });
    const { business, orders, vehicles, selectedVehicleId } = get();

    const activeOrders = orders.filter(
      (o) => o.status !== 'delivered' && o.status !== 'cancelled'
    );

    if (activeOrders.length === 0) {
      set({ isOptimizing: false, currentRoutePlan: null });
      return null as any;
    }

    const vehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

    try {
      const plan = await optimizeRoute(business, activeOrders, vehicle, { algorithm });
      const savings = calculateSavingsComparison(plan.originalMetrics, plan.metrics);

      const run: OptimizationRun = {
        id: `run-${Date.now()}`,
        timestamp: new Date().toISOString(),
        businessType: business.type,
        orderCount: activeOrders.length,
        algorithmUsed: algorithm,
        beforeDistanceKm: plan.originalMetrics?.totalDistanceKm || plan.metrics.totalDistanceKm,
        afterDistanceKm: plan.metrics.totalDistanceKm,
        distanceSavedKm: savings.distanceSavedKm,
        percentDistanceSaved: savings.percentDistanceSaved,
        beforeDurationMin: plan.originalMetrics?.totalDurationMin || plan.metrics.totalDurationMin,
        afterDurationMin: plan.metrics.totalDurationMin,
        timeSavedMin: savings.timeSavedMin,
        beforeLateCount: plan.originalMetrics?.lateOrdersCount || 0,
        afterLateCount: plan.metrics.lateOrdersCount,
        beforeCost: plan.originalMetrics?.estimatedTotalCost || plan.metrics.estimatedTotalCost,
        afterCost: plan.metrics.estimatedTotalCost,
        costSaved: savings.costSaved,
        fuelSavedLiters: savings.fuelSavedLiters,
        co2SavedKg: savings.co2SavedKg,
        score: plan.metrics.totalScore,
      };

      set((state) => ({
        currentRoutePlan: plan,
        isOptimizing: false,
        optimizationHistory: [run, ...state.optimizationHistory],
        driverSim: {
          ...state.driverSim,
          currentLat: business.depot.lat,
          currentLng: business.depot.lng,
          currentStopIndex: 0,
          progressPercent: 0,
          isPlaying: false,
        },
      }));

      trackEvent('route_optimized', { algorithm, stopsCount: activeOrders.length });
      return plan;
    } catch (err) {
      console.error('Route optimization error:', err);
      set({ isOptimizing: false });
      throw err;
    }
  },

  reoptimizeRemainingRoute: async () => {
    const { business, orders, vehicles, selectedVehicleId, currentRoutePlan } = get();
    if (!currentRoutePlan) return null;

    set({ isOptimizing: true });
    const remainingOrders = orders.filter(
      (o) => o.status !== 'delivered' && o.status !== 'cancelled'
    );

    if (remainingOrders.length === 0) {
      set({ isOptimizing: false, currentRoutePlan: null });
      return null;
    }

    const vehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

    try {
      const plan = await optimizeRoute(business, remainingOrders, vehicle, {
        algorithm: 'two_opt',
      });
      set({ currentRoutePlan: plan, isOptimizing: false });
      trackEvent('route_reoptimized', { remainingCount: remainingOrders.length });
      return plan;
    } catch (e) {
      console.error('Dynamic re-optimization error:', e);
      set({ isOptimizing: false });
      return null;
    }
  },

  startSimulation: () => {
    set((state) => ({
      driverSim: { ...state.driverSim, isPlaying: true },
    }));
  },

  pauseSimulation: () => {
    set((state) => ({
      driverSim: { ...state.driverSim, isPlaying: false },
    }));
  },

  resetSimulation: () => {
    const { business } = get();
    set((state) => ({
      driverSim: {
        isPlaying: false,
        progressPercent: 0,
        speedMultiplier: 1,
        currentLat: business.depot.lat,
        currentLng: business.depot.lng,
        currentStopIndex: 0,
      },
    }));
  },

  setSimulationSpeed: (speed) => {
    set((state) => ({
      driverSim: { ...state.driverSim, speedMultiplier: speed },
    }));
  },

  advanceSimulationStep: () => {
    const { currentRoutePlan, driverSim } = get();
    if (!currentRoutePlan || currentRoutePlan.stops.length === 0) return;

    const geom = currentRoutePlan.roadGeometry;
    if (!geom || geom.length === 0) return;

    const nextPercent = Math.min(100, driverSim.progressPercent + 2 * driverSim.speedMultiplier);
    const pointIndex = Math.min(
      geom.length - 1,
      Math.floor((nextPercent / 100) * (geom.length - 1))
    );

    const [nextLat, nextLng] = geom[pointIndex];
    const stopInterval = 100 / Math.max(1, currentRoutePlan.stops.length);
    const stopIdx = Math.min(
      currentRoutePlan.stops.length,
      Math.floor(nextPercent / stopInterval)
    );

    set({
      driverSim: {
        ...driverSim,
        progressPercent: nextPercent,
        currentLat: nextLat,
        currentLng: nextLng,
        currentStopIndex: stopIdx,
        isPlaying: nextPercent < 100,
      },
    });
  },

  addExpressOrder: async () => {
    const { business } = get();
    const tempId = `ord-express-${Date.now()}`;
    const expressOrder: Order = {
      id: tempId,
      orderNumber: `EXP-${Math.floor(100 + Math.random() * 900)}`,
      customer: {
        id: `cust-exp-${Date.now()}`,
        name: 'Express Customer',
        phone: '+91 98450 00000',
        address: 'Express Delivery Stop, Tumakuru',
        lat: business.depot.lat + (Math.random() - 0.5) * 0.02,
        lng: business.depot.lng + (Math.random() - 0.5) * 0.02,
      },
      category: 'Rush Bakery Order',
      weightKg: 1.5,
      priority: 'critical',
      timeWindow: {
        start: '10:00',
        end: '11:00',
      },
      serviceTimeMinutes: 3,
      isFragile: true,
      isTemperatureSensitive: true,
      specialInstructions: 'Urgent express delivery.',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({ orders: [expressOrder, ...state.orders] }));
    trackEvent('order_created', { orderNumber: expressOrder.orderNumber, isExpress: true });

    insertOrderToSupabase(expressOrder)
      .then((persisted) => {
        if (persisted) {
          set((state) => ({
            orders: state.orders.map((o) => (o.id === tempId ? persisted : o)),
          }));
        }
      })
      .catch((err) => {
        console.warn('Background Supabase express order insert failed:', err);
      });

    return expressOrder;
  },

  setActiveRole: (role) => set({ activeRole: role }),

  toggleTheme: () => {
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      if (typeof document !== 'undefined') {
        if (next === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return { theme: next };
    });
  },

  setThemeMode: (theme) => {
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    set({ theme });
  },

  setCookiePreferences: (prefs) => {
    set((state) => ({
      cookiePreferences: { ...state.cookiePreferences, ...prefs, hasConsented: true },
    }));
  },
}));

// Automatic persistence subscription
if (typeof window !== 'undefined') {
  useStore.subscribe((state) => {
    try {
      const toSave = {
        userProfile: state.userProfile,
        business: state.business,
        products: state.products,
        customers: state.customers,
        orders: state.orders,
        drivers: state.drivers,
        vehicles: state.vehicles,
        selectedVehicleId: state.selectedVehicleId,
        optimizationHistory: state.optimizationHistory,
        activeRole: state.activeRole,
        isAuthenticated: state.isAuthenticated,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(toSave));
    } catch (err) {
      console.warn('LocalStorage save error:', err);
    }
  });
}
