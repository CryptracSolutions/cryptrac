'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from "next/link";
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, Users, Shield, HelpCircle, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Logo } from "@/app/components/ui/logo";
import { Separator } from "@/app/components/ui/separator";
import { Badge } from "@/app/components/ui/badge";
import { toast } from 'react-hot-toast';
import { LandingNav } from "@/app/components/layout/landing-nav";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");

  const sections = useMemo(() => [
    { id: "contact-info", title: "Contact Information", icon: Phone },
    { id: "support-hours", title: "Support Hours", icon: Clock },
    { id: "contact-form", title: "Send Message", icon: MessageSquare },
    { id: "faq", title: "Frequently Asked", icon: HelpCircle },
    { id: "emergency", title: "Emergency Support", icon: AlertCircle }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Message sent successfully! We\'ll get back to you soon.');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        throw new Error('Failed to send message');
      }
    } catch {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
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
              Customer Support
            </Badge>
            <h1 className="font-phonic text-3xl md:text-4xl lg:text-6xl font-normal tracking-tight text-gray-900 mb-4">
              Contact Us
            </h1>
            <p className="font-capsule text-base md:text-lg font-normal text-gray-600 max-w-2xl mx-auto">
              Have questions about Cryptrac? We&apos;re here to help. Reach out to our support team for assistance with your cryptocurrency payment processing needs.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-6 text-base text-gray-500">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Response within 24 hours</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Secure & Confidential</span>
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
              <span className="font-phonic text-base font-normal text-gray-900">Quick Navigation</span>
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
              <CardTitle className="font-phonic text-base font-normal text-gray-900">Quick Navigation</CardTitle>
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
              <div className="space-y-12">
                {/* Section 1: Contact Information */}
                <section id="contact-info">
                  <h2 className="font-phonic text-xl md:text-2xl font-normal text-gray-900 mb-4 md:mb-6 flex flex-wrap items-center gap-2 md:gap-3">
                    <Phone className="h-6 md:h-8 w-6 md:w-8 text-[#7f5efd]" />
                    Contact Information
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <Card className="border-[#7f5efd]/20 bg-[#f5f3ff]/30">
                      <CardHeader>
                        <CardTitle className="font-phonic text-base md:text-lg font-normal text-gray-900 flex flex-wrap items-center gap-2">
                          <Mail className="h-5 w-5 text-[#7f5efd]" />
                          Email Support
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-capsule text-base font-normal text-gray-600 mb-2">Primary support channel</p>
                        <a href="mailto:support@cryptrac.com" className="font-phonic font-semibold text-gray-900 hover:text-[#7f5efd] transition-colors">
                          support@cryptrac.com
                        </a>
                        <p className="font-phonic text-base font-normal text-gray-500 mt-2">Best for technical issues and general inquiries</p>
                      </CardContent>
                    </Card>

                    <Card className="border-gray-200">
                      <CardHeader>
                        <CardTitle className="font-phonic text-base md:text-lg font-normal text-gray-900 flex items-center gap-2">
                          <Phone className="h-5 w-5 text-[#7f5efd]" />
                          Phone Support
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-capsule text-base font-normal text-gray-600 mb-2">Direct assistance</p>
                        <a href="tel:+13476193721" className="font-phonic font-semibold text-gray-900 hover:text-[#7f5efd] transition-colors">
                          +1 (347) 619-3721
                        </a>
                        <p className="font-phonic text-base font-normal text-gray-500 mt-2">Available during business hours</p>
                      </CardContent>
                    </Card>

                    <Card className="border-gray-200">
                      <CardHeader>
                        <CardTitle className="font-phonic text-base md:text-lg font-normal text-gray-900 flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-[#7f5efd]" />
                          Business Hours
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-capsule text-base font-normal text-gray-600 mb-2">Eastern Standard Time</p>
                        <p className="font-phonic font-semibold text-gray-900">Monday - Friday</p>
                        <p className="font-capsule text-base font-normal text-gray-600">9:00 AM - 6:00 PM EST</p>
                        <p className="font-phonic text-base font-normal text-gray-500 mt-2">Weekend support via email</p>
                      </CardContent>
                    </Card>

                    <Card className="border-gray-200">
                      <CardHeader>
                        <CardTitle className="font-phonic text-base md:text-lg font-normal text-gray-900 flex items-center gap-2">
                          <Users className="h-5 w-5 text-[#7f5efd]" />
                          Response Times
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="font-phonic text-base font-normal text-gray-600">Email: Within 2 hours</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="font-phonic text-base font-normal text-gray-600">Phone: Immediate during hours</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                <Separator className="my-12" />

                {/* Section 2: Support Hours */}
                <section id="support-hours">
                  <h2 className="font-phonic text-xl md:text-2xl font-normal text-gray-900 mb-4 md:mb-6 flex flex-wrap items-center gap-2 md:gap-3">
                    <Clock className="h-6 md:h-8 w-6 md:w-8 text-[#7f5efd]" />
                    Support Hours & Availability
                  </h2>
                  
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <Card className="border-green-200 bg-green-50">
                      <CardHeader>
                        <CardTitle className="font-phonic text-base md:text-lg font-normal text-green-900">Standard Support</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <p className="font-phonic text-sm font-normal text-green-800 mb-2">Monday - Friday</p>
                        <p className="font-phonic text-2xl font-bold text-green-900 mb-2">9 AM - 6 PM EST</p>
                        <p className="font-phonic text-base font-normal text-green-700">Email & Phone Support</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-blue-200 bg-blue-50">
                      <CardHeader>
                        <CardTitle className="font-phonic text-base md:text-lg font-normal text-blue-900">Weekend Support</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <p className="font-phonic text-base font-normal text-blue-800 mb-2">Saturday - Sunday</p>
                        <p className="font-phonic text-2xl font-bold text-blue-900 mb-2">Email Only</p>
                        <p className="font-phonic text-base font-normal text-blue-700">Response within 2 hours</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-orange-200 bg-orange-50">
                      <CardHeader>
                        <CardTitle className="font-phonic text-base md:text-lg font-normal text-orange-900">Emergency Support</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <p className="font-phonic text-sm font-normal text-orange-800 mb-2">24/7 for Critical Issues</p>
                        <p className="font-phonic text-2xl font-bold text-orange-900 mb-2">Security & Outages</p>
                        <p className="font-phonic text-base font-normal text-orange-700">Immediate response</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="font-phonic text-base font-normal text-amber-900">
                      <strong>Holiday Schedule:</strong> We observe major US holidays. During holidays, email support is available with extended response times. Emergency support remains available for critical issues.
                    </p>
                  </div>
                </section>

                <Separator className="my-12" />

                {/* Section 3: Contact Form */}
                <section id="contact-form">
                  <h2 className="font-phonic text-xl md:text-2xl font-normal text-gray-900 mb-4 md:mb-6 flex flex-wrap items-center gap-2 md:gap-3">
                    <MessageSquare className="h-6 md:h-8 w-6 md:w-8 text-[#7f5efd]" />
                    Send us a Message
                  </h2>
                  
                  <Card className="border-[#7f5efd]/20 bg-[#f5f3ff]/30">
                    <CardHeader>
                      <CardTitle className="font-phonic text-xl font-normal text-gray-900">
                        Contact Form
                      </CardTitle>
                      <p className="font-capsule text-base font-normal text-gray-600">
                        Fill out the form below and we&apos;ll get back to you as soon as possible.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            label="Name"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            required
                            disabled={loading}
                          />
                          <Input
                            label="Email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            required
                            disabled={loading}
                          />
                        </div>
                        
                        <Input
                          label="Subject"
                          value={formData.subject}
                          onChange={(e) => setFormData({...formData, subject: e.target.value})}
                          required
                          disabled={loading}
                        />
                        
                        <div>
                          <label className="block font-phonic text-sm font-normal text-gray-700 mb-2">
                            Message
                          </label>
                          <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7f5efd] focus:border-transparent resize-none"
                            rows={6}
                            value={formData.message}
                            onChange={(e) => setFormData({...formData, message: e.target.value})}
                            required
                            disabled={loading}
                            placeholder="Please describe your inquiry in detail..."
                          />
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="w-full bg-[#7f5efd] hover:bg-[#7c3aed] text-white"
                          disabled={loading}
                        >
                          {loading ? 'Sending...' : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Send Message
                            </>
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </section>

                <Separator className="my-12" />

                {/* Section 4: FAQ */}
                <section id="faq">
                  <h2 className="font-phonic text-xl md:text-2xl font-normal text-gray-900 mb-4 md:mb-6 flex flex-wrap items-center gap-2 md:gap-3">
                    <HelpCircle className="h-6 md:h-8 w-6 md:w-8 text-[#7f5efd]" />
                    Frequently Asked Questions
                  </h2>
                  
                  <div className="space-y-4">
                    <Card className="border-gray-200">
                      <CardHeader>
                        <CardTitle className="font-phonic text-base md:text-lg font-normal text-gray-900">How quickly will I receive a response?</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-capsule text-base font-normal text-gray-700">
                          We typically respond to email inquiries within 2 hours during business days. Phone support is available immediately during business hours. For urgent matters, we offer expedited support.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-gray-200">
                      <CardHeader>
                        <CardTitle className="font-phonic text-base md:text-lg font-normal text-gray-900">What information should I include in my message?</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-capsule text-base font-normal text-gray-700">
                          Please include your account details (if applicable), a clear description of your issue or question, and any relevant transaction IDs or error messages. This helps us provide faster, more accurate assistance.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-gray-200">
                      <CardHeader>
                        <CardTitle className="font-phonic text-base md:text-lg font-normal text-gray-900">Do you offer support in languages other than English?</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-capsule text-base font-normal text-gray-700">
                          Currently, we provide support in English only. However, we&apos;re working on expanding our language support. For now, we can work with translation tools if needed.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-gray-200">
                      <CardHeader>
                        <CardTitle className="font-phonic text-base md:text-lg font-normal text-gray-900">How do I report a security issue?</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-capsule text-base font-normal text-gray-700">
                          For security-related issues, please contact us immediately at support@cryptrac.com with &ldquo;SECURITY&rdquo; in the subject line. We treat security reports with the highest priority and respond within 4 hours.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                <Separator className="my-12" />

                {/* Section 5: Emergency Support */}
                <section id="emergency">
                  <h2 className="font-phonic text-xl md:text-2xl font-normal text-gray-900 mb-4 md:mb-6 flex flex-wrap items-center gap-2 md:gap-3">
                    <AlertCircle className="h-6 md:h-8 w-6 md:w-8 text-[#7f5efd]" />
                    Emergency Support
                  </h2>
                  
                  <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                      <CardTitle className="font-phonic text-lg font-normal text-red-900">Critical Issues Requiring Immediate Attention</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-phonic font-semibold text-red-900">Security Incidents</h4>
                        <ul className="space-y-1 font-phonic text-sm font-normal text-red-800">
                          <li>• Unauthorized account access</li>
                          <li>• Suspicious transaction activity</li>
                          <li>• Data breach concerns</li>
                          <li>• Phishing attempts</li>
                        </ul>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-phonic font-semibold text-red-900">Service Outages</h4>
                        <ul className="space-y-1 font-phonic text-sm font-normal text-red-800">
                          <li>• Payment processing failures</li>
                          <li>• Platform unavailability</li>
                          <li>• Critical feature malfunctions</li>
                        </ul>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-phonic font-semibold text-red-900">Financial Issues</h4>
                        <ul className="space-y-1 font-phonic text-sm font-normal text-red-800">
                          <li>• Missing or incorrect transactions</li>
                          <li>• Payment processing errors</li>
                          <li>• Account balance discrepancies</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="mt-6 grid md:grid-cols-2 gap-4">
                    <Card className="border-gray-200">
                      <CardHeader>
                        <CardTitle className="font-phonic text-base md:text-lg font-normal text-gray-900">Emergency Contact</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-capsule text-base font-normal text-gray-700 mb-2">For critical issues:</p>
                        <a href="mailto:support@cryptrac.com" className="font-phonic font-semibold text-gray-900 hover:text-[#7f5efd]">
                          support@cryptrac.com
                        </a>
                        <p className="font-phonic text-base font-normal text-gray-500 mt-2">Include &ldquo;URGENT&rdquo; in subject line</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-gray-200">
                      <CardHeader>
                        <CardTitle className="font-phonic text-base md:text-lg font-normal text-gray-900">Response Time</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-capsule text-base font-normal text-gray-700 mb-2">Emergency issues:</p>
                        <p className="font-phonic font-semibold text-gray-900">Immediately</p>
                        <p className="font-phonic text-base font-normal text-gray-500 mt-2">24/7 monitoring for critical issues</p>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                {/* Final Contact Summary */}
                <Card className="border-[#7f5efd] bg-gradient-to-br from-[#f5f3ff] to-white">
                  <CardContent className="pt-8 pb-8 text-center">
                    <h3 className="font-phonic text-xl font-normal text-gray-900 mb-4">
                      Ready to Get Started?
                    </h3>
                    <p className="font-capsule text-base font-normal text-gray-700 mb-6">
                      Our support team is here to help you with any questions about Cryptrac&apos;s cryptocurrency payment processing platform.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      <Button asChild className="bg-[#7f5efd] hover:bg-[#7c3aed] text-white">
                        <Link href="mailto:support@cryptrac.com">
                          <Mail className="h-4 w-4 mr-2" />
                          Email Support
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href="/help">
                          <HelpCircle className="h-4 w-4 mr-2" />
                          Help Center
                        </Link>
                      </Button>
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
              <Link href="/help" className="font-phonic text-sm font-normal text-gray-400 hover:text-white transition-colors">
                Help Center
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
