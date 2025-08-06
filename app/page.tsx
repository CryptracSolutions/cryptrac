import Link from "next/link";
import { ArrowRight, Shield, Zap, Globe, CheckCircle, Bitcoin, Smartphone, BarChart3, DollarSign, HelpCircle, Info } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Logo } from "@/app/components/ui/logo";
import { CryptoIcon } from "@/app/components/ui/crypto-icon";
import FeeDocumentation from "@/app/components/fee-documentation";

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
      answer: "Cryptrac charges $19/month (or $199/year) for platform access. We don't take any transaction fees - you only pay gateway processing fees (0.5% for direct payments, 1% for auto-convert) which go to the payment processor, not to Cryptrac."
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
            <Link href="#faq" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              FAQ
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
            
            {/* Hero Transparency Callout */}
            <div className="mt-8 mx-auto max-w-2xl">
              <Alert className="border-green-200 bg-green-50">
                <DollarSign className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Transparent Pricing:</strong> $19/month subscription - no transaction fees to Cryptrac. 
                  Gateway fees (0.5-1%) go to payment processor, not us.
                </AlertDescription>
              </Alert>
            </div>

            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button size="lg" className="text-base" asChild>
                <Link href="/signup">
                  Start Free 30-Day Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="text-base" asChild>
                <Link href="#pricing">View Pricing</Link>
              </Button>
            </div>
            <div className="mt-6 text-sm text-muted-foreground">
              30-day free trial • $19/month • No setup fees • Cancel anytime
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
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              No hidden fees, no transaction fees to Cryptrac. Just a simple monthly subscription and transparent gateway fees.
            </p>
          </div>

          {/* Main Pricing Card */}
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
                  30-day free trial • No setup fees • Cancel anytime
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Fee Transparency Notice */}
          <div className="mt-16 max-w-4xl mx-auto">
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                  <strong>Complete Transparency:</strong> Cryptrac&apos;s only revenue is the $19/month subscription.
                Gateway fees (0.5% or 1%) are charged by the payment processor for handling transactions and go directly to them, not to Cryptrac. 
                Network fees may vary by cryptocurrency and blockchain congestion.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-gray-50">
        <div className="container-wide">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to know about Cryptrac pricing and fees
            </p>
          </div>
          <div className="max-w-3xl mx-auto space-y-6">
            {faqItems.map((item, index) => (
              <Card key={index} className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-primary" />
                    {item.question}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{item.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Detailed Fee Documentation */}
          <div className="mt-16">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Understanding Payment Fees: Crypto vs Traditional
              </h3>
              <p className="text-muted-foreground">
                Complete breakdown of how crypto payments compare to traditional processors
              </p>
            </div>
            <FeeDocumentation 
              variant="full" 
              showComparison={true}
              showNetworkFees={true}
              showGatewayFees={true}
            />
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
                Start Free 30-Day Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base border-white text-white hover:bg-white hover:text-primary" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
          <div className="mt-6 text-primary-100 text-sm">
            No credit card required • Full access during trial • $19/month after trial
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
              <div className="mt-4 text-sm text-gray-500">
                Transparent pricing: $19/month subscription, no transaction fees to Cryptrac
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#features" className="hover:text-white">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="#faq" className="hover:text-white">FAQ</Link></li>
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

