'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, Shield, Zap, CreditCard } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Logo } from '@/app/components/ui/logo';
import { supabase } from '@/lib/supabase-browser';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!email || !password) {
      toast.error('Please enter both email and password');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (error) {
        toast.error(error.message);
        console.error('Login error:', error);
        setLoading(false);
        return;
      }

      const { session } = data;
      if (session) {
        toast.success('Welcome back!');
        const role = session.user.user_metadata.role || 'merchant';
        console.log('Verified client session:', JSON.stringify(session, null, 2));
        console.log('Role after login:', role);
        
        // Redirect based on role
        if (role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/merchant/dashboard');
        }
      } else {
        toast.error('Session not available');
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
      <div className="hidden lg:flex flex-1 bg-[#7f5efd] relative overflow-hidden">
        <div className="relative flex items-center justify-center p-12">
          <div className="text-center text-white max-w-lg">
            <div className="mb-8">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                <Shield className="h-12 w-12 text-white" />
              </div>
              <h2 className="font-phonic text-4xl font-normal mb-4">Secure Crypto Payments</h2>
              <p className="font-capsule text-base text-white/90">
                Welcome to the future of payments. Manage your cryptocurrency transactions with confidence and security.
              </p>
            </div>

            {/* Trust Indicators */}
            <div className="space-y-6">
              <div className="flex items-center justify-center space-x-4 text-white/90">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span className="font-phonic font-normal">Non-Custodial Security</span>
                </div>
              </div>
              <div className="flex items-center justify-center space-x-4 text-white/90">
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span className="font-phonic font-normal">Instant Processing</span>
                </div>
              </div>
              <div className="flex items-center justify-center space-x-4 text-white/90">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span className="font-phonic font-normal">Global Support</span>
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
            <h1 className="font-martina text-6xl font-normal text-gray-900 mb-3">Welcome back</h1>
            <p className="font-capsule text-base text-gray-600">
              Sign in to your Cryptrac account to manage your crypto payments
            </p>
          </div>

          {/* Login Form */}
          <Card className="shadow-xl border-0 bg-white">
            <CardHeader className="space-y-2 pb-8">
              <CardTitle className="font-phonic text-3xl font-normal text-center text-gray-900">Sign in</CardTitle>
              <CardDescription className="font-phonic text-base text-center text-gray-600">
                Enter your credentials to access your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <form onSubmit={handleLogin} className="space-y-6">
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
                  placeholder="Enter your password"
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
                  autoComplete="current-password"
                  disabled={loading}
                  required
                />

                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <Link 
                      href="/forgot-password" 
                      className="font-phonic text-[#7f5efd] hover:text-[#7c3aed] font-normal transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-14 font-phonic text-base font-normal shadow-lg bg-[#7f5efd] hover:bg-[#7c3aed] text-white"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-sm text-gray-600">
                  Don&apos;t have an account?{' '}
                  <Link 
                    href="/signup" 
                    className="font-phonic text-[#7f5efd] hover:text-[#7c3aed] font-normal transition-colors"
                  >
                    Sign up for free
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500">
            <p>
              By signing in, you agree to our{' '}
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

