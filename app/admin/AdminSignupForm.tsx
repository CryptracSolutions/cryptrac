"use client"; // Client component for the form

import { useState } from 'react';
import { createBrowserClient } from '../../lib/supabase-browser'; // Relative path
import toast from 'react-hot-toast';

const supabase = createBrowserClient(); // Singleton

export default function AdminSignupForm() {
  const [email, setEmail] = useState('admin@cryptrac.com'); // Hardcoded
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (email !== 'admin@cryptrac.com') {
      toast.error('Only admin@cryptrac.com allowed');
      return;
    }
    if (!password) {
      toast.error('Enter password');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      toast.error(error.message);
    } else if (data.user) {
      await supabase.from('profiles').insert({ id: data.user.id, role: 'admin' });
      toast.success('Admin signed up! Set up 2FA in settings.');
      window.location.href = '/login';
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '300px', margin: 'auto', padding: '20px' }}>
      <h1>Admin Signup</h1>
      <input
        type="email"
        value={email}
        disabled
        style={{ display: 'block', margin: '10px 0' }}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: 'block', margin: '10px 0' }}
      />
      <button onClick={handleSignup} disabled={loading}>
        {loading ? 'Signing up...' : 'Signup Admin'}
      </button>
    </div>
  );
};