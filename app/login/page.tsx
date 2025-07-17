"use client"; // Client component

// app/login/page.tsx
import { useState, useEffect } from 'react';
import { createBrowserClient } from '../../lib/supabase-browser'; // Relative path
import toast from 'react-hot-toast';

const supabase = createBrowserClient(); // Singleton

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Test toast on load
  useEffect(() => {
    toast.success('Test toast - if visible, fix worked!');
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error('Enter email and password');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    console.log(error); // Debug
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Logged in!');
      window.location.href = '/';
    }
  };

  return (
    <div style={{ maxWidth: '300px', margin: 'auto', padding: '20px' }}>
      <h1>Login</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ display: 'block', margin: '10px 0' }}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: 'block', margin: '10px 0' }}
      />
      <button onClick={handleLogin} disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </div>
  );
}

export const dynamic = 'force-dynamic'; // Add this to make page dynamic (fixes prerender env issue)