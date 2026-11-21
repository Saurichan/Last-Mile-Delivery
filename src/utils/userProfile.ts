import { UserProfile } from '../types';

/**
 * Extracts the first name from a full name string.
 * e.g. "Priya Sharma" -> "Priya"
 * e.g. "Alex" -> "Alex"
 */
export function getUserFirstName(name?: string): string {
  if (!name || typeof name !== 'string') return '';
  const trimmed = name.trim();
  if (!trimmed) return '';
  return trimmed.split(/\s+/)[0];
}

/**
 * Formats full name with a fallback if empty.
 * e.g. "Priya Sharma" -> "Priya Sharma"
 * e.g. "" -> "Welcome!"
 */
export function getUserFullName(name?: string, fallback = 'Welcome!'): string {
  if (!name || typeof name !== 'string') return fallback;
  const trimmed = name.trim();
  return trimmed || fallback;
}

/**
 * Computes initials from a user's name or returns fallback.
 * e.g. "Priya Sharma" -> "PS"
 * e.g. "Rohan" -> "R"
 * e.g. "" -> "U"
 */
export function getUserInitials(name?: string, fallback = 'U'): string {
  if (!name || typeof name !== 'string') return fallback;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Generates personalized dynamic greeting:
 * "Good afternoon, {first_name}" (or morning/evening)
 * or "Welcome!" if no name is provided.
 */
export function getUserGreeting(userProfile?: Partial<UserProfile> | null): string {
  const firstName = getUserFirstName(userProfile?.name);
  if (!firstName) {
    return 'Welcome!';
  }

  const hour = new Date().getHours();
  let timeOfDay = 'afternoon';
  if (hour >= 4 && hour < 12) {
    timeOfDay = 'morning';
  } else if (hour >= 12 && hour < 17) {
    timeOfDay = 'afternoon';
  } else {
    timeOfDay = 'evening';
  }

  return `Good ${timeOfDay}, ${firstName} 👋`;
}

/**
 * Formats user badge:
 * "{user.full_name} | Business Owner"
 * or "{user.role}" if no name provided.
 */
export function formatUserTitle(userProfile?: Partial<UserProfile> | null): string {
  const role = userProfile?.role || 'Business Owner';
  const name = userProfile?.name?.trim();
  if (!name) {
    return role;
  }
  return `${name} | ${role}`;
}
