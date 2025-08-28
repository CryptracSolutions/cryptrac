import Link from "next/link";
import { ArrowLeft, Link as LinkIcon, Shield, Zap, CheckCircle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { LandingNav } from "@/app/components/layout/landing-nav";

export default function PaymentLinksInfo() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      
      <div className="container-wide py-16">
        {/* Back Button */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="text-gray-600 hover:text-[#7f5efd]">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="w-20 h-20 bg-gradient-to-br from-[#7f5efd] to-[#7c3aed] rounded-2xl flex items-center justify-center mx-auto mb-8">
            <LinkIcon className="h-10 w-10 text-white" />
          </div>
          <h1 className="font-martina text-6xl font-normal text-gray-900 mb-6">
            Payment Links
          </h1>
          <p className="font-capsule text-xl text-gray-600 max-w-3xl mx-auto">
            Generate shareable payment links instantly. Perfect for invoices, e-commerce, and remote transactions.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardHeader>
              <div className="w-12 h-12 bg-[#f5f3ff] rounded-lg flex items-center justify-center mb-4">
                <LinkIcon className="h-6 w-6 text-[#7f5efd]" />
              </div>
              <CardTitle className="font-phonic text-xl">Instant Generation</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="font-phonic text-base">
                Create payment links in seconds. Share via email, SMS, social media, or embed on your website.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardHeader>
              <div className="w-12 h-12 bg-[#f5f3ff] rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-[#7f5efd]" />
              </div>
              <CardTitle className="font-phonic text-xl">Secure & Reliable</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="font-phonic text-base">
                Each link is unique and secure. Track payment status in real-time with built-in fraud protection.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardHeader>
              <div className="w-12 h-12 bg-[#f5f3ff] rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-[#7f5efd]" />
              </div>
              <CardTitle className="font-phonic text-xl">Quick Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="font-phonic text-base">
                Customers pay with one click. Optimized checkout flow with QR codes for mobile payments.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Key Features */}
        <div className="bg-gray-50 rounded-2xl p-12 mb-16">
          <h2 className="font-phonic text-4xl font-normal text-center mb-12">Everything You Need</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              {[
                "Custom amount or fixed pricing",
                "Multiple currency support",
                "Branded payment pages",
                "Automatic QR code generation",
                "Email notifications"
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-6 h-6 bg-[#f5f3ff] rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-[#7f5efd]" />
                  </div>
                  <span className="font-phonic text-base text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
            <div className="space-y-6">
              {[
                "Expiration date settings",
                "Payment confirmation receipts",
                "Integration with accounting software",
                "Detailed payment analytics",
                "Mobile-optimized checkout"
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-6 h-6 bg-[#f5f3ff] rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-[#7f5efd]" />
                  </div>
                  <span className="font-phonic text-base text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="mb-16">
          <h2 className="font-phonic text-4xl font-normal text-center mb-12">Perfect For</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="font-phonic text-2xl">Freelancers</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="font-phonic text-base">
                  Send professional invoices to clients worldwide. Get paid faster with crypto payments.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="font-phonic text-2xl">E-commerce</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="font-phonic text-base">
                  Add crypto checkout to your online store. Reduce cart abandonment with simplified payments.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="font-phonic text-2xl">Service Providers</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="font-phonic text-base">
                  Request deposits, final payments, or recurring bills. Streamline your payment collection.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-[#7f5efd] to-[#7c3aed] rounded-2xl p-12">
          <h2 className="font-phonic text-4xl font-normal text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="font-capsule text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Start creating payment links today and get paid faster with cryptocurrency.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-[#7f5efd] hover:bg-gray-50" asChild>
              <Link href="/signup">Start Free Trial</Link>
            </Button>
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10" asChild>
              <Link href="/merchant/dashboard/payments/create">Create Payment Link</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}