"use client";

import Link from "next/link";
import { ArrowRight, Shield, Zap, Globe, CheckCircle, Bitcoin, Smartphone, BarChart3 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Logo } from "@/app/components/ui/logo";
import { CryptoIcon } from "@/app/components/ui/crypto-icon";

export default function Home() {
  const features = [
    {
      icon: Shield,
      title: "Non-Custodial Security",
      description: "You hold your keys - we never touch your funds. Direct wallet-to-wallet transfers ensure maximum security."
    },
    {
      icon: Zap,
      title: "Instant Setup",
      description: "Get started in minutes. Generate payment links, QR codes, and invoices with just a few clicks."
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Accept payments from anywhere in the world. Support for all major cryptocurrencies."
    },
    {
      icon: BarChart3,
      title: "Real-time Analytics",
      description: "Track your payments, revenue, and performance with comprehensive dashboard analytics."
    },
    {
      icon: Smartphone,
      title: "Mobile Optimized",
      description: "Perfect for point-of-sale. Mobile-friendly interface works on any device."
    },
    {
      icon: Bitcoin,
      title: "Multi-Currency",
      description: "Support for Bitcoin, Ethereum, Litecoin, and many more cryptocurrencies."
    }
  ];

  const supportedCryptos = [
    { symbol: "BTC", name: "Bitcoin" },
    { symbol: "ETH", name: "Ethereum" },
    { symbol: "LTC", name: "Litecoin" },
    { symbol: "ADA", name: "Cardano" },
    { symbol: "DOT", name: "Polkadot" },
    { symbol: "USDT", name: "Tether" }
  ];

  const benefits = [
    "30-day free trial",
    "$19/month or $199/year subscription – 30 days free",
    "Cryptrac Gateway Fee: 0.5% (no conversion), 1% (auto-convert enabled)",
    "Non-custodial security",
    "Real-time notifications",
    "Mobile-friendly interface"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container-wide flex h-16 items-center justify-between">
          <Logo size="md" />
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Features
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Pricing
            </Link>
            <Link href="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              About
            </Link>
          </nav>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-primary-50 py-20 sm:py-32">
        <div className="container-wide">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-6">
              🚀 Now in Beta - Join the Future of Payments
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Get Paid in{" "}
              <span className="text-gradient">Crypto</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
              Modern Payments to Grow your Revenue. Non-custodial gateway for Bitcoin, Ethereum, Solana and all supported cryptos.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button size="lg" className="text-base" asChild>
                <Link href="/signup">
                  Get Started Free - 30-Day Trial Available
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="text-base" asChild>
                <Link href="#features">Learn More</Link>
              </Button>
            </div>
            <div className="mt-8 text-sm text-muted-foreground">
              30-day free trial • $19/month or $199/year • Cryptrac Gateway Fee applies (see pricing)
            </div>
          </div>
        </div>
      </section>

      {/* Supported Cryptocurrencies */}
      <section className="py-16 bg-white">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Accept All Major Cryptocurrencies
            </h2>
            <p className="text-muted-foreground">
              Support for Bitcoin, Ethereum, and many more digital currencies
            </p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-8">
            {supportedCryptos.map((crypto) => (
              <div key={crypto.symbol} className="flex items-center gap-3">
                <CryptoIcon currency={crypto.symbol} size="lg" />
                <div>
                  <div className="font-medium text-gray-900">{crypto.name}</div>
                  <div className="text-sm text-muted-foreground">{crypto.symbol}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="container-wide">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything you need to accept crypto payments
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built for businesses of all sizes. From freelancers to enterprises, Cryptrac makes crypto payments simple.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="container-wide">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-muted-foreground">
              Cryptrac does not charge any transaction fee. A Gateway Fee (0.5% or 1%) is automatically deducted by the platform per transaction—see dashboard for breakdown. This fee is not Cryptrac revenue.
            </p>
          </div>
          <div className="max-w-lg mx-auto">
            <Card className="border-2 border-primary shadow-xl">
              <CardHeader className="text-center pb-8">
                <div className="flex justify-center mb-4">
                  <Badge variant="default" className="text-sm">
                    Most Popular
                  </Badge>
                </div>
                <CardTitle className="text-3xl font-bold">Cryptrac</CardTitle>
                <CardDescription className="text-lg">
                  Everything you need to get started
                </CardDescription>
                <div className="mt-6">
                  <span className="text-4xl font-bold">$19</span>
                  <span className="text-muted-foreground ml-2">/month</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  or $199/year (save $29)
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span className="text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>
                <Button size="lg" className="w-full" asChild>
                  <Link href="/signup">Start Free Trial</Link>
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Accept all cryptos, 0.5% Gateway fee, 30-day trial for setup
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-400">
        <div className="container-wide text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to start accepting crypto payments?
          </h2>
          <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses already using Cryptrac to accept cryptocurrency payments securely and efficiently.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-base" asChild>
              <Link href="/signup">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base border-white text-white hover:bg-white hover:text-primary" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container-wide">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <Logo variant="white" size="md" className="mb-4" />
              <p className="text-gray-400 max-w-md">
                The simplest way to accept cryptocurrency payments. Non-custodial, secure, and designed for modern businesses.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#features" className="hover:text-white">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/signup" className="hover:text-white">Get Started</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Cryptrac. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export const dynamic = 'force-dynamic';

