'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Cookie, Settings, Shield, Users, AlertCircle, Eye, Clock, Lock, Phone, Mail, MapPin, FileText } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Logo } from "@/app/components/ui/logo";
import { Separator } from "@/app/components/ui/separator";
import { Badge } from "@/app/components/ui/badge";

export default function CookiePolicy() {
  const [activeSection, setActiveSection] = useState<string>("");
  const effectiveDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const sections = [
    { id: "introduction", title: "Introduction", icon: Cookie },
    { id: "types", title: "Types of Cookies", icon: Settings },
    { id: "third-party", title: "Third-Party Services", icon: Users },
    { id: "management", title: "Cookie Management", icon: Settings },
    { id: "retention", title: "Data Retention", icon: Clock },
    { id: "security", title: "Security & Privacy", icon: Shield },
    { id: "updates", title: "Policy Updates", icon: AlertCircle },
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
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container-wide flex h-16 items-center justify-between">
          <Logo size="md" />
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/privacy" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Terms of Service
            </Link>
            <Link href="/help" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Help Center
            </Link>
            <Link href="/contact" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
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
              Legal Documentation
            </Badge>
            <h1 className="font-phonic text-6xl font-normal tracking-tight text-gray-900 mb-4">
              Cookie Policy
            </h1>
            <p className="font-capsule text-base font-normal text-gray-600 max-w-2xl mx-auto">
              Learn how Cryptrac uses cookies and similar tracking technologies to enhance your experience
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
                {/* Section 1: Introduction */}
                <section id="introduction" className="mb-12">
                  <h2 className="font-phonic text-5xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <Cookie className="h-8 w-8 text-[#7f5efd]" />
                    1. Introduction
                  </h2>
                  <div className="bg-[#f5f3ff] border-l-4 border-[#7f5efd] p-6 rounded-r-lg mb-6">
                    <p className="font-medium text-gray-900 mb-2">
                      Understanding Our Cookie Usage
                    </p>
                    <p className="text-gray-600">
                      This policy explains how Cryptrac Solutions uses cookies and tracking technologies
                    </p>
                  </div>
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-4">
                    This Cookie Policy explains how Cryptrac Solutions ("Company," "we," "us," or "our") uses cookies and similar tracking technologies when you visit our website, use our mobile applications, or interact with our cryptocurrency payment processing services (collectively, the "Service"). This policy should be read in conjunction with our Privacy Policy and Terms of Service.
                  </p>
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-4">
                    Cookies are small text files that are placed on your device when you visit a website or use an application. They are widely used to make websites and applications work more efficiently and to provide information to website owners about user behavior and preferences.
                  </p>
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-4">
                    By continuing to use our Service, you consent to our use of cookies and similar technologies as described in this policy. You can control and manage cookies through your browser settings, though disabling certain cookies may affect the functionality of our Service.
                  </p>
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed">
                    We are committed to transparency about our data practices and want to ensure you understand how and why we use cookies. This policy provides detailed information about the types of cookies we use, their purposes, and how you can manage your cookie preferences.
                  </p>
                </section>

                <Separator className="my-12" />

                {/* Section 2: Types of Cookies */}
                <section id="types" className="mb-12">
                  <h2 className="font-phonic text-5xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <Settings className="h-8 w-8 text-[#7f5efd]" />
                    2. Types of Cookies We Use
                  </h2>
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    Our Service uses several different types of cookies, each serving specific purposes to enhance your experience and enable the proper functioning of our platform. Understanding these categories will help you make informed decisions about your cookie preferences.
                  </p>
                  
                  <div className="grid gap-6 mb-6">
                    <Card className="border-green-200 bg-green-50">
                      <CardHeader>
                        <CardTitle className="text-lg text-green-900 flex items-center gap-2">
                          <Lock className="h-5 w-5" />
                          Essential Cookies
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-green-800 mb-3">
                          Necessary for the basic functionality of our Service and cannot be disabled without severely impacting your ability to use the platform.
                        </p>
                        <ul className="space-y-2 text-sm text-green-700">
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>Authentication tokens that keep you logged in</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>Session identifiers for server connections</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>Security cookies for CSRF protection</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>Payment processing functionality</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-blue-200 bg-blue-50">
                      <CardHeader>
                        <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
                          <Settings className="h-5 w-5" />
                          Functional Cookies
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-blue-800 mb-3">
                          Enhance your experience by remembering your preferences and settings.
                        </p>
                        <ul className="space-y-2 text-sm text-blue-700">
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>Preferred language and currency settings</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>Dashboard layout customizations</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>Cryptocurrency wallet preferences</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>Payment link templates</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-purple-200 bg-purple-50">
                      <CardHeader>
                        <CardTitle className="text-lg text-purple-900 flex items-center gap-2">
                          <Eye className="h-5 w-5" />
                          Analytics Cookies
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-purple-800 mb-3">
                          Help us understand how users interact with our Service by collecting aggregated usage information.
                        </p>
                        <ul className="space-y-2 text-sm text-purple-700">
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-purple-600 mt-0.5" />
                            <span>Page views and user journey tracking</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-purple-600 mt-0.5" />
                            <span>Feature usage and performance metrics</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-purple-600 mt-0.5" />
                            <span>Error reporting and optimization data</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-orange-200 bg-orange-50">
                      <CardHeader>
                        <CardTitle className="text-lg text-orange-900 flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Marketing Cookies
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-orange-800 mb-3">
                          May be used to deliver relevant content and advertisements based on your interests.
                        </p>
                        <ul className="space-y-2 text-sm text-orange-700">
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-orange-600 mt-0.5" />
                            <span>Marketing campaign effectiveness tracking</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-orange-600 mt-0.5" />
                            <span>Targeted communications and content</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                <Separator className="my-12" />

                {/* Section 3: Third-Party Services */}
                <section id="third-party" className="mb-12">
                  <h2 className="font-phonic text-5xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <Users className="h-8 w-8 text-[#7f5efd]" />
                    3. Third-Party Cookies and Services
                  </h2>
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    Our Service integrates with several third-party providers that may set their own cookies when you use our platform. These integrations are essential for providing comprehensive cryptocurrency payment processing services and maintaining the security and functionality of our platform.
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <Card className="border-gray-200">
                      <CardHeader className="bg-gray-50">
                        <CardTitle className="font-phonic text-2xl font-normal text-gray-900">Supabase</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <p className="text-sm text-gray-600 mb-2">Database and authentication provider</p>
                        <ul className="space-y-1 text-xs text-gray-500">
                          <li>• User authentication cookies</li>
                          <li>• Session management</li>
                          <li>• Data synchronization</li>
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-gray-200">
                      <CardHeader className="bg-gray-50">
                        <CardTitle className="font-phonic text-2xl font-normal text-gray-900">NOWPayments</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <p className="text-sm text-gray-600 mb-2">Cryptocurrency payment processor</p>
                        <ul className="space-y-1 text-xs text-gray-500">
                          <li>• Payment processing cookies</li>
                          <li>• Fraud prevention</li>
                          <li>• Transaction monitoring</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-gray-200">
                      <CardHeader className="bg-gray-50">
                        <CardTitle className="font-phonic text-2xl font-normal text-gray-900">SendGrid</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <p className="text-sm text-gray-600 mb-2">Email communications</p>
                        <ul className="space-y-1 text-xs text-gray-500">
                          <li>• Email delivery tracking</li>
                          <li>• Engagement measurement</li>
                          <li>• Communication preferences</li>
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-gray-200">
                      <CardHeader className="bg-gray-50">
                        <CardTitle className="font-phonic text-2xl font-normal text-gray-900">Hosting Providers</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <p className="text-sm text-gray-600 mb-2">Content delivery and security</p>
                        <ul className="space-y-1 text-xs text-gray-500">
                          <li>• Performance optimization</li>
                          <li>• Security protection</li>
                          <li>• Geographic content delivery</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-900">
                      <strong>Important:</strong> Each third-party service has its own privacy policy and cookie practices. While we carefully select our providers, we cannot directly control their cookie usage.
                    </p>
                  </div>
                </section>

                <Separator className="my-12" />

                {/* Section 4: Cookie Management */}
                <section id="management" className="mb-12">
                  <h2 className="font-phonic text-5xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <Settings className="h-8 w-8 text-[#7f5efd]" />
                    4. Cookie Management and Your Choices
                  </h2>
                  
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    You have several options for managing cookies and controlling how they are used when you interact with our Service. Understanding these options will help you make choices that align with your privacy preferences while maintaining the functionality you need.
                  </p>

                  <div className="space-y-6">
                    <Card className="border-[#7f5efd]/20 bg-[#f5f3ff]/30">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-gray-900">Browser Settings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="font-capsule text-base font-normal text-gray-700">Most modern browsers provide direct cookie control:</p>
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li className="flex items-start gap-2">
                            <Badge variant="outline" className="mt-0.5">1</Badge>
                            <span>View and manage existing cookies</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Badge variant="outline" className="mt-0.5">2</Badge>
                            <span>Block all cookies or allow only first-party cookies</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Badge variant="outline" className="mt-0.5">3</Badge>
                            <span>Selectively allow cookies from specific websites</span>
                          </li>
                        </ul>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                          <p className="text-xs text-yellow-800">
                            <strong>Note:</strong> Blocking essential cookies may prevent access to account management and payment processing features.
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-gray-200">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-gray-900">Mobile Device Controls</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 mb-3">Mobile platforms provide additional privacy controls:</p>
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Limit ad tracking settings</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Reset advertising identifiers</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>App-specific privacy settings</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-gray-200">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-gray-900">Third-Party Opt-Out</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 mb-3">Many services offer their own opt-out mechanisms:</p>
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Google Analytics opt-out browser add-on</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Industry opt-out platforms for advertising</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Service-specific privacy controls</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                    <p className="text-sm text-blue-900">
                      <strong>Remember:</strong> Cookie preferences are typically stored locally on your device, so you may need to set preferences separately for different browsers and devices.
                    </p>
                  </div>
                </section>

                <Separator className="my-12" />

                {/* Section 5: Data Retention */}
                <section id="retention" className="mb-12">
                  <h2 className="font-phonic text-5xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <Clock className="h-8 w-8 text-[#7f5efd]" />
                    5. Data Retention and Cookie Lifespan
                  </h2>
                  
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    Different types of cookies have varying lifespans, and understanding these timeframes can help you make informed decisions about your privacy preferences and data management.
                  </p>

                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <Card className="border-red-200 bg-red-50">
                      <CardHeader>
                        <CardTitle className="text-lg text-red-900">Session Cookies</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <p className="text-sm text-red-800 mb-2">Temporary and deleted when browser closes</p>
                        <ul className="space-y-1 text-xs text-red-700">
                          <li>• Login state maintenance</li>
                          <li>• Form data preservation</li>
                          <li>• Security during active sessions</li>
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-blue-200 bg-blue-50">
                      <CardHeader>
                        <CardTitle className="text-lg text-blue-900">Persistent Cookies</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <p className="text-sm text-blue-800 mb-2">Remain for specified periods</p>
                        <ul className="space-y-1 text-xs text-blue-700">
                          <li>• Authentication: weeks to months</li>
                          <li>• Preferences: months to years</li>
                          <li>• Analytics: days to years</li>
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-green-200 bg-green-50">
                      <CardHeader>
                        <CardTitle className="text-lg text-green-900">Third-Party Cookies</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <p className="text-sm text-green-800 mb-2">Governed by provider policies</p>
                        <ul className="space-y-1 text-xs text-green-700">
                          <li>• Payment processing: session-based</li>
                          <li>• Email tracking: weeks to months</li>
                          <li>• Authentication: extended periods</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed">
                    We regularly review and update our cookie retention practices to ensure they align with privacy best practices and regulatory requirements. Cookies that are no longer needed for their intended purpose are automatically expired or deleted according to our data retention schedules.
                  </p>
                </section>

                <Separator className="my-12" />

                {/* Section 6: Security & Privacy */}
                <section id="security" className="mb-12">
                  <h2 className="font-phonic text-5xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <Shield className="h-8 w-8 text-[#7f5efd]" />
                    6. Security and Privacy Considerations
                  </h2>
                  
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    The security of cookie data is a critical aspect of our overall privacy and security framework. We implement multiple layers of protection to ensure that cookie information is handled securely and in accordance with privacy best practices.
                  </p>

                  <div className="space-y-4">
                    <Card className="border-green-200 bg-green-50">
                      <CardHeader>
                        <CardTitle className="text-lg text-green-900">Encryption & Security</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <ul className="space-y-2 text-sm text-green-800">
                          <li className="flex items-start gap-2">
                            <Lock className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>Sensitive cookies are encrypted</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Lock className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>HTTPS-only transmission</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Lock className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>Security flags prevent unauthorized access</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-blue-200 bg-blue-50">
                      <CardHeader>
                        <CardTitle className="text-lg text-blue-900">Access Controls</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <ul className="space-y-2 text-sm text-blue-800">
                          <li className="flex items-start gap-2">
                            <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>Strict team access policies</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>Cookie data segregation by sensitivity</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>Regular access permission audits</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-purple-200 bg-purple-50">
                      <CardHeader>
                        <CardTitle className="text-lg text-purple-900">Data Minimization</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <ul className="space-y-2 text-sm text-purple-800">
                          <li className="flex items-start gap-2">
                            <Eye className="h-4 w-4 text-purple-600 mt-0.5" />
                            <span>Only necessary data collected</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Eye className="h-4 w-4 text-purple-600 mt-0.5" />
                            <span>Automatic deletion of expired cookies</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Eye className="h-4 w-4 text-purple-600 mt-0.5" />
                            <span>Avoid personal identifiers when possible</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
                    <p className="text-sm text-amber-900">
                      <strong>Compliance:</strong> Our cookie practices align with GDPR, CCPA, and other privacy regulations. We conduct regular assessments and update policies as regulations evolve.
                    </p>
                  </div>
                </section>

                <Separator className="my-12" />

                {/* Section 7: Updates */}
                <section id="updates" className="mb-12">
                  <h2 className="font-phonic text-5xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <AlertCircle className="h-8 w-8 text-[#7f5efd]" />
                    7. Updates to This Cookie Policy
                  </h2>
                  
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    We may update this Cookie Policy from time to time to reflect changes in our practices, technologies, legal requirements, or service offerings. When we make significant changes to this policy, we will notify users through appropriate channels and provide information about the nature of the changes.
                  </p>

                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <Card className="border-gray-200">
                      <CardHeader className="bg-gray-50">
                        <CardTitle className="font-phonic text-2xl font-normal text-gray-900">Notification Methods</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <ul className="space-y-2 text-sm text-gray-600">
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
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li className="flex items-start gap-2">
                            <Clock className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Reasonable time to review changes</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Settings className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Adjust cookie preferences if needed</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Discontinue service if disagreeing with changes</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed">
                    Effective dates will be clearly indicated, and we maintain previous policy versions when legally required. Your continued use of our Service after updates constitutes acceptance of the revised Cookie Policy. We encourage periodic review to stay informed about our practices.
                  </p>
                </section>

                <Separator className="my-12" />

                {/* Section 8: Contact */}
                <section id="contact" className="mb-12">
                  <h2 className="font-phonic text-5xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <Phone className="h-8 w-8 text-[#7f5efd]" />
                    8. Contact Information and Support
                  </h2>
                  
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    If you have questions about our Cookie Policy, need assistance with cookie settings, or want to exercise your privacy rights related to cookie data, we provide several ways to contact our support team.
                  </p>
                  
                  <Card className="border-[#7f5efd]/20 bg-gradient-to-br from-[#f5f3ff] to-white">
                    <CardHeader>
                      <CardTitle className="text-xl text-gray-900">Cryptrac Solutions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-[#7f5efd]" />
                        <div>
                          <p className="text-sm text-gray-600">Privacy Inquiries</p>
                          <a href="mailto:privacy@cryptrac.com" className="font-semibold text-gray-900 hover:text-[#7f5efd]">
                            privacy@cryptrac.com
                          </a>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-[#7f5efd]" />
                        <div>
                          <p className="text-sm text-gray-600">Support</p>
                          <a href="mailto:support@cryptrac.com" className="font-semibold text-gray-900 hover:text-[#7f5efd]">
                            support@cryptrac.com
                          </a>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-[#7f5efd]" />
                        <div>
                          <p className="text-sm text-gray-600">Legal Team</p>
                          <a href="mailto:legal@cryptrac.com" className="font-semibold text-gray-900 hover:text-[#7f5efd]">
                            legal@cryptrac.com
                          </a>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <p className="text-sm text-gray-600">
                          <strong>Response Time:</strong> We aim to respond to privacy-related inquiries within 48 hours and will work with you to address any concerns about our cookie usage.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </section>

                {/* Final Agreement Box */}
                <Card className="border-[#7f5efd] bg-gradient-to-br from-[#f5f3ff] to-white">
                  <CardContent className="pt-8 pb-8 text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      Cookie Policy Acknowledgment
                    </h3>
                    <p className="text-gray-700 mb-6">
                      By continuing to use our Service, you acknowledge that you have read and understood this Cookie Policy and consent to our use of cookies as described herein.
                    </p>
                    <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
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
              <p className="text-sm text-gray-400">
                © 2025 Cryptrac Solutions. All rights reserved.
              </p>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/cookies" className="text-sm text-gray-400 hover:text-white transition-colors">
                Cookie Policy
              </Link>
              <Link href="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">
                Terms of Service
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