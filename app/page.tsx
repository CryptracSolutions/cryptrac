"use client";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { ArrowRight, Shield, Zap, Globe, CheckCircle, Bitcoin, Smartphone, BarChart3, DollarSign, HelpCircle, Network, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Logo } from "@/app/components/ui/logo";
import { CryptoIcon } from "@/app/components/ui/crypto-icon";
import { LandingNav } from "@/app/components/layout/landing-nav";

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

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

  const CARDS_PER_VIEW = 3;
  const maxSlide = Math.max(0, features.length - CARDS_PER_VIEW);

  const nextSlide = () => {
    if (currentSlide < maxSlide) {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(Math.max(0, Math.min(maxSlide, index)));
  };

  const supportedCryptos = [
    { symbol: "BTC", name: "Bitcoin" },
    { symbol: "ETH", name: "Ethereum" },
    { symbol: "SOL", name: "Solana" },
    { symbol: "XRP", name: "Ripple" },
    { symbol: "BNB", name: "Binance Smart Chain" },
    { symbol: "TRX", name: "Tron" },
    { symbol: "AVAX", name: "Avalanche" },
    { symbol: "XLM", name: "Stellar" },
    { symbol: "TON", name: "Toncoin" },
    { symbol: "SUI", name: "Sui" },
    { symbol: "USDC", name: "USD Coin" },
    { symbol: "USDT", name: "USD Tether" },
    { symbol: "LTC", name: "Litecoin" },
    { symbol: "ADA", name: "Cardano" },
    { symbol: "DOGE", name: "Dogecoin" },
    { symbol: "ALGO", name: "Algorand" },
    { symbol: "DOT", name: "Polkadot" },
    { symbol: "BASE", name: "Base" },
    { symbol: "MATIC", name: "Polygon" },
    { symbol: "PYUSD", name: "PayPal USD" }
  ];

  const benefits = [
    "30-day free trial",
    "No transaction fees to Cryptrac",
    "Gateway fees: 0.5% (direct) or 1% (auto-convert)",
    "Non-custodial security",
    "Real-time notifications",
    "Mobile-friendly interface",
    "Comprehensive analytics",
    "Multi-currency support"
  ];

  const faqItems = [
    {
      question: "What does Cryptrac cost?",
      answer: "Cryptrac charges $19/month (or $199/year) for platform access. We don't take any transaction fees - you only pay gateway fees (0.5% for direct payments, 1% for auto-convert) which go to the payment processor, not to Cryptrac."
    },
    {
      question: "Are there any hidden fees?",
      answer: "Absolutely not. Our pricing is completely transparent: $19/month subscription + gateway fees (0.5% or 1%). Network fees may apply depending on the cryptocurrency and blockchain congestion, but these are blockchain costs, not Cryptrac fees."
    },
    {
      question: "How do gateway fees work?",
      answer: "Gateway fees are charged by the payment processor (not Cryptrac) for handling transactions. You can choose whether you or your customers pay these fees. Direct payments: 0.5%, Auto-convert payments: 1%."
    },
    {
      question: "Why is crypto cheaper than credit cards?",
      answer: "Traditional processors like Stripe charge 2.9% + $0.30 per transaction. Crypto gateway fees are typically 0.5-1% with no fixed fees, making them cheaper for most transaction sizes, especially larger payments."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <LandingNav />

      {/* Hero Section - Left Aligned */}
      <section id="hero" className="relative overflow-hidden py-16 sm:py-20 lg:py-24">
        {/* Base Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-[#f8f7ff]"></div>
        
        {/* Flowing Wave Background */}
        <div className="absolute inset-0 overflow-hidden">
          <svg
            className="absolute -left-[10%] -right-[10%] -top-[10%] -bottom-[10%] w-[120%] h-[120%]"
            viewBox="0 0 1400 900"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Purple Wave Gradient */}
              <linearGradient id="purpleWave" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#a78bfa" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#7f5efd" stopOpacity="0.2" />
              </linearGradient>
              
              {/* Cyan Wave Gradient */}
              <linearGradient id="cyanWave" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.2" />
              </linearGradient>
              
              {/* Light Purple Overlay */}
              <linearGradient id="lightPurple" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e0e7ff" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#c7d2fe" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#a5b4fc" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            
            {/* Main Purple Wave - Extended */}
            <path
              d="M-200,450 C100,350 300,550 600,450 C900,350 1200,550 1600,450 L1600,900 L-200,900 Z"
              fill="url(#purpleWave)"
              className="animate-wave-1-enhanced"
            />
            
            {/* Secondary Purple Wave - Extended */}
            <path
              d="M-200,500 C200,400 500,600 900,500 C1200,400 1400,600 1600,500 L1600,900 L-200,900 Z"
              fill="url(#purpleWave)"
              className="animate-wave-2-enhanced"
              opacity="0.6"
            />
            
            {/* Cyan Wave - Extended */}
            <path
              d="M-200,350 C150,250 450,450 750,350 C1050,250 1300,450 1600,350 L1600,900 L-200,900 Z"
              fill="url(#cyanWave)"
              className="animate-wave-3-enhanced"
            />
            
            {/* Light Purple Overlay Wave - Extended */}
            <path
              d="M-200,300 C100,200 400,400 700,300 C1000,200 1300,400 1600,300 L1600,900 L-200,900 Z"
              fill="url(#lightPurple)"
              className="animate-wave-1-enhanced"
              opacity="0.7"
            />
            
            {/* Top Flowing Curves - Extended */}
            <path
              d="M-200,250 Q200,150 700,250 T1600,250 L1600,0 L-200,0 Z"
              fill="url(#cyanWave)"
              className="animate-wave-2-enhanced"
              opacity="0.3"
            />
            
            <path
              d="M-200,200 Q300,100 900,200 T1600,200 L1600,0 L-200,0 Z"
              fill="url(#purpleWave)"
              className="animate-wave-3-enhanced"
              opacity="0.4"
            />
            
            {/* Bottom Flowing Curves - Extended */}
            <path
              d="M-200,600 Q400,500 800,600 T1600,600 L1600,900 L-200,900 Z"
              fill="url(#lightPurple)"
              className="animate-wave-1-enhanced"
              opacity="0.3"
            />
            
            {/* Flowing Lines - Extended */}
            <path
              d="M-200,370 Q200,270 700,370 T1600,370"
              stroke="url(#purpleWave)"
              strokeWidth="2"
              fill="none"
              className="animate-wave-1-enhanced"
              opacity="0.5"
            />
            
            <path
              d="M-200,430 Q300,330 800,430 T1600,430"
              stroke="url(#cyanWave)"
              strokeWidth="1.5"
              fill="none"
              className="animate-wave-2-enhanced"
              opacity="0.4"
            />
            
            {/* Additional seamless waves */}
            <path
              d="M-200,550 Q500,450 1000,550 T1600,550 L1600,900 L-200,900 Z"
              fill="url(#purpleWave)"
              className="animate-wave-3-enhanced"
              opacity="0.2"
            />
          </svg>
        </div>
        
        <div className="container-wide relative z-10">
          {/* Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[600px]">
            
            {/* Left Column - Content */}
            <div className="text-left">
              {/* Enhanced Heading */}
              <div className="relative mb-6">
                <h1 className="font-martina text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-normal text-gray-900 leading-tight">
                  Get Paid in{" "}
                  <span className="relative inline-block">
                    <span className="font-martina text-[#7f5efd] font-semibold">Crypto</span>
                    {/* Subtle underline decoration */}
                    <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-[#7f5efd] to-[#a78bfa] opacity-20 rounded-full"></div>
                  </span>
                </h1>
              </div>
              
              {/* Enhanced Subheading */}
              <p className="font-capsule text-lg sm:text-xl lg:text-2xl font-normal text-gray-600 mb-8 leading-relaxed max-w-2xl">
                Modern Payments to Grow your Revenue. Non-custodial gateway for Bitcoin, Ethereum, Solana and all major cryptos.
              </p>
              
              {/* Call-to-Action Buttons */}
              <div className="flex flex-col sm:flex-row items-start gap-4 mb-6">
                <Button size="lg" className="font-phonic text-lg font-normal px-10 py-4 h-14 shadow-xl bg-[#7f5efd] hover:bg-[#7c3aed] text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl" asChild>
                  <Link href="/signup">
                    Start Free 30-Day Trial
                    <ArrowRight className="ml-3 h-6 w-6" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="font-phonic text-lg font-normal px-10 py-4 h-14 border-2 border-[#7f5efd] text-[#7f5efd] hover:bg-[#7f5efd] hover:text-white transition-all duration-300" asChild>
                  <Link href="#pricing">View Pricing</Link>
                </Button>
              </div>
              
              {/* Trial Info */}
              <div className="font-phonic text-sm text-gray-500 mb-8 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                30-day free trial • $19/month • Cancel anytime
              </div>

              {/* Trust Indicators - Vertical Stack */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#f5f3ff] rounded-lg flex items-center justify-center">
                    <Shield className="h-5 w-5 text-[#7f5efd]" />
                  </div>
                  <span className="font-phonic font-medium text-gray-700">Secure & Non-Custodial</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#f5f3ff] rounded-lg flex items-center justify-center">
                    <Zap className="h-5 w-5 text-[#7f5efd]" />
                  </div>
                  <span className="font-phonic font-medium text-gray-700">Instant Setup</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#f5f3ff] rounded-lg flex items-center justify-center">
                    <Globe className="h-5 w-5 text-[#7f5efd]" />
                  </div>
                  <span className="font-phonic font-medium text-gray-700">Global Support</span>
                </div>
              </div>
              
              {/* Stats - Horizontal Layout */}
              <div className="grid grid-cols-3 gap-6 max-w-md">
                <div>
                  <div className="font-phonic text-2xl sm:text-3xl font-semibold text-[#7f5efd] mb-1">140+</div>
                  <div className="font-phonic text-sm text-gray-600">Cryptocurrencies</div>
                </div>
                <div>
                  <div className="font-phonic text-2xl sm:text-3xl font-semibold text-[#7f5efd] mb-1">0.5%</div>
                  <div className="font-phonic text-sm text-gray-600">Gateway Fees</div>
                </div>
                <div>
                  <div className="font-phonic text-2xl sm:text-3xl font-semibold text-[#7f5efd] mb-1">$19</div>
                  <div className="font-phonic text-sm text-gray-600">Per Month</div>
                </div>
              </div>
            </div>

            {/* Right Column - Visual Element */}
            <div className="relative flex items-center justify-center">
              {/* Main Dashboard Mockup */}
              <div className="relative w-full max-w-lg">
                {/* Floating Payment Card */}
                <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#7f5efd] to-[#7c3aed] rounded-lg flex items-center justify-center">
                        <Bitcoin className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="font-phonic text-sm font-medium text-gray-900">Payment Link</div>
                        <div className="font-phonic text-xs text-gray-500">cryptrac.com/pay/abc123</div>
                      </div>
                    </div>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="font-phonic text-sm text-gray-600">Subtotal</span>
                      <span className="font-phonic text-sm font-medium text-gray-900">$299.99</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-phonic text-sm text-gray-600">Gateway Fee (0.5%)</span>
                      <span className="font-phonic text-sm font-medium text-gray-900">$1.50</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-phonic text-sm text-gray-600">Tax</span>
                      <span className="font-phonic text-sm font-medium text-gray-900">$24.00</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                      <span className="font-phonic text-sm font-semibold text-gray-900">Total</span>
                      <span className="font-phonic text-sm font-semibold text-gray-900">$325.49</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-phonic text-sm text-gray-600">Currency</span>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                        <span className="font-phonic text-sm font-medium text-gray-900">Bitcoin</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="w-24 h-24 bg-white rounded-lg mx-auto flex items-center justify-center overflow-hidden">
                      <svg className="w-20 h-20" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* QR Code Pattern */}
                        <rect width="200" height="200" fill="white"/>
                        
                        {/* Corner squares */}
                        <rect x="10" y="10" width="60" height="60" fill="black"/>
                        <rect x="20" y="20" width="40" height="40" fill="white"/>
                        <rect x="30" y="30" width="20" height="20" fill="black"/>
                        
                        <rect x="130" y="10" width="60" height="60" fill="black"/>
                        <rect x="140" y="20" width="40" height="40" fill="white"/>
                        <rect x="150" y="30" width="20" height="20" fill="black"/>
                        
                        <rect x="10" y="130" width="60" height="60" fill="black"/>
                        <rect x="20" y="140" width="40" height="40" fill="white"/>
                        <rect x="30" y="150" width="20" height="20" fill="black"/>
                        
                        {/* Data patterns */}
                        <rect x="90" y="10" width="10" height="10" fill="black"/>
                        <rect x="110" y="10" width="10" height="10" fill="black"/>
                        <rect x="90" y="20" width="10" height="10" fill="black"/>
                        <rect x="100" y="30" width="10" height="10" fill="black"/>
                        <rect x="110" y="30" width="10" height="10" fill="black"/>
                        
                        <rect x="10" y="90" width="10" height="10" fill="black"/>
                        <rect x="30" y="90" width="10" height="10" fill="black"/>
                        <rect x="50" y="90" width="10" height="10" fill="black"/>
                        <rect x="10" y="100" width="10" height="10" fill="black"/>
                        <rect x="20" y="100" width="10" height="10" fill="black"/>
                        <rect x="40" y="100" width="10" height="10" fill="black"/>
                        <rect x="60" y="100" width="10" height="10" fill="black"/>
                        
                        <rect x="90" y="90" width="10" height="10" fill="black"/>
                        <rect x="100" y="90" width="10" height="10" fill="black"/>
                        <rect x="110" y="90" width="10" height="10" fill="black"/>
                        <rect x="90" y="100" width="10" height="10" fill="black"/>
                        <rect x="110" y="100" width="10" height="10" fill="black"/>
                        <rect x="90" y="110" width="10" height="10" fill="black"/>
                        <rect x="100" y="110" width="10" height="10" fill="black"/>
                        <rect x="110" y="110" width="10" height="10" fill="black"/>
                        
                        <rect x="130" y="90" width="10" height="10" fill="black"/>
                        <rect x="150" y="90" width="10" height="10" fill="black"/>
                        <rect x="170" y="90" width="10" height="10" fill="black"/>
                        <rect x="130" y="100" width="10" height="10" fill="black"/>
                        <rect x="160" y="100" width="10" height="10" fill="black"/>
                        <rect x="180" y="100" width="10" height="10" fill="black"/>
                        
                        <rect x="90" y="130" width="10" height="10" fill="black"/>
                        <rect x="110" y="130" width="10" height="10" fill="black"/>
                        <rect x="130" y="130" width="10" height="10" fill="black"/>
                        <rect x="150" y="130" width="10" height="10" fill="black"/>
                        <rect x="170" y="130" width="10" height="10" fill="black"/>
                        <rect x="90" y="140" width="10" height="10" fill="black"/>
                        <rect x="100" y="140" width="10" height="10" fill="black"/>
                        <rect x="120" y="140" width="10" height="10" fill="black"/>
                        <rect x="140" y="140" width="10" height="10" fill="black"/>
                        <rect x="160" y="140" width="10" height="10" fill="black"/>
                        <rect x="180" y="140" width="10" height="10" fill="black"/>
                        
                        <rect x="90" y="160" width="10" height="10" fill="black"/>
                        <rect x="110" y="160" width="10" height="10" fill="black"/>
                        <rect x="130" y="160" width="10" height="10" fill="black"/>
                        <rect x="150" y="160" width="10" height="10" fill="black"/>
                        <rect x="170" y="160" width="10" height="10" fill="black"/>
                        <rect x="100" y="170" width="10" height="10" fill="black"/>
                        <rect x="120" y="170" width="10" height="10" fill="black"/>
                        <rect x="140" y="170" width="10" height="10" fill="black"/>
                        <rect x="160" y="170" width="10" height="10" fill="black"/>
                        <rect x="180" y="170" width="10" height="10" fill="black"/>
                        
                        <rect x="90" y="180" width="10" height="10" fill="black"/>
                        <rect x="110" y="180" width="10" height="10" fill="black"/>
                        <rect x="130" y="180" width="10" height="10" fill="black"/>
                        <rect x="150" y="180" width="10" height="10" fill="black"/>
                        <rect x="170" y="180" width="10" height="10" fill="black"/>
                      </svg>
                    </div>
                    <div className="text-center mt-2">
                      <div className="font-phonic text-xs text-gray-500">Scan QR Code</div>
                    </div>
                  </div>
                  
                  <button className="w-full bg-[#7f5efd] text-white rounded-lg py-2 font-phonic text-sm font-medium hover:bg-[#7c3aed] transition-colors">
                    Pay in BTC
                  </button>
                </div>

                {/* Background Analytics Card */}
                <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg border border-gray-100 p-4 w-48 transform -rotate-6 z-[-1]">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="h-4 w-4 text-[#7f5efd]" />
                    <span className="font-phonic text-xs font-medium text-gray-900">Analytics</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-phonic text-xs text-gray-500">Today</span>
                      <span className="font-phonic text-xs font-medium text-gray-900">$2,847</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-phonic text-xs text-gray-500">This Week</span>
                      <span className="font-phonic text-xs font-medium text-gray-900">$18,291</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1 mt-2">
                      <div className="bg-[#7f5efd] h-1 rounded-full w-3/4"></div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Cryptocurrencies */}
      <section className="py-12 bg-slate-50">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="font-phonic text-3xl font-normal text-gray-900 mb-4">
              Accept <span className="text-[#7f5efd]">140+</span> Cryptocurrencies
            </h2>
            <p className="font-phonic text-base font-normal text-gray-600 max-w-2xl mx-auto">
              Support for Bitcoin, Ethereum, Solana, and hundreds more digital currencies
            </p>
            <p className="font-phonic text-sm font-normal text-gray-500 max-w-xl mx-auto mt-3">
              Complete choice - Accept and receive only what you want to
            </p>
          </div>
          
          {/* All Cryptocurrencies - Uniform Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3 sm:gap-4 max-w-6xl mx-auto mb-8">
            {supportedCryptos.map((crypto) => (
              <div key={crypto.symbol} className="flex flex-col items-center p-4 rounded-lg hover:bg-[#f5f3ff] transition-all duration-200 group">
                <div className="p-2 bg-[#ede9fe] rounded-lg group-hover:bg-[#ddd6fe] transition-colors mb-3">
                  <CryptoIcon currency={crypto.symbol} size="md" />
                </div>
                <div className="text-center">
                  <div className="font-phonic font-normal text-gray-900 text-sm mb-1">{crypto.symbol}</div>
                  <div className="font-phonic text-xs text-gray-500">{crypto.name}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <p className="font-phonic text-base text-gray-600 mb-4">
              <span className="font-medium text-[#7f5efd]"></span>
            </p>
            <Button variant="outline" size="sm" className="border-[#7f5efd] text-[#7f5efd] hover:bg-[#f5f3ff]" asChild>
              <Link href="/supported-cryptocurrencies">View All Supported Cryptocurrencies</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section with Sliding Carousel */}
      <section id="features" className="py-12 bg-slate-50">
        <div className="container-wide">
          <div className="text-center mb-20">
            <h2 className="font-phonic text-3xl font-normal text-gray-900 mb-6">
              Everything you need to accept crypto payments
            </h2>
            <p className="font-capsule text-base text-gray-600 max-w-3xl mx-auto">
              Built for businesses of all sizes. From freelancers to enterprises, Cryptrac makes crypto payments simple.
            </p>
          </div>
          
          {/* Carousel Container */}
          <div className="relative">
            {/* Navigation Buttons */}
            <button
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center transition-all duration-200 hover:shadow-xl hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <ChevronLeft className="h-6 w-6 text-[#7f5efd]" />
            </button>
            
            <button
              onClick={nextSlide}
              disabled={currentSlide >= maxSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center transition-all duration-200 hover:shadow-xl hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <ChevronRight className="h-6 w-6 text-[#7f5efd]" />
            </button>

            {/* Cards Container */}
            <div className="overflow-hidden mx-16">
              <div 
                ref={carouselRef}
                className="flex transition-transform duration-500 ease-out"
                style={{
                  transform: `translateX(-${currentSlide * (100 / CARDS_PER_VIEW)}%)`
                }}
              >
                {features.map((feature, index) => (
                  <div key={index} className="w-1/3 flex-shrink-0 px-4">
                    <Card className="border-[#7f5efd] bg-[#f8f7ff] border-2 shadow-lg bg-white h-full">
                      <CardHeader className="text-center pb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#7f5efd] to-[#7c3aed] rounded-lg flex items-center justify-center mx-auto mb-4 shadow-lg">
                          <feature.icon className="h-8 w-8 text-white" />
                        </div>
                        <CardTitle className="font-phonic text-2xl font-normal text-gray-900">
                          {feature.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-center px-6 pb-6">
                        <CardDescription className="font-phonic text-base font-normal text-gray-600">
                          {feature.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>

            {/* Slide Indicators */}
            <div className="flex justify-center mt-8 space-x-2">
              {Array.from({ length: maxSlide + 1 }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index === currentSlide 
                      ? 'bg-[#7f5efd] w-6' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 bg-slate-50">
        <div className="container-wide">
          <div className="text-center mb-20">
            <h2 className="font-phonic text-3xl font-normal text-gray-900 mb-6">
              Simple, transparent pricing
            </h2>
            <p className="font-capsule text-base text-gray-600 max-w-3xl mx-auto">
              No hidden fees, no transaction fees to Cryptrac. Just a simple monthly subscription and transparent gateway fees.
            </p>
          </div>

          {/* Main Pricing Card */}
          <div className="max-w-lg mx-auto">
            <Card className="border-2 border-[#7f5efd] shadow-2xl bg-white relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#7f5efd] to-[#a78bfa]"></div>
              <CardHeader className="text-center pb-8 pt-8">
                {/* Badge removed as there is only one plan */}
                <CardTitle className="font-phonic text-3xl font-normal text-gray-900">Cryptrac</CardTitle>
                <CardDescription className="font-phonic text-base text-gray-600">
                  Everything you need to get started
                </CardDescription>
                <div className="mt-8">
                  <span className="font-phonic text-4xl font-medium text-[#7f5efd]">$19</span>
                  <span className="font-phonic text-2xl font-normal text-gray-600 ml-2">/month</span>
                </div>
                <div className="font-phonic text-sm text-gray-500 mt-2">
                  or $199/year (save $29)
                </div>
              </CardHeader>
              <CardContent className="space-y-6 px-8 pb-8">
                <div className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-6 h-6 bg-[#f5f3ff] rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="h-4 w-4 text-[#7f5efd]" />
                      </div>
                      <span className="font-phonic text-base text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
                <Button size="lg" className="font-phonic text-base font-normal w-full h-14 shadow-lg bg-[#7f5efd] hover:bg-[#7c3aed] text-white" asChild>
                  <Link href="/signup">Start Free Trial</Link>
                </Button>
                <p className="font-phonic text-xs text-center text-gray-500">
                  30-day free trial • No setup fees • Cancel anytime
                </p>
              </CardContent>
            </Card>
          </div>

        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-12 bg-slate-50">
        <div className="container-wide">
          <div className="text-center mb-20">
            <h2 className="font-phonic text-3xl font-normal text-gray-900 mb-6">
              Frequently Asked Questions
            </h2>
            <p className="font-phonic text-base text-gray-600">
              Everything you need to know about Cryptrac pricing and fees
            </p>
          </div>
          <div className="max-w-4xl mx-auto space-y-6">
            {faqItems.map((item, index) => (
              <Card key={index} className="border-0 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="font-phonic text-2xl font-normal flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#f5f3ff] rounded-full flex items-center justify-center flex-shrink-0">
                      <HelpCircle className="h-4 w-4 text-[#7f5efd]" />
                    </div>
                    {item.question}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-phonic text-base text-gray-600">{item.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Simplified Fee Documentation */}
          <div className="mt-20">
            <div className="text-center mb-12">
              <h3 className="font-phonic text-3xl font-normal text-gray-900 mb-4">
                Understanding Payment Fees
              </h3>
              <p className="font-phonic text-base text-gray-600 max-w-3xl mx-auto">
                Simple breakdown of how crypto payments work compared to traditional processors
              </p>
            </div>
            
            <div className="max-w-6xl mx-auto">
              {/* Traditional vs Crypto Comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                {/* Traditional Processors */}
                <Card className="border-0 shadow-lg bg-white">
                  <CardHeader className="text-center pb-6">
                    <CardTitle className="font-phonic text-3xl font-normal text-gray-900">Traditional Processors</CardTitle>
                    <p className="font-phonic text-base text-gray-600">Stripe, PayPal, Square</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-center">
                      <div className="font-phonic text-4xl font-medium text-gray-900 mb-2">2.9% + $0.30</div>
                      <p className="font-phonic text-sm text-gray-600">per transaction</p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="font-phonic text-base text-gray-700">Fixed percentage + fixed fee</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="font-phonic text-base text-gray-700">Higher cost for small transactions</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="font-phonic text-base text-gray-700">Requires bank account setup</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Crypto Payments */}
                <Card className="border-2 border-[#7f5efd] shadow-lg bg-white">
                  <CardHeader className="text-center pb-6">
                    <CardTitle className="font-phonic text-3xl font-normal text-gray-900">Crypto Payments</CardTitle>
                    <p className="font-phonic text-base text-gray-600">Cryptrac</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-center">
                      <div className="font-phonic text-4xl font-medium text-[#7f5efd] mb-2">0.5% - 1%</div>
                      <p className="font-phonic text-sm text-gray-600">gateway fee only</p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-[#7f5efd] rounded-full"></div>
                        <span className="font-phonic text-base text-gray-700">No fixed fees</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-[#7f5efd] rounded-full"></div>
                        <span className="font-phonic text-base text-gray-700">Lower cost for all transaction sizes</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-[#7f5efd] rounded-full"></div>
                        <span className="font-phonic text-base text-gray-700">Direct to your crypto wallet</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Fee Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <Card className="border-0 shadow-lg bg-white">
                  <CardHeader className="text-center">
                    <div className="w-12 h-12 bg-[#f5f3ff] rounded-full flex items-center justify-center mx-auto mb-4">
                      <DollarSign className="h-6 w-6 text-[#7f5efd]" />
                    </div>
                    <CardTitle className="font-phonic text-2xl font-normal text-gray-900">Gateway Fee</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="font-phonic text-4xl font-medium text-[#7f5efd] mb-2">0.5% - 1%</div>
                    <p className="font-phonic text-sm text-gray-600 mb-4">
                      Charged by payment processor for handling transactions
                    </p>
                    <div className="font-phonic text-xs text-gray-500">
                      <div className="mb-1">• Direct payments: 0.5%</div>
                      <div>• Auto-convert: 1%</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-white">
                  <CardHeader className="text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Network className="h-6 w-6 text-gray-600" />
                    </div>
                    <CardTitle className="font-phonic text-2xl font-normal text-gray-900">Network Fee</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="font-phonic text-4xl font-medium text-gray-600 mb-2">Variable</div>
                    <p className="font-phonic text-sm text-gray-600 mb-4">
                      Charged by blockchain network (not Cryptrac)
                    </p>
                    <div className="font-phonic text-xs text-gray-500">
                      <div className="mb-1">• Bitcoin/Ethereum: Higher</div>
                      <div>• Solana/XRP: Lower</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-white">
                  <CardHeader className="text-center">
                    <div className="w-12 h-12 bg-[#f5f3ff] rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-6 w-6 text-[#7f5efd]" />
                    </div>
                    <CardTitle className="font-phonic text-2xl font-normal text-gray-900">Cryptrac Fee</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="font-phonic text-4xl font-medium text-[#7f5efd] mb-2">$19/month</div>
                    <p className="font-phonic text-sm text-gray-600 mb-4">
                      Subscription only - no transaction fees
                    </p>
                    <div className="font-phonic text-xs text-gray-500">
                      <div className="mb-1">• No percentage fees</div>
                      <div>• No per-transaction fees</div>
                    </div>
                  </CardContent>
                </Card>
              </div>


            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-gradient-to-r from-[#7f5efd] to-[#7c3aed] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#7f5efd]/90 to-[#7c3aed]/90"></div>
        <div className="container-wide text-center relative">
          <h2 className="font-phonic text-3xl font-normal text-white mb-6">
            Ready to start accepting crypto payments?
          </h2>
          <p className="font-capsule text-base text-white/90 mb-10 max-w-3xl mx-auto">
            Join thousands of businesses already using Cryptrac to accept cryptocurrency payments securely and efficiently.
          </p>
          <div className="flex justify-center">
            <Button size="lg" className="font-phonic text-base font-normal px-8 py-4 shadow-lg bg-white text-[#7f5efd] hover:bg-gray-50 transition-all duration-200" asChild>
              <Link href="/signup">
                Start Free 30-Day Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          <div className="font-phonic text-xs text-white/80 mt-8">
            No credit card required • Full access during trial • $19/month after trial
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container-wide">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <Logo variant="white" size="md" className="mb-6" />
              <p className="font-phonic text-base text-gray-400 mb-6 leading-relaxed">
                The simplest way to accept cryptocurrency payments. Non-custodial, secure, and designed for modern businesses.
              </p>
              <div className="font-phonic text-sm text-gray-500 mb-6">
                Transparent pricing: $19/month subscription, no transaction fees to Cryptrac
              </div>
              {/* Social Links */}
              <div className="flex space-x-4">
                <Link
                  href="https://twitter.com/cryptrac_"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Twitter"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </Link>
                <Link
                  href="https://instagram.com/Cryptrac"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Instagram"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.718-1.297c-.875.807-2.026 1.297-3.323 1.297s-2.448-.49-3.323-1.297c-.807-.875-1.297-2.026-1.297-3.323s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323z"/>
                  </svg>
                </Link>
              </div>
            </div>

            {/* Product Section */}
            <div className="lg:col-span-1">
              <h3 className="font-phonic text-2xl font-normal mb-6">Product</h3>
              <ul className="space-y-3 font-phonic text-sm text-gray-400">
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#faq" className="hover:text-white transition-colors">FAQ</Link></li>
                <li><Link href="/signup" className="hover:text-white transition-colors">Get Started</Link></li>
              </ul>
            </div>

            {/* Support Section */}
            <div className="lg:col-span-1">
              <h3 className="font-phonic text-2xl font-normal mb-6">Support</h3>
              <ul className="space-y-3 font-phonic text-sm text-gray-400">
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/security" className="hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>

            {/* Company Section */}
            <div className="lg:col-span-1">
              <h3 className="font-phonic text-2xl font-normal mb-6">Company</h3>
              <ul className="space-y-3 font-phonic text-sm text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/careers" className="hover:text-white transition-colors">Become a Sales Rep</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-6 lg:space-y-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-8">
                <p className="font-phonic text-xs text-gray-400">
                  &copy; 2025 Cryptrac. All rights reserved.
                </p>
                <div className="flex items-center space-x-6">
                  <Link href="/privacy" className="font-phonic text-xs text-gray-400 hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                  <Link href="/terms" className="font-phonic text-xs text-gray-400 hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                  <Link href="/cookies" className="font-phonic text-xs text-gray-400 hover:text-white transition-colors">
                    Cookie Policy
                  </Link>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-6">
                <span className="font-phonic text-xs text-gray-400">
                  Built with security and compliance in mind
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-phonic text-xs text-gray-400">All systems operational</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export const dynamic = 'force-dynamic';

