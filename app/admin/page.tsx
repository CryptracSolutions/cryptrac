import { createSupabaseServer } from '@/lib/supabase-server'; // Alias
import { redirect } from 'next/navigation'; // For redirects
import AdminSignupForm from './AdminSignupForm'; // Import the client form
import { cookies } from 'next/headers'; // For cookie debug

export default async function AdminSignupPage({ searchParams }: { searchParams: Promise<{ session?: string }> }) {
  const supabase = await createSupabaseServer();
  const { data: { session: serverSession } } = await supabase.auth.getSession();

  // Debug: Log server session and cookies
  console.log('Server session in guard:', serverSession);
  const cookieStore = await cookies();
  console.log('Server cookies:', cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; '));

  let session = serverSession;
  let role: string | undefined;

  // Await searchParams and fallback to query param if server session is null
  const params = await searchParams;
  if (!session && params.session) {
    try {
      session = JSON.parse(decodeURIComponent(params.session));
      console.log('Fallback session from query:', session);
      role = session.user.user_metadata.role;
    } catch (e) {
      console.error('Invalid session from query:', e);
    }
  } else {
    role = session?.user.user_metadata.role;
  }

  if (!session) {
    console.log('No session - redirect to /login');
    return redirect('/login');
  }
  console.log('Role in guard:', role);
  if (role !== 'admin') {
    console.log('Not admin - redirect to /login');
    return redirect('/login');
  }
  console.log('Guard passed - showing form');

  // Render the client form if guard passes
  return <AdminSignupForm />;
}

export const dynamic = 'force-dynamic'; // Dynamic