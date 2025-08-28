'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Shield, Lock, Eye, AlertTriangle, CheckCircle2, Server, Key, Users, Clock, Phone, Mail, MapPin, FileText, Zap, Database, Globe, UserCheck, AlertCircle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Logo } from "@/app/components/ui/logo";
import { Separator } from "@/app/components/ui/separator";
import { Badge } from "@/app/components/ui/badge";

export default function SecurityPage() {
  const [activeSection, setActiveSection] = useState<string>("");
  const effectiveDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const sections = [
    { id: "overview", title: "Security Overview", icon: Shield },
    { id: "platform-security", title: "Platform Security", icon: Lock },
    { id: "data-protection", title: "Data Protection", icon: Database },
    { id: "transaction-security", title: "Transaction Security", icon: Zap },
    { id: "authentication", title: "Authentication & Access", icon: UserCheck },
    { id: "infrastructure", title: "Infrastructure Security", icon: Server },
    { id: "compliance", title: "Compliance & Standards", icon: CheckCircle2 },
    { id: "incident-response", title: "Incident Response", icon: AlertTriangle },
    { id: "user-security", title: "Your Security Role", icon: Users },
    { id: "reporting", title: "Security Reporting", icon: Eye },
    { id: "contact", title: "Security Contact", icon: Phone }
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
            <Link href="/about" className="font-phonic text-sm font-normal text-gray-600 hover:text-gray-900 transition-colors">
              About
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

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-16">
        <div className="container-wide relative z-10">
          <div className="text-center">
            <Badge className="mb-4 bg-[#f5f3ff] text-[#7f5efd] border-[#ede9fe]">
              Platform Security
            </Badge>
            <h1 className="font-phonic text-3xl font-normal tracking-tight text-gray-900 mb-4">
              Security at Cryptrac
            </h1>
            <p className="font-capsule text-base font-normal text-gray-600 max-w-2xl mx-auto">
              Learn how we protect your cryptocurrency payments with enterprise-grade security measures and best practices
            </p>
            <div className="flex items-center justify-center gap-4 mt-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Updated: {effectiveDate}</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Security Framework v2.0</span>
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
                {/* Section 1: Security Overview */}
                <section id="overview" className="mb-12">
                  <h2 className="font-phonic text-2xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <Shield className="h-8 w-8 text-[#7f5efd]" />
                    1. Security Overview
                  </h2>
                  <div className="bg-[#f5f3ff] border-l-4 border-[#7f5efd] p-6 rounded-r-lg mb-6">
                    <p className="font-phonic text-base font-normal text-gray-900 mb-2">
                      Enterprise-Grade Security for Cryptocurrency Payments
                    </p>
                    <p className="font-capsule text-base font-normal text-gray-600">
                      Cryptrac implements comprehensive security measures to protect your business and customers
                    </p>
                  </div>
                  
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    At Cryptrac, security is not an afterthought—it's the foundation of everything we build. As a cryptocurrency payment processing platform handling financial transactions, we understand the critical importance of maintaining the highest security standards to protect your business, your customers, and the integrity of the blockchain ecosystem.
                  </p>

                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <Card className="border-green-200 bg-green-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="font-phonic text-2xl font-normal text-green-900 text-center">Non-Custodial</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center">
                        <p className="font-phonic text-sm font-normal text-green-700">
                          We never hold your cryptocurrency. Payments go directly to your wallets.
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-blue-200 bg-blue-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="font-phonic text-2xl font-normal text-blue-900 text-center">End-to-End Encryption</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center">
                        <p className="font-phonic text-sm font-normal text-blue-700">
                          All data transmission and storage protected with advanced encryption.
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-purple-200 bg-purple-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="font-phonic text-2xl font-normal text-purple-900 text-center">Zero-Trust Architecture</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center">
                        <p className="font-phonic text-sm font-normal text-purple-700">
                          Every request is verified, authenticated, and authorized.
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed">
                    Our security framework encompasses multiple layers of protection, from infrastructure and network security to application-level safeguards and user authentication. We continuously monitor, assess, and improve our security posture to stay ahead of emerging threats in the rapidly evolving cryptocurrency landscape.
                  </p>
                </section>

                <Separator className="my-12" />

                {/* Section 2: Platform Security */}
                <section id="platform-security" className="mb-12">
                  <h2 className="font-phonic text-2xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <Lock className="h-8 w-8 text-[#7f5efd]" />
                    2. Platform Security Architecture
                  </h2>
                  
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    Our platform is built with security as the primary design principle, implementing multiple layers of protection to ensure the integrity and confidentiality of all payment processing activities.
                  </p>

                  <div className="space-y-6">
                    <Card className="border-[#7f5efd]/20 bg-[#f5f3ff]/30">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-gray-900">Application Security</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ul className="space-y-2 font-phonic text-sm font-normal text-gray-600">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Secure coding practices with regular code reviews</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Input validation and sanitization for all user data</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>SQL injection and XSS protection mechanisms</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>CSRF tokens and secure session management</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Regular penetration testing and vulnerability assessments</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-gray-200">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-gray-900">API Security</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ul className="space-y-2 font-phonic text-sm font-normal text-gray-600">
                          <li className="flex items-start gap-2">
                            <Key className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>API key authentication with rate limiting</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Key className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>OAuth 2.0 and JWT token-based authentication</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Key className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Request signing and timestamp validation</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Key className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Comprehensive logging and monitoring</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-gray-200">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-gray-900">Transport Security</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ul className="space-y-2 font-phonic text-sm font-normal text-gray-600">
                          <li className="flex items-start gap-2">
                            <Globe className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>TLS 1.3 encryption for all communications</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Globe className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>HSTS headers and certificate pinning</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Globe className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Perfect Forward Secrecy (PFS) implementation</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Globe className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Content Security Policy (CSP) headers</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                <Separator className="my-12" />

                {/* Section 3: Data Protection */}
                <section id="data-protection" className="mb-12">
                  <h2 className="font-phonic text-2xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <Database className="h-8 w-8 text-[#7f5efd]" />
                    3. Data Protection and Privacy
                  </h2>
                  
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    We implement comprehensive data protection measures to safeguard sensitive information throughout its lifecycle, from collection and processing to storage and eventual deletion.
                  </p>

                  <div className="grid md:grid-cols-2 gap-6">
                    <Card className="border-green-200 bg-green-50">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-green-900">Encryption at Rest</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ul className="space-y-2 font-phonic text-sm font-normal text-green-700">
                          <li className="flex items-start gap-2">
                            <Lock className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>AES-256 encryption for all stored data</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Lock className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>Encrypted database backups</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Lock className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>Key rotation and management policies</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Lock className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>Hardware Security Modules (HSMs)</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-blue-200 bg-blue-50">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-blue-900">Data Access Controls</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ul className="space-y-2 font-phonic text-sm font-normal text-blue-700">
                          <li className="flex items-start gap-2">
                            <Users className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>Role-based access control (RBAC)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Users className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>Principle of least privilege</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Users className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>Regular access reviews and audits</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Users className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>Multi-factor authentication required</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
                    <p className="font-phonic text-sm font-normal text-amber-900">
                      <strong>Data Minimization:</strong> We collect and store only the data necessary for payment processing. Sensitive information like private keys is never stored on our systems.
                    </p>
                  </div>
                </section>

                <Separator className="my-12" />

                {/* Section 4: Transaction Security */}
                <section id="transaction-security" className="mb-12">
                  <h2 className="font-phonic text-2xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <Zap className="h-8 w-8 text-[#7f5efd]" />
                    4. Transaction Security
                  </h2>
                  
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    Every cryptocurrency transaction processed through Cryptrac is protected by multiple security layers designed to prevent fraud, ensure authenticity, and maintain the integrity of the payment process.
                  </p>

                  <div className="space-y-6">
                    <Card className="border-[#7f5efd]/20 bg-[#f5f3ff]/30">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-gray-900">Payment Link Security</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ul className="space-y-2 font-phonic text-sm font-normal text-gray-600">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Cryptographically secure payment link generation</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Time-limited payment windows with expiration</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Single-use payment addresses when possible</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Tamper-evident QR codes with digital signatures</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-red-200 bg-red-50">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-red-900">Fraud Prevention</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ul className="space-y-2 font-phonic text-sm font-normal text-red-700">
                          <li className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                            <span>Real-time transaction monitoring and analysis</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                            <span>IP address and geolocation verification</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                            <span>Suspicious activity detection algorithms</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                            <span>Integration with blockchain analysis tools</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-gray-200">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-gray-900">Blockchain Verification</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ul className="space-y-2 font-phonic text-sm font-normal text-gray-600">
                          <li className="flex items-start gap-2">
                            <Zap className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Multi-node blockchain confirmation validation</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Zap className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Transaction hash verification and tracking</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Zap className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Network fee estimation and optimization</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Zap className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Double-spending prevention mechanisms</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                <Separator className="my-12" />

                {/* Section 5: Authentication & Access */}
                <section id="authentication" className="mb-12">
                  <h2 className="font-phonic text-2xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <UserCheck className="h-8 w-8 text-[#7f5efd]" />
                    5. Authentication and Access Control
                  </h2>
                  
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    We implement robust authentication and authorization mechanisms to ensure that only legitimate users can access merchant accounts and sensitive functionality.
                  </p>

                  <div className="grid md:grid-cols-2 gap-6">
                    <Card className="border-[#7f5efd]/20 bg-[#f5f3ff]/30">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-gray-900">Multi-Factor Authentication</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ul className="space-y-2 font-phonic text-sm font-normal text-gray-600">
                          <li className="flex items-start gap-2">
                            <Key className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Email and SMS verification codes</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Key className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>TOTP authenticator app support</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Key className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Hardware security key compatibility</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Key className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Biometric authentication options</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-gray-200">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-gray-900">Session Management</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ul className="space-y-2 font-phonic text-sm font-normal text-gray-600">
                          <li className="flex items-start gap-2">
                            <Clock className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Secure session token generation</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Clock className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Automatic session timeout policies</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Clock className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Concurrent session monitoring</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Clock className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Device and location tracking</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                <Separator className="my-12" />

                {/* Section 6: Infrastructure Security */}
                <section id="infrastructure" className="mb-12">
                  <h2 className="font-phonic text-2xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <Server className="h-8 w-8 text-[#7f5efd]" />
                    6. Infrastructure Security
                  </h2>
                  
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    Our infrastructure is designed with security at every level, from the physical data centers to the cloud services that power our platform, ensuring robust protection against both digital and physical threats.
                  </p>

                  <div className="space-y-6">
                    <Card className="border-green-200 bg-green-50">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-green-900">Cloud Security</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ul className="space-y-2 font-phonic text-sm font-normal text-green-700">
                          <li className="flex items-start gap-2">
                            <Server className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>SOC 2 Type II compliant infrastructure providers</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Server className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>Virtual private clouds (VPC) with network isolation</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Server className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>Automated security patching and updates</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Server className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>Geographic distribution and redundancy</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-blue-200 bg-blue-50">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-blue-900">Network Security</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ul className="space-y-2 font-phonic text-sm font-normal text-blue-700">
                          <li className="flex items-start gap-2">
                            <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>Web Application Firewall (WAF) protection</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>DDoS protection and traffic filtering</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>Intrusion detection and prevention systems</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>Network segmentation and micro-segmentation</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-purple-200 bg-purple-50">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-purple-900">Monitoring & Logging</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ul className="space-y-2 font-phonic text-sm font-normal text-purple-700">
                          <li className="flex items-start gap-2">
                            <Eye className="h-4 w-4 text-purple-600 mt-0.5" />
                            <span>24/7 security operations center (SOC)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Eye className="h-4 w-4 text-purple-600 mt-0.5" />
                            <span>Real-time threat detection and alerting</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Eye className="h-4 w-4 text-purple-600 mt-0.5" />
                            <span>Comprehensive audit logging and retention</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Eye className="h-4 w-4 text-purple-600 mt-0.5" />
                            <span>SIEM integration and correlation analysis</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                <Separator className="my-12" />

                {/* Section 7: Compliance & Standards */}
                <section id="compliance" className="mb-12">
                  <h2 className="font-phonic text-2xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <CheckCircle2 className="h-8 w-8 text-[#7f5efd]" />
                    7. Compliance and Security Standards
                  </h2>
                  
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    Cryptrac adheres to industry-leading security standards and regulatory frameworks to ensure our platform meets the highest levels of security and compliance requirements.
                  </p>

                  <div className="grid md:grid-cols-2 gap-6">
                    <Card className="border-[#7f5efd]/20 bg-[#f5f3ff]/30">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-gray-900">Security Frameworks</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ul className="space-y-2 font-phonic text-sm font-normal text-gray-600">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>ISO 27001 Information Security Management</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>NIST Cybersecurity Framework alignment</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>OWASP secure development practices</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>CIS Controls implementation</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-gray-200">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-gray-900">Regulatory Compliance</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ul className="space-y-2 font-phonic text-sm font-normal text-gray-600">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>GDPR data protection compliance</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>CCPA privacy regulation adherence</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>AML/KYC compliance protocols</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Financial services regulations</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
                    <p className="font-phonic text-sm font-normal text-green-900">
                      <strong>Continuous Improvement:</strong> We regularly undergo third-party security assessments and maintain certifications to ensure ongoing compliance with evolving security standards.
                    </p>
                  </div>
                </section>

                <Separator className="my-12" />

                {/* Section 8: Incident Response */}
                <section id="incident-response" className="mb-12">
                  <h2 className="font-phonic text-2xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <AlertTriangle className="h-8 w-8 text-[#7f5efd]" />
                    8. Incident Response and Recovery
                  </h2>
                  
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    We maintain comprehensive incident response procedures to quickly detect, contain, and resolve security incidents while minimizing impact to our users and maintaining transparency throughout the process.
                  </p>

                  <div className="space-y-4">
                    <Card className="border-gray-200">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <Badge className="bg-[#7f5efd] text-white">Phase 1</Badge>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-1">Detection and Analysis</h4>
                            <p className="font-phonic text-sm font-normal text-gray-600">24/7 monitoring systems identify potential security incidents and automatically alert our response team</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-gray-200">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <Badge className="bg-[#7f5efd] text-white">Phase 2</Badge>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-1">Containment and Eradication</h4>
                            <p className="font-phonic text-sm font-normal text-gray-600">Immediate isolation of affected systems and removal of security threats to prevent further damage</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-gray-200">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <Badge className="bg-[#7f5efd] text-white">Phase 3</Badge>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-1">Recovery and Communication</h4>
                            <p className="font-phonic text-sm font-normal text-gray-600">System restoration and transparent communication with affected users about the incident and resolution</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-gray-200">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <Badge className="bg-[#7f5efd] text-white">Phase 4</Badge>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-1">Post-Incident Review</h4>
                            <p className="font-phonic text-sm font-normal text-gray-600">Comprehensive analysis and implementation of improvements to prevent similar incidents</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                <Separator className="my-12" />

                {/* Section 9: User Security Responsibilities */}
                <section id="user-security" className="mb-12">
                  <h2 className="font-phonic text-2xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <Users className="h-8 w-8 text-[#7f5efd]" />
                    9. Your Security Responsibilities
                  </h2>
                  
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    While we implement comprehensive security measures, the security of your account also depends on following best practices on your end. Here are key steps you can take to protect your account and transactions.
                  </p>

                  <div className="grid md:grid-cols-2 gap-6">
                    <Card className="border-[#7f5efd]/20 bg-[#f5f3ff]/30">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-gray-900">Account Security</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ul className="space-y-2 font-phonic text-sm font-normal text-gray-600">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Use strong, unique passwords for your account</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Enable multi-factor authentication (MFA)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Keep your contact information up to date</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Review account activity regularly</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-amber-200 bg-amber-50">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-amber-900">Wallet Security</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ul className="space-y-2 font-phonic text-sm font-normal text-amber-700">
                          <li className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                            <span>Verify wallet addresses before adding them</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                            <span>Use hardware wallets for large amounts</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                            <span>Keep private keys secure and never share them</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                            <span>Monitor blockchain transactions independently</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
                    <h3 className="font-phonic text-base font-normal text-red-900 mb-3">Security Warnings</h3>
                    <ul className="space-y-2 font-phonic text-sm font-normal text-red-800">
                      <li className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-0.5" />
                        <span>Never share your account credentials or MFA codes</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-0.5" />
                        <span>Always log in through our official website or app</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-0.5" />
                        <span>Be cautious of phishing emails or fake websites</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-0.5" />
                        <span>Report any suspicious activity immediately</span>
                      </li>
                    </ul>
                  </div>
                </section>

                <Separator className="my-12" />

                {/* Section 10: Security Reporting */}
                <section id="reporting" className="mb-12">
                  <h2 className="font-phonic text-2xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <Eye className="h-8 w-8 text-[#7f5efd]" />
                    10. Security Issue Reporting
                  </h2>
                  
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    We encourage responsible disclosure of security vulnerabilities and provide multiple channels for reporting security concerns. Our security team takes all reports seriously and responds promptly to legitimate security issues.
                  </p>

                  <div className="space-y-6">
                    <Card className="border-[#7f5efd]/20 bg-[#f5f3ff]/30">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-gray-900">Vulnerability Reporting</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="font-capsule text-base font-normal text-gray-700 mb-3">If you discover a security vulnerability, please:</p>
                        <ul className="space-y-2 font-phonic text-sm font-normal text-gray-600">
                          <li className="flex items-start gap-2">
                            <Badge variant="outline" className="mt-0.5">1</Badge>
                            <span>Email security@cryptrac.com with detailed information</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Badge variant="outline" className="mt-0.5">2</Badge>
                            <span>Include steps to reproduce the issue</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Badge variant="outline" className="mt-0.5">3</Badge>
                            <span>Provide your contact information for follow-up</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Badge variant="outline" className="mt-0.5">4</Badge>
                            <span>Allow us time to investigate and address the issue</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-green-200 bg-green-50">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-green-900">Responsible Disclosure Policy</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ul className="space-y-2 font-phonic text-sm font-normal text-green-700">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>We acknowledge receipt of reports within 24 hours</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>Initial assessment completed within 72 hours</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>Regular updates provided during investigation</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>Recognition and potential rewards for valid findings</span>
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
                    11. Security Contact Information
                  </h2>
                  
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    Our security team is available to address your security concerns and questions. We provide multiple ways to contact us depending on the urgency and nature of your inquiry.
                  </p>
                  
                  <Card className="border-[#7f5efd]/20 bg-gradient-to-br from-[#f5f3ff] to-white">
                    <CardHeader>
                      <CardTitle className="font-phonic text-3xl font-normal text-gray-900">Security Team</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-[#7f5efd]" />
                        <div>
                          <p className="font-phonic text-sm font-normal text-gray-600">Security Vulnerabilities</p>
                          <a href="mailto:security@cryptrac.com" className="font-phonic text-base font-normal text-gray-900 hover:text-[#7f5efd]">
                            security@cryptrac.com
                          </a>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-[#7f5efd]" />
                        <div>
                          <p className="font-phonic text-sm font-normal text-gray-600">Emergency Security Hotline</p>
                          <a href="tel:+13476193721" className="font-phonic text-base font-normal text-gray-900 hover:text-[#7f5efd]">
                            +1 (347) 619-3721
                          </a>
                          <p className="font-phonic text-xs font-normal text-gray-500">24/7 for critical security incidents</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-[#7f5efd]" />
                        <div>
                          <p className="font-phonic text-sm font-normal text-gray-600">General Security Inquiries</p>
                          <a href="mailto:support@cryptrac.com" className="font-phonic text-base font-normal text-gray-900 hover:text-[#7f5efd]">
                            support@cryptrac.com
                          </a>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <p className="font-phonic text-sm font-normal text-gray-600">
                          <strong>Response Times:</strong> Security vulnerabilities are prioritized based on severity. Critical issues receive immediate attention, while general inquiries are typically addressed within 48 hours.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </section>

                {/* Security Commitment Box */}
                <Card className="border-[#7f5efd] bg-gradient-to-br from-[#f5f3ff] to-white">
                  <CardContent className="pt-8 pb-8 text-center">
                    <h3 className="font-phonic text-3xl font-normal text-gray-900 mb-4">
                      Our Security Commitment
                    </h3>
                    <p className="font-capsule text-base font-normal text-gray-700 mb-6">
                      Security is fundamental to everything we do at Cryptrac. We are committed to maintaining the highest standards of security to protect your cryptocurrency payments and data.
                    </p>
                    <div className="flex items-center justify-center gap-6 font-phonic text-sm font-normal text-gray-500">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>Last Updated: {effectiveDate}</span>
                      </div>
                      <Separator orientation="vertical" className="h-4" />
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>Security Framework v2.0</span>
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
              <Link href="/security" className="font-phonic text-sm font-normal text-gray-400 hover:text-white transition-colors">
                Security
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