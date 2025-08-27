'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight, HelpCircle, Users, CreditCard, Shield, AlertCircle, Settings, Phone, Mail, MapPin, Clock, FileText, Zap, Lock, Eye, MessageCircle, BookOpen, Wrench, Globe, Star } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Logo } from "@/app/components/ui/logo";
import { Separator } from "@/app/components/ui/separator";
import { Badge } from "@/app/components/ui/badge";

export default function HelpPage() {
  const [activeSection, setActiveSection] = useState<string>("");
  const lastUpdated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const sections = [
    { id: "welcome", title: "Welcome to Cryptrac", icon: HelpCircle },
    { id: "merchants", title: "Getting Started for Merchants", icon: Users },
    { id: "dashboard", title: "Merchant Dashboard Features", icon: Settings },
    { id: "customers", title: "Customer Payment Guide", icon: CreditCard },
    { id: "troubleshooting", title: "Troubleshooting Common Issues", icon: Wrench },
    { id: "security", title: "Security Best Practices", icon: Shield },
    { id: "contact", title: "Contact Information & Support", icon: Phone }
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      
      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80;
      const elementPosition = element.offsetTop - offset;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container-wide flex h-16 items-center justify-between">
          <Logo size="md" />
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/privacy" className="font-phonic text-sm font-normal text-gray-600 hover:text-gray-900 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="font-phonic text-sm font-normal text-gray-600 hover:text-gray-900 transition-colors">
              Terms of Service
            </Link>
            <Link href="/cookies" className="font-phonic text-sm font-normal text-gray-600 hover:text-gray-900 transition-colors">
              Cookie Policy
            </Link>
            <Link href="/contact" className="font-phonic text-sm font-normal text-gray-600 hover:text-gray-900 transition-colors">
              Contact
            </Link>
          </nav>
          <Button variant="ghost" size="sm" asChild className="text-gray-600 hover:text-gray-900">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero Section with Geometric Lines */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-16">
        {/* Minimal Geometric Line Background */}
        <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-[30%] left-0 right-0 h-px bg-[#7f5efd]/10"></div>
          <div className="absolute top-[70%] left-0 right-0 h-px bg-[#7f5efd]/10"></div>
          <div className="absolute top-0 bottom-0 left-[20%] w-px bg-[#7f5efd]/10"></div>
          <div className="absolute top-0 bottom-0 right-[20%] w-px bg-[#7f5efd]/10"></div>
        </div>
        
        <div className="container-wide relative z-10">
          <div className="text-center">
            <Badge className="mb-4 bg-[#f5f3ff] text-[#7f5efd] border-[#ede9fe]">
              Support & Documentation
            </Badge>
            <h1 className="font-phonic text-6xl font-normal tracking-tight text-gray-900 mb-4">
              Help & Support Guide
            </h1>
            <p className="font-capsule text-base font-normal text-gray-600 max-w-2xl mx-auto">
              Comprehensive assistance for merchants and customers using Cryptrac's cryptocurrency payment processing platform
            </p>
            <div className="flex items-center justify-center gap-4 mt-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Last Updated: {lastUpdated}</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Version 1.0</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container-wide flex gap-8 relative py-8">
        {/* Sidebar Navigation */}
        <aside className="hidden lg:block w-64 sticky top-24 h-fit">
          <Card className="shadow-lg border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="font-phonic text-sm font-normal text-gray-900">Table of Contents</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="space-y-1 pb-4">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-all hover:bg-gray-50 ${
                        activeSection === section.id 
                          ? 'bg-[#f5f3ff] text-[#7f5efd] border-l-2 border-[#7f5efd]' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="text-left">{section.title}</span>
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </aside>

        {/* Main Content */}
        <main className="flex-1 max-w-4xl">
          <Card className="shadow-xl border-0">
            <CardContent className="p-8 md:p-12">
              <div className="prose prose-gray max-w-none">
                {/* Section 1: Welcome */}
                <section id="welcome" className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <HelpCircle className="h-8 w-8 text-[#7f5efd]" />
                    1. Welcome to Cryptrac
                  </h2>
                  <div className="bg-[#f5f3ff] border-l-4 border-[#7f5efd] p-6 rounded-r-lg mb-6">
                    <p className="font-medium text-gray-900 mb-2">
                      Your Comprehensive Cryptocurrency Payment Processing Platform
                    </p>
                    <p className="text-gray-600">
                      This guide provides step-by-step instructions, troubleshooting tips, and answers to frequently asked questions
                    </p>
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Welcome to Cryptrac, your comprehensive cryptocurrency payment processing platform. This Help & Support Guide is designed to assist both merchants and customers in understanding and effectively using our services. Whether you're a business owner looking to accept cryptocurrency payments or a customer making a purchase, this guide provides step-by-step instructions, troubleshooting tips, and answers to frequently asked questions.
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Cryptrac simplifies cryptocurrency payments by providing a secure, non-custodial platform that connects merchants with customers through seamless payment processing. Our platform supports multiple cryptocurrencies including Bitcoin, Ethereum, Solana, TRON, BNB, and various stablecoins, making it easy for businesses to expand their payment options and reach a global customer base.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    This guide is organized into sections for different user types and common scenarios. Merchants will find detailed information about account setup, payment link creation, wallet management, and subscription services. Customers will discover how to make payments, understand transaction processes, and resolve common payment issues. Both user types will benefit from our troubleshooting section and contact information for additional support.
                  </p>
                </section>

                <Separator className="my-12" />

                {/* Section 2: Getting Started for Merchants */}
                <section id="merchants" className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <Users className="h-8 w-8 text-[#7f5efd]" />
                    2. Getting Started for Merchants
                  </h2>
                  
                  <p className="text-gray-700 leading-relaxed mb-6">
                    Setting up your Cryptrac merchant account is the first step toward accepting cryptocurrency payments for your business. Our onboarding process is designed to be straightforward while ensuring compliance with regulatory requirements and security best practices.
                  </p>

                  <div className="space-y-6">
                    <Card className="border-[#7f5efd]/20 bg-[#f5f3ff]/30">
                      <CardHeader>
                        <CardTitle className="text-lg text-gray-900">Account Registration Process</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-gray-700">The registration process begins with:</p>
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li className="flex items-start gap-2">
                            <Badge variant="outline" className="mt-0.5">1</Badge>
                            <span>Visit our website and click "Sign Up" or "Get Started"</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Badge variant="outline" className="mt-0.5">2</Badge>
                            <span>Provide basic business information including business name, contact details, and business type</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Badge variant="outline" className="mt-0.5">3</Badge>
                            <span>Create secure login credentials and verify your email address</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Badge variant="outline" className="mt-0.5">4</Badge>
                            <span>Complete business verification and compliance requirements</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-gray-200">
                      <CardHeader className="bg-gray-50">
                        <CardTitle className="text-lg text-gray-900">Business Verification and Compliance</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <p className="text-gray-700 mb-3">Requirements vary based on your location and business type, but generally include:</p>
                        <ul className="space-y-2 text-gray-700">
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Proof of business registration</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Tax identification numbers</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Contact information for key business personnel</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Additional documentation as required by regulations</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-gray-200">
                      <CardHeader className="bg-gray-50">
                        <CardTitle className="text-lg text-gray-900">Cryptocurrency Wallet Configuration</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <p className="text-gray-700 mb-3">
                          Cryptrac operates as a non-custodial platform, meaning payments go directly to wallet addresses you control rather than being held by our platform.
                        </p>
                        <ul className="space-y-2 text-gray-700">
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Provide valid wallet addresses for each cryptocurrency you want to accept</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Our platform supports Bitcoin, Ethereum, Solana, TRON, BNB, and associated stablecoins</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Double-check addresses before saving - cryptocurrency transactions are irreversible</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                <Separator className="my-12" />

                {/* Section 3: Merchant Dashboard Features */}
                <section id="dashboard" className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <Settings className="h-8 w-8 text-[#7f5efd]" />
                    3. Merchant Dashboard Features
                  </h2>
                  
                  <p className="text-gray-700 leading-relaxed mb-6">
                    Your merchant dashboard serves as the central hub for managing all aspects of your cryptocurrency payment processing. Understanding the various features and sections will help you maximize the effectiveness of our platform for your business needs.
                  </p>

                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <Card className="border-[#7f5efd]/20">
                      <CardHeader className="bg-[#f5f3ff]">
                        <CardTitle className="text-lg text-gray-900">Dashboard Overview</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Total payments received and transaction volume</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Recent transaction activity and pending payments</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Customizable date ranges for analytics</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Important notifications and system updates</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-gray-200">
                      <CardHeader className="bg-gray-50">
                        <CardTitle className="text-lg text-gray-900">Payment Link Management</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Create, edit, and monitor all payment links</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>View detailed analytics and conversion rates</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Modify accepted cryptocurrencies and settings</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Set expiration dates and usage limits</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900">
                      <strong>Pro Tip:</strong> Use the dashboard analytics to understand which cryptocurrencies are most popular with your customers and optimize your payment offerings accordingly.
                    </p>
                  </div>
                </section>

                <Separator className="my-12" />

                {/* Section 4: Customer Payment Guide */}
                <section id="customers" className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <CreditCard className="h-8 w-8 text-[#7f5efd]" />
                    4. Customer Payment Guide
                  </h2>
                  
                  <p className="text-gray-700 leading-relaxed mb-6">
                    Making payments through Cryptrac is designed to be simple and secure, whether you're purchasing products, services, or making recurring payments. This section provides step-by-step guidance for customers navigating the payment process.
                  </p>

                  <div className="space-y-6">
                    <Card className="border-green-200 bg-green-50">
                      <CardHeader>
                        <CardTitle className="text-lg text-green-900">Accessing Payment Pages</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-green-800">
                          Payment links are unique URLs that direct you to secure payment pages hosted on our platform.
                        </p>
                        <ul className="space-y-2 text-sm text-green-700">
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>Merchants share payment links through email, social media, or their website</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>Pages display merchant information, payment details, and accepted cryptocurrencies</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>Optimized for both desktop and mobile devices</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-blue-200 bg-blue-50">
                      <CardHeader>
                        <CardTitle className="text-lg text-blue-900">Making the Payment</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-blue-800">
                          Send the specified amount of cryptocurrency to the provided wallet address within the designated time frame.
                        </p>
                        <ul className="space-y-2 text-sm text-blue-700">
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>Scan QR code with your cryptocurrency wallet app (mobile users)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>Copy wallet address and amount for manual entry (desktop users)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>Double-check all information before confirming the transaction</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-purple-200 bg-purple-50">
                      <CardHeader>
                        <CardTitle className="text-lg text-purple-900">Transaction Confirmation</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-purple-800">
                          The payment page will automatically detect your transaction and update the status.
                        </p>
                        <ul className="space-y-2 text-sm text-purple-700">
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-purple-600 mt-0.5" />
                            <span>Status updates: "Awaiting Payment" → "Payment Detected" → "Payment Confirmed"</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-purple-600 mt-0.5" />
                            <span>Confirmation times vary by cryptocurrency and network congestion</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-purple-600 mt-0.5" />
                            <span>Monitor status on payment page or through blockchain explorers</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
                    <p className="text-sm text-amber-900">
                      <strong>Important:</strong> Cryptocurrency transactions are generally irreversible. Always verify payment details before sending funds.
                    </p>
                  </div>
                </section>

                <Separator className="my-12" />

                {/* Section 5: Troubleshooting */}
                <section id="troubleshooting" className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <Wrench className="h-8 w-8 text-[#7f5efd]" />
                    5. Troubleshooting Common Issues
                  </h2>
                  
                  <p className="text-gray-700 leading-relaxed mb-6">
                    Despite our efforts to provide a seamless payment experience, technical issues or user errors can occasionally occur. This troubleshooting section addresses the most common problems encountered by both merchants and customers, along with step-by-step solutions.
                  </p>

                  <div className="space-y-6">
                    <Card className="border-red-200 bg-red-50">
                      <CardHeader>
                        <CardTitle className="text-lg text-red-900">Payment Not Detected Issues</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-red-800 mb-3">If you've sent a cryptocurrency payment but the payment page still shows "Awaiting Payment":</p>
                        <ul className="space-y-2 text-sm text-red-700">
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-red-600 mt-0.5" />
                            <span>Verify you sent the correct amount to the exact wallet address provided</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-red-600 mt-0.5" />
                            <span>Check transaction status on a blockchain explorer using your transaction ID</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-red-600 mt-0.5" />
                            <span>Wait for sufficient network confirmations (may take 10-60 minutes)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-red-600 mt-0.5" />
                            <span>Contact the merchant immediately if you sent to an incorrect address</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-orange-200 bg-orange-50">
                      <CardHeader>
                        <CardTitle className="text-lg text-orange-900">Transaction Confirmation Delays</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-orange-800 mb-3">Confirmation delays are often related to network conditions:</p>
                        <ul className="space-y-2 text-sm text-orange-700">
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-orange-600 mt-0.5" />
                            <span>Check current network status and fee recommendations</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-orange-600 mt-0.5" />
                            <span>Consider increasing transaction fees during high congestion</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-orange-600 mt-0.5" />
                            <span>Use "replace-by-fee" mechanisms if supported by your wallet</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-yellow-200 bg-yellow-50">
                      <CardHeader>
                        <CardTitle className="text-lg text-yellow-900">Account Access Problems</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-yellow-800 mb-3">If you're unable to log in to your merchant account:</p>
                        <ul className="space-y-2 text-sm text-yellow-700">
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-yellow-600 mt-0.5" />
                            <span>Verify you're using the correct email address and password</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-yellow-600 mt-0.5" />
                            <span>Use the "Forgot Password" link to reset your password</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-yellow-600 mt-0.5" />
                            <span>Check your email (including spam folder) for reset instructions</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-yellow-600 mt-0.5" />
                            <span>Contact support if you have two-factor authentication issues</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                <Separator className="my-12" />

                {/* Section 6: Security Best Practices */}
                <section id="security" className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <Shield className="h-8 w-8 text-[#7f5efd]" />
                    6. Security Best Practices
                  </h2>
                  
                  <p className="text-gray-700 leading-relaxed mb-6">
                    Security is paramount when dealing with cryptocurrency payments, and both merchants and customers play important roles in maintaining the safety and integrity of transactions. This section outlines essential security practices that help protect against fraud, theft, and other security threats.
                  </p>

                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <Card className="border-green-200 bg-green-50">
                      <CardHeader>
                        <CardTitle className="text-lg text-green-900">Account Security for Merchants</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <ul className="space-y-2 text-sm text-green-700">
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>Create strong, unique passwords</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>Enable two-factor authentication (2FA)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>Regularly review account activity</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>Keep contact information updated</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-blue-200 bg-blue-50">
                      <CardHeader>
                        <CardTitle className="text-lg text-blue-900">Wallet Security</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <ul className="space-y-2 text-sm text-blue-700">
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>Use reputable wallet applications</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>Store private keys securely offline</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>Regularly backup wallet data</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>Monitor wallet addresses for activity</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-900">
                      <strong>Critical:</strong> Never share your private keys or recovery phrases with anyone, including Cryptrac support staff. Legitimate support requests will never require this information.
                    </p>
                  </div>
                </section>

                <Separator className="my-12" />

                {/* Section 7: Contact Information */}
                <section id="contact" className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <Phone className="h-8 w-8 text-[#7f5efd]" />
                    7. Contact Information and Support Channels
                  </h2>
                  
                  <p className="text-gray-700 leading-relaxed mb-6">
                    We provide multiple ways to get help and support for your Cryptrac experience. Our support team is committed to providing timely, helpful assistance for both technical issues and general questions about our platform and services.
                  </p>
                  
                  <Card className="border-[#7f5efd]/20 bg-gradient-to-br from-[#f5f3ff] to-white">
                    <CardHeader>
                      <CardTitle className="text-xl text-gray-900">Cryptrac Solutions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-[#7f5efd]" />
                        <div>
                          <p className="text-sm text-gray-600">General Support</p>
                          <a href="mailto:support@cryptrac.com" className="font-semibold text-gray-900 hover:text-[#7f5efd]">
                            support@cryptrac.com
                          </a>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-[#7f5efd]" />
                        <div>
                          <p className="text-sm text-gray-600">Phone Support</p>
                          <a href="tel:+13476193721" className="font-semibold text-gray-900 hover:text-[#7f5efd]">
                            +1 (347) 619-3721
                          </a>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-[#7f5efd]" />
                        <div>
                          <p className="text-sm text-gray-600">Security Issues</p>
                          <a href="mailto:security@cryptrac.com" className="font-semibold text-gray-900 hover:text-[#7f5efd]">
                            security@cryptrac.com
                          </a>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-[#7f5efd]" />
                        <div>
                          <p className="text-sm text-gray-600">Business Hours</p>
                          <p className="font-semibold text-gray-900">
                            Monday - Friday, 9:00 AM - 6:00 PM EST
                          </p>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <p className="text-sm text-gray-600">
                          <strong>Response Time Expectations:</strong> Email support within 24 hours (business days), live chat immediate during business hours, security issues within 2 hours, emergency issues within 1 hour.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </section>

                {/* Final Support Box */}
                <Card className="border-[#7f5efd] bg-gradient-to-br from-[#f5f3ff] to-white">
                  <CardContent className="pt-8 pb-8 text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      Need Additional Help?
                    </h3>
                    <p className="text-gray-700 mb-6">
                      Our support team is here to help you succeed with cryptocurrency payment processing. Don't hesitate to reach out whenever you need assistance.
                    </p>
                    <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>Last Updated: {lastUpdated}</span>
                      </div>
                      <Separator orientation="vertical" className="h-4" />
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>Version 1.0</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="container-wide">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <Logo variant="white" size="sm" />
              <Separator orientation="vertical" className="h-6 bg-gray-700" />
              <p className="text-sm text-gray-400">
                © 2025 Cryptrac Solutions. All rights reserved.
              </p>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/cookies" className="text-sm text-gray-400 hover:text-white transition-colors">
                Cookie Policy
              </Link>
              <Link href="/contact" className="text-sm text-gray-400 hover:text-white transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
