import {
  Order,
  Business,
  Vehicle,
  RoutePlan,
  RouteStop,
  RouteMetrics,
  DistanceTimeMatrix,
  Depot,
} from '../../types';
import { getDistanceTimeMatrix, getRouteGeometry } from '../routingService';
import {
  evaluateRouteSequence,
  runTwoOptOptimization,
  timeStringToMinutes,
  minutesToTimeString,
  RouteEvaluation,
} from './twoOpt';
import { generateStopRationale } from './explanation';

export interface OptimizationOptions {
  algorithm?: 'nearest_neighbor' | 'two_opt' | 'genetic' | 'manual';
  customMatrix?: DistanceTimeMatrix;
}

/**
 * Builds initial feasible sequence using Time-Window-Aware Nearest Neighbor heuristic
 */
function buildNearestNeighborSequence(
  orders: Order[],
  matrix: DistanceTimeMatrix,
  depotStartTimeMin: number
): number[] {
  const n = orders.length;
  if (n === 0) return [];

  const visited = new Set<number>();
  const sequence: number[] = [];

  // Handle locked stops that have fixed positions
  const lockedIndices = new Map<number, number>(); // stopPosition -> orderIndex
  orders.forEach((o, idx) => {
    if (o.isLocked && o.lockedPosition !== undefined) {
      lockedIndices.set(o.lockedPosition, idx);
    }
  });

  let currentMatrixIdx = 0; // Depot is index 0
  let currentClockMin = depotStartTimeMin;

  for (let step = 0; step < n; step++) {
    // If a locked stop is specified for this position, pick it directly
    if (lockedIndices.has(step + 1)) {
      const lockedIdx = lockedIndices.get(step + 1)!;
      if (!visited.has(lockedIdx)) {
        visited.add(lockedIdx);
        sequence.push(lockedIdx);
        currentMatrixIdx = lockedIdx + 1;
        const dur = matrix.durations[currentMatrixIdx]?.[lockedIdx + 1] ?? 10;
        currentClockMin += dur + (orders[lockedIdx].serviceTimeMinutes || 4);
        continue;
      }
    }

    // Find best next stop among unvisited
    let bestCandidateIdx = -1;
    let lowestScore = Infinity;

    for (let i = 0; i < n; i++) {
      if (visited.has(i)) continue;

      const order = orders[i];
      const matrixIdx = i + 1;
      const travelDist = matrix.distances[currentMatrixIdx]?.[matrixIdx] ?? 5;
      const travelDur = matrix.durations[currentMatrixIdx]?.[matrixIdx] ?? 10;
      const estArrival = currentClockMin + travelDur;

      let score = travelDist * 1.5 + travelDur * 1.0;

      // Priority factor: Critical / High gets preference
      if (order.priority === 'critical') score -= 50;
      else if (order.priority === 'high') score -= 20;

      // Time window factor
      if (order.timeWindow) {
        const winStart = timeStringToMinutes(order.timeWindow.start);
        const winEnd = timeStringToMinutes(order.timeWindow.end);

        if (estArrival > winEnd) {
          // Late penalty
          score += (estArrival - winEnd) * 10;
        } else if (estArrival < winStart) {
          // Early wait penalty
          score += (winStart - estArrival) * 0.4;
        } else {
          // Perfect fit bonus
          score -= 15;
        }
      }

      if (score < lowestScore) {
        lowestScore = score;
        bestCandidateIdx = i;
      }
    }

    if (bestCandidateIdx !== -1) {
      visited.add(bestCandidateIdx);
      sequence.push(bestCandidateIdx);
      currentMatrixIdx = bestCandidateIdx + 1;
      const dur = matrix.durations[currentMatrixIdx]?.[bestCandidateIdx + 1] ?? 10;
      currentClockMin += dur + (orders[bestCandidateIdx].serviceTimeMinutes || 4);
    }
  }

  // Add any remaining unvisited if any edge case occurred
  for (let i = 0; i < n; i++) {
    if (!visited.has(i)) {
      sequence.push(i);
    }
  }

  return sequence;
}

