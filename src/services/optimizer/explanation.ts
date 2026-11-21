import { RouteStop, Depot, BusinessType } from '../../types';

/**
 * Generates clear, data-driven explanations for each stop in the optimized sequence
 */
export function generateStopRationale(
  stop: RouteStop,
  previousLocationName: string,
  businessType: BusinessType
): string {
  const order = stop.order;
  const reasons: string[] = [];

  // 1. Locked Stop
  if (stop.isLocked) {
    return `🔒 Fixed Position: Manually pinned at Stop #${stop.stopIndex} by dispatcher/driver.`;
  }

  // 2. Critical/High Priority Reason
  if (order.priority === 'critical') {
    reasons.push(`Emergency / Critical priority fulfillment`);
  } else if (order.priority === 'high') {
    reasons.push(`High priority order`);
  }

  // 3. Time window & Deadline urgency
  if (order.timeWindow) {
    if (stop.isLate) {
      reasons.push(`Scheduled despite tight window (${order.timeWindow.start}-${order.timeWindow.end}) to prevent further downstream delays`);
    } else {
      reasons.push(`Satisfies delivery window (${order.timeWindow.start} - ${order.timeWindow.end}) arriving at ${stop.estimatedArrival}`);
    }
  } else if (order.deadline) {
    reasons.push(`Meets strict deadline of ${order.deadline} with ${stop.lateByMinutes === 0 ? 'ample margin' : 'minimal deviation'}`);
  }

  // 4. Proximity / Cluster Efficiency
  if (stop.travelDistanceKm <= 2.0) {
    reasons.push(`High proximity (${stop.travelDistanceKm.toFixed(1)} km from ${previousLocationName}) for optimal route clustering`);
  } else {
    reasons.push(`${stop.travelDistanceKm.toFixed(1)} km transit from ${previousLocationName}`);
  }

  // 5. Special handling for business types
  if (businessType === 'bakery' && order.isFragile) {
    reasons.push(`Direct early drop preserves oven-fresh quality and fragile pastry structure`);
  } else if (businessType === 'pharmacy' && order.isTemperatureSensitive) {
    reasons.push(`Expedited transit preserves temperature-sensitive medical integrity`);
  } else if (businessType === 'tiffin_service') {
    reasons.push(`Sequenced for hot meal lunch/dinner delivery schedule`);
  }

  return reasons.join(' • ');
}
