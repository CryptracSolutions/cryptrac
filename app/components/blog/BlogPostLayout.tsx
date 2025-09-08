'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, User, Clock, Share2, Twitter, Linkedin, Facebook, Copy, Check, ChevronRight } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Logo } from "@/app/components/ui/logo";
import { Separator } from "@/app/components/ui/separator";
import { BlogPost, getAllBlogPosts } from "@/lib/blog-posts";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface BlogPostLayoutProps {
  post: BlogPost;
}

export function BlogPostLayout({ post }: BlogPostLayoutProps) {
  const [readingProgress, setReadingProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    setShareUrl(window.location.href);
    
    const updateReadingProgress = () => {
      const element = document.getElementById('blog-content');
      if (!element) return;
      
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const elementTop = element.offsetTop;
      const elementHeight = element.scrollHeight;
      
      if (scrollTop < elementTop) {
        setReadingProgress(0);
      } else if (scrollTop > elementTop + elementHeight - clientHeight) {
        setReadingProgress(100);
      } else {
        const progress = ((scrollTop - elementTop) / (elementHeight - clientHeight)) * 100;
        setReadingProgress(Math.max(0, Math.min(100, progress)));
      }
    };

    window.addEventListener('scroll', updateReadingProgress);
    return () => window.removeEventListener('scroll', updateReadingProgress);
  }, []);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(shareUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
  };

  // Get related posts (same category, excluding current post)
  const allPosts = getAllBlogPosts();
  const relatedPosts = allPosts
    .filter(p => p.id !== post.id && p.category === post.category)
    .slice(0, 3);

  // If not enough in same category, fill with other recent posts
  if (relatedPosts.length < 3) {
    const otherPosts = allPosts
      .filter(p => p.id !== post.id && !relatedPosts.includes(p))
      .slice(0, 3 - relatedPosts.length);
    relatedPosts.push(...otherPosts);
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Reading Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-1 bg-[#7f5efd] z-50 transition-all duration-150 ease-out"
        style={{ width: `${readingProgress}%` }}
      />
      
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container-wide flex h-16 items-center justify-between">
          <Logo size="md" />
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/blog" className="font-phonic text-sm font-normal text-gray-600 hover:text-gray-900 transition-colors">
              Blog
            </Link>
            <Link href="/about" className="font-phonic text-sm font-normal text-gray-600 hover:text-gray-900 transition-colors">
              About
            </Link>
            <Link href="/security" className="font-phonic text-sm font-normal text-gray-600 hover:text-gray-900 transition-colors">
              Security
            </Link>
            <Link href="/contact" className="font-phonic text-sm font-normal text-gray-600 hover:text-gray-900 transition-colors">
              Contact
            </Link>
          </nav>
          <Button variant="ghost" size="sm" asChild className="text-gray-600 hover:text-gray-900">
            <Link href="/blog" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Link>
          </Button>
        </div>
      </header>

      <div className="container-wide py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <article className="lg:col-span-3">
            {/* Article Header */}
            <header className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className="text-sm">
                  {post.category}
                </Badge>
                {post.featured && (
                  <Badge className="bg-[#7f5efd] text-white text-sm">
                    Featured
                  </Badge>
                )}
              </div>
              
              <h1 className="font-phonic text-4xl lg:text-5xl font-normal tracking-tight text-gray-900 mb-6 leading-tight">
                {post.title}
              </h1>
              
              <p className="font-capsule text-lg font-normal text-gray-600 mb-6 leading-relaxed">
                {post.excerpt}
              </p>
              
              <div className="flex items-center gap-6 text-sm text-gray-500 mb-6">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-phonic font-normal">{post.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="font-phonic font-normal">
                    {new Date(post.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-phonic font-normal">{post.readTime}</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-8">
                {post.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            </header>

            {/* Article Content */}
            <div id="blog-content" className="prose prose-lg max-w-none mb-12">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => <h1 className="font-phonic text-3xl font-normal text-gray-900 mb-6 mt-12 first:mt-0">{children}</h1>,
                  h2: ({ children }) => <h2 className="font-phonic text-2xl font-normal text-gray-900 mb-4 mt-10">{children}</h2>,
                  h3: ({ children }) => <h3 className="font-phonic text-xl font-normal text-gray-900 mb-3 mt-8">{children}</h3>,
                  p: ({ children }) => <p className="font-capsule text-base font-normal text-gray-700 mb-4 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="font-capsule text-base font-normal text-gray-700 mb-4 pl-6 space-y-2">{children}</ul>,
                  ol: ({ children }) => <ol className="font-capsule text-base font-normal text-gray-700 mb-4 pl-6 space-y-2">{children}</ol>,
                  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-[#7f5efd] pl-6 py-2 mb-6 bg-[#f5f3ff]/30 italic">
                      {children}
                    </blockquote>
                  ),
                  code: ({ children }) => (
                    <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-6 overflow-x-auto">
                      {children}
                    </pre>
                  ),
                  strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                }}
              >
                {post.content}
              </ReactMarkdown>
            </div>

            {/* Share Section */}
            <div className="border-t pt-8 mb-12">
              <div className="flex items-center justify-between">
                <h3 className="font-phonic text-lg font-normal text-gray-900">Share this article</h3>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(shareUrls.twitter, '_blank')}
                    className="flex items-center gap-2"
                  >
                    <Twitter className="h-4 w-4" />
                    Twitter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(shareUrls.linkedin, '_blank')}
                    className="flex items-center gap-2"
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(shareUrls.facebook, '_blank')}
                    className="flex items-center gap-2"
                  >
                    <Facebook className="h-4 w-4" />
                    Facebook
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyUrl}
                    className="flex items-center gap-2"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copied!' : 'Copy Link'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Author Bio */}
            <div className="bg-[#f5f3ff]/30 border border-[#7f5efd]/20 rounded-lg p-6 mb-12">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-[#7f5efd] rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-phonic text-lg font-normal text-gray-900 mb-2">{post.author}</h4>
                  <p className="font-capsule text-sm font-normal text-gray-600">
                    {post.author === 'Cryptrac Team' 
                      ? 'The Cryptrac team is dedicated to making cryptocurrency payments accessible and secure for businesses worldwide. Our experts combine deep blockchain knowledge with practical business experience.'
                      : 'Expert contributor to the Cryptrac blog, sharing insights on cryptocurrency payments, blockchain technology, and the future of digital commerce.'
                    }
                  </p>
                </div>
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-8">
              {/* Table of Contents */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="font-phonic text-lg font-normal text-gray-900">
                    Table of Contents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p className="font-capsule text-gray-600">
                      Navigate through this article using the headings below.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Related Posts */}
              {relatedPosts.length > 0 && (
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="font-phonic text-lg font-normal text-gray-900">
                      Related Articles
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {relatedPosts.map((relatedPost) => (
                      <Link key={relatedPost.id} href={`/blog/${relatedPost.slug}`}>
                        <div className="pb-4 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 p-2 rounded transition-colors">
                          <h4 className="font-phonic text-sm font-normal text-gray-900 mb-2 line-clamp-2">
                            {relatedPost.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                            <Calendar className="h-3 w-3" />
                            {new Date(relatedPost.date).toLocaleDateString()}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {relatedPost.category}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Newsletter Signup */}
              <Card className="shadow-lg border-[#7f5efd]/20 bg-[#f5f3ff]/30">
                <CardHeader>
                  <CardTitle className="font-phonic text-lg font-normal text-gray-900">
                    Stay Updated
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-capsule text-sm font-normal text-gray-600 mb-4">
                    Get the latest cryptocurrency payment insights and Cryptrac updates.
                  </p>
                  <div className="space-y-3">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7f5efd] focus:border-transparent"
                    />
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
                  <CardTitle className="font-phonic text-lg font-normal text-gray-900">
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
                  <Link href="/contact" className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <span className="font-phonic text-sm font-normal text-gray-700">Contact Support</span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </Link>
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>
      </div>

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-[#7f5efd] to-[#6547e8] py-16">
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