/**
 * Converts RouteEvaluation into full RouteMetrics with cost & fuel calculations
 */
function buildRouteMetrics(
  evaluation: RouteEvaluation,
  business: Business,
  vehicle?: Vehicle
): RouteMetrics {
  const mileage = vehicle?.mileageKmPerLiter || 14; // default 14 km/L
  const fuelPrice = business.fuelPricePerLiter || 1.45; // default $1.45 / L
  const driverWagePerHour = 22.0; // $22/hr

  const fuelConsumedLiters = Number((evaluation.totalDistanceKm / mileage).toFixed(2));
  const estimatedFuelCost = Number((fuelConsumedLiters * fuelPrice).toFixed(2));
  const estimatedDriverCost = Number(
    ((evaluation.totalDurationMin / 60) * driverWagePerHour).toFixed(2)
  );
  const estimatedTotalCost = Number((estimatedFuelCost + estimatedDriverCost).toFixed(2));
  const estimatedCo2Kg = Number((fuelConsumedLiters * 2.31).toFixed(2)); // ~2.31 kg CO2 per liter

  const onTimePercentage =
    evaluation.lateOrdersCount === 0
      ? 100
      : Math.max(0, Math.round(((evaluation.stopArrivalsMin.length - evaluation.lateOrdersCount) / Math.max(1, evaluation.stopArrivalsMin.length)) * 100));

  return {
    totalDistanceKm: evaluation.totalDistanceKm,
    totalDurationMin: evaluation.totalDurationMin,
    totalTravelTimeMin: evaluation.travelTimeMin,
    totalServiceTimeMin: evaluation.serviceTimeMin,
    totalWaitingTimeMin: evaluation.waitingTimeMin,
    lateOrdersCount: evaluation.lateOrdersCount,
    onTimePercentage,
    fuelConsumedLiters,
    estimatedFuelCost,
    estimatedDriverCost,
    estimatedTotalCost,
    estimatedCo2Kg,
    vehicleCapacityUsedKg: 0,
    vehicleUtilizationPercent: 0,
    isFeasible: evaluation.isFeasible,
    feasibilityIssues: evaluation.feasibilityIssues,
    totalScore: Number(evaluation.cost.toFixed(1)),
  };
}

/**
 * Master Route Optimizer
 */
