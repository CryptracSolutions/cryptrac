// app/login/page.tsx
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase-server'; // Alias works
import toast from 'react-hot-toast';

export default function Login() {
  return (
    <div style={{ maxWidth: '300px', margin: 'auto', padding: '20px' }}>
      <h1>Login</h1>
      <form action={handleLogin}>
        <input type="email" name="email" placeholder="Email" style={{ display: 'block', margin: '10px 0' }} autoComplete="email" />
        <input type="password" name="password" placeholder="Password" style={{ display: 'block', margin: '10px 0' }} autoComplete="current-password" />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

async function handleLogin(formData: FormData) {
  'use server'; // Mark as server action
  const supabase = await createServerClient(); // Await the async function
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    toast.error('Enter email and password');
    return;
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    toast.error(error.message);
    console.error('Login error:', error);
    return;
  }

  const { session } = data;
  if (session) {
    toast.success('Logged in!'); // Verify this works
    const role = session.user.user_metadata.role || 'merchant';
    console.log('Verified server session:', JSON.stringify(session, null, 2));
    console.log('Role after login:', role);
    alert(`Logging in as ${role}. Session: ${JSON.stringify(session, null, 2)}`);
    // Redirect based on role
    if (role === 'admin') {
      redirect('/admin');
    } else {
      redirect('/');
    }
  } else {
    toast.error('Session not available');
  }
}

export const dynamic = 'force-dynamic'; // Ensure dynamic rendering