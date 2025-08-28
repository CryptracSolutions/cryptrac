'use client';

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight, BookOpen, Calendar, User, Clock, Search, Tag, TrendingUp, Zap, Shield, Globe, Lightbulb, Award } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Logo } from "@/app/components/ui/logo";
import { Separator } from "@/app/components/ui/separator";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";

export default function BlogPage() {
  const [searchTerm, setSearchTerm] = useState("");

  // Sample blog posts data
  const blogPosts = [
    {
      id: 1,
      title: "Getting Started with Cryptocurrency Payments: A Merchant's Guide",
      excerpt: "Learn the basics of accepting cryptocurrency payments for your business, including setup, security considerations, and best practices for success.",
      author: "Cryptrac Team",
      date: "2025-01-15",
      readTime: "8 min read",
      category: "Getting Started",
      tags: ["Bitcoin", "Payments", "Setup", "Merchants"],
      featured: true,
      image: "/blog/crypto-payments-guide.jpg"
    },
    {
      id: 2,
      title: "The Future of Stablecoins in E-commerce",
      excerpt: "Explore how stablecoins like USDT, USDC, and DAI are transforming online commerce by combining cryptocurrency benefits with price stability.",
      author: "Sarah Chen",
      date: "2025-01-10",
      readTime: "6 min read",
      category: "Industry Insights",
      tags: ["Stablecoins", "E-commerce", "USDT", "USDC"],
      featured: false,
      image: "/blog/stablecoins-ecommerce.jpg"
    },
    {
      id: 3,
      title: "Security Best Practices for Cryptocurrency Merchants",
      excerpt: "Comprehensive guide to securing your cryptocurrency payment setup, from wallet management to transaction monitoring and fraud prevention.",
      author: "Michael Rodriguez",
      date: "2025-01-05",
      readTime: "10 min read",
      category: "Security",
      tags: ["Security", "Wallets", "Best Practices", "Fraud Prevention"],
      featured: true,
      image: "/blog/security-best-practices.jpg"
    },
    {
      id: 4,
      title: "Understanding Transaction Fees in Different Blockchains",
      excerpt: "Compare transaction costs across Bitcoin, Ethereum, Solana, and other networks to optimize your payment processing strategy.",
      author: "Alex Thompson",
      date: "2025-01-01",
      readTime: "7 min read",
      category: "Technical",
      tags: ["Transaction Fees", "Bitcoin", "Ethereum", "Solana"],
      featured: false,
      image: "/blog/transaction-fees.jpg"
    },
    {
      id: 5,
      title: "Cryptrac's 2024 Year in Review: Growth and Innovation",
      excerpt: "Reflecting on our achievements this year, from new features and partnerships to the thousands of merchants who joined our platform.",
      author: "Cryptrac Team",
      date: "2024-12-28",
      readTime: "5 min read",
      category: "Company News",
      tags: ["Year Review", "Growth", "Innovation", "Milestones"],
      featured: false,
      image: "/blog/2024-year-review.jpg"
    },
    {
      id: 6,
      title: "Smart Terminal: Bringing Cryptocurrency to Point-of-Sale",
      excerpt: "Discover how our Smart Terminal feature enables brick-and-mortar businesses to accept cryptocurrency payments in person.",
      author: "Jennifer Park",
      date: "2024-12-20",
      readTime: "9 min read",
      category: "Product Updates",
      tags: ["Smart Terminal", "Point of Sale", "In-Person Payments", "Hardware"],
      featured: false,
      image: "/blog/smart-terminal.jpg"
    }
  ];

  const categories = ["All", "Getting Started", "Industry Insights", "Security", "Technical", "Company News", "Product Updates"];
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPosts = blogPosts.filter(post => post.featured);
  const recentPosts = blogPosts.slice(0, 3);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container-wide flex h-16 items-center justify-between">
          <Logo size="md" />
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/about" className="font-phonic text-sm font-normal text-gray-600 hover:text-gray-900 transition-colors">
              About
            </Link>
            <Link href="/security" className="font-phonic text-sm font-normal text-gray-600 hover:text-gray-900 transition-colors">
              Security
            </Link>
            <Link href="/privacy" className="font-phonic text-sm font-normal text-gray-600 hover:text-gray-900 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="font-phonic text-sm font-normal text-gray-600 hover:text-gray-900 transition-colors">
              Terms of Service
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
              Cryptrac Blog
            </Badge>
            <h1 className="font-phonic text-3xl font-normal tracking-tight text-gray-900 mb-4">
              Insights & Updates
            </h1>
            <p className="font-capsule text-base font-normal text-gray-600 max-w-2xl mx-auto">
              Stay updated with the latest in cryptocurrency payments, industry insights, and Cryptrac platform updates
            </p>
            
            {/* Search Bar */}
            <div className="max-w-md mx-auto mt-8">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container-wide py-8">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="font-phonic text-sm font-normal"
            >
              {category}
            </Button>
          ))}
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Featured Posts */}
            {selectedCategory === "All" && featuredPosts.length > 0 && (
              <div className="mb-12">
                <h2 className="font-phonic text-2xl font-normal text-gray-900 mb-6 flex items-center gap-2">
                  <Award className="h-6 w-6 text-[#7f5efd]" />
                  Featured Articles
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {featuredPosts.map((post) => (
                    <Card key={post.id} className="border-[#7f5efd]/20 bg-[#f5f3ff]/30 hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {post.category}
                          </Badge>
                          <Badge className="bg-[#7f5efd] text-white text-xs">
                            Featured
                          </Badge>
                        </div>
                        <CardTitle className="font-phonic text-xl font-normal text-gray-900 line-clamp-2">
                          {post.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-capsule text-sm font-normal text-gray-600 mb-4 line-clamp-3">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {post.author}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(post.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {post.readTime}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-4">
                          {post.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <Button variant="ghost" size="sm" className="font-phonic text-sm font-normal text-[#7f5efd] hover:text-[#6547e8] p-0">
                          Read Article
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* All Posts */}
            <div>
              <h2 className="font-phonic text-3xl font-normal text-gray-900 mb-6 flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-[#7f5efd]" />
                {selectedCategory === "All" ? "All Articles" : `${selectedCategory} Articles`}
                <Badge variant="outline" className="text-sm">
                  {filteredPosts.length}
                </Badge>
              </h2>

              {filteredPosts.length === 0 ? (
                <Card className="p-8 text-center">
                  <div className="text-gray-400 mb-4">
                    <Search className="h-12 w-12 mx-auto mb-4" />
                  </div>
                  <h3 className="font-phonic text-lg font-normal text-gray-900 mb-2">No articles found</h3>
                  <p className="font-capsule text-sm font-normal text-gray-600">
                    Try adjusting your search terms or category filter.
                  </p>
                </Card>
              ) : (
                <div className="space-y-6">
                  {filteredPosts.map((post) => (
                    <Card key={post.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                              <Badge variant="outline" className="text-xs">
                                {post.category}
                              </Badge>
                              {post.featured && (
                                <Badge className="bg-[#7f5efd] text-white text-xs">
                                  Featured
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-phonic text-xl font-normal text-gray-900 mb-3 line-clamp-2">
                              {post.title}
                            </h3>
                            <p className="font-capsule text-sm font-normal text-gray-600 mb-4 line-clamp-2">
                              {post.excerpt}
                            </p>
                            <div className="flex items-center gap-6 text-xs text-gray-500 mb-4">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {post.author}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(post.date).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {post.readTime}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1 mb-4">
                              {post.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <Button variant="ghost" size="sm" className="font-phonic text-sm font-normal text-[#7f5efd] hover:text-[#6547e8] p-0">
                              Read Full Article
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-8">
              {/* Recent Posts */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="font-phonic text-lg font-normal text-gray-900 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-[#7f5efd]" />
                    Recent Posts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentPosts.map((post) => (
                    <div key={post.id} className="pb-4 border-b border-gray-200 last:border-b-0">
                      <h4 className="font-phonic text-sm font-normal text-gray-900 mb-2 line-clamp-2">
                        {post.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <Calendar className="h-3 w-3" />
                        {new Date(post.date).toLocaleDateString()}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {post.category}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Popular Topics */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="font-phonic text-lg font-normal text-gray-900 flex items-center gap-2">
                    <Tag className="h-5 w-5 text-[#7f5efd]" />
                    Popular Topics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {["Bitcoin", "Security", "Stablecoins", "Getting Started", "Payments", "E-commerce", "Wallets", "Blockchain"].map((topic, index) => (
                      <Badge key={index} variant="secondary" className="text-xs cursor-pointer hover:bg-[#7f5efd] hover:text-white transition-colors">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Newsletter Signup */}
              <Card className="shadow-lg border-[#7f5efd]/20 bg-[#f5f3ff]/30">
                <CardHeader>
                  <CardTitle className="font-phonic text-lg font-normal text-gray-900 flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-[#7f5efd]" />
                    Stay Updated
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-capsule text-sm font-normal text-gray-600 mb-4">
                    Subscribe to our newsletter for the latest insights on cryptocurrency payments and platform updates.
                  </p>
                  <div className="space-y-3">
                    <Input type="email" placeholder="Enter your email" className="text-sm" />
                    <Button className="w-full" size="sm">
                      Subscribe
                    </Button>
                  </div>
                  <p className="font-phonic text-xs font-normal text-gray-500 mt-2">
                    No spam. Unsubscribe at any time.
                  </p>
                </CardContent>
              </Card>

              {/* Quick Links */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="font-phonic text-lg font-normal text-gray-900 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-[#7f5efd]" />
                    Quick Links
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/merchant/onboarding" className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <span className="font-phonic text-sm font-normal text-gray-700">Get Started</span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </Link>
                  <Link href="/smart-terminal" className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <span className="font-phonic text-sm font-normal text-gray-700">Smart Terminal</span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </Link>
                  <Link href="/security" className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <span className="font-phonic text-sm font-normal text-gray-700">Security</span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </Link>
                  <Link href="/about" className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <span className="font-phonic text-sm font-normal text-gray-700">About Cryptrac</span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </Link>
                  <Link href="/contact" className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <span className="font-phonic text-sm font-normal text-gray-700">Contact Support</span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-[#7f5efd] to-[#6547e8] py-16 mt-16">
        <div className="container-wide text-center">
          <h2 className="font-phonic text-3xl font-normal text-white mb-4">
            Ready to Accept Cryptocurrency Payments?
          </h2>
          <p className="font-capsule text-lg font-normal text-white/80 mb-8 max-w-2xl mx-auto">
            Join thousands of merchants using Cryptrac to accept Bitcoin, Ethereum, and other cryptocurrencies securely.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/merchant/onboarding">
                Get Started Free
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10" asChild>
              <Link href="/contact">
                Contact Sales
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
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
              <Link href="/blog" className="font-phonic text-sm font-normal text-gray-400 hover:text-white transition-colors">
                Blog
              </Link>
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