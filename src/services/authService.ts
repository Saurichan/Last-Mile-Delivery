import { supabase, isSupabaseConfigured, trackEvent } from './supabase';
import { UserProfile, BusinessType } from '../types';
import { useStore } from '../store/useStore';

export interface EmailVerificationResult {
  success: boolean;
  message: string;
  verificationRequired: boolean;
}

/**
 * Initializes Supabase auth state listener and synchronizes
 * the authenticated Supabase user profile into the store.
 */
export function initAuthListener(): () => void {
  if (!isSupabaseConfigured || !supabase) {
    return () => {};
  }

  // 1. Initial check on startup
  supabase.auth.getSession().then(({ data: { session }, error }) => {
    if (error) {
      console.warn('Error checking Supabase session:', error);
      return;
    }
    if (session?.user) {
      syncProfileFromSupabaseUser(session.user);
    }
  });

  // 2. Real-time auth state subscription
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
      if (session?.user) {
        await syncProfileFromSupabaseUser(session.user);
      }
    } else if (event === 'SIGNED_OUT') {
      const store = useStore.getState();
      if (store.isAuthenticated) {
        store.logout();
      }
    }
  });

  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Reads user data from Supabase Auth and public.profiles table,
 * then updates the store as the primary source of truth.
 */
export async function syncProfileFromSupabaseUser(user: any): Promise<void> {
  if (!user) return;

  const metadata = user.user_metadata || {};
  let fullName = metadata.full_name || metadata.name || '';
  let role = metadata.role || 'Business Owner';
  let businessName = metadata.business_name || '';
  let businessType: BusinessType = metadata.business_type || 'bakery';
  let businessLocation = metadata.business_location || '';
  let avatarUrl = metadata.avatar_url || '';
  let phone = metadata.phone || '';
  let city = metadata.city || 'Tumakuru';
  let state = metadata.state || 'Karnataka';

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: profileRow, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileRow && !error) {
        if (profileRow.full_name) fullName = profileRow.full_name;
        if (profileRow.role) role = profileRow.role;
        if (profileRow.avatar_url) avatarUrl = profileRow.avatar_url;
        if (profileRow.phone) phone = profileRow.phone;
        if (profileRow.business_name) businessName = profileRow.business_name;
        if (profileRow.business_type) businessType = profileRow.business_type;
        if (profileRow.business_location) businessLocation = profileRow.business_location;
        if (profileRow.city) city = profileRow.city;
        if (profileRow.state) state = profileRow.state;
      }
    } catch (err) {
      console.warn('Failed to fetch from public.profiles table:', err);
    }
  }

  const store = useStore.getState();
  store.updateUserProfile({
    id: user.id,
    email: user.email || store.userProfile.email,
    name: fullName,
    role: role,
    avatarUrl: avatarUrl,
    phone: phone,
    businessName: businessName || store.business.name,
    businessType: businessType,
    businessLocation: businessLocation || `${city}, ${state}`,
    city: city,
    state: state,
  });

  if (businessName && businessName !== store.business.name) {
    store.setBusiness({
      ...store.business,
      name: businessName,
      type: businessType || store.business.type,
      depot: {
        ...store.business.depot,
        address: businessLocation || store.business.depot.address,
      },
    });
  }

  store.setIsAuthenticated(true);
}

/**
 * Saves profile updates to Supabase profiles table, Supabase auth user metadata,
 * and updates the local store reactively.
 */
export async function saveUserProfileToSupabase(updates: Partial<UserProfile>): Promise<void> {
  const store = useStore.getState();
  // 1. Immediately update local store for instant UI feedback across app
  store.updateUserProfile(updates);

  // 2. If business details changed, sync business state
  if (updates.businessName || updates.businessType || updates.businessLocation) {
    store.setBusiness({
      ...store.business,
      ...(updates.businessName ? { name: updates.businessName } : {}),
      ...(updates.businessType ? { type: updates.businessType as BusinessType } : {}),
      ...(updates.businessLocation
        ? {
            depot: {
              ...store.business.depot,
              address: updates.businessLocation,
            },
          }
        : {}),
    });
  }

  // 3. Sync to Supabase if live
  if (isSupabaseConfigured && supabase) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Update auth user metadata
        await supabase.auth.updateUser({
          data: {
            full_name: updates.name !== undefined ? updates.name : user.user_metadata?.full_name,
            name: updates.name !== undefined ? updates.name : user.user_metadata?.name,
            role: updates.role || user.user_metadata?.role,
            avatar_url: updates.avatarUrl !== undefined ? updates.avatarUrl : user.user_metadata?.avatar_url,
            phone: updates.phone !== undefined ? updates.phone : user.user_metadata?.phone,
            business_name: updates.businessName !== undefined ? updates.businessName : user.user_metadata?.business_name,
            business_type: updates.businessType !== undefined ? updates.businessType : user.user_metadata?.business_type,
            business_location: updates.businessLocation !== undefined ? updates.businessLocation : user.user_metadata?.business_location,
            city: updates.city !== undefined ? updates.city : user.user_metadata?.city,
            state: updates.state !== undefined ? updates.state : user.user_metadata?.state,
          },
        });

        // Upsert to profiles table
        const profilePayload: Record<string, any> = {
          id: user.id,
          email: updates.email || user.email,
          full_name: updates.name !== undefined ? updates.name : '',
          role: updates.role || 'admin',
          updated_at: new Date().toISOString(),
        };

        if (updates.avatarUrl !== undefined) profilePayload.avatar_url = updates.avatarUrl;
        if (updates.phone !== undefined) profilePayload.phone = updates.phone;
        if (updates.businessName !== undefined) profilePayload.business_name = updates.businessName;
        if (updates.businessType !== undefined) profilePayload.business_type = updates.businessType;
        if (updates.businessLocation !== undefined) profilePayload.business_location = updates.businessLocation;
        if (updates.city !== undefined) profilePayload.city = updates.city;
        if (updates.state !== undefined) profilePayload.state = updates.state;

        const { error: upsertErr } = await supabase.from('profiles').upsert(profilePayload);
        if (upsertErr) {
          // If custom columns don't exist yet, retry with base columns
          await supabase.from('profiles').upsert({
            id: user.id,
            email: updates.email || user.email,
            full_name: updates.name || '',
            role: 'admin',
            updated_at: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.warn('Error saving user profile to Supabase:', err);
    }
  }

  trackEvent('order_updated', { type: 'profile_updated', name: updates.name });
}

/**
 * Updates user email with authentication verification.
 * In Supabase, this sends a confirmation link to the new email address.
 */
export async function updateUserEmailWithVerification(newEmail: string): Promise<EmailVerificationResult> {
  const cleanEmail = newEmail.trim().toLowerCase();
  if (!cleanEmail) {
    throw new Error('Please enter a valid email address.');
  }

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.auth.updateUser({ email: cleanEmail });
    if (error) {
      throw error;
    }
    return {
      success: true,
      message: `A verification link has been sent to ${cleanEmail}. Please verify the link in your inbox to complete the email change.`,
      verificationRequired: true,
    };
  }

  // Offline / local storage fallback
  useStore.getState().updateUserProfile({ email: cleanEmail });
  return {
    success: true,
    message: `Email updated to ${cleanEmail}. Verification link simulation confirmed.`,
    verificationRequired: false,
  };
}
