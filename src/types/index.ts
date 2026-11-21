export type BusinessCategory = 'food_beverage' | 'healthcare' | 'retail' | 'services' | 'other';

export type BusinessType = 
  | 'bakery'
  | 'restaurant'
  | 'cloud_kitchen'
  | 'tiffin_service'
  | 'cafe'
  | 'dairy'
  | 'pharmacy'
  | 'medical_supplies'
  | 'diagnostic_samples'
  | 'grocery'
  | 'flower_shop'
  | 'stationery'
  | 'electronics'
  | 'boutique'
  | 'general_store'
  | 'laundry'
  | 'cleaning'
  | 'nursery_plants'
  | 'pet_supplies'
  | 'custom_business';

export interface BusinessRules {
  timeSensitivityWeight: number; // 0 to 10
  freshnessWeight: number;       // 0 to 10
  priorityWeight: number;        // 0 to 10
  distanceEfficiencyWeight: number; // 0 to 10
  urgencyWeight: number;         // 0 to 10
  customerAvailabilityWeight: number; // 0 to 10
  batchDeliveryWeight: number;   // 0 to 10
  capacityWeight: number;        // 0 to 10
  waitingTimeToleranceMin: number; // Max minutes willing to wait before delivering elsewhere
  defaultServiceTimeMin: number; // Default minutes per stop
}

export type OrderPriority = 'critical' | 'high' | 'normal' | 'flexible';

export type OrderStatus = 
  | 'pending'
  | 'assigned'
  | 'picked_up'
  | 'en_route'
  | 'arriving'
  | 'delivered'
  | 'failed'
  | 'rescheduled'
  | 'cancelled';

export interface Location {
  address: string;
  lat: number;
  lng: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  lat: number;
  lng: number;
}

export interface TimeWindow {
  start: string; // e.g. "17:00" (24h format)
  end: string;   // e.g. "18:00"
}

export interface ProofOfDelivery {
  id?: string;
  signatureDataUrl?: string;
  photoUrl?: string;
  otpCode?: string;
  isOtpVerified?: boolean;
  notes?: string;
  timestamp: string;
  recipientName?: string;
  lat?: number;
  lng?: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: Customer;
  category: string;
  weightKg: number;
  volumeM3?: number;
  packageCount?: number;
  priority: OrderPriority;
  timeWindow?: TimeWindow; // undefined means "Anytime"
  deadline?: string;       // e.g. "18:30"
  serviceTimeMinutes: number;
  isFragile: boolean;
  isTemperatureSensitive: boolean;
  specialInstructions?: string;
  assignedDriverId?: string;
  assignedVehicleId?: string;
  status: OrderStatus;
  isLocked?: boolean;
  lockedPosition?: number;
  failureReason?: string;
  failureNotes?: string;
  rescheduledDate?: string;
  completedAt?: string;
  pod?: ProofOfDelivery;
  createdAt: string;
  updatedAt: string;
}

export type VehicleType = 'bike' | 'scooter' | 'auto' | 'car' | 'van' | 'truck' | 'ev_van' | 'handcart';

export interface Vehicle {
  id: string;
  name: string;
  type: VehicleType;
  icon?: string;
  maxWeightKg: number;
  maxPackageCapacity: number;
  mileageKmPerLiter: number;
  fuelType: 'petrol' | 'diesel' | 'ev' | 'cng' | 'manual';
  isAvailable: boolean;
  assignedDriverId?: string;
  estimatedCostPerKm?: number;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatarUrl?: string;
  status: 'idle' | 'on_duty' | 'delivering' | 'offline';
  currentLocation?: { lat: number; lng: number };
  hourlyWage: number;
}

export interface UserProfile {
  id?: string;
  name: string;
  role: string;
  businessName: string;
  businessType?: BusinessType | string;
  businessLocation?: string;
  address?: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  city: string;
  state: string;
}

export interface BakeryProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  weightKg: number;
  isAvailable: boolean;
  image?: string;
}

export interface Depot {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface Business {
  id: string;
  name: string;
  tagline?: string;
  category: BusinessCategory;
  type: BusinessType;
  depot: Depot;
  rules: BusinessRules;
  currency: string;
  fuelPricePerLiter: number;
  returnToDepot: boolean;
  maxRouteDurationMinutes: number;
  defaultStartTime: string; // e.g. "09:00"
}

export interface RouteStop {
  stopIndex: number; // 1-based index (depot is 0)
  orderId: string;
  order: Order;
  estimatedArrival: string; // "HH:MM"
  estimatedDeparture: string; // "HH:MM"
  travelDistanceKm: number;
  travelDurationMin: number;
  waitingTimeMin: number;
  isLate: boolean;
  lateByMinutes: number;
  isLocked: boolean;
  isCompleted: boolean;
  rationale?: string;
}

export interface RouteMetrics {
  totalDistanceKm: number;
  totalDurationMin: number;
  totalTravelTimeMin: number;
  totalServiceTimeMin: number;
  totalWaitingTimeMin: number;
  lateOrdersCount: number;
  onTimePercentage: number;
  fuelConsumedLiters: number;
  estimatedFuelCost: number;
  estimatedDriverCost: number;
  estimatedTotalCost: number;
  estimatedCo2Kg: number;
  vehicleCapacityUsedKg: number;
  vehicleUtilizationPercent: number;
  isFeasible: boolean;
  feasibilityIssues: string[];
  totalScore: number;
}

export interface RoutePlan {
  id: string;
  businessId: string;
  vehicleId?: string;
  driverId?: string;
  depot: Depot;
  returnToDepot: boolean;
  startTime: string;
  stops: RouteStop[];
  metrics: RouteMetrics;
  roadGeometry: [number, number][]; // lat, lng pairs
  originalStops?: RouteStop[];
  originalMetrics?: RouteMetrics;
  originalRoadGeometry?: [number, number][];
  algorithmUsed: 'nearest_neighbor' | 'two_opt' | 'genetic' | 'manual';
  createdAt: string;
}

export interface OptimizationRun {
  id: string;
  timestamp: string;
  businessType: BusinessType;
  orderCount: number;
  algorithmUsed: string;
  beforeDistanceKm: number;
  afterDistanceKm: number;
  distanceSavedKm: number;
  percentDistanceSaved: number;
  beforeDurationMin: number;
  afterDurationMin: number;
  timeSavedMin: number;
  beforeLateCount: number;
  afterLateCount: number;
  beforeCost: number;
  afterCost: number;
  costSaved: number;
  fuelSavedLiters: number;
  co2SavedKg: number;
  score: number;
}

export interface DistanceTimeMatrix {
  distances: number[][]; // distance in km
  durations: number[][]; // duration in minutes
  sources: { lat: number; lng: number }[];
  destinations: { lat: number; lng: number }[];
  isRoadMatrix: boolean; // true if from OSRM, false if Haversine approximation
}

export interface WhatIfScenario {
  id: string;
  name: string;
  description: string;
  addExpressOrdersCount: number;
  trafficMultiplier: number; // e.g. 1.3 (+30% duration)
  roadClosureActive: boolean;
  closedStopIndex?: number;
  capacityReductionPercent: number;
  driverRemoved: boolean;
}

export type UserRole = 'admin' | 'dispatcher' | 'driver' | 'customer';

export interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  optional: boolean;
  hasConsented: boolean;
}
