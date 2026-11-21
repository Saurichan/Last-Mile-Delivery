import { Order, BusinessRules, DistanceTimeMatrix, Vehicle, Depot } from '../../types';

export interface RouteEvaluation {
  cost: number;
  totalDistanceKm: number;
  totalDurationMin: number;
  travelTimeMin: number;
  serviceTimeMin: number;
  waitingTimeMin: number;
  lateOrdersCount: number;
  isFeasible: boolean;
  feasibilityIssues: string[];
  stopArrivalsMin: number[]; // Minutes from route start
  stopDeparturesMin: number[];
  stopWaitTimesMin: number[];
  stopLateMinutes: number[];
}

/**
 * Parses "HH:MM" time string into minutes from midnight
 */
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Formats minutes from midnight into "HH:MM" time string
 */
export function minutesToTimeString(minutes: number): string {
  const norm = ((Math.floor(minutes) % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Evaluates a sequence of orders starting from depot (index 0)
 * Order indices map to matrix indices [0 = depot, 1..N = orders]
 */
export function evaluateRouteSequence(
  orderIndices: number[], // Indices into orders array (0 to orders.length - 1)
  orders: Order[],
  matrix: DistanceTimeMatrix,
  rules: BusinessRules,
  depotStartTimeMin: number,
  returnToDepot: boolean,
  vehicle?: Vehicle,
  maxRouteDurationMin: number = 480
): RouteEvaluation {
  let currentClockMin = depotStartTimeMin;
  let totalDistanceKm = 0;
  let totalTravelTimeMin = 0;
  let totalServiceTimeMin = 0;
  let totalWaitingTimeMin = 0;
  let lateOrdersCount = 0;
  const feasibilityIssues: string[] = [];

  const stopArrivalsMin: number[] = [];
  const stopDeparturesMin: number[] = [];
  const stopWaitTimesMin: number[] = [];
  const stopLateMinutes: number[] = [];

  let previousMatrixIdx = 0; // Depot is index 0 in distance matrix

  let totalWeightKg = 0;
  let totalPackages = 0;

  // Track capacity usage
  for (const idx of orderIndices) {
    const order = orders[idx];
    totalWeightKg += order.weightKg || 1;
    totalPackages += order.packageCount || 1;
  }

  if (vehicle) {
    if (totalWeightKg > vehicle.maxWeightKg) {
      feasibilityIssues.push(
        `Vehicle weight capacity exceeded (${totalWeightKg.toFixed(1)}kg > ${vehicle.maxWeightKg}kg max)`
      );
    }
    if (totalPackages > vehicle.maxPackageCapacity) {
      feasibilityIssues.push(
        `Package count limit exceeded (${totalPackages} pkgs > ${vehicle.maxPackageCapacity} max)`
      );
    }
  }

  // Iterate over each stop in the sequence
  for (let s = 0; s < orderIndices.length; s++) {
    const orderIdx = orderIndices[s];
    const order = orders[orderIdx];
    const matrixIdx = orderIdx + 1; // 1-based in matrix

    // 1. Travel from previous stop
    const dist = matrix.distances[previousMatrixIdx]?.[matrixIdx] ?? 0;
    const dur = matrix.durations[previousMatrixIdx]?.[matrixIdx] ?? 0;

    totalDistanceKm += dist;
    totalTravelTimeMin += dur;
    currentClockMin += dur;

    const arrivalClockMin = currentClockMin;
    stopArrivalsMin.push(arrivalClockMin);

    // 2. Customer availability window check
    let waitTime = 0;
    let lateMin = 0;

    if (order.timeWindow) {
      const windowStartMin = timeStringToMinutes(order.timeWindow.start);
      const windowEndMin = timeStringToMinutes(order.timeWindow.end);

      if (arrivalClockMin < windowStartMin) {
        // Arrived early: Must wait for window to open
        waitTime = windowStartMin - arrivalClockMin;
        currentClockMin = windowStartMin;
      } else if (arrivalClockMin > windowEndMin) {
        // Arrived late
        lateMin = arrivalClockMin - windowEndMin;
        lateOrdersCount++;
        feasibilityIssues.push(
          `Order #${order.orderNumber} arrived ${lateMin}m late (Window was ${order.timeWindow.start}-${order.timeWindow.end})`
        );
      }
    } else if (order.deadline) {
      const deadlineMin = timeStringToMinutes(order.deadline);
      if (arrivalClockMin > deadlineMin) {
        lateMin = arrivalClockMin - deadlineMin;
        lateOrdersCount++;
        feasibilityIssues.push(
          `Order #${order.orderNumber} missed deadline by ${lateMin}m (Deadline was ${order.deadline})`
        );
      }
    }

    totalWaitingTimeMin += waitTime;
    stopWaitTimesMin.push(waitTime);
    stopLateMinutes.push(lateMin);

    // 3. Service time at stop
    const serviceMin = order.serviceTimeMinutes || rules.defaultServiceTimeMin || 4;
    totalServiceTimeMin += serviceMin;
    currentClockMin += serviceMin;

    stopDeparturesMin.push(currentClockMin);
    previousMatrixIdx = matrixIdx;
  }

  // 4. Return to depot if configured
  if (returnToDepot && orderIndices.length > 0) {
    const returnDist = matrix.distances[previousMatrixIdx]?.[0] ?? 0;
    const returnDur = matrix.durations[previousMatrixIdx]?.[0] ?? 0;
    totalDistanceKm += returnDist;
    totalTravelTimeMin += returnDur;
    currentClockMin += returnDur;
  }

  const totalDurationMin = currentClockMin - depotStartTimeMin;

  if (totalDurationMin > maxRouteDurationMin) {
    feasibilityIssues.push(
      `Route exceeds max driver duration (${Math.round(totalDurationMin / 60)}h ${Math.round(totalDurationMin % 60)}m > ${Math.round(maxRouteDurationMin / 60)}h limit)`
    );
  }

  // Calculate Multi-Objective Cost
  // Weights (0 to 10 scale normalized)
  const wDist = (rules.distanceEfficiencyWeight || 7) * 1.0;
  const wTime = (rules.timeSensitivityWeight || 8) * 0.8;
  const wLate = (rules.urgencyWeight || 9) * 25.0; // Heavy penalty for late deliveries
  const wWait = 0.5;
  const wPriority = (rules.priorityWeight || 8) * 2.0;

  let priorityPenalty = 0;
  for (let s = 0; s < orderIndices.length; s++) {
    const order = orders[orderIndices[s]];
    let prioMultiplier = 1;
    if (order.priority === 'critical') prioMultiplier = 10;
    else if (order.priority === 'high') prioMultiplier = 5;
    else if (order.priority === 'normal') prioMultiplier = 2;
    else prioMultiplier = 1;

    // Earlier positions for critical/high priority reduce penalty
    priorityPenalty += s * prioMultiplier;
  }

  let capacityPenalty = 0;
  if (vehicle && totalWeightKg > vehicle.maxWeightKg) {
    capacityPenalty += (totalWeightKg - vehicle.maxWeightKg) * 50;
  }

  const cost =
    totalDistanceKm * wDist +
    totalTravelTimeMin * wTime +
    stopLateMinutes.reduce((a, b) => a + b, 0) * wLate +
    totalWaitingTimeMin * wWait +
    priorityPenalty * wPriority +
    capacityPenalty;

  return {
    cost,
    totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
    totalDurationMin: Number(totalDurationMin.toFixed(1)),
    travelTimeMin: Number(totalTravelTimeMin.toFixed(1)),
    serviceTimeMin: Number(totalServiceTimeMin.toFixed(1)),
    waitingTimeMin: Number(totalWaitingTimeMin.toFixed(1)),
    lateOrdersCount,
    isFeasible: feasibilityIssues.length === 0,
    feasibilityIssues,
    stopArrivalsMin,
    stopDeparturesMin,
    stopWaitTimesMin,
    stopLateMinutes,
  };
}

/**
 * 2-Opt Local Search Algorithm with multi-constraint evaluation
 * Iteratively swaps edge pairs to find optimal sequence while preserving locked stops
 */
export function runTwoOptOptimization(
  initialSequence: number[],
  orders: Order[],
  matrix: DistanceTimeMatrix,
  rules: BusinessRules,
  depotStartTimeMin: number,
  returnToDepot: boolean,
  vehicle?: Vehicle,
  maxRouteDurationMin: number = 480
): { bestSequence: number[]; bestEvaluation: RouteEvaluation; iterations: number } {
  let currentSequence = [...initialSequence];
  let bestEvaluation = evaluateRouteSequence(
    currentSequence,
    orders,
    matrix,
    rules,
    depotStartTimeMin,
    returnToDepot,
    vehicle,
    maxRouteDurationMin
  );

  let improved = true;
  let iterations = 0;
  const maxIterations = 250;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    for (let i = 0; i < currentSequence.length - 1; i++) {
      for (let k = i + 1; k < currentSequence.length; k++) {
        // Check if any stop in the 2-opt swap range is locked
        let containsLocked = false;
        for (let idx = i; idx <= k; idx++) {
          if (orders[currentSequence[idx]]?.isLocked) {
            containsLocked = true;
            break;
          }
        }
        if (containsLocked) continue;

        // Perform 2-opt edge reversal: reverse subarray from i to k
        const candidateSequence = [
          ...currentSequence.slice(0, i),
          ...currentSequence.slice(i, k + 1).reverse(),
          ...currentSequence.slice(k + 1),
        ];

        const candidateEval = evaluateRouteSequence(
          candidateSequence,
          orders,
          matrix,
          rules,
          depotStartTimeMin,
          returnToDepot,
          vehicle,
          maxRouteDurationMin
        );

        if (candidateEval.cost < bestEvaluation.cost - 0.001) {
          currentSequence = candidateSequence;
          bestEvaluation = candidateEval;
          improved = true;
          break;
        }
      }
      if (improved) break;
    }
  }

  return {
    bestSequence: currentSequence,
    bestEvaluation,
    iterations,
  };
}
