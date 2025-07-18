// lib/auth-guards.ts
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { User } from '@supabase/supabase-js';

// Types for user roles
export type UserRole = 'merchant' | 'rep' | 'partner' | 'admin';

// Interface for user session with role
export interface UserSession {
  user: User;
  role: UserRole;
  country?: string;
}

// Hook for role-based authentication guard
export function useRoleGuard(
  allowedRoles: UserRole[], 
  allowedCountries: string[] = ['US']
) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session: authSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth error:', error);
          router.push('/login');
          return;
        }

        if (!authSession) {
          router.push('/login');
          return;
        }

        const role = authSession.user.user_metadata.role as UserRole || 'merchant';
        const country = authSession.user.user_metadata.country || 'US';

        // Check if role is allowed
        if (!allowedRoles.includes(role)) {
          console.warn(`Access denied: Role ${role} not in allowed roles:`, allowedRoles);
          router.push('/');
          return;
        }

        // Check if country is allowed (for future international expansion)
        if (!allowedCountries.includes(country)) {
          console.warn(`Access restricted: Country ${country} not in allowed countries:`, allowedCountries);
          // For now, just log warning but allow access (per Bible - future expansion)
        }

        setSession({
          user: authSession.user,
          role,
          country
        });
      } catch (err) {
        console.error('Unexpected auth error:', err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setSession(null);
          router.push('/login');
        } else if (event === 'SIGNED_IN' && session) {
          const role = session.user.user_metadata.role as UserRole || 'merchant';
          const country = session.user.user_metadata.country || 'US';
          
          if (allowedRoles.includes(role)) {
            setSession({
              user: session.user,
              role,
              country
            });
          } else {
            router.push('/');
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [allowedRoles, allowedCountries, router, supabase.auth]);

  return { session, loading };
}

// Hook for checking if user is authenticated (any role)
export function useAuth() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session: authSession } } = await supabase.auth.getSession();
        
        if (authSession) {
          const role = authSession.user.user_metadata.role as UserRole || 'merchant';
          const country = authSession.user.user_metadata.country || 'US';
          
          setSession({
            user: authSession.user,
            role,
            country
          });
        }
      } catch (err) {
        console.error('Auth check error:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setSession(null);
        } else if (session) {
          const role = session.user.user_metadata.role as UserRole || 'merchant';
          const country = session.user.user_metadata.country || 'US';
          
          setSession({
            user: session.user,
            role,
            country
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  return { session, loading };
}

// Utility function to check if user has specific role
export function hasRole(session: UserSession | null, role: UserRole): boolean {
  return session?.role === role;
}

// Utility function to check if user is admin (hardcoded email check)
export function isAdmin(session: UserSession | null): boolean {
  return session?.user.email === 'admin@cryptrac.com' || session?.role === 'admin';
}

// Logout function
export async function logout() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  await supabase.auth.signOut();
}
