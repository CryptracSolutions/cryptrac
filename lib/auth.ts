// lib/auth.ts
import { createSupabaseServer } from './supabase-server'; // Server client
import { redirect } from 'next/navigation'; // For redirects
import { useEffect, useState } from 'react'; // For client hook
import { createBrowserClient } from './supabase-browser'; // Client client

// Server Guard (for async pages)
export async function withAuth(allowedRoles: string[]) {
  const supabase = await createSupabaseServer();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return redirect('/login');
  const role = session.user.user_metadata.role;
  if (!allowedRoles.includes(role)) return redirect('/');
  return session;
}

// Client Guard Hook (for use in pages)
export function useRoleGuard(allowedRoles: string[]) {
  const [session, setSession] = useState(null);
  const supabase = createBrowserClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) window.location.href = '/login';
      const role = data.session?.user.user_metadata.role;
      if (role && !allowedRoles.includes(role)) window.location.href = '/';
    });
  }, [allowedRoles, supabase.auth]); // Add deps to fix warning

  return session;
}