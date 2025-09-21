'use client';

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ChevronRight, Users, Target, Zap, Shield, Globe, Lightbulb, Heart, Award, TrendingUp, Clock, Phone, Mail, Building, Rocket, Star } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Logo } from "@/app/components/ui/logo";
import { Separator } from "@/app/components/ui/separator";
import { Badge } from "@/app/components/ui/badge";
import { LandingNav } from "@/app/components/layout/landing-nav";

export default function AboutPage() {
  const [activeSection, setActiveSection] = useState<string>("");
  const foundedYear = "2024";

  const sections = useMemo(() => [
    { id: "introduction", title: "About Cryptrac", icon: Building },
    { id: "mission", title: "Our Mission", icon: Target },
    { id: "vision", title: "Our Vision", icon: Lightbulb },
    { id: "values", title: "Core Values", icon: Heart },
    { id: "story", title: "Our Story", icon: Rocket },
    { id: "technology", title: "Technology", icon: Zap },
    { id: "security", title: "Security First", icon: Shield },
    { id: "team", title: "Our Team", icon: Users },
    { id: "achievements", title: "Achievements", icon: Award },
    { id: "future", title: "Looking Forward", icon: TrendingUp },
    { id: "contact", title: "Get in Touch", icon: Phone }
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
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-16">
        <div className="container-wide relative z-10">
          <div className="text-center">
            <Badge className="mb-4 bg-[#f5f3ff] text-[#7f5efd] border-[#ede9fe]">
              About Cryptrac
            </Badge>
            <h1 className="font-phonic text-3xl md:text-4xl lg:text-6xl font-normal tracking-tight text-gray-900 mb-4">
              Simplifying Cryptocurrency Payments
            </h1>
            <p className="font-capsule text-base md:text-lg font-normal text-gray-600 max-w-2xl mx-auto">
              Learn about our mission to make cryptocurrency payments accessible, secure, and effortless for businesses worldwide
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-6 text-base text-gray-500">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Founded in {foundedYear}</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>Global Reach</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container-wide flex flex-col lg:flex-row gap-8 relative py-4 md:py-8">
        {/* Mobile Navigation Dropdown */}
        <div className="lg:hidden w-full mb-4 sticky top-16 z-30 bg-white py-2 border-b border-gray-100 px-4 md:px-6">
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

        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:block w-64 sticky top-24 h-fit">
          <Card className="shadow-lg border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="font-phonic text-base font-normal text-gray-900">Table of Contents</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="space-y-1 pb-4">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
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
            </CardContent>
          </Card>
        </aside>

        {/* Main Content */}
        <main className="flex-1 max-w-4xl w-full">
          <Card className="shadow-xl border-0">
            <CardContent className="p-6 md:p-8 lg:p-12">
              <div className="prose prose-gray max-w-none">
                {/* Section 1: Introduction */}
                <section id="introduction" className="mb-12">
                  <h2 className="font-phonic text-xl md:text-2xl font-normal text-gray-900 mb-4 md:mb-6 flex flex-wrap items-center gap-2 md:gap-3">
                    <Building className="h-6 md:h-8 w-6 md:w-8 text-[#7f5efd]" />
                    <span>1. About Cryptrac</span>
                  </h2>
                  <div className="bg-[#f5f3ff] border-l-4 border-[#7f5efd] p-6 rounded-r-lg mb-6">
                    <p className="font-phonic text-base font-normal text-gray-900 mb-2">
                      Pioneering the Future of Cryptocurrency Payments
                    </p>
                    <p className="font-capsule text-base font-normal text-gray-600">
                      Cryptrac Solutions is dedicated to making cryptocurrency payments simple, secure, and accessible for businesses of all sizes
                    </p>
                  </div>
                  
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    Cryptrac Solutions is a leading cryptocurrency payment processing platform that bridges the gap between traditional commerce and the digital economy. Founded in {foundedYear}, we have been at the forefront of making cryptocurrency payments accessible to merchants and customers worldwide, regardless of their technical expertise or prior experience with digital assets.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
                    <Card className="border-[#7f5efd]/20 bg-[#f5f3ff]/30">
                      <CardHeader className="pb-3">
                        <CardTitle className="font-phonic text-lg md:text-xl lg:text-2xl font-normal text-gray-900 text-center">Non-Custodial</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center">
                        <p className="font-phonic text-base font-normal text-gray-600">
                          Your funds go directly to your wallets. We never hold your cryptocurrency.
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-blue-200 bg-blue-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="font-phonic text-lg md:text-xl lg:text-2xl font-normal text-blue-900 text-center">Global Scale</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center">
                        <p className="font-phonic text-base font-normal text-blue-700">
                          Supporting businesses worldwide with multi-currency payment processing.
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-green-200 bg-green-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="font-phonic text-lg md:text-xl lg:text-2xl font-normal text-green-900 text-center">User-Focused</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center">
                        <p className="font-phonic text-base font-normal text-green-700">
                          Designed with simplicity and security as our primary concerns.
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed">
                    Our platform supports major cryptocurrencies including Bitcoin (BTC), Ethereum (ETH), Solana (SOL), TRON (TRX), BNB, and popular stablecoins like USDT, USDC, and DAI. We serve thousands of merchants globally, from small online stores to large enterprises, providing them with the tools they need to accept cryptocurrency payments effortlessly.
                  </p>
                </section>

                <Separator className="my-12" />

                {/* Section 2: Mission */}
                <section id="mission" className="mb-12">
                  <h2 className="font-phonic text-xl md:text-2xl font-normal text-gray-900 mb-4 md:mb-6 flex flex-wrap items-center gap-2 md:gap-3">
                    <Target className="h-6 md:h-8 w-6 md:w-8 text-[#7f5efd]" />
                    <span>2. Our Mission</span>
                  </h2>
                  
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    At Cryptrac, our mission is to democratize access to cryptocurrency payments by providing simple, secure, and reliable payment processing solutions that empower businesses to participate in the digital economy without barriers or complexity.
                  </p>

                  <Card className="border-[#7f5efd]/20 bg-[#f5f3ff]/30 mb-6">
                    <CardHeader>
                      <CardTitle className="font-phonic text-lg md:text-xl lg:text-2xl font-normal text-gray-900 text-center">
&quot;Making Cryptocurrency Payments as Simple as Traditional Payments&quot;
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="font-capsule text-base font-normal text-gray-600">
                        We believe that the future of commerce includes cryptocurrency, and every business should have the opportunity to benefit from its advantages.
                      </p>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <Card className="border-gray-200">
                      <CardHeader>
                        <CardTitle className="font-phonic text-lg md:text-xl lg:text-2xl font-normal text-gray-900">For Merchants</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ul className="space-y-2 font-phonic text-base font-normal text-gray-600">
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Reduce payment processing fees</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Access global markets instantly</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Eliminate chargebacks and fraud</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Receive payments directly to their wallets</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-gray-200">
                      <CardHeader>
                        <CardTitle className="font-phonic text-lg md:text-xl lg:text-2xl font-normal text-gray-900">For Customers</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ul className="space-y-2 font-phonic text-base font-normal text-gray-600">
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Enhanced privacy and security</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Faster international transactions</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Lower transaction costs</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Use their preferred cryptocurrencies</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                <Separator className="my-12" />

                {/* Section 3: Vision */}
                <section id="vision" className="mb-12">
                  <h2 className="font-phonic text-xl md:text-2xl font-normal text-gray-900 mb-4 md:mb-6 flex flex-wrap items-center gap-2 md:gap-3">
                    <Lightbulb className="h-6 md:h-8 w-6 md:w-8 text-[#7f5efd]" />
                    <span>3. Our Vision</span>
                  </h2>
                  
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    We envision a world where cryptocurrency payments are as commonplace and trusted as traditional payment methods, where businesses of all sizes can seamlessly participate in the global digital economy without technical barriers or complex integrations.
                  </p>

                  <Card className="border-blue-200 bg-blue-50 mb-6">
                    <CardHeader>
                      <CardTitle className="font-phonic text-lg md:text-xl lg:text-2xl font-normal text-blue-900">The Future We&apos;re Building</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-phonic text-base font-normal text-blue-900">Universal Adoption</h4>
                          <p className="font-phonic text-base font-normal text-blue-700">
                            Every business, from corner stores to multinational corporations, can accept cryptocurrency payments effortlessly.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-phonic text-base font-normal text-blue-900">Financial Inclusion</h4>
                          <p className="font-phonic text-base font-normal text-blue-700">
                            Enabling economic participation for underbanked populations through accessible digital payment solutions.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-phonic text-base font-normal text-blue-900">Innovation Driver</h4>
                          <p className="font-phonic text-base font-normal text-blue-700">
                            Pioneering new features and capabilities that make cryptocurrency payments even more powerful and user-friendly.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-phonic text-base font-normal text-blue-900">Trust & Security</h4>
                          <p className="font-phonic text-base font-normal text-blue-700">
                            Setting the standard for security and reliability in cryptocurrency payment processing.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed">
                    Our long-term vision extends beyond payment processing. We aim to be the infrastructure that powers the next generation of commerce, enabling new business models and economic opportunities that are only possible with the programmability and global accessibility of cryptocurrency.
                  </p>
                </section>

                <Separator className="my-12" />

                {/* Section 4: Values */}
                <section id="values" className="mb-12">
                  <h2 className="font-phonic text-xl md:text-2xl font-normal text-gray-900 mb-4 md:mb-6 flex flex-wrap items-center gap-2 md:gap-3">
                    <Heart className="h-6 md:h-8 w-6 md:w-8 text-[#7f5efd]" />
                    <span>4. Our Core Values</span>
                  </h2>
                  
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    Our values guide every decision we make and every feature we build. They represent our commitment to our users, our team, and the broader cryptocurrency ecosystem.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <Card className="border-[#7f5efd]/20 bg-[#f5f3ff]/30">
                      <CardHeader>
                        <CardTitle className="font-phonic text-lg md:text-xl lg:text-2xl font-normal text-gray-900 flex flex-wrap items-center gap-2">
                          <Shield className="h-5 md:h-6 w-5 md:w-6 text-[#7f5efd]" />
                          <span>Security First</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-capsule text-base font-normal text-gray-700">
                          Security isn&apos;t just a feature&mdash;it&apos;s the foundation of everything we build. We implement multiple layers of protection to ensure your funds and data are always safe.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-green-200 bg-green-50">
                      <CardHeader>
                        <CardTitle className="font-phonic text-lg md:text-xl lg:text-2xl font-normal text-green-900 flex flex-wrap items-center gap-2">
                          <Users className="h-5 md:h-6 w-5 md:w-6 text-green-600" />
                          <span>User-Centric Design</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-capsule text-base font-normal text-green-800">
                          Every feature is designed with our users in mind. We prioritize simplicity, clarity, and ease of use without compromising on powerful functionality.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-blue-200 bg-blue-50">
                      <CardHeader>
                        <CardTitle className="font-phonic text-lg md:text-xl lg:text-2xl font-normal text-blue-900 flex flex-wrap items-center gap-2">
                          <Globe className="h-5 md:h-6 w-5 md:w-6 text-blue-600" />
                          <span>Global Accessibility</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-capsule text-base font-normal text-blue-800">
                          We believe cryptocurrency should be accessible to everyone, regardless of location, technical expertise, or business size. We build for inclusivity and global reach.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-purple-200 bg-purple-50">
                      <CardHeader>
                        <CardTitle className="font-phonic text-lg md:text-xl lg:text-2xl font-normal text-purple-900 flex flex-wrap items-center gap-2">
                          <Lightbulb className="h-5 md:h-6 w-5 md:w-6 text-purple-600" />
                          <span>Innovation</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-capsule text-base font-normal text-purple-800">
                          We continuously explore new technologies and approaches to improve cryptocurrency payments and expand what&apos;s possible in digital commerce.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-orange-200 bg-orange-50">
                      <CardHeader>
                        <CardTitle className="font-phonic text-lg md:text-xl lg:text-2xl font-normal text-orange-900 flex flex-wrap items-center gap-2">
                          <Heart className="h-5 md:h-6 w-5 md:w-6 text-orange-600" />
                          <span>Transparency</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-capsule text-base font-normal text-orange-800">
                          We maintain open communication about our practices, pricing, and policies. Our non-custodial approach means full transparency about where your funds go.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-red-200 bg-red-50">
                      <CardHeader>
                        <CardTitle className="font-phonic text-lg md:text-xl lg:text-2xl font-normal text-red-900 flex flex-wrap items-center gap-2">
                          <Award className="h-5 md:h-6 w-5 md:w-6 text-red-600" />
                          <span>Excellence</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-capsule text-base font-normal text-red-800">
                          We strive for excellence in everything we do, from code quality and user experience to customer support and platform reliability.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                <Separator className="my-12" />

                {/* Section 5: Story */}
                <section id="story" className="mb-12">
                  <h2 className="font-phonic text-2xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <Rocket className="h-8 w-8 text-[#7f5efd]" />
                    5. Our Story
                  </h2>
                  
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    Cryptrac was born from the recognition that while cryptocurrency had tremendous potential for transforming commerce, the technical barriers for adoption remained too high for most businesses. Our founders saw an opportunity to bridge this gap.
                  </p>

                  <div className="space-y-6">
                    <Card className="border-[#7f5efd]/20 bg-[#f5f3ff]/30">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-gray-900">The Problem We Saw</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="font-capsule text-base font-normal text-gray-700">
                          In the early days of cryptocurrency adoption, we observed that while the technology was revolutionary, the user experience was often frustrating:
                        </p>
                        <ul className="space-y-2 font-phonic text-base font-normal text-gray-600">
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Complex wallet setups and private key management</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Technical integration challenges for merchants</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Security concerns and custodial risks</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Limited cryptocurrency support and poor user interfaces</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-green-200 bg-green-50">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-green-900">Our Solution</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="font-capsule text-base font-normal text-green-800">
                          We set out to create a platform that would eliminate these barriers while maintaining the core benefits of cryptocurrency:
                        </p>
                        <ul className="space-y-2 font-phonic text-sm font-normal text-green-700">
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>Simple setup with no technical expertise required</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>Non-custodial architecture for maximum security</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>Beautiful, intuitive user interfaces</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>Comprehensive support for major cryptocurrencies</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-blue-200 bg-blue-50">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-blue-900">Our Journey</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-capsule text-base font-normal text-blue-800">
                          Since our founding in {foundedYear}, we&apos;ve focused on building a platform that grows with our users&apos; needs. We&apos;ve expanded from supporting a single cryptocurrency to handling multiple blockchains, added advanced features like subscription billing and smart terminals, and continuously improved our security and user experience based on community feedback.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                <Separator className="my-12" />

                {/* Section 6: Technology */}
                <section id="technology" className="mb-12">
                  <h2 className="font-phonic text-2xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <Zap className="h-8 w-8 text-[#7f5efd]" />
                    6. Our Technology
                  </h2>
                  
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    Cryptrac is built on modern, scalable technology designed for reliability, security, and performance. Our architecture supports high transaction volumes while maintaining the speed and responsiveness users expect.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <Card className="border-[#7f5efd]/20 bg-[#f5f3ff]/30">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-gray-900">Platform Architecture</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ul className="space-y-2 font-phonic text-base font-normal text-gray-600">
                          <li className="flex items-start gap-2">
                            <Zap className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Next.js 15 with TypeScript for robust web applications</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Zap className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Supabase for secure, scalable database management</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Zap className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Edge functions for global performance optimization</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Zap className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Progressive Web App (PWA) capabilities</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-gray-200">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-gray-900">Cryptocurrency Integration</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ul className="space-y-2 font-phonic text-base font-normal text-gray-600">
                          <li className="flex items-start gap-2">
                            <Globe className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>NOWPayments integration for reliable transaction processing</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Globe className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Multi-blockchain support (Bitcoin, Ethereum, Solana, TRON, BNB)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Globe className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Real-time blockchain monitoring and confirmation tracking</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Globe className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>WebAssembly for client-side cryptographic operations</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
                    <p className="font-phonic text-sm font-normal text-amber-900">
                      <strong>Continuous Innovation:</strong> We continuously evaluate and adopt new technologies that can improve our platform&apos;s capabilities, security, and user experience.
                    </p>
                  </div>
                </section>

                <Separator className="my-12" />

                {/* Section 7: Security */}
                <section id="security" className="mb-12">
                  <h2 className="font-phonic text-2xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <Shield className="h-8 w-8 text-[#7f5efd]" />
                    7. Security-First Approach
                  </h2>
                  
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    Security is not just a feature at Cryptrac&mdash;it&apos;s the cornerstone of our entire platform. We implement industry-leading security practices to ensure that your funds and data are protected at every level.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <Card className="border-green-200 bg-green-50">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-green-900">Non-Custodial Architecture</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="font-capsule text-base font-normal text-green-800 mb-3">
                          The most secure way to handle cryptocurrency is to never hold it at all:
                        </p>
                        <ul className="space-y-2 font-phonic text-sm font-normal text-green-700">
                          <li className="flex items-start gap-2">
                            <Shield className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>Payments go directly to your specified wallet addresses</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Shield className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>We never store or have access to private keys</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Shield className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>Eliminates custodial risk and security concerns</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-blue-200 bg-blue-50">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-blue-900">Platform Security</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ul className="space-y-2 font-phonic text-sm font-normal text-blue-700">
                          <li className="flex items-start gap-2">
                            <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>End-to-end encryption for all data transmission</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>Multi-factor authentication and access controls</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>Regular security audits and penetration testing</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>Compliance with industry security standards</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="text-center mt-6">
                    <Link href="/security" className="inline-flex items-center gap-2 text-[#7f5efd] hover:text-[#6547e8] font-phonic text-sm font-normal">
                      Learn more about our security practices
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </section>

                <Separator className="my-12" />

                {/* Section 8: Team */}
                <section id="team" className="mb-12">
                  <h2 className="font-phonic text-2xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <Users className="h-8 w-8 text-[#7f5efd]" />
                    8. Our Team
                  </h2>
                  
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    Cryptrac is built by a diverse team of cryptocurrency enthusiasts, software engineers, security experts, and business professionals who share a passion for making digital payments accessible to everyone.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
                    <Card className="border-[#7f5efd]/20 bg-[#f5f3ff]/30">
                      <CardHeader className="text-center">
                        <CardTitle className="font-phonic text-2xl font-normal text-gray-900">Engineering</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center">
                        <p className="font-phonic text-base font-normal text-gray-600">
                          Full-stack developers, blockchain specialists, and infrastructure engineers building the next generation of payment technology.
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-blue-200 bg-blue-50">
                      <CardHeader className="text-center">
                        <CardTitle className="font-phonic text-2xl font-normal text-blue-900">Security</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center">
                        <p className="font-phonic text-base font-normal text-blue-700">
                          Cybersecurity experts and cryptography specialists ensuring the highest levels of platform and transaction security.
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-green-200 bg-green-50">
                      <CardHeader className="text-center">
                        <CardTitle className="font-phonic text-2xl font-normal text-green-900">Business</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center">
                        <p className="font-phonic text-base font-normal text-green-700">
                          Product managers, customer success specialists, and business development professionals focused on user experience and growth.
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="border-gray-200">
                    <CardHeader>
                      <CardTitle className="font-phonic text-2xl font-normal text-gray-900 text-center">Our Culture</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-phonic text-base font-normal text-gray-900">Remote-First</h4>
                          <p className="font-phonic text-base font-normal text-gray-600">
                            We embrace remote work and hire the best talent globally, fostering collaboration across time zones and cultures.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-phonic text-base font-normal text-gray-900">Continuous Learning</h4>
                          <p className="font-phonic text-base font-normal text-gray-600">
                            The cryptocurrency space evolves rapidly, and we invest heavily in keeping our team at the forefront of new developments.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-phonic text-base font-normal text-gray-900">User Advocacy</h4>
                          <p className="font-phonic text-base font-normal text-gray-600">
                            Every team member understands and champions the needs of our users in their day-to-day work.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-phonic text-base font-normal text-gray-900">Innovation</h4>
                          <p className="font-phonic text-base font-normal text-gray-600">
                            We encourage creative thinking and provide the resources to explore new ideas and technologies.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </section>

                <Separator className="my-12" />

                {/* Section 9: Achievements */}
                <section id="achievements" className="mb-12">
                  <h2 className="font-phonic text-2xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <Award className="h-8 w-8 text-[#7f5efd]" />
                    9. Key Achievements
                  </h2>
                  
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    Since our launch, we&apos;ve reached several important milestones that reflect our growth and the trust our users place in our platform.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <Card className="border-[#7f5efd]/20 bg-[#f5f3ff]/30">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-gray-900">Platform Growth</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ul className="space-y-2 font-phonic text-base font-normal text-gray-600">
                          <li className="flex items-start gap-2">
                            <Star className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Thousands of merchants onboarded globally</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Star className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Support for 8+ major cryptocurrencies</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Star className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>99.9% platform uptime maintained</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Star className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Multi-language and multi-currency support</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-green-200 bg-green-50">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-green-900">Security & Compliance</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ul className="space-y-2 font-phonic text-sm font-normal text-green-700">
                          <li className="flex items-start gap-2">
                            <Shield className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>Zero security incidents since launch</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Shield className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>GDPR and CCPA compliance achieved</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Shield className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>Regular third-party security audits passed</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Shield className="h-4 w-4 text-green-600 mt-0.5" />
                            <span>Non-custodial architecture validated</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                    <p className="font-phonic text-sm font-normal text-blue-900">
                      <strong>Looking Ahead:</strong> These achievements represent just the beginning of our journey. We&apos;re committed to continuous improvement and setting new standards for cryptocurrency payment processing.
                    </p>
                  </div>
                </section>

                <Separator className="my-12" />

                {/* Section 10: Future */}
                <section id="future" className="mb-12">
                  <h2 className="font-phonic text-2xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <TrendingUp className="h-8 w-8 text-[#7f5efd]" />
                    10. Looking Forward
                  </h2>
                  
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    The future of cryptocurrency payments is bright, and we&apos;re excited to be at the forefront of this transformation. Our roadmap includes several exciting developments that will further enhance the platform and expand our capabilities.
                  </p>

                  <div className="space-y-6">
                    <Card className="border-[#7f5efd]/20 bg-[#f5f3ff]/30">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-gray-900">Near-Term Developments</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ul className="space-y-2 font-phonic text-base font-normal text-gray-600">
                          <li className="flex items-start gap-2">
                            <TrendingUp className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Enhanced mobile applications with advanced features</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <TrendingUp className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Additional cryptocurrency integrations and Layer 2 solutions</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <TrendingUp className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Advanced analytics and reporting capabilities</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <TrendingUp className="h-4 w-4 text-[#7f5efd] mt-0.5" />
                            <span>Integration with popular e-commerce platforms</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-blue-200 bg-blue-50">
                      <CardHeader>
                        <CardTitle className="font-phonic text-2xl font-normal text-blue-900">Long-Term Vision</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ul className="space-y-2 font-phonic text-sm font-normal text-blue-700">
                          <li className="flex items-start gap-2">
                            <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>AI-powered fraud detection and transaction optimization</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>Cross-border payment solutions with automatic currency conversion</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>DeFi integration for enhanced financial services</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>Expansion into emerging markets and new use cases</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mt-6">
                    We&apos;re committed to staying at the cutting edge of cryptocurrency payment technology while never losing sight of our core mission: making digital payments simple, secure, and accessible for everyone.
                  </p>
                </section>

                <Separator className="my-12" />

                {/* Section 11: Contact */}
                <section id="contact" className="mb-12">
                  <h2 className="font-phonic text-2xl font-normal text-gray-900 mb-6 flex items-center gap-3">
                    <Phone className="h-8 w-8 text-[#7f5efd]" />
                    11. Get in Touch
                  </h2>
                  
                  <p className="font-capsule text-base font-normal text-gray-700 leading-relaxed mb-6">
                    We love hearing from our community, whether you&apos;re an existing user, considering Cryptrac for your business, or just curious about cryptocurrency payments. Don&apos;t hesitate to reach out!
                  </p>
                  
                  <Card className="border-[#7f5efd]/20 bg-gradient-to-br from-[#f5f3ff] to-white">
                    <CardHeader>
                      <CardTitle className="font-phonic text-3xl font-normal text-gray-900">Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-[#7f5efd]" />
                        <div>
                          <p className="font-phonic text-base font-normal text-gray-600">General Inquiries</p>
                          <a href="mailto:hello@cryptrac.com" className="font-phonic text-base font-normal text-gray-900 hover:text-[#7f5efd]">
                            hello@cryptrac.com
                          </a>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-[#7f5efd]" />
                        <div>
                          <p className="font-phonic text-base font-normal text-gray-600">Support</p>
                          <a href="mailto:support@cryptrac.com" className="font-phonic text-base font-normal text-gray-900 hover:text-[#7f5efd]">
                            support@cryptrac.com
                          </a>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-[#7f5efd]" />
                        <div>
                          <p className="font-phonic text-base font-normal text-gray-600">Business Development</p>
                          <a href="mailto:partnerships@cryptrac.com" className="font-phonic text-base font-normal text-gray-900 hover:text-[#7f5efd]">
                            partnerships@cryptrac.com
                          </a>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="text-center">
                            <Button asChild className="w-full">
                              <Link href="/merchant/onboarding">
                                Get Started
                              </Link>
                            </Button>
                          </div>
                          <div className="text-center">
                            <Button variant="outline" asChild className="w-full">
                              <Link href="/contact">
                                Contact Sales
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </section>

                {/* Company Statement Box */}
                <Card className="border-[#7f5efd] bg-gradient-to-br from-[#f5f3ff] to-white">
                  <CardContent className="pt-8 pb-8 text-center">
                    <h3 className="font-phonic text-3xl font-normal text-gray-900 mb-4">
                      Join the Future of Payments
                    </h3>
                    <p className="font-capsule text-base font-normal text-gray-700 mb-6">
                      At Cryptrac, we&apos;re not just processing payments&mdash;we&apos;re building the infrastructure for the next generation of global commerce. Join thousands of businesses already using cryptocurrency to expand their reach and reduce costs.
                    </p>
                    <div className="flex items-center justify-center gap-6 font-phonic text-sm font-normal text-gray-500">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        <span>Founded {foundedYear}</span>
                      </div>
                      <Separator orientation="vertical" className="h-4" />
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span>Global Platform</span>
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
              <Link href="/about" className="font-phonic text-sm font-normal text-gray-400 hover:text-white transition-colors">
                About
              </Link>
              <Link href="/privacy" className="font-phonic text-sm font-normal text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="font-phonic text-sm font-normal text-gray-400 hover:text-white transition-colors">
                Terms of Service
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

