import Link from "next/link";
import { Smartphone, Shield, Zap, CheckCircle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { LandingNav } from "@/app/components/layout/landing-nav";

export default function SmartTerminalInfo() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      
      <div className="container-wide py-8 mobile:py-6 md:py-12 lg:py-16">
        {/* Hero Section */}
        <div className="text-center mb-8 mobile:mb-6 md:mb-12 lg:mb-16">
          <div className="w-16 mobile:w-14 h-16 mobile:h-14 md:w-20 md:h-20 bg-gradient-to-br from-[#7f5efd] to-[#7c3aed] rounded-2xl flex items-center justify-center mx-auto mb-4 mobile:mb-4 md:mb-6 lg:mb-8">
            <Smartphone className="h-8 mobile:h-7 w-8 mobile:w-7 md:h-10 md:w-10 text-white" />
          </div>
          <h1 className="font-martina text-2xl mobile:text-xl md:text-3xl font-normal text-gray-900 mb-3 mobile:mb-3 md:mb-4 lg:mb-6">
            Smart Terminal
          </h1>
          <p className="font-capsule text-base mobile:text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4 mobile:px-4 md:px-6 lg:px-0">
            Transform any device into a powerful crypto payment terminal. Perfect for point-of-sale, retail, and in-person transactions.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mobile:gap-4 md:gap-6 lg:gap-8 mb-8 mobile:mb-6 md:mb-12 lg:mb-16">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardHeader>
              <div className="w-10 mobile:w-10 h-10 mobile:h-10 md:w-12 md:h-12 bg-[#f5f3ff] rounded-lg flex items-center justify-center mb-3 mobile:mb-3 md:mb-4">
                <Smartphone className="h-5 mobile:h-5 w-5 mobile:w-5 md:h-6 md:w-6 text-[#7f5efd]" />
              </div>
              <CardTitle className="font-phonic text-lg mobile:text-base md:text-lg lg:text-xl">Mobile Optimized</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="font-phonic text-sm mobile:text-sm md:text-base">
                Works perfectly on tablets, phones, and any web-enabled device. Responsive design for any screen size.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardHeader>
              <div className="w-10 mobile:w-10 h-10 mobile:h-10 md:w-12 md:h-12 bg-[#f5f3ff] rounded-lg flex items-center justify-center mb-3 mobile:mb-3 md:mb-4">
                <Shield className="h-5 mobile:h-5 w-5 mobile:w-5 md:h-6 md:w-6 text-[#7f5efd]" />
              </div>
              <CardTitle className="font-phonic text-lg mobile:text-base md:text-lg lg:text-xl">Secure Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="font-phonic text-sm mobile:text-sm md:text-base">
                Non-custodial payments go directly to your wallet. No intermediaries, maximum security for every transaction.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardHeader>
              <div className="w-10 mobile:w-10 h-10 mobile:h-10 md:w-12 md:h-12 bg-[#f5f3ff] rounded-lg flex items-center justify-center mb-3 mobile:mb-3 md:mb-4">
                <Zap className="h-5 mobile:h-5 w-5 mobile:w-5 md:h-6 md:w-6 text-[#7f5efd]" />
              </div>
              <CardTitle className="font-phonic text-lg mobile:text-base md:text-lg lg:text-xl">Instant Setup</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="font-phonic text-sm mobile:text-sm md:text-base">
                Get your terminal running in minutes. Simple configuration, powerful features, ready to accept payments.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Key Features */}
        <div className="bg-gray-50 rounded-2xl p-6 mobile:p-4 md:p-8 lg:p-12 mb-8 mobile:mb-6 md:mb-12 lg:mb-16">
          <h2 className="font-phonic text-2xl mobile:text-xl md:text-2xl lg:text-3xl font-normal text-center mb-6 mobile:mb-4 md:mb-8 lg:mb-12">Everything You Need</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mobile:gap-4 md:gap-8 lg:gap-12 max-w-4xl mx-auto">
            <div className="space-y-4 mobile:space-y-3 md:space-y-5 lg:space-y-6 flex flex-col items-start">
              {[
                "QR code generation for instant payments",
                "Real-time payment confirmation",
                "Support for 150+ cryptocurrencies",
                "Offline mode capability",
                "Custom branding options"
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3 mobile:gap-3 md:gap-4 w-full">
                  <div className="w-6 h-6 bg-[#f5f3ff] rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-[#7f5efd]" />
                  </div>
                  <span className="font-phonic text-sm mobile:text-sm md:text-base text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
            <div className="space-y-4 mobile:space-y-3 md:space-y-5 lg:space-y-6 flex flex-col items-start">
              {[
                "Multi-language support",
                "Receipt generation and printing",
                "Integration with existing POS systems",
                "Advanced analytics and reporting",
                "24/7 customer support"
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3 mobile:gap-3 md:gap-4 w-full">
                  <div className="w-6 h-6 bg-[#f5f3ff] rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-[#7f5efd]" />
                  </div>
                  <span className="font-phonic text-sm mobile:text-sm md:text-base text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="mb-8 mobile:mb-6 md:mb-12 lg:mb-16">
          <h2 className="font-phonic text-2xl mobile:text-xl md:text-2xl lg:text-3xl font-normal text-center mb-6 mobile:mb-4 md:mb-8 lg:mb-12">Perfect For</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mobile:gap-4 md:gap-6 lg:gap-8">
            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="font-phonic text-xl mobile:text-lg md:text-xl lg:text-2xl">Retail Stores</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="font-phonic text-sm mobile:text-sm md:text-base">
                  Transform any device into a crypto payment terminal. Perfect for brick-and-mortar stores accepting digital payments.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="font-phonic text-xl mobile:text-lg md:text-xl lg:text-2xl">Food & Beverage</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="font-phonic text-sm mobile:text-sm md:text-base">
                  Fast, secure payments for restaurants, cafes, and food trucks. Reduce wait times with QR code payments.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="font-phonic text-xl mobile:text-lg md:text-xl lg:text-2xl">Service Businesses</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="font-phonic text-sm mobile:text-sm md:text-base">
                  Salons, repair shops, and professional services. Accept payments anywhere with mobile-optimized terminals.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-[#7f5efd] to-[#7c3aed] rounded-2xl p-6 mobile:p-4 md:p-8 lg:p-12">
          <h2 className="font-phonic text-2xl mobile:text-xl md:text-2xl lg:text-3xl font-normal text-white mb-3 mobile:mb-3 md:mb-4 lg:mb-6">
            Ready to Get Started?
          </h2>
          <p className="font-capsule text-base mobile:text-sm md:text-base lg:text-lg text-white/90 mb-4 mobile:mb-4 md:mb-6 lg:mb-8 max-w-2xl mx-auto px-4 mobile:px-4 md:px-6 lg:px-0">
            Join thousands of businesses using Cryptrac Smart Terminal for secure crypto payments.
          </p>
          <div className="flex justify-center">
            <Button size="lg" className="bg-white text-[#7f5efd] hover:bg-gray-50 min-h-[44px] px-6 mobile:px-4 md:px-6" asChild>
              <Link href="/signup">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}