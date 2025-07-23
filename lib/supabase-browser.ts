// lib/supabase-browser.ts
// Proper singleton Supabase client for browser-side usage
// Uses @supabase/ssr for Next.js compatibility and session management

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  // Return existing client if already created (singleton pattern)
  if (supabaseClient) {
    return supabaseClient;
  }

  // Create new browser client using @supabase/ssr
  supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return supabaseClient;
}

// Export the singleton client
export const supabase = createClient();

// Export createBrowserClient for backward compatibility
export { createBrowserClient };

// Helper function to get current session with proper error handling
export async function getCurrentSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Session error:', error);
      return null;
    }
    return session;
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
}

// Helper function to get current user with proper error handling
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('User error:', error);
      return null;
    }
    return user;
  } catch (error) {
    console.error('Failed to get user:', error);
    return null;
  }
}

// Helper function to make authenticated API calls
export async function makeAuthenticatedRequest(url: string, options: RequestInit = {}) {
  const session = await getCurrentSession();
  
  if (!session) {
    throw new Error('No active session');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
}

