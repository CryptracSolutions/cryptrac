import Link from "next/link";
import { ArrowLeft, Repeat, Shield, Zap, CheckCircle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { LandingNav } from "@/app/components/layout/landing-nav";

export default function SubscriptionsInfo() {
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
            <Repeat className="h-10 w-10 text-white" />
          </div>
          <h1 className="font-martina text-3xl font-normal text-gray-900 mb-6">
            Subscriptions
          </h1>
          <p className="font-capsule text-xl text-gray-600 max-w-3xl mx-auto">
            Automated recurring crypto payments. Perfect for SaaS, memberships, and subscription-based businesses.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardHeader>
              <div className="w-12 h-12 bg-[#f5f3ff] rounded-lg flex items-center justify-center mb-4">
                <Repeat className="h-6 w-6 text-[#7f5efd]" />
              </div>
              <CardTitle className="font-phonic text-xl">Automated Billing</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="font-phonic text-base">
                Set it and forget it. Automated recurring payments reduce churn and eliminate manual billing processes.
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
                Built-in retry logic and failure handling. Your customers stay subscribed with seamless payment recovery.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardHeader>
              <div className="w-12 h-12 bg-[#f5f3ff] rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-[#7f5efd]" />
              </div>
              <CardTitle className="font-phonic text-xl">Flexible Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="font-phonic text-base">
                Daily, weekly, monthly, or custom intervals. Pro-rated upgrades and downgrades handled automatically.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Key Features */}
        <div className="bg-gray-50 rounded-2xl p-12 mb-16">
          <h2 className="font-phonic text-3xl font-normal text-center mb-12">Everything You Need</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 max-w-4xl mx-auto">
            {[
              "Multiple billing frequencies",
              "Customer portal for self-service",
              "Trial periods and grace periods",
              "Detailed subscription analytics",
              "Automatic invoice generation",
              "Webhook notifications",
              "Failed payment recovery",
              "Tax handling and compliance",
              "Proration and plan changes",
              "Multi-currency support"
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-4 w-full">
                <div className="w-6 h-6 bg-[#f5f3ff] rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-4 w-4 text-[#7f5efd]" />
                </div>
                <span className="font-phonic text-base text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Use Cases */}
        <div className="mb-16">
          <h2 className="font-phonic text-3xl font-normal text-center mb-12">Perfect For</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="font-phonic text-2xl">SaaS Companies</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="font-phonic text-base">
                  Monthly or annual software subscriptions. Reduce churn with crypto's global accessibility.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="font-phonic text-2xl">Content Creators</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="font-phonic text-base">
                  Subscription-based content, courses, and memberships. Build recurring revenue with loyal fans.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="font-phonic text-2xl">Service Providers</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="font-phonic text-base">
                  Maintenance contracts, hosting services, and ongoing professional services with predictable billing.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>


        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-[#7f5efd] to-[#7c3aed] rounded-2xl p-12">
          <h2 className="font-phonic text-3xl font-normal text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="font-capsule text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Launch your crypto subscription business today and start earning recurring revenue.
          </p>
          <div className="flex justify-center">
            <Button size="lg" className="bg-white text-[#7f5efd] hover:bg-gray-50" asChild>
              <Link href="/signup">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}