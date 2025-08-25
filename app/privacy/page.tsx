import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Logo } from "@/app/components/ui/logo";

export const metadata = {
  title: "Privacy Policy - Cryptrac",
  description: "Privacy Policy for Cryptrac cryptocurrency payment platform",
};

export default function PrivacyPolicy() {
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
              Privacy Policy
            </CardTitle>
            <p className="text-gray-600">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <h2>1. Information We Collect</h2>
            <h3>Personal Information</h3>
            <ul>
              <li>Email address and account credentials</li>
              <li>Business information and contact details</li>
              <li>Cryptocurrency wallet addresses</li>
              <li>Payment and transaction data</li>
            </ul>

            <h3>Automatically Collected Information</h3>
            <ul>
              <li>IP address and location data</li>
              <li>Browser and device information</li>
              <li>Usage patterns and analytics</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <ul>
              <li>Provide and maintain our payment services</li>
              <li>Process transactions and generate reports</li>
              <li>Communicate with you about your account</li>
              <li>Improve our services and user experience</li>
              <li>Comply with legal and regulatory requirements</li>
            </ul>

            <h2>3. Information Sharing</h2>
            <p>
              We do not sell, trade, or rent your personal information to third parties. We may share information with:
            </p>
            <ul>
              <li>Payment processors for transaction processing</li>
              <li>Service providers who assist in our operations</li>
              <li>Legal authorities when required by law</li>
            </ul>

            <h2>4. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your information, including encryption, secure servers, and regular security audits.
            </p>

            <h2>5. Non-Custodial Nature</h2>
            <p>
              As a non-custodial service, we do not store or have access to your cryptocurrency funds. All payments are made directly to your wallet addresses.
            </p>

            <h2>6. Data Retention</h2>
            <p>
              We retain your information for as long as necessary to provide our services and comply with legal obligations.
            </p>

            <h2>7. Your Rights</h2>
            <ul>
              <li>Access and update your personal information</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of marketing communications</li>
              <li>Data portability rights</li>
            </ul>

            <h2>8. Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies to enhance your experience and analyze usage patterns. You can control cookie settings through your browser.
            </p>

            <h2>9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.
            </p>

            <h2>10. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at:
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