export async function optimizeRoute(
  business: Business,
  orders: Order[],
  vehicle?: Vehicle,
  options: OptimizationOptions = {}
): Promise<RoutePlan> {
  const algorithm = options.algorithm || 'two_opt';
  const depotStartTimeMin = timeStringToMinutes(business.defaultStartTime || '09:00');

  // Coordinates array: Depot is index 0, followed by all orders
  const allCoords = [
    { lat: business.depot.lat, lng: business.depot.lng },
    ...orders.map((o) => ({ lat: o.customer.lat, lng: o.customer.lng })),
  ];

  // 1. Fetch or use distance/time matrix
  const matrix = options.customMatrix || (await getDistanceTimeMatrix(allCoords));

  // 2. Evaluate original / manual sequence (as-is input order)
  const manualSequence = Array.from({ length: orders.length }, (_, i) => i);
  const originalEvaluation = evaluateRouteSequence(
    manualSequence,
    orders,
    matrix,
    business.rules,
    depotStartTimeMin,
    business.returnToDepot,
    vehicle,
    business.maxRouteDurationMinutes
  );
  const originalMetrics = buildRouteMetrics(originalEvaluation, business, vehicle);

  // 3. Construct initial Nearest Neighbor sequence
  const nnSequence = buildNearestNeighborSequence(orders, matrix, depotStartTimeMin);

  let finalSequence: number[] = [];
  let finalEvaluation: RouteEvaluation;

  if (algorithm === 'manual') {
    finalSequence = manualSequence;
    finalEvaluation = originalEvaluation;
  } else if (algorithm === 'nearest_neighbor') {
    finalSequence = nnSequence;
    finalEvaluation = evaluateRouteSequence(
      finalSequence,
      orders,
      matrix,
      business.rules,
      depotStartTimeMin,
      business.returnToDepot,
      vehicle,
      business.maxRouteDurationMinutes
    );
  } else {
    // Default: 2-Opt local search improvement on top of Nearest Neighbor
    const twoOptResult = runTwoOptOptimization(
      nnSequence,
      orders,
      matrix,
      business.rules,
      depotStartTimeMin,
      business.returnToDepot,
      vehicle,
      business.maxRouteDurationMinutes
    );
    finalSequence = twoOptResult.bestSequence;
    finalEvaluation = twoOptResult.bestEvaluation;
  }

  // 4. Build RouteStops with ETAs, departure times, and rationale
  const stops: RouteStop[] = [];
  let previousLocName = business.depot.name || 'Depot / Shop';
  let previousMatrixIdx = 0;

  for (let s = 0; s < finalSequence.length; s++) {
    const orderIdx = finalSequence[s];
    const order = orders[orderIdx];
    const matrixIdx = orderIdx + 1;

    const travelDist = matrix.distances[previousMatrixIdx]?.[matrixIdx] ?? 0;
    const travelDur = matrix.durations[previousMatrixIdx]?.[matrixIdx] ?? 0;
    const arrivalClockMin = finalEvaluation.stopArrivalsMin[s];
    const departureClockMin = finalEvaluation.stopDeparturesMin[s];
    const waitTime = finalEvaluation.stopWaitTimesMin[s];
    const lateMin = finalEvaluation.stopLateMinutes[s];

    const stop: RouteStop = {
      stopIndex: s + 1,
      orderId: order.id,
      order,
      estimatedArrival: minutesToTimeString(arrivalClockMin),
      estimatedDeparture: minutesToTimeString(departureClockMin),
      travelDistanceKm: Number(travelDist.toFixed(2)),
      travelDurationMin: Number(travelDur.toFixed(1)),
      waitingTimeMin: Number(waitTime.toFixed(1)),
      isLate: lateMin > 0,
      lateByMinutes: lateMin,
      isLocked: !!order.isLocked,
      isCompleted: order.status === 'delivered',
    };

    stop.rationale = generateStopRationale(stop, previousLocName, business.type);
    stops.push(stop);

    previousLocName = `Stop #${s + 1} (${order.customer.name})`;
    previousMatrixIdx = matrixIdx;
  }

  // 5. Fetch actual road geometry for the optimized sequence
  const waypointsInOrder = [
    { lat: business.depot.lat, lng: business.depot.lng },
    ...finalSequence.map((idx) => ({
      lat: orders[idx].customer.lat,
      lng: orders[idx].customer.lng,
    })),
  ];
  if (business.returnToDepot) {
    waypointsInOrder.push({ lat: business.depot.lat, lng: business.depot.lng });
  }

  const roadGeometry = await getRouteGeometry(waypointsInOrder);

  // Waypoints for original manual route
  const originalWaypoints = [
    { lat: business.depot.lat, lng: business.depot.lng },
    ...orders.map((o) => ({ lat: o.customer.lat, lng: o.customer.lng })),
  ];
  if (business.returnToDepot) {
    originalWaypoints.push({ lat: business.depot.lat, lng: business.depot.lng });
  }
  const originalRoadGeometry = await getRouteGeometry(originalWaypoints);

  const metrics = buildRouteMetrics(finalEvaluation, business, vehicle);

  return {
    id: `route-${Date.now()}`,
    businessId: business.id,
    vehicleId: vehicle?.id,
    depot: business.depot,
    returnToDepot: business.returnToDepot,
    startTime: business.defaultStartTime || '09:00',
    stops,
    metrics,
    roadGeometry,
    originalMetrics,
    originalRoadGeometry,
    algorithmUsed: algorithm,
    createdAt: new Date().toISOString(),
  };
}
