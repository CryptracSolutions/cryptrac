'use client';

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ChevronRight, FileText, Shield, CreditCard, Users, AlertCircle, Ban, Lock, Scale, Zap, Phone, Mail, MapPin, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Logo } from "@/app/components/ui/logo";
import { Separator } from "@/app/components/ui/separator";
import { Badge } from "@/app/components/ui/badge";
import { LandingNav } from "@/app/components/layout/landing-nav";

export default function TermsOfService() {
  const [activeSection, setActiveSection] = useState<string>("");
  const effectiveDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const sections = useMemo(() => [
    { id: "introduction", title: "Introduction & Acceptance", icon: FileText },
    { id: "service", title: "Service Description", icon: Zap },
    { id: "eligibility", title: "Eligibility & Registration", icon: Users },
    { id: "merchant", title: "Merchant Responsibilities", icon: Shield },
    { id: "customer", title: "Customer Obligations", icon: CreditCard },
    { id: "fees", title: "Fees & Processing", icon: Scale },
    { id: "prohibited", title: "Prohibited Uses", icon: Ban },
    { id: "intellectual", title: "Intellectual Property", icon: Lock },
    { id: "privacy", title: "Privacy & Data", icon: Shield },
    { id: "liability", title: "Liability & Disclaimers", icon: AlertCircle },
    { id: "indemnification", title: "Indemnification", icon: Shield },
    { id: "termination", title: "Termination", icon: AlertCircle },
    { id: "dispute", title: "Dispute Resolution", icon: Scale },
    { id: "force", title: "Force Majeure", icon: AlertCircle },
    { id: "general", title: "General Provisions", icon: FileText },
    { id: "contact", title: "Contact Information", icon: Phone }
  ], []);

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
  }, [sections]);

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
      <LandingNav />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-12 md:py-16">
        <div className="container-wide relative z-10 px-4 md:px-6">
          <div className="text-center">
            <Badge className="mb-4 bg-[#f5f3ff] text-[#7f5efd] border-[#ede9fe]">
              Legal Documentation
            </Badge>
            <h1 className="font-phonic text-3xl md:text-4xl lg:text-6xl font-normal tracking-tight text-gray-900 mb-4">
              Terms of Service
            </h1>
            <p className="font-capsule text-base font-normal text-gray-600 max-w-2xl mx-auto px-4">
              Please read these terms carefully before using Cryptrac&apos;s cryptocurrency payment processing platform
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 mt-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Effective: {effectiveDate}</span>
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

      {/* Mobile Navigation Dropdown */}
      <div className="lg:hidden w-full mb-4 px-4 md:px-6 sticky top-16 z-30 bg-white py-2 border-b border-gray-100">
        <details className="group">
          <summary className="flex items-center justify-between w-full px-4 py-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 min-h-[44px]">
            <span className="font-phonic text-base font-normal text-gray-900">Table of Contents</span>
            <svg className="w-5 h-5 text-gray-500 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="mt-2 bg-white border border-gray-200 rounded-lg overflow-hidden">
            <nav className="py-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={(e) => {
                      scrollToSection(section.id);
                      // Close the details dropdown
                      const details = e.currentTarget.closest('details');
                      if (details) details.open = false;
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 min-h-[44px] font-phonic text-base font-normal transition-all hover:bg-gray-50 ${
                      activeSection === section.id
                        ? 'bg-[#f5f3ff] text-[#7f5efd] border-l-2 border-[#7f5efd]'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="text-left">{section.title}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </details>
      </div>

      <div className="container-wide flex gap-8 relative py-4 md:py-8 px-4 md:px-6">
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
                      className={`w-full flex items-center gap-3 px-4 py-2 font-phonic text-sm font-normal transition-all hover:bg-gray-50 ${
                        activeSection === section.id 
                          ? 'bg-[#f5f3ff] text-[#7f5efd] border-l-2 border-[#7f5efd]' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="text-left text-sm">{section.title}</span>
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </aside>

        {/* Main Content */}
        <main className="flex-1 max-w-4xl w-full">
          <Card className="shadow-xl border-0">
            <CardContent className="p-4 md:p-8 lg:p-12">
              <div className="prose prose-gray max-w-none">
                {/* Section 1: Introduction */}
                <section id="introduction" className="mb-12">
                  <h2 className="font-phonic text-xl md:text-2xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <FileText className="h-6 w-6 md:h-8 md:w-8 text-[#7f5efd]" />
                    1. Introduction and Acceptance of Terms
                  </h2>
                  <div className="bg-[#f5f3ff] border-l-4 border-[#7f5efd] p-4 md:p-6 rounded-r-lg mb-6">
                    <p className="font-phonic text-base font-normal text-gray-900 mb-2">
                      Welcome to Cryptrac, operated by Cryptrac Solutions
                    </p>
                    <p className="font-capsule text-base font-normal text-gray-600">
                      These Terms govern your use of our cryptocurrency payment processing platform
                    </p>
                  </div>
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-4">
                    Welcome to Cryptrac, a cryptocurrency payment processing platform operated by Cryptrac Solutions (&ldquo;Company,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). These Terms of Service (&ldquo;Terms&rdquo;) govern your use of our website, mobile applications, and related services (collectively, the &ldquo;Service&rdquo;) that enable merchants to accept cryptocurrency payments and provide customers with secure payment processing solutions.
                  </p>
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-4">
                    By accessing or using our Service, you (&ldquo;User,&rdquo; &ldquo;you,&rdquo; or &ldquo;your&rdquo;) agree to be bound by these Terms and our Privacy Policy, which is incorporated herein by reference. If you do not agree to these Terms, you may not access or use our Service.
                  </p>
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed">
                    These Terms constitute a legally binding agreement between you and Cryptrac Solutions. We reserve the right to modify these Terms at any time, and such modifications will be effective immediately upon posting. Your continued use of the Service after any such changes constitutes your acceptance of the new Terms.
                  </p>
                </section>

                <Separator className="my-12" />

                {/* Section 2: Service Description */}
                <section id="service" className="mb-12">
                  <h2 className="font-phonic text-xl md:text-2xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <Zap className="h-6 w-6 md:h-8 md:w-8 text-[#7f5efd]" />
                    2. Description of Service
                  </h2>
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    Cryptrac is a non-custodial cryptocurrency payment processing platform that facilitates transactions between merchants and customers using various cryptocurrencies including Bitcoin (BTC), Ethereum (ETH), Solana (SOL), TRON (TRX), BNB, and associated stablecoins such as USDT, USDC, and DAI.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <Card className="border-gray-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="font-phonic text-lg md:text-xl lg:text-2xl font-normal text-gray-900">Merchant Features</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 font-phonic text-sm font-normal text-gray-600">
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Payment link generation</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Multi-currency wallet management</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Subscription billing</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Smart terminal functionality</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-gray-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="font-phonic text-lg md:text-xl lg:text-2xl font-normal text-gray-900">Customer Features</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 font-phonic text-sm font-normal text-gray-600">
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Secure payment pages</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>QR code functionality</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Real-time status updates</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Transaction receipts</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="font-phonic text-sm font-normal text-amber-900">
                      <strong>Important:</strong> As a non-custodial platform, Cryptrac does not hold, store, or have access to customer funds. All payments are processed directly to merchant-specified wallet addresses.
                    </p>
                  </div>
                </section>

                <Separator className="my-12" />

                {/* Section 3: Eligibility */}
                <section id="eligibility" className="mb-12">
                  <h2 className="font-phonic text-xl md:text-2xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <Users className="h-6 w-6 md:h-8 md:w-8 text-[#7f5efd]" />
                    3. Eligibility and Account Registration
                  </h2>
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    To use our Service, you must be at least 18 years of age and have the legal capacity to enter into binding agreements. By using our Service, you represent and warrant that you meet these eligibility requirements and that all information you provide is accurate, current, and complete.
                  </p>
                  
                  <Card className="border-[#7f5efd]/20 bg-[#f5f3ff]/30 mb-6">
                    <CardHeader>
                      <CardTitle className="text-lg text-gray-900">Merchant Requirements</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="font-capsule text-base font-normal text-gray-700">Merchants must provide:</p>
                      <ul className="space-y-2 font-phonic text-sm font-normal text-gray-600">
                        <li className="flex items-start gap-2">
                          <Badge variant="outline" className="mt-0.5">1</Badge>
                          <span>Accurate business information and contact details</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Badge variant="outline" className="mt-0.5">2</Badge>
                          <span>Valid cryptocurrency wallet addresses</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Badge variant="outline" className="mt-0.5">3</Badge>
                          <span>Compliance documentation as required</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                  
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed">
                    You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account or any other breach of security.
                  </p>
                </section>

                <Separator className="my-12" />

                {/* Section 4: Merchant Responsibilities */}
                <section id="merchant" className="mb-12">
                  <h2 className="font-phonic text-xl md:text-2xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <Shield className="h-6 w-6 md:h-8 md:w-8 text-[#7f5efd]" />
                    4. Merchant Responsibilities and Obligations
                  </h2>
                  
                  <div className="space-y-6">
                    <Card className="border-gray-200">
                      <CardHeader className="bg-gray-50">
                        <CardTitle className="font-phonic text-lg md:text-xl lg:text-2xl font-normal text-gray-900">Wallet Address Management</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <p className="font-capsule text-base font-normal text-gray-700">
                          You are solely responsible for the accuracy and validity of all cryptocurrency wallet addresses provided to our platform. Cryptrac is not liable for any losses resulting from incorrect wallet addresses. Cryptocurrency transactions are generally irreversible.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-gray-200">
                      <CardHeader className="bg-gray-50">
                        <CardTitle className="font-phonic text-lg md:text-xl lg:text-2xl font-normal text-gray-900">Legal Compliance</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <ul className="space-y-2 text-gray-700">
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Tax obligations and reporting</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Business licensing requirements</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Consumer protection laws</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Financial services regulations</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-gray-200">
                      <CardHeader className="bg-gray-50">
                        <CardTitle className="font-phonic text-lg md:text-xl lg:text-2xl font-normal text-gray-900">Product & Service Accuracy</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <p className="font-capsule text-base font-normal text-gray-700">
                          You are responsible for the accuracy of all product descriptions, pricing, and terms of sale. You must honor all transactions completed through our Service and resolve disputes directly with customers.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
                    <p className="text-sm text-red-900">
                      <strong>Prohibited:</strong> You must not use our Service for illegal activities including money laundering, terrorist financing, fraud, or sale of prohibited goods.
                    </p>
                  </div>
                </section>

                <Separator className="my-12" />

                {/* Section 5: Customer Obligations */}
                <section id="customer" className="mb-12">
                  <h2 className="font-phonic text-xl md:text-2xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <CreditCard className="h-6 w-6 md:h-8 md:w-8 text-[#7f5efd]" />
                    5. Customer Payment Process and Obligations
                  </h2>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <h3 className="font-phonic text-base font-normal text-blue-900 mb-3">Important Payment Information</h3>
                    <ul className="space-y-2 font-phonic text-sm font-normal text-blue-800">
                      <li className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-0.5" />
                        <span>Cryptocurrency transactions are generally irreversible</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-0.5" />
                        <span>Exchange rates may fluctuate during transaction</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-0.5" />
                        <span>Network fees apply and vary by blockchain</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-0.5" />
                        <span>Confirmation times depend on network congestion</span>
                      </li>
                    </ul>
                  </div>
                  
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-4">
                    When making a payment through our Service, you are responsible for ensuring that you send the correct amount of cryptocurrency to the specified wallet address within the designated time frame. We cannot recover funds sent to incorrect addresses or in incorrect amounts.
                  </p>
                  
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed">
                    You acknowledge that cryptocurrency values are highly volatile and that the amount of cryptocurrency required for payment may change between the time a payment link is generated and when the transaction is completed. Exchange rates are determined by our payment processor, NOWPayments.
                  </p>
                </section>

                <Separator className="my-12" />

                {/* Section 6: Fees */}
                <section id="fees" className="mb-12">
                  <h2 className="font-phonic text-xl md:text-2xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <Scale className="h-6 w-6 md:h-8 md:w-8 text-[#7f5efd]" />
                    6. Fees and Payment Processing
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <Card className="border-[#7f5efd]/20">
                      <CardHeader className="bg-[#f5f3ff]">
                        <CardTitle className="font-phonic text-lg md:text-xl lg:text-2xl font-normal text-gray-900">Platform Fee</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="font-phonic text-3xl font-normal text-[#7f5efd] mb-2">$19/month</div>
                        <p className="font-phonic text-sm font-normal text-gray-600">or $199/year</p>
                        <p className="font-phonic text-xs font-normal text-gray-500 mt-2">Subscription only</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-gray-200">
                      <CardHeader className="bg-gray-50">
                        <CardTitle className="font-phonic text-lg md:text-xl lg:text-2xl font-normal text-gray-900">Gateway Fee</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="font-phonic text-3xl font-normal text-gray-900 mb-2">0.5-1%</div>
                        <p className="font-phonic text-sm font-normal text-gray-600">Direct: 0.5%</p>
                        <p className="font-phonic text-sm font-normal text-gray-600">Auto-convert: 1%</p>
                        <p className="font-phonic text-xs font-normal text-gray-500 mt-2">Charged by NOWPayments</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-gray-200">
                      <CardHeader className="bg-gray-50">
                        <CardTitle className="font-phonic text-lg md:text-xl lg:text-2xl font-normal text-gray-900">Network Fee</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="font-phonic text-3xl font-normal text-gray-900 mb-2">Variable</div>
                        <p className="font-phonic text-sm font-normal text-gray-600">Depends on blockchain</p>
                        <p className="font-phonic text-xs font-normal text-gray-500 mt-2">Paid to network validators</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed">
                    Our Service utilizes NOWPayments as our primary payment processor. Gateway fees are charged by NOWPayments and are not controlled by Cryptrac. Merchants may choose to absorb these fees or pass them on to customers. Network fees vary based on blockchain congestion and are paid directly to network validators or miners.
                  </p>
                </section>

                <Separator className="my-12" />

                {/* Section 7: Prohibited Uses */}
                <section id="prohibited" className="mb-12">
                  <h2 className="font-phonic text-xl md:text-2xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <Ban className="h-6 w-6 md:h-8 md:w-8 text-[#7f5efd]" />
                    7. Prohibited Uses and Conduct
                  </h2>
                  
                  <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                      <CardTitle className="text-lg text-red-900">Strictly Prohibited Activities</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-phonic text-base font-normal text-red-900">Illegal Activities</h4>
                        <ul className="space-y-1 font-phonic text-sm font-normal text-red-800">
                          <li>• Money laundering or terrorist financing</li>
                          <li>• Fraud, tax evasion, or financial crimes</li>
                          <li>• Sale of illegal goods or services</li>
                          <li>• Violation of sanctions or export controls</li>
                        </ul>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-phonic text-base font-normal text-red-900">System Abuse</h4>
                        <ul className="space-y-1 font-phonic text-sm font-normal text-red-800">
                          <li>• Unauthorized access attempts</li>
                          <li>• Malware or virus transmission</li>
                          <li>• System vulnerability exploitation</li>
                          <li>• Service disruption attempts</li>
                        </ul>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-phonic text-base font-normal text-red-900">High-Risk Activities</h4>
                        <ul className="space-y-1 font-phonic text-sm font-normal text-red-800">
                          <li>• Gambling or adult content</li>
                          <li>• Pharmaceuticals or weapons</li>
                          <li>• Activities prohibited by payment processors</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </section>

                <Separator className="my-12" />

                {/* Section 8: Intellectual Property */}
                <section id="intellectual" className="mb-12">
                  <h2 className="font-phonic text-xl md:text-2xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <Lock className="h-6 w-6 md:h-8 md:w-8 text-[#7f5efd]" />
                    8. Intellectual Property Rights
                  </h2>
                  
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    The Service and its original content, features, and functionality are and will remain the exclusive property of Cryptrac Solutions and its licensors. The Service is protected by copyright, trademark, and other laws.
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card className="border-gray-200">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-gray-900">Your License</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-phonic text-sm font-normal text-gray-600">
                          Limited, non-exclusive, non-transferable, revocable license to use our Service for its intended purpose.
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-gray-200">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-gray-900">Your Content</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-phonic text-sm font-normal text-gray-600">
                          You retain ownership of content you submit but grant us a license to use it in connection with providing our Service.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                <Separator className="my-12" />

                {/* Section 9: Privacy */}
                <section id="privacy" className="mb-12">
                  <h2 className="font-phonic text-xl md:text-2xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <Shield className="h-6 w-6 md:h-8 md:w-8 text-[#7f5efd]" />
                    9. Privacy and Data Protection
                  </h2>
                  
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    Your privacy is important to us, and we are committed to protecting your personal information in accordance with our Privacy Policy. By using our Service, you consent to the collection, use, and disclosure of your information as described.
                  </p>
                  
                  <Card className="border-[#7f5efd]/20 bg-[#f5f3ff]/30">
                    <CardHeader>
                      <CardTitle className="font-phonic text-2xl font-normal text-gray-900">Data Collection & Processing</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="font-capsule text-base font-normal text-gray-700">We collect and process:</p>
                      <ul className="space-y-2 font-phonic text-sm font-normal text-gray-600">
                        <li className="flex items-start gap-2">
                          <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                          <span>Account information and transaction data</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                          <span>Communications and support interactions</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                          <span>Usage analytics for service improvement</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                  
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
                    <p className="font-phonic text-sm font-normal text-amber-900">
                      <strong>Note:</strong> Cryptocurrency transactions are recorded on public blockchains. While we don&apos;t publish personal information, transaction details may be publicly visible on blockchain explorers.
                    </p>
                  </div>
                </section>

                <Separator className="my-12" />

                {/* Section 10: Liability */}
                <section id="liability" className="mb-12">
                  <h2 className="font-phonic text-xl md:text-2xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <AlertCircle className="h-6 w-6 md:h-8 md:w-8 text-[#7f5efd]" />
                    10. Limitation of Liability and Disclaimers
                  </h2>
                  
                  <Card className="border-orange-200 bg-orange-50">
                    <CardHeader>
                      <CardTitle className="font-phonic text-2xl font-normal text-orange-900 uppercase">Important Legal Notice</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-orange-900">
                      <p className="font-phonic text-base font-normal">
                        TO THE MAXIMUM EXTENT PERMITTED BY LAW, CRYPTRAC SOLUTIONS SHALL NOT BE LIABLE FOR:
                      </p>
                      <ul className="space-y-2 font-phonic text-sm font-normal">
                        <li>• Indirect, incidental, special, or consequential damages</li>
                        <li>• Loss of profits, data, or goodwill</li>
                        <li>• Service interruptions or errors</li>
                        <li>• Cryptocurrency value fluctuations</li>
                        <li>• Incorrect wallet addresses or lost transactions</li>
                      </ul>
                      <p className="font-phonic text-sm font-normal">
                        OUR SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <p className="text-gray-700 leading-relaxed mt-6">
                    Our total liability for any claims shall not exceed the fees paid by you in the twelve months preceding the claim, or $100, whichever is greater. Some jurisdictions do not allow these limitations, so they may not apply to you.
                  </p>
                </section>

                <Separator className="my-12" />

                {/* Section 11: Indemnification */}
                <section id="indemnification" className="mb-12">
                  <h2 className="font-phonic text-xl md:text-2xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <Shield className="h-6 w-6 md:h-8 md:w-8 text-[#7f5efd]" />
                    11. Indemnification
                  </h2>
                  
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-4">
                    You agree to defend, indemnify, and hold harmless Cryptrac Solutions and its officers, directors, employees, agents, and affiliates from and against any and all claims, damages, obligations, losses, liabilities, costs, or debt, and expenses (including attorney&apos;s fees) arising from:
                  </p>
                  
                  <ul className="space-y-2 text-gray-700 mb-4">
                    <li className="flex items-start gap-2">
                      <Badge className="mt-0.5">1</Badge>
                      <span>Your use of our Service</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge className="mt-0.5">2</Badge>
                      <span>Your violation of these Terms</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge className="mt-0.5">3</Badge>
                      <span>Your violation of any third-party rights</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge className="mt-0.5">4</Badge>
                      <span>Any content you submit to our Service</span>
                    </li>
                  </ul>
                  
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed">
                    This indemnification obligation will survive the termination of these Terms and your use of our Service.
                  </p>
                </section>

                <Separator className="my-12" />

                {/* Section 12: Termination */}
                <section id="termination" className="mb-12">
                  <h2 className="font-phonic text-xl md:text-2xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <AlertCircle className="h-6 w-6 md:h-8 md:w-8 text-[#7f5efd]" />
                    12. Termination
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <Card className="border-gray-200">
                      <CardHeader className="bg-gray-50">
                        <CardTitle className="font-phonic text-lg md:text-xl lg:text-2xl font-normal text-gray-900">We May Terminate</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <p className="text-sm text-gray-600 mb-2">Immediately for:</p>
                        <ul className="space-y-1 text-sm text-gray-600">
                          <li>• Breach of Terms</li>
                          <li>• Suspected fraud</li>
                          <li>• Legal violations</li>
                          <li>• System abuse</li>
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-gray-200">
                      <CardHeader className="bg-gray-50">
                        <CardTitle className="font-phonic text-lg md:text-xl lg:text-2xl font-normal text-gray-900">You May Terminate</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <p className="text-sm text-gray-600 mb-2">At any time by:</p>
                        <ul className="space-y-1 text-sm text-gray-600">
                          <li>• Contacting support</li>
                          <li>• Using dashboard options</li>
                          <li>• Stopping use of Service</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed">
                    Upon termination, your right to use our Service ceases immediately. We will provide access to your transaction data for 30 days, after which it may be permanently deleted.
                  </p>
                </section>

                <Separator className="my-12" />

                {/* Section 13: Dispute Resolution */}
                <section id="dispute" className="mb-12">
                  <h2 className="font-phonic text-xl md:text-2xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <Scale className="h-6 w-6 md:h-8 md:w-8 text-[#7f5efd]" />
                    13. Dispute Resolution and Governing Law
                  </h2>
                  
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    These Terms shall be governed by and construed in accordance with applicable laws. Any disputes arising from or relating to these Terms or our Service shall be resolved through the following process:
                  </p>
                  
                  <div className="space-y-4">
                    <Card className="border-gray-200">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <Badge className="bg-[#7f5efd] text-white">Step 1</Badge>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-1">Good Faith Negotiation</h4>
                            <p className="font-phonic text-sm font-normal text-gray-600">Contact our support team to attempt resolution</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-gray-200">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <Badge className="bg-[#7f5efd] text-white">Step 2</Badge>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-1">Binding Arbitration</h4>
                            <p className="font-phonic text-sm font-normal text-gray-600">Individual arbitration if negotiation fails</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
                    <p className="text-sm text-gray-700">
                      <strong>Class Action Waiver:</strong> You agree that any arbitration will be conducted on an individual basis and not as part of a class action.
                    </p>
                  </div>
                </section>

                <Separator className="my-12" />

                {/* Section 14: Force Majeure */}
                <section id="force" className="mb-12">
                  <h2 className="font-phonic text-xl md:text-2xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <AlertCircle className="h-6 w-6 md:h-8 md:w-8 text-[#7f5efd]" />
                    14. Force Majeure
                  </h2>
                  
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-4">
                    We shall not be liable for any failure or delay in performance due to circumstances beyond our reasonable control, including but not limited to:
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <Card className="border-gray-200">
                      <CardContent className="pt-4 pb-4">
                        <p className="text-sm text-center text-gray-600">Natural disasters</p>
                      </CardContent>
                    </Card>
                    <Card className="border-gray-200">
                      <CardContent className="pt-4 pb-4">
                        <p className="text-sm text-center text-gray-600">Internet outages</p>
                      </CardContent>
                    </Card>
                    <Card className="border-gray-200">
                      <CardContent className="pt-4 pb-4">
                        <p className="text-sm text-center text-gray-600">Government actions</p>
                      </CardContent>
                    </Card>
                    <Card className="border-gray-200">
                      <CardContent className="pt-4 pb-4">
                        <p className="text-sm text-center text-gray-600">Labor disputes</p>
                      </CardContent>
                    </Card>
                    <Card className="border-gray-200">
                      <CardContent className="pt-4 pb-4">
                        <p className="text-sm text-center text-gray-600">Third-party failures</p>
                      </CardContent>
                    </Card>
                    <Card className="border-gray-200">
                      <CardContent className="pt-4 pb-4">
                        <p className="text-sm text-center text-gray-600">War or terrorism</p>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                <Separator className="my-12" />

                {/* Section 15: General Provisions */}
                <section id="general" className="mb-12">
                  <h2 className="font-phonic text-xl md:text-2xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <FileText className="h-6 w-6 md:h-8 md:w-8 text-[#7f5efd]" />
                    15. Severability and Entire Agreement
                  </h2>
                  
                  <div className="space-y-4">
                    <Card className="border-gray-200">
                      <CardContent className="pt-6">
                        <h4 className="font-semibold text-gray-900 mb-2">Severability</h4>
                        <p className="font-phonic text-sm font-normal text-gray-600">
                          If any provision of these Terms is found unenforceable, it will be limited or eliminated to the minimum extent necessary while remaining provisions stay in effect.
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-gray-200">
                      <CardContent className="pt-6">
                        <h4 className="font-semibold text-gray-900 mb-2">Entire Agreement</h4>
                        <p className="font-phonic text-sm font-normal text-gray-600">
                          These Terms, together with our Privacy Policy, constitute the entire agreement between you and Cryptrac Solutions regarding our Service.
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-gray-200">
                      <CardContent className="pt-6">
                        <h4 className="font-semibold text-gray-900 mb-2">Waiver</h4>
                        <p className="font-phonic text-sm font-normal text-gray-600">
                          Our failure to enforce any right or provision will not be considered a waiver. Any waiver must be in writing and signed by an authorized representative.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                <Separator className="my-12" />

                {/* Section 16: Contact */}
                <section id="contact" className="mb-12">
                  <h2 className="font-phonic text-xl md:text-2xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <Phone className="h-6 w-6 md:h-8 md:w-8 text-[#7f5efd]" />
                    16. Contact Information
                  </h2>
                  
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    If you have any questions about these Terms or our Service, please contact us:
                  </p>
                  
                  <Card className="border-[#7f5efd]/20 bg-gradient-to-br from-[#f5f3ff] to-white">
                    <CardHeader className="pb-3 md:pb-4">
                      <CardTitle className="font-phonic text-2xl md:text-3xl font-normal text-gray-900">Cryptrac Solutions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 md:space-y-6">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-[#7f5efd]" />
                        <div>
                          <p className="font-phonic text-sm font-normal text-gray-600">Email</p>
                          <a href="mailto:support@cryptrac.com" className="font-phonic text-base font-normal text-gray-900 hover:text-[#7f5efd]">
                            support@cryptrac.com
                          </a>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-[#7f5efd]" />
                        <div>
                          <p className="font-phonic text-sm font-normal text-gray-600">Phone</p>
                          <a href="tel:+13476193721" className="font-phonic text-base font-normal text-gray-900 hover:text-[#7f5efd]">
                            +1 (347) 619-3721
                          </a>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-[#7f5efd]" />
                        <div>
                          <p className="font-phonic text-sm font-normal text-gray-600">Address</p>
                          <p className="font-phonic text-base font-normal text-gray-900">
                            Contact support for mailing address
                          </p>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <p className="font-phonic text-sm font-normal text-gray-600">
                          <strong>Response Time:</strong> We typically respond within 48 hours for non-urgent inquiries. For security issues, contact us immediately.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </section>

                {/* Final Agreement Box */}
                <Card className="border-[#7f5efd] bg-gradient-to-br from-[#f5f3ff] to-white">
                  <CardContent className="pt-6 pb-6 md:pt-8 md:pb-8 text-center px-4">
                    <h3 className="font-phonic text-2xl md:text-3xl font-normal text-gray-900 mb-4">
                      Agreement Acknowledgment
                    </h3>
                    <p className="font-capsule text-base font-normal text-gray-700 mb-6">
                      By using our Service, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                    </p>
                    <div className="flex items-center justify-center gap-6 font-phonic text-sm font-normal text-gray-500">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>Last Updated: {effectiveDate}</span>
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
        <div className="container-wide px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-4">
            <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4 text-center md:text-left">
              <Logo variant="white" size="sm" />
              <Separator orientation="vertical" className="hidden md:block h-6 bg-gray-700" />
              <p className="font-phonic text-sm font-normal text-gray-400">
                © 2025 Cryptrac Solutions. All rights reserved.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              <Link href="/privacy" className="font-phonic text-sm font-normal text-gray-400 hover:text-white transition-colors px-2 py-2 md:px-0 md:py-0">
                Privacy Policy
              </Link>
              <Link href="/terms" className="font-phonic text-sm font-normal text-gray-400 hover:text-white transition-colors px-2 py-2 md:px-0 md:py-0">
                Terms of Service
              </Link>
              <Link href="/contact" className="font-phonic text-sm font-normal text-gray-400 hover:text-white transition-colors px-2 py-2 md:px-0 md:py-0">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
