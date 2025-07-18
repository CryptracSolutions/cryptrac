'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'react-hot-toast';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!email || !password || !confirmPassword || !businessName) {
      toast.error('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      // Get country from IP (simplified for now)
      let country = 'US';
      try {
        const ipResponse = await fetch('https://ipapi.co/json/' );
        const ipData = await ipResponse.json();
        country = ipData.country_code || 'US';
      } catch (err) {
        console.warn('Could not detect country, defaulting to US:', err);
      }

      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'merchant', // Default role for signup
            business_name: businessName,
            country: country,
            onboarded: false,
            setup_paid: false,
            trial_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          }
        }
      });

      if (error) {
        toast.error(error.message);
        console.error('Signup error:', error);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Check if email confirmation is required
        if (!data.session) {
          toast.success('Please check your email to confirm your account');
        } else {
          toast.success('Account created successfully!');
          // Redirect to onboarding or dashboard
          router.push('/merchant/onboarding');
        }
      }
    } catch (err) {
      console.error('Unexpected signup error:', err);
      toast.error('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: 'auto', padding: '20px' }}>
      <h1>Sign Up for Cryptrac</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Start accepting cryptocurrency payments today. 7-day free trial included.
      </p>
      
      <form onSubmit={handleSignup}>
        <input 
          type="text" 
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="Business Name" 
          style={{ 
            display: 'block', 
            margin: '10px 0', 
            width: '100%', 
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }} 
          disabled={loading}
          required
        />
        
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email" 
          style={{ 
            display: 'block', 
            margin: '10px 0', 
            width: '100%', 
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }} 
          autoComplete="email"
          disabled={loading}
          required
        />
        
        <input 
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (min 6 characters)" 
          style={{ 
            display: 'block', 
            margin: '10px 0', 
            width: '100%', 
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }} 
          autoComplete="new-password"
          disabled={loading}
          required
        />
        
        <input 
          type="password" 
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm Password" 
          style={{ 
            display: 'block', 
            margin: '10px 0', 
            width: '100%', 
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }} 
          autoComplete="new-password"
          disabled={loading}
          required
        />
        
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: '12px', 
            backgroundColor: loading ? '#ccc' : '#7f5efd',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {loading ? 'Creating Account...' : 'Start Free Trial'}
        </button>
      </form>
      
      <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
        Already have an account?{' '}
        <a 
          href="/login" 
          style={{ color: '#7f5efd', textDecoration: 'none' }}
        >
          Sign in
        </a>
      </p>
      
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '4px',
        fontSize: '14px',
        color: '#666'
      }}>
        <strong>What you get:</strong>
        <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
          <li>7-day free trial (setup fee waived)</li>
          <li>Accept Bitcoin, Ethereum, and more</li>
          <li>Non-custodial security (you control your keys)</li>
          <li>2.9% transaction fees</li>
        </ul>
      </div>
    </div>
  );
}
