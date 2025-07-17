// app/admin/page.tsx (for /admin route)
import { createSupabaseServer } from '../../lib/supabase-server'; // Server client
import { redirect } from 'next/navigation'; // For redirects
import AdminSignupForm from './AdminSignupForm'; // Import the client form

// Server Guard: Only admin (async page for App Router)
export default async function AdminSignupPage() {
  const supabase = await createSupabaseServer();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return redirect('/login');
  const role = session.user.user_metadata.role;
  if (role !== 'admin') return redirect('/');

  // Render the client form if guard passes
  return <AdminSignupForm />;
}

export const dynamic = 'force-dynamic'; // Dynamic