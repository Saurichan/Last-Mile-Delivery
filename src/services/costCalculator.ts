import { RouteMetrics } from '../types';

export interface SavingsComparison {
  distanceSavedKm: number;
  percentDistanceSaved: number;
  timeSavedMin: number;
  percentTimeSaved: number;
  fuelSavedLiters: number;
  costSaved: number;
  percentCostSaved: number;
  co2SavedKg: number;
  lateOrdersSaved: number;
  isFeasibilityImproved: boolean;
}

/**
 * Calculates dynamic savings and environmental impact between original and optimized route metrics
 */
export function calculateSavingsComparison(
  original?: RouteMetrics,
  optimized?: RouteMetrics
): SavingsComparison {
  if (!original || !optimized) {
    return {
      distanceSavedKm: 0,
      percentDistanceSaved: 0,
      timeSavedMin: 0,
      percentTimeSaved: 0,
      fuelSavedLiters: 0,
      costSaved: 0,
      percentCostSaved: 0,
      co2SavedKg: 0,
      lateOrdersSaved: 0,
      isFeasibilityImproved: false,
    };
  }

  const distanceSavedKm = Number(
    Math.max(0, original.totalDistanceKm - optimized.totalDistanceKm).toFixed(2)
  );
  const percentDistanceSaved =
    original.totalDistanceKm > 0
      ? Number(((distanceSavedKm / original.totalDistanceKm) * 100).toFixed(1))
      : 0;

  const timeSavedMin = Number(
    Math.max(0, original.totalDurationMin - optimized.totalDurationMin).toFixed(1)
  );
  const percentTimeSaved =
    original.totalDurationMin > 0
      ? Number(((timeSavedMin / original.totalDurationMin) * 100).toFixed(1))
      : 0;

  const fuelSavedLiters = Number(
    Math.max(0, original.fuelConsumedLiters - optimized.fuelConsumedLiters).toFixed(2)
  );

  const costSaved = Number(
    Math.max(0, original.estimatedTotalCost - optimized.estimatedTotalCost).toFixed(2)
  );
  const percentCostSaved =
    original.estimatedTotalCost > 0
      ? Number(((costSaved / original.estimatedTotalCost) * 100).toFixed(1))
      : 0;

  const co2SavedKg = Number((fuelSavedLiters * 2.31).toFixed(2));
  const lateOrdersSaved = Math.max(0, original.lateOrdersCount - optimized.lateOrdersCount);
  const isFeasibilityImproved = !original.isFeasible && optimized.isFeasible;

  return {
    distanceSavedKm,
    percentDistanceSaved,
    timeSavedMin,
    percentTimeSaved,
    fuelSavedLiters,
    costSaved,
    percentCostSaved,
    co2SavedKg,
    lateOrdersSaved,
    isFeasibilityImproved,
  };
}
