"use client"; // Client component

// app/signup/page.tsx
import { useState, useEffect } from 'react';
import { createBrowserClient } from '../../lib/supabase-browser'; // Relative path
import toast from 'react-hot-toast';

const supabase = createBrowserClient(); // Singleton

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('merchant'); // Default role
  const [loading, setLoading] = useState(false);

  // Test toast on load
  useEffect(() => {
    toast.success('Test toast on signup - working!');
  }, []);

  const handleSignup = async () => {
    if (!email || !password || !role) {
      toast.error('Enter all fields');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      toast.error(error.message);
    } else if (data.user) { // Null check to fix type error
      // Set role metadata (Bible Section 5) - assume profiles table; add migration if needed
      await supabase.from('profiles').insert({ id: data.user.id, role });
      toast.success('Signed up!');
      window.location.href = '/login';
    } else {
      toast.error('Signup succeeded but user data missing');
    }
    setLoading(false);
  };

  // Stub country check (ipapi)
  useEffect(() => {
    fetch('https://ipapi.co/json/').then(res => res.json()).then(data => {
      if (data.country_code !== 'US') {
        toast.warning('US-only - Proceed at own risk');
      }
    });
  }, []);

  return (
    <div style={{ maxWidth: '300px', margin: 'auto', padding: '20px' }}>
      <h1>Signup</h1>
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
      <select value={role} onChange={(e) => setRole(e.target.value)} style={{ display: 'block', margin: '10px 0' }}>
        <option value="merchant">Merchant</option>
        <option value="rep">Rep</option>
        <option value="partner">Partner</option>
      </select>
      <button onClick={handleSignup} disabled={loading}>
        {loading ? 'Signing up...' : 'Signup'}
      </button>
    </div>
  );
}

export const dynamic = 'force-dynamic'; // Dynamic for env