import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('placeholder')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export type AnalyticsEventType =
  | 'signup_completed'
  | 'login_completed'
  | 'business_created'
  | 'order_created'
  | 'order_updated'
  | 'route_optimized'
  | 'route_reoptimized'
  | 'delivery_started'
  | 'delivery_completed'
  | 'delivery_failed'
  | 'proof_uploaded'
  | 'customer_tracking_opened'
  | 'what_if_simulated';

/**
 * Reusable event tracker that logs events to Supabase if configured,
 * and maintains an in-memory / local storage event buffer
 */
export async function trackEvent(
  eventType: AnalyticsEventType,
  payload: Record<string, any> = {}
): Promise<void> {
  const event = {
    eventType,
    payload,
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
  };

  // Store in localStorage for analytics view
  try {
    const existing = JSON.parse(localStorage.getItem('optimizer_analytics_events') || '[]');
    existing.unshift(event);
    if (existing.length > 200) existing.pop();
    localStorage.setItem('optimizer_analytics_events', JSON.stringify(existing));
  } catch (err) {
    console.debug('Failed to write event to local storage', err);
  }

  // Push to Supabase if connected
  if (supabase) {
    try {
      await supabase.from('analytics_events').insert({
        event_type: eventType,
        payload,
        created_at: event.timestamp,
      });
    } catch (err) {
      console.warn('Supabase event tracking error:', err);
    }
  }
}
