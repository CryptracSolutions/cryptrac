import Link from "next/link";
import { ArrowRight, Shield, Zap, Globe, CheckCircle, Bitcoin, Smartphone, BarChart3, DollarSign, HelpCircle, Network } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
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
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container-wide flex h-16 items-center justify-between">
          <Logo size="md" />
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
              Pricing
            </Link>
            <Link href="#faq" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
              FAQ
            </Link>
            <Link href="#about" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
              About
            </Link>
            <Link href="/help" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
              Help
            </Link>
            <Link href="/contact" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
              Contact
            </Link>
          </nav>
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button size="sm" className="bg-[#7f5efd] hover:bg-[#7c3aed] text-white" asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="relative overflow-hidden bg-white py-20 sm:py-32">
        {/* Minimal Geometric Line Background */}
        <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none" aria-hidden="true">
          {/* Horizontal lines */}
          <div className="absolute top-[20%] left-0 right-0 h-px bg-[#7f5efd]/30"></div>
          <div className="absolute top-[40%] left-0 right-0 h-px bg-[#7f5efd]/25"></div>
          <div className="absolute top-[60%] left-0 right-0 h-px bg-[#7f5efd]/20"></div>
          <div className="absolute top-[80%] left-0 right-0 h-px bg-[#7f5efd]/25"></div>
          
          {/* Vertical lines */}
          <div className="absolute top-0 bottom-0 left-[15%] w-px bg-[#7f5efd]/20"></div>
          <div className="absolute top-0 bottom-0 left-[30%] w-px bg-[#7f5efd]/25"></div>
          <div className="absolute top-0 bottom-0 left-[45%] w-px bg-[#7f5efd]/18"></div>
          <div className="absolute top-0 bottom-0 left-[55%] w-px bg-[#7f5efd]/18"></div>
          <div className="absolute top-0 bottom-0 left-[70%] w-px bg-[#7f5efd]/25"></div>
          <div className="absolute top-0 bottom-0 left-[85%] w-px bg-[#7f5efd]/20"></div>
          
          {/* Diagonal accent lines */}
          <div className="absolute inset-0">
            <svg className="w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="none">
              {/* Main diagonal */}
              <line x1="0" y1="400" x2="1200" y2="200" stroke="#7f5efd" strokeWidth="0.5" opacity="0.4" />
              {/* Supporting diagonal */}
              <line x1="0" y1="600" x2="1200" y2="400" stroke="#7f5efd" strokeWidth="0.5" opacity="0.25" />
              {/* Counter diagonal */}
              <line x1="1200" y1="600" x2="0" y2="200" stroke="#7f5efd" strokeWidth="0.5" opacity="0.3" />
            </svg>
          </div>
          
          {/* Animated accent lines */}
          <div className="absolute top-[30%] left-0 w-32 h-px bg-gradient-to-r from-transparent via-[#7f5efd] to-transparent opacity-50 animate-slide-right"></div>
          <div className="absolute top-[70%] right-0 w-32 h-px bg-gradient-to-l from-transparent via-[#7f5efd] to-transparent opacity-50 animate-slide-left"></div>
          <div className="absolute left-[25%] top-0 h-32 w-px bg-gradient-to-b from-transparent via-[#7f5efd] to-transparent opacity-50 animate-slide-down"></div>
          <div className="absolute right-[25%] bottom-0 h-32 w-px bg-gradient-to-t from-transparent via-[#7f5efd] to-transparent opacity-50 animate-slide-up"></div>
          
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-24 h-24">
            <div className="absolute top-0 left-0 w-full h-px bg-[#7f5efd]/40"></div>
            <div className="absolute top-0 left-0 h-full w-px bg-[#7f5efd]/40"></div>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24">
            <div className="absolute top-0 right-0 w-full h-px bg-[#7f5efd]/40"></div>
            <div className="absolute top-0 right-0 h-full w-px bg-[#7f5efd]/40"></div>
          </div>
          <div className="absolute bottom-0 left-0 w-24 h-24">
            <div className="absolute bottom-0 left-0 w-full h-px bg-[#7f5efd]/40"></div>
            <div className="absolute bottom-0 left-0 h-full w-px bg-[#7f5efd]/40"></div>
          </div>
          <div className="absolute bottom-0 right-0 w-24 h-24">
            <div className="absolute bottom-0 right-0 w-full h-px bg-[#7f5efd]/40"></div>
            <div className="absolute bottom-0 right-0 h-full w-px bg-[#7f5efd]/40"></div>
          </div>
        </div>
        <div className="container-wide relative z-10">
          <div className="mx-auto max-w-4xl text-center">

            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-gray-900 mb-8 leading-tight">
              Get Paid in{" "}
              <span className="font-mono text-[#7f5efd] tracking-wider" style={{ fontFamily: "'Orbitron', 'Space Mono', monospace", fontWeight: 900, letterSpacing: "0.05em" }}>Crypto</span>
            </h1>
            <p className="text-xl leading-8 text-gray-600 max-w-3xl mx-auto mb-10">
              Modern Payments to Grow your Revenue. Non-custodial gateway for Bitcoin, Ethereum, Solana and all supported cryptos.
            </p>
            


            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="text-lg px-8 py-3 shadow-lg bg-[#7f5efd] hover:bg-[#7c3aed] text-white" asChild>
                <Link href="/signup">
                  Start Free 30-Day Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-3 border-[#7f5efd] text-[#7f5efd] hover:bg-[#f5f3ff]" asChild>
                <Link href="#pricing">View Pricing</Link>
              </Button>
            </div>
            <div className="mt-6 text-sm text-gray-500">
              30-day free trial • $19/month • No setup fees • Cancel anytime
            </div>

            {/* Trust Indicators */}
            <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2 bg-white px-6 py-3 rounded-full shadow-sm border border-[#ede9fe]">
                <Shield className="h-4 w-4 text-[#7f5efd]" />
                <span className="font-medium">Secure & Non-Custodial</span>
              </div>
              <div className="flex items-center space-x-2 bg-white px-6 py-3 rounded-full shadow-sm border border-[#ede9fe]">
                <Zap className="h-4 w-4 text-[#7f5efd]" />
                <span className="font-medium">Instant Setup</span>
              </div>
              <div className="flex items-center space-x-2 bg-white px-6 py-3 rounded-full shadow-sm border border-[#ede9fe]">
                <Globe className="h-4 w-4 text-[#7f5efd]" />
                <span className="font-medium">Global Support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Cryptocurrencies */}
      <section className="py-16 bg-white">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Accept <span className="text-[#7f5efd]">300+</span> Cryptocurrencies
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Support for Bitcoin, Ethereum, Solana, and hundreds more digital currencies
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
                  <div className="font-semibold text-gray-900 text-sm mb-1">{crypto.symbol}</div>
                  <div className="text-xs text-gray-500">{crypto.name}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              <span className="font-semibold text-[#7f5efd]">300+ cryptocurrencies</span> supported and counting
            </p>
            <Button variant="outline" size="sm" className="border-[#7f5efd] text-[#7f5efd] hover:bg-[#f5f3ff]" asChild>
              <Link href="/supported-cryptocurrencies">View All Supported Cryptocurrencies</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="container-wide">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Everything you need to accept crypto payments
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Built for businesses of all sizes. From freelancers to enterprises, Cryptrac makes crypto payments simple.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
                              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 bg-white group">
                <CardHeader className="text-center pb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#7f5efd] to-[#7c3aed] rounded-lg flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-200">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-base leading-relaxed text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white">
        <div className="container-wide">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              No hidden fees, no transaction fees to Cryptrac. Just a simple monthly subscription and transparent gateway fees.
            </p>
          </div>

          {/* Main Pricing Card */}
          <div className="max-w-lg mx-auto">
            <Card className="border-2 border-[#7f5efd] shadow-2xl bg-white relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#7f5efd] to-[#a78bfa]"></div>
              <CardHeader className="text-center pb-8 pt-8">
                {/* Badge removed as there is only one plan */}
                <CardTitle className="text-3xl font-bold text-gray-900">Cryptrac</CardTitle>
                <CardDescription className="text-lg text-gray-600">
                  Everything you need to get started
                </CardDescription>
                <div className="mt-8">
                  <span className="text-5xl font-bold text-gray-900">$19</span>
                  <span className="text-gray-600 ml-2 text-xl">/month</span>
                </div>
                <div className="text-sm text-gray-500 mt-2">
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
                      <span className="text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
                <Button size="lg" className="w-full h-14 text-lg font-semibold shadow-lg bg-[#7f5efd] hover:bg-[#7c3aed] text-white" asChild>
                  <Link href="/signup">Start Free Trial</Link>
                </Button>
                <p className="text-xs text-center text-gray-500">
                  30-day free trial • No setup fees • Cancel anytime
                </p>
              </CardContent>
            </Card>
          </div>

        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-gray-50">
        <div className="container-wide">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Everything you need to know about Cryptrac pricing and fees
            </p>
          </div>
          <div className="max-w-4xl mx-auto space-y-6">
            {faqItems.map((item, index) => (
              <Card key={index} className="border-0 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#f5f3ff] rounded-full flex items-center justify-center flex-shrink-0">
                      <HelpCircle className="h-4 w-4 text-[#7f5efd]" />
                    </div>
                    {item.question}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">{item.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Simplified Fee Documentation */}
          <div className="mt-20">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Understanding Payment Fees
              </h3>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Simple breakdown of how crypto payments work compared to traditional processors
              </p>
            </div>
            
            <div className="max-w-6xl mx-auto">
              {/* Traditional vs Crypto Comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                {/* Traditional Processors */}
                <Card className="border-0 shadow-lg bg-white">
                  <CardHeader className="text-center pb-6">
                    <CardTitle className="text-2xl font-bold text-gray-900">Traditional Processors</CardTitle>
                    <p className="text-gray-600">Stripe, PayPal, Square</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-gray-900 mb-2">2.9% + $0.30</div>
                      <p className="text-gray-600">per transaction</p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-gray-700">Fixed percentage + fixed fee</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-gray-700">Higher cost for small transactions</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-gray-700">Requires bank account setup</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Crypto Payments */}
                <Card className="border-2 border-[#7f5efd] shadow-lg bg-white">
                  <CardHeader className="text-center pb-6">
                    <CardTitle className="text-2xl font-bold text-gray-900">Crypto Payments</CardTitle>
                    <p className="text-gray-600">Cryptrac</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-[#7f5efd] mb-2">0.5% - 1%</div>
                      <p className="text-gray-600">gateway fee only</p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-[#7f5efd] rounded-full"></div>
                        <span className="text-gray-700">No fixed fees</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-[#7f5efd] rounded-full"></div>
                        <span className="text-gray-700">Lower cost for all transaction sizes</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-[#7f5efd] rounded-full"></div>
                        <span className="text-gray-700">Direct to your crypto wallet</span>
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
                    <CardTitle className="text-lg font-bold text-gray-900">Gateway Fee</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="text-2xl font-bold text-[#7f5efd] mb-2">0.5% - 1%</div>
                    <p className="text-sm text-gray-600 mb-4">
                      Charged by payment processor for handling transactions
                    </p>
                    <div className="text-xs text-gray-500">
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
                    <CardTitle className="text-lg font-bold text-gray-900">Network Fee</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="text-2xl font-bold text-gray-600 mb-2">Variable</div>
                    <p className="text-sm text-gray-600 mb-4">
                      Charged by blockchain network (not Cryptrac)
                    </p>
                    <div className="text-xs text-gray-500">
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
                    <CardTitle className="text-lg font-bold text-gray-900">Cryptrac Fee</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="text-2xl font-bold text-[#7f5efd] mb-2">$19/month</div>
                    <p className="text-sm text-gray-600 mb-4">
                      Subscription only - no transaction fees
                    </p>
                    <div className="text-xs text-gray-500">
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
      <section className="py-24 bg-gradient-to-r from-[#7f5efd] to-[#7c3aed] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#7f5efd]/90 to-[#7c3aed]/90"></div>
        <div className="container-wide text-center relative">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to start accepting crypto payments?
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed">
            Join thousands of businesses already using Cryptrac to accept cryptocurrency payments securely and efficiently.
          </p>
          <div className="flex justify-center">
            <Button size="lg" className="text-lg px-8 py-4 shadow-lg bg-white text-[#7f5efd] hover:bg-gray-50 transition-all duration-200" asChild>
              <Link href="/signup">
                Start Free 30-Day Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          <div className="mt-8 text-white/80 text-sm">
            No credit card required • Full access during trial • $19/month after trial
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container-wide">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand Section */}
            <div>
              <Logo variant="white" size="md" className="mb-6" />
              <p className="text-gray-400 leading-relaxed mb-6">
                The simplest way to accept cryptocurrency payments. Non-custodial, secure, and designed for modern businesses.
              </p>
              <div className="text-sm text-gray-500 mb-6">
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
            <div>
              <h3 className="font-semibold mb-6 text-lg">Product</h3>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#faq" className="hover:text-white transition-colors">FAQ</Link></li>
                <li><Link href="/signup" className="hover:text-white transition-colors">Get Started</Link></li>
              </ul>
            </div>

            {/* Support Section */}
            <div>
              <h3 className="font-semibold mb-6 text-lg">Support</h3>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/security" className="hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>

            {/* Company Section */}
            <div>
              <h3 className="font-semibold mb-6 text-lg">Company</h3>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/careers" className="hover:text-white transition-colors">Become a Sales Rep</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8">
                <p className="text-gray-400 text-sm">
                  &copy; 2025 Cryptrac. All rights reserved.
                </p>
                <div className="flex items-center space-x-6">
                  <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Privacy Policy
                  </Link>
                  <Link href="/terms" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Terms of Service
                  </Link>
                  <Link href="/cookies" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Cookie Policy
                  </Link>
                </div>
              </div>
              <div className="flex items-center space-x-6 mt-4 md:mt-0">
                <span className="text-gray-400 text-sm">
                  Built with security and compliance in mind
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-400 text-sm">All systems operational</span>
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

