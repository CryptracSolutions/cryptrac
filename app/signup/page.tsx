'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, Shield, Zap, CreditCard, CheckCircle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Logo } from '@/app/components/ui/logo';
import { createClient } from '@/lib/supabase-browser';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!email || !password) {
      toast.error('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      // Get country from IP
      let country = 'US';
      try {
        const ipResponse = await fetch('https://ipapi.co/json/' );
        const ipData = await ipResponse.json();
        country = ipData.country_code || 'US';
      } catch (ipError) {
        console.warn('Could not detect country:', ipError);
      }

      // Calculate trial end date (30 days from now)
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 30);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'merchant',
            country: country,
            trial_end: trialEnd.toISOString(),
            onboarded: false,
            setup_paid: false,
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
        toast.success('Account created successfully! Welcome to Cryptrac!');
        console.log('User created:', data.user);
        
        // Redirect to onboarding wizard for new users
        router.push('/merchant/onboarding');
      } else {
        toast.error('Account creation failed');
        setLoading(false);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[#7f5efd] to-[#7c3aed] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#7f5efd]/90 to-[#7c3aed]/90"></div>
        <div className="relative flex items-center justify-center p-12">
          <div className="text-center text-white max-w-lg">
            <div className="mb-8">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                <Zap className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Start Accepting Crypto Today</h2>
              <p className="text-xl text-white/90 leading-relaxed">
                Join the cryptocurrency revolution. Set up your payment gateway in minutes and start accepting digital payments from customers worldwide.
              </p>
            </div>

            {/* Trust Indicators */}
            <div className="space-y-6">
              <div className="flex items-center justify-center space-x-4 text-white/90">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span className="font-medium">Secure & Non-Custodial</span>
                </div>
              </div>
              <div className="flex items-center justify-center space-x-4 text-white/90">
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span className="font-medium">Instant Setup</span>
                </div>
              </div>
              <div className="flex items-center justify-center space-x-4 text-white/90">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span className="font-medium">Global Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and Header */}
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <Logo size="lg" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Welcome to the future of payments</h1>
            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              Join thousands of businesses already using Cryptrac to accept cryptocurrency payments from customers
            </p>
            <div className="flex justify-center">
              <Badge className="bg-[#f5f3ff] text-[#7f5efd] border-[#ede9fe] px-4 py-2 text-sm font-semibold">
                30-day free trial
              </Badge>
            </div>
          </div>

          {/* Signup Form */}
          <Card className="shadow-xl border-0 bg-white">
            <CardHeader className="space-y-2 pb-8">
              <CardTitle className="text-2xl font-bold text-center text-gray-900">Create account</CardTitle>
              <CardDescription className="text-center text-gray-600">
                $19/month or $199/year after trial
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <form onSubmit={handleSignup} className="space-y-6">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  label="Email Address"
                  leftIcon={<Mail className="h-4 w-4" />}
                  autoComplete="email"
                  disabled={loading}
                  required
                />
                
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  label="Password"
                  leftIcon={<Lock className="h-4 w-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                  autoComplete="new-password"
                  disabled={loading}
                  required
                />

                <div className="text-sm text-gray-500">
                  Password must be at least 6 characters long
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-14 text-lg font-semibold shadow-lg bg-[#7f5efd] hover:bg-[#7c3aed] text-white"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link 
                    href="/login" 
                    className="text-[#7f5efd] hover:text-[#7c3aed] font-semibold transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-[#7f5efd] flex-shrink-0" />
                <span>Accept Bitcoin, Ethereum, and more</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-[#7f5efd] flex-shrink-0" />
                <span>Non-custodial - you control your funds</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-[#7f5efd] flex-shrink-0" />
                <span>Gateway Fee: 0.5% (direct), 1% (auto-convert)</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500">
            <p>
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="text-[#7f5efd] hover:text-[#7c3aed] transition-colors">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-[#7f5efd] hover:text-[#7c3aed] transition-colors">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';

