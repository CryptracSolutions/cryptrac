"use client"; // Client component

// app/page.tsx (homepage with logout for testing)
import { createBrowserClient } from '../lib/supabase-browser';
import toast from 'react-hot-toast';

const supabase = createBrowserClient(); // Singleton

export default function Home() {
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Logged out');
      window.location.href = '/login';
    }
  };

  return (
    <main style={{ maxWidth: '300px', margin: 'auto', padding: '20px' }}>
      <h1>Home Page</h1>
      <button onClick={handleLogout}>
        Logout
      </button>
    </main>
  );
}

export const dynamic = 'force-dynamic'; // Dynamic for env