import { Order, Vehicle, DistanceTimeMatrix, BusinessRules } from '../../types';
import { calculateHaversineDistance } from '../routingService';
import { timeStringToMinutes } from './twoOpt';

export interface DeliveryBatch {
  id: string;
  name: string;
  orders: Order[];
  totalWeightKg: number;
  totalVolumeM3: number;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  timeSpanFormatted: string;
  recommendedVehicleType?: string;
  rationale: string;
}

/**
 * Groups orders into smart geographic and time-feasible delivery batches
 */
export function generateSmartBatches(
  orders: Order[],
  vehicles: Vehicle[],
  rules: BusinessRules,
  maxRadiusKm: number = 3.5
): DeliveryBatch[] {
  if (orders.length === 0) return [];

  const unassigned = [...orders];
  const batches: DeliveryBatch[] = [];
  let batchCounter = 1;

  while (unassigned.length > 0) {
    const seed = unassigned.shift()!;
    const cluster: Order[] = [seed];
    let totalWeight = seed.weightKg || 1;
    let totalVolume = seed.volumeM3 || 0.05;

    // Find max vehicle capacity limit
    const maxCapacity = vehicles.length > 0
      ? Math.max(...vehicles.map(v => v.maxWeightKg))
      : 80;

    const remainingIndices: number[] = [];

    for (let i = 0; i < unassigned.length; i++) {
      const candidate = unassigned[i];
      const dist = calculateHaversineDistance(
        seed.customer.lat,
        seed.customer.lng,
        candidate.customer.lat,
        candidate.customer.lng
      );

      // Check distance proximity
      const isClose = dist <= maxRadiusKm;

      // Check time window compatibility (overlap within 90 minutes)
      let isTimeCompatible = true;
      if (seed.timeWindow && candidate.timeWindow) {
        const seedStart = timeStringToMinutes(seed.timeWindow.start);
        const seedEnd = timeStringToMinutes(seed.timeWindow.end);
        const candStart = timeStringToMinutes(candidate.timeWindow.start);
        const candEnd = timeStringToMinutes(candidate.timeWindow.end);

        const gap = Math.max(0, candStart - seedEnd, seedStart - candEnd);
        if (gap > 90) {
          isTimeCompatible = false;
        }
      }

      // Check vehicle capacity limit
      const canFit = (totalWeight + (candidate.weightKg || 1)) <= maxCapacity;

      if (isClose && isTimeCompatible && canFit) {
        cluster.push(candidate);
        totalWeight += candidate.weightKg || 1;
        totalVolume += candidate.volumeM3 || 0.05;
      } else {
        remainingIndices.push(i);
      }
    }

    // Keep only untouched items in unassigned
    const nextUnassigned = remainingIndices.map(idx => unassigned[idx]);
    unassigned.length = 0;
    unassigned.push(...nextUnassigned);

    // Calculate cluster center
    const centerLat = cluster.reduce((sum, o) => sum + o.customer.lat, 0) / cluster.length;
    const centerLng = cluster.reduce((sum, o) => sum + o.customer.lng, 0) / cluster.length;
    const maxDistInCluster = Math.max(
      ...cluster.map(o => calculateHaversineDistance(centerLat, centerLng, o.customer.lat, o.customer.lng))
    );

    // Formatted time span
    const timeWindows = cluster
      .map(o => o.timeWindow)
      .filter((tw): tw is { start: string; end: string } => !!tw);

    let timeSpanFormatted = 'Anytime';
    if (timeWindows.length > 0) {
      const earliest = timeWindows.reduce((min, tw) => tw.start < min ? tw.start : min, timeWindows[0].start);
      const latest = timeWindows.reduce((max, tw) => tw.end > max ? tw.end : max, timeWindows[0].end);
      timeSpanFormatted = `${earliest} - ${latest}`;
    }

    // Recommended vehicle
    let recommendedVehicle = 'Bike / Scooter';
    if (totalWeight > 30 || cluster.length > 8) {
      recommendedVehicle = 'Delivery Van';
    } else if (totalWeight > 15 || cluster.length > 4) {
      recommendedVehicle = 'Car / Small Van';
    }

    batches.push({
      id: `batch-${batchCounter}`,
      name: `Trip Cluster ${String.fromCharCode(64 + batchCounter)} (${cluster.length} Orders)`,
      orders: cluster,
      totalWeightKg: Number(totalWeight.toFixed(1)),
      totalVolumeM3: Number(totalVolume.toFixed(2)),
      centerLat,
      centerLng,
      radiusKm: Number(Math.max(0.5, maxDistInCluster).toFixed(1)),
      timeSpanFormatted,
      recommendedVehicleType: recommendedVehicle,
      rationale: `${cluster.length} nearby orders within ${maxRadiusKm}km with compatible time windows and combined payload of ${totalWeight.toFixed(1)}kg.`,
    });

    batchCounter++;
  }

  return batches;
}
