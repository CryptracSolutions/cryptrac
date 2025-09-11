'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, Shield, Users, Eye, Lock, Settings, AlertCircle, Clock, Phone, Mail, MapPin, FileText, Database, CreditCard, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { Badge } from "@/app/components/ui/badge";
import { LandingNav } from "@/app/components/layout/landing-nav";

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState<string>("");
  const effectiveDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const sections = [
    { id: "introduction", title: "Introduction", icon: Shield },
    { id: "information-collected", title: "Information We Collect", icon: Database },
    { id: "how-we-use", title: "How We Use Your Information", icon: Settings },
    { id: "information-sharing", title: "Information Sharing & Disclosure", icon: Users },
    { id: "data-security", title: "Data Security & Protection", icon: Lock },
    { id: "privacy-rights", title: "Your Privacy Rights & Choices", icon: Eye },
    { id: "international-transfers", title: "International Data Transfers", icon: Globe },
    { id: "data-retention", title: "Data Retention & Deletion", icon: Clock },
    { id: "children-privacy", title: "Children's Privacy", icon: Users },
    { id: "policy-changes", title: "Changes to This Policy", icon: AlertCircle },
    { id: "contact", title: "Contact Information", icon: Phone }
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
      <LandingNav />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-16">
        <div className="container-wide relative z-10">
          <div className="text-center">
            <Badge className="mb-4 bg-[#f5f3ff] text-[#7f5efd] border-[#ede9fe]">
              Legal Documentation
            </Badge>
            <h1 className="font-phonic text-6xl font-normal tracking-tight text-gray-900 mb-4">
              Privacy Policy
            </h1>
            <p className="font-capsule text-base font-normal text-gray-600 max-w-2xl mx-auto">
              Learn how Cryptrac protects your privacy and handles your personal information
            </p>
            <div className="flex items-center justify-center gap-4 mt-6 text-sm text-gray-500">
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
                      className={`w-full flex items-center gap-3 px-4 py-2 font-phonic text-sm font-normal transition-all hover:bg-gray-50 ${
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
                {/* Section 1: Introduction */}
                <section id="introduction" className="mb-12">
                  <h2 className="font-phonic text-2xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <Shield className="h-8 w-8 text-[#7f5efd]" />
                    1. Introduction
                  </h2>
                  <div className="bg-[#f5f3ff] border-l-4 border-[#7f5efd] p-6 rounded-r-lg mb-6">
                    <p className="font-phonic text-base font-normal text-gray-900 mb-2">
                      Protecting Your Privacy is Our Priority
                    </p>
                    <p className="font-capsule text-base font-normal text-gray-600">
                      This Privacy Policy explains how we collect, use, and protect your information
                    </p>
                  </div>
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-4">
                    Cryptrac Solutions ("Company," "we," "us," or "our") is committed to protecting the privacy and security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our cryptocurrency payment processing platform, website, mobile applications, and related services (collectively, the "Service").
                  </p>
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-4">
                    This Privacy Policy applies to all users of our Service, including merchants who use our platform to accept cryptocurrency payments and customers who make payments through our system. By using our Service, you consent to the data practices described in this policy.
                  </p>
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-4">
                    We understand that privacy is fundamental to trust, especially in the financial technology sector. Our approach to privacy is built on principles of transparency, data minimization, user control, and security. We collect only the information necessary to provide our services effectively and securely, and we implement robust measures to protect your data from unauthorized access or misuse.
                  </p>
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed">
                    This Privacy Policy should be read in conjunction with our Terms of Service and Cookie Policy, which provide additional information about your rights and responsibilities when using our Service. We encourage you to review all of these documents carefully to understand how we handle your information.
                  </p>
                </section>

                <Separator className="my-12" />

                {/* Section 2: Information We Collect */}
                <section id="information-collected" className="mb-12">
                  <h2 className="font-phonic text-2xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <Database className="h-8 w-8 text-[#7f5efd]" />
                    2. Information We Collect
                  </h2>
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    We collect several types of information to provide, maintain, and improve our Service. The information we collect varies depending on how you interact with our platform, whether as a merchant, customer, or website visitor.
                  </p>
                  
                  <div className="space-y-6">
                    <Card className="border-[#7f5efd]/20 bg-[#f5f3ff]/30">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-gray-900">Account and Profile Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="font-capsule text-base font-normal text-gray-700">Collected when you register for a merchant account or interact with our Service:</p>
                        <ul className="space-y-2 font-phonic text-sm font-normal text-gray-600">
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Business name and contact information</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Individual contact details for account administrators</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Business registration and tax identification numbers</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Account preferences and settings</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-gray-200">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-gray-900">Financial and Payment Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="font-capsule text-base font-normal text-gray-700">Essential for our cryptocurrency payment processing services:</p>
                        <ul className="space-y-2 font-phonic text-sm font-normal text-gray-600">
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Cryptocurrency wallet addresses for each supported currency</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Bank account information if using conversion services</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Transaction amounts and currency selections</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Payment confirmation data from blockchain networks</span>
                          </li>
                        </ul>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <p className="font-phonic text-xs font-normal text-amber-900">
                            <strong>Important:</strong> We do not store private keys or have access to your cryptocurrency wallets beyond the addresses you provide.
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-gray-200">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-gray-900">Transaction Data</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="font-capsule text-base font-normal text-gray-700">Comprehensive records of all payment activities:</p>
                        <ul className="space-y-2 font-phonic text-sm font-normal text-gray-600">
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Payment link details including titles, descriptions, and amounts</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Transaction timestamps and status updates</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Blockchain transaction identifiers and confirmation data</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Subscription billing information for recurring payments</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-gray-200">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-gray-900">Technical Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="font-capsule text-base font-normal text-gray-700">Automatically collected to ensure proper functionality and security:</p>
                        <ul className="space-y-2 font-phonic text-sm font-normal text-gray-600">
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>IP addresses and geolocation data</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Browser type and version information</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Device identifiers and operating system details</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Usage patterns and feature interactions</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                <Separator className="my-12" />

                {/* Section 3: How We Use Your Information */}
                <section id="how-we-use" className="mb-12">
                  <h2 className="font-phonic text-2xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <Settings className="h-8 w-8 text-[#7f5efd]" />
                    3. How We Use Your Information
                  </h2>
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    We use the information we collect for several specific purposes that are essential to providing our cryptocurrency payment processing services and maintaining a secure, efficient platform for all users.
                  </p>
                  
                  <div className="space-y-6">
                    <Card className="border-[#7f5efd]/20 bg-[#f5f3ff]/30">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-gray-900">Service Provision and Operation</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="font-capsule text-base font-normal text-gray-700">Our primary use of your information:</p>
                        <ul className="space-y-2 font-phonic text-sm font-normal text-gray-600">
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Create and maintain your merchant account</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Facilitate cryptocurrency payment transactions</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Generate payment links and process subscription billing</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Provide customer support and technical assistance</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-red-200 bg-red-50">
                      <CardHeader>
                        <CardTitle className="text-lg text-red-900">Security and Fraud Prevention</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="font-capsule text-base font-normal text-red-800 mb-3">Critical aspect of our operations, particularly given the irreversible nature of cryptocurrency transactions:</p>
                        <ul className="space-y-2 font-phonic text-sm font-normal text-red-700">
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-red-600 mt-0.5" />
                            <span>Analyze transaction patterns and user behavior</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-red-600 mt-0.5" />
                            <span>Monitor for suspicious account access or unusual usage</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-red-600 mt-0.5" />
                            <span>Implement security measures to protect against unauthorized access</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-red-600 mt-0.5" />
                            <span>Maintain audit logs to support security investigations</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-blue-200 bg-blue-50">
                      <CardHeader>
                        <CardTitle className="text-lg text-blue-900">Compliance and Legal Obligations</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="font-capsule text-base font-normal text-blue-800 mb-3">Meeting various regulatory requirements in the financial services and cryptocurrency sectors:</p>
                        <ul className="space-y-2 font-phonic text-sm font-normal text-blue-700">
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>Comply with anti-money laundering (AML) and KYC regulations</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>Respond to lawful requests from government authorities</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>Maintain records as required by financial services regulations</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>Cooperate with regulatory investigations and audits</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-green-200 bg-green-50">
                      <CardHeader>
                        <CardTitle className="text-lg text-green-900">Service Improvement and Development</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="font-capsule text-base font-normal text-green-800 mb-3">Using aggregated and anonymized data to enhance our platform:</p>
                        <ul className="space-y-2 text-sm text-green-700">
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>Analyze usage patterns to identify areas for improvement</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>Monitor system performance to optimize speed and reliability</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>Gather feedback to guide product development decisions</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>Understand how users interact with our Service</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                <Separator className="my-12" />

                {/* Section 4: Information Sharing and Disclosure */}
                <section id="information-sharing" className="mb-12">
                  <h2 className="font-phonic text-2xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <Users className="h-8 w-8 text-[#7f5efd]" />
                    4. Information Sharing and Disclosure
                  </h2>
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    We share your information with third parties only when necessary to provide our services, comply with legal obligations, or protect our legitimate interests. We do not sell your personal information to third parties for marketing purposes.
                  </p>
                  
                  <div className="space-y-6">
                    <Card className="border-[#7f5efd]/20 bg-[#f5f3ff]/30">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-gray-900">Service Providers and Business Partners</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="font-capsule text-base font-normal text-gray-700">Limited access to your information as necessary to support our operations:</p>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          <Card className="border-gray-200">
                            <CardHeader className="pb-3">
                              <CardTitle className="font-phonic text-sm font-normal text-gray-900">NOWPayments</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="font-phonic text-xs font-normal text-gray-600 mb-2">Primary cryptocurrency payment processor</p>
                              <ul className="space-y-1 font-phonic text-xs font-normal text-gray-500">
                                <li>• Transaction data for payment processing</li>
                                <li>• Payment amounts and cryptocurrency types</li>
                                <li>• Wallet addresses for transaction routing</li>
                              </ul>
                            </CardContent>
                          </Card>
                          
                          <Card className="border-gray-200">
                            <CardHeader className="pb-3">
                              <CardTitle className="font-phonic text-sm font-normal text-gray-900">Supabase</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="font-phonic text-xs font-normal text-gray-600 mb-2">Database and authentication provider</p>
                              <ul className="space-y-1 font-phonic text-xs font-normal text-gray-500">
                                <li>• Account information storage</li>
                                <li>• Transaction records in encrypted databases</li>
                                <li>• Authentication and session management</li>
                              </ul>
                            </CardContent>
                          </Card>
                          
                          <Card className="border-gray-200">
                            <CardHeader className="pb-3">
                              <CardTitle className="font-phonic text-sm font-normal text-gray-900">SendGrid</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="font-phonic text-xs font-normal text-gray-600 mb-2">Email service provider</p>
                              <ul className="space-y-1 font-phonic text-xs font-normal text-gray-500">
                                <li>• Transaction confirmations</li>
                                <li>• Account notifications</li>
                                <li>• Service-related communications</li>
                              </ul>
                            </CardContent>
                          </Card>
                        </div>
                        
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <p className="font-phonic text-xs font-normal text-amber-900">
                            <strong>Security:</strong> Each service provider is bound by contractual obligations to protect your information and use it only for authorized purposes.
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-blue-200 bg-blue-50">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-blue-900">Legal and Regulatory Disclosures</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="font-capsule text-base font-normal text-blue-800 mb-3">May be necessary to comply with applicable laws and regulations:</p>
                        <ul className="space-y-2 font-phonic text-sm font-normal text-blue-700">
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>Respond to subpoenas, court orders, and legal processes</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>Cooperate with anti-money laundering investigations</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>Provide information to tax authorities as required</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>Protect the safety of our users or the public</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                <Separator className="my-12" />

                {/* Section 5: Data Security and Protection */}
                <section id="data-security" className="mb-12">
                  <h2 className="font-phonic text-2xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <Lock className="h-8 w-8 text-[#7f5efd]" />
                    5. Data Security and Protection
                  </h2>
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    Protecting your information is a fundamental responsibility that we take seriously. We implement comprehensive security measures designed to safeguard your data against unauthorized access, alteration, disclosure, or destruction.
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card className="border-green-200 bg-green-50">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-green-900">Technical Safeguards</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ul className="space-y-2 text-sm text-green-700">
                          <li className="flex items-start gap-2">
                            <Lock className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>Industry-standard TLS encryption for all data transmission</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Lock className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>Encrypted databases with multiple access control layers</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Lock className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>Network security with firewalls and intrusion detection</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Lock className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>Multi-factor authentication for administrative access</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-blue-200 bg-blue-50">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-blue-900">Administrative Safeguards</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ul className="space-y-2 font-phonic text-sm font-normal text-blue-700">
                          <li className="flex items-start gap-2">
                            <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>Strict access control policies for authorized personnel</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>Background checks and security training requirements</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>Regular access permission audits and reviews</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>Comprehensive audit logs of all data access</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
                    <p className="font-phonic text-sm font-normal text-amber-900">
                      <strong>Ongoing Security:</strong> We conduct regular security assessments, penetration testing, and maintain incident response procedures to quickly detect and address any security concerns.
                    </p>
                  </div>
                </section>

                <Separator className="my-12" />

                {/* Section 6: Your Privacy Rights and Choices */}
                <section id="privacy-rights" className="mb-12">
                  <h2 className="font-phonic text-2xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <Eye className="h-8 w-8 text-[#7f5efd]" />
                    6. Your Privacy Rights and Choices
                  </h2>
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    We believe that you should have control over your personal information, and we provide several mechanisms for you to exercise your privacy rights and manage how your information is used.
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card className="border-[#7f5efd]/20 bg-[#f5f3ff]/30">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-gray-900">Access and Portability Rights</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="font-capsule text-base font-normal text-gray-700">Request information about the personal data we have collected:</p>
                        <ul className="space-y-2 font-phonic text-sm font-normal text-gray-600">
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Request a copy of your personal information</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Transfer data to another service provider</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Access account information and transaction history</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-gray-200">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-gray-900">Correction and Update Rights</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="font-capsule text-base font-normal text-gray-700">Ensure your personal information is accurate and up-to-date:</p>
                        <ul className="space-y-2 font-phonic text-sm font-normal text-gray-600">
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Update account information through dashboard</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Request corrections for inaccurate data</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Modify communication preferences</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-gray-200">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-gray-900">Deletion Rights</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="font-capsule text-base font-normal text-gray-700">Request deletion of your personal information:</p>
                        <ul className="space-y-2 font-phonic text-sm font-normal text-gray-600">
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Delete your account and associated data</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Remove personal information from active systems</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Export important data before deletion</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-gray-200">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-gray-900">Communication Preferences</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="font-capsule text-base font-normal text-gray-700">Manage how we communicate with you:</p>
                        <ul className="space-y-2 font-phonic text-sm font-normal text-gray-600">
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Opt out of marketing communications</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Receive only essential account notifications</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Control email and notification settings</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                <Separator className="my-12" />

                {/* Section 7: International Data Transfers */}
                <section id="international-transfers" className="mb-12">
                  <h2 className="font-phonic text-2xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <Globe className="h-8 w-8 text-[#7f5efd]" />
                    7. International Data Transfers and Processing
                  </h2>
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    As a global cryptocurrency payment processing platform, we may transfer and process your information in countries other than your country of residence. We are committed to ensuring that your information receives appropriate protection regardless of where it is processed.
                  </p>
                  
                  <Card className="border-[#7f5efd]/20 bg-[#f5f3ff]/30">
                    <CardHeader>
                      <CardTitle className="text-lg text-gray-900">Legal Frameworks for International Transfers</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-gray-700">When we transfer personal information from the European Union or other regions with specific data protection requirements, we rely on appropriate legal mechanisms:</p>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-start gap-2">
                          <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                          <span>Adequacy decisions by regulatory authorities</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                          <span>Standard contractual clauses for data protection</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                          <span>Other approved transfer mechanisms</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </section>

                <Separator className="my-12" />

                {/* Section 8: Data Retention and Deletion */}
                <section id="data-retention" className="mb-12">
                  <h2 className="font-phonic text-2xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <Clock className="h-8 w-8 text-[#7f5efd]" />
                    8. Data Retention and Deletion
                  </h2>
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    We retain your information only as long as necessary to provide our services, comply with legal obligations, and protect our legitimate interests. Our data retention practices are designed to balance your privacy rights with our operational and legal requirements.
                  </p>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <Card className="border-blue-200 bg-blue-50">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-blue-900">Account Information</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <p className="font-phonic text-sm font-normal text-blue-800 mb-2">Retained for the duration of your relationship with us</p>
                        <ul className="space-y-1 font-phonic text-xs font-normal text-blue-700">
                          <li>• Active merchant accounts</li>
                          <li>• Business information</li>
                          <li>• Contact details</li>
                          <li>• Account preferences</li>
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-green-200 bg-green-50">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-green-900">Transaction Data</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <p className="font-phonic text-sm font-normal text-green-800 mb-2">Governed by financial services regulations</p>
                        <ul className="space-y-1 font-phonic text-xs font-normal text-green-700">
                          <li>• Several years for compliance</li>
                          <li>• Anti-money laundering requirements</li>
                          <li>• Tax obligations</li>
                          <li>• Audit purposes</li>
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-purple-200 bg-purple-50">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-purple-900">Communication Data</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <p className="font-phonic text-sm font-normal text-purple-800 mb-2">Retained for customer support and service improvement</p>
                        <ul className="space-y-1 font-phonic text-xs font-normal text-purple-700">
                          <li>• Support tickets</li>
                          <li>• Email communications</li>
                          <li>• Feedback and surveys</li>
                          <li>• Service interactions</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                <Separator className="my-12" />

                {/* Section 9: Children's Privacy */}
                <section id="children-privacy" className="mb-12">
                  <h2 className="font-phonic text-2xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <Users className="h-8 w-8 text-[#7f5efd]" />
                    9. Children's Privacy
                  </h2>
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    Our Service is not intended for use by individuals under the age of 18, and we do not knowingly collect personal information from children. Cryptocurrency payment processing involves complex financial transactions that require adult understanding and legal capacity to enter into binding agreements.
                  </p>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h3 className="font-phonic text-base font-normal text-red-900 mb-3">Important Notice</h3>
                    <ul className="space-y-2 font-phonic text-sm font-normal text-red-800">
                      <li className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-0.5" />
                        <span>We do not knowingly collect personal information from children under 18</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-0.5" />
                        <span>If we become aware of collecting child data, we will delete it promptly</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-0.5" />
                        <span>Parents should contact us immediately if they believe their child has provided information</span>
                      </li>
                    </ul>
                  </div>
                </section>

                <Separator className="my-12" />

                {/* Section 10: Changes to This Policy */}
                <section id="policy-changes" className="mb-12">
                  <h2 className="font-phonic text-2xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <AlertCircle className="h-8 w-8 text-[#7f5efd]" />
                    10. Changes to This Privacy Policy
                  </h2>
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. When we make significant changes to this policy, we will provide appropriate notice to users and, where required by law, obtain consent for new uses of personal information.
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card className="border-gray-200">
                      <CardHeader className="bg-gray-50">
                        <CardTitle className="font-phonic text-2xl font-normal text-gray-900">Notification Methods</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <ul className="space-y-2 font-phonic text-sm font-normal text-gray-600">
                          <li className="flex items-start gap-2">
                            <Mail className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Email notifications to registered users</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Prominent notices on our website</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Settings className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Dashboard notifications for significant changes</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-gray-200">
                      <CardHeader className="bg-gray-50">
                        <CardTitle className="font-phonic text-2xl font-normal text-gray-900">Your Rights</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <ul className="space-y-2 font-phonic text-sm font-normal text-gray-600">
                          <li className="flex items-start gap-2">
                            <Clock className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Reasonable time to review changes</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Settings className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Adjust privacy preferences if needed</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Discontinue service if disagreeing with changes</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                <Separator className="my-12" />

                {/* Section 11: Contact Information */}
                <section id="contact" className="mb-12">
                  <h2 className="font-phonic text-2xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <Phone className="h-8 w-8 text-[#7f5efd]" />
                    11. Contact Information and Privacy Support
                  </h2>
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    We are committed to addressing your privacy concerns and questions promptly and thoroughly. Our privacy team is available to help you understand our privacy practices, exercise your privacy rights, and resolve any issues related to your personal information.
                  </p>
                  
                  <Card className="border-[#7f5efd]/20 bg-gradient-to-br from-[#f5f3ff] to-white">
                    <CardHeader>
                      <CardTitle className="font-phonic text-3xl font-normal text-gray-900">Cryptrac Solutions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-[#7f5efd]" />
                        <div>
                          <p className="font-phonic text-sm font-normal text-gray-600">Privacy Inquiries</p>
                          <a href="mailto:privacy@cryptrac.com" className="font-phonic text-base font-normal text-gray-900 hover:text-[#7f5efd]">
                            privacy@cryptrac.com
                          </a>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-[#7f5efd]" />
                        <div>
                          <p className="font-phonic text-sm font-normal text-gray-600">General Support</p>
                          <a href="mailto:support@cryptrac.com" className="font-phonic text-base font-normal text-gray-900 hover:text-[#7f5efd]">
                            support@cryptrac.com
                          </a>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-[#7f5efd]" />
                        <div>
                          <p className="font-phonic text-sm font-normal text-gray-600">Phone</p>
                          <a href="tel:+13476193721" className="font-phonic text-base font-normal text-gray-900 hover:text-[#7f5efd]">
                            +1 (347) 619-3721
                          </a>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <p className="font-phonic text-sm font-normal text-gray-600">
                          <strong>Response Time:</strong> We aim to respond to privacy-related inquiries within 48 hours and will work with you to address any concerns about your personal information.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </section>

                {/* Final Agreement Box */}
                <Card className="border-[#7f5efd] bg-gradient-to-br from-[#f5f3ff] to-white">
                  <CardContent className="pt-8 pb-8 text-center">
                    <h3 className="font-phonic text-3xl font-normal text-gray-900 mb-4">
                      Privacy Policy Acknowledgment
                    </h3>
                    <p className="font-capsule text-base font-normal text-gray-700 mb-6">
                      By using our Service, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy and consent to our data practices as described herein.
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
        <div className="container-wide">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <Logo variant="white" size="sm" />
              <Separator orientation="vertical" className="h-6 bg-gray-700" />
              <p className="font-phonic text-sm font-normal text-gray-400">
                © 2025 Cryptrac Solutions. All rights reserved.
              </p>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="font-phonic text-sm font-normal text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="font-phonic text-sm font-normal text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/cookies" className="font-phonic text-sm font-normal text-gray-400 hover:text-white transition-colors">
                Cookie Policy
              </Link>
              <Link href="/contact" className="font-phonic text-sm font-normal text-gray-400 hover:text-white transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
