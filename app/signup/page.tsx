'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, Building } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Logo } from '@/app/components/ui/logo';
import { createBrowserClient } from '@/lib/supabase-browser';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createBrowserClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!email || !password || !businessName) {
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

      // Calculate trial end date (7 days from now)
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 7);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'merchant',
            business_name: businessName,
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Logo size="lg" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Get started with Cryptrac</h1>
          <p className="mt-2 text-gray-600">
            Accept crypto payments in minutes
          </p>
          <div className="flex justify-center mt-4">
            <Badge variant="success" className="text-xs">
              7-day free trial • No setup fees during trial
            </Badge>
          </div>
        </div>

        {/* Signup Form */}
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl text-center">Create account</CardTitle>
            <CardDescription className="text-center">
              Start accepting cryptocurrency payments today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <Input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Enter your business name"
                label="Business Name"
                leftIcon={<Building className="h-4 w-4" />}
                disabled={loading}
                required
              />

              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                label="Email"
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
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                autoComplete="new-password"
                disabled={loading}
                required
              />

              <div className="text-xs text-muted-foreground">
                Password must be at least 6 characters long
              </div>

              <Button 
                type="submit" 
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link 
                  href="/login" 
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="text-center space-y-3">
          <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
              <span>Accept Bitcoin, Ethereum, and more</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
              <span>Non-custodial - you control your funds</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
              <span>2.9% transaction fee</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-primary hover:text-primary/80">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-primary hover:text-primary/80">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';

