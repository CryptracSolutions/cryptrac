import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Logo } from "@/app/components/ui/logo";

export const metadata = {
  title: "Terms of Service - Cryptrac",
  description: "Terms of Service for Cryptrac cryptocurrency payment platform",
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container-wide flex h-16 items-center justify-between">
          <Logo size="md" />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container-narrow py-12">
        <Card className="shadow-medium">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl font-bold text-gray-900 mb-4">
              Terms of Service
            </CardTitle>
            <p className="text-gray-600">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using Cryptrac ("Service"), you accept and agree to be bound by the terms and provision of this agreement.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              Cryptrac is a non-custodial cryptocurrency payment gateway that enables merchants to accept digital currency payments from customers worldwide. We provide payment processing, invoicing, and analytics tools.
            </p>

            <h2>3. Non-Custodial Nature</h2>
            <p>
              Cryptrac operates as a non-custodial service. We do not hold, store, or have access to your cryptocurrency funds. All payments are made directly to your designated wallet addresses.
            </p>

            <h2>4. User Responsibilities</h2>
            <ul>
              <li>Maintain the security of your account credentials</li>
              <li>Provide accurate wallet addresses for payment receipt</li>
              <li>Comply with applicable laws and regulations</li>
              <li>Use the service for legitimate business purposes only</li>
            </ul>

            <h2>5. Fees and Payments</h2>
            <p>
              Cryptrac charges a monthly subscription fee of $19/month or $199/year. Gateway fees of 0.5% (direct payments) or 1% (auto-convert payments) are charged by third-party payment processors, not by Cryptrac.
            </p>

            <h2>6. Privacy and Data Protection</h2>
            <p>
              Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information.
            </p>

            <h2>7. Limitation of Liability</h2>
            <p>
              Cryptrac shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.
            </p>

            <h2>8. Termination</h2>
            <p>
              Either party may terminate this agreement at any time. Upon termination, your access to the service will be discontinued.
            </p>

            <h2>9. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting to our website.
            </p>

            <h2>10. Contact Information</h2>
            <p>
              For questions about these Terms of Service, please contact us at:
              <br />
              Email: support@cryptrac.com
              <br />
              Phone: +1 (347) 619-3721
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
