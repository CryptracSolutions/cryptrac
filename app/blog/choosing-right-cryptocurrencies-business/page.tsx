import { Metadata } from 'next';
import { BlogPostLayout } from '@/app/components/blog/BlogPostLayout';
import { getBlogPostBySlug } from '@/lib/blog-posts';
import { notFound } from 'next/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const post = getBlogPostBySlug('choosing-right-cryptocurrencies-business');
  
  if (!post) {
    return {};
  }

  return {
    title: post.seo.metaTitle,
    description: post.seo.metaDescription,
    keywords: post.seo.keywords.join(', '),
    authors: [{ name: post.author }],
    openGraph: {
      title: post.seo.metaTitle,
      description: post.seo.metaDescription,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
      url: `https://www.cryptrac.com/blog/${post.slug}`,
      siteName: 'Cryptrac',
      images: [
        {
          url: `https://www.cryptrac.com${post.image}`,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seo.metaTitle,
      description: post.seo.metaDescription,
      images: [`https://www.cryptrac.com${post.image}`],
    },
    alternates: {
      canonical: `https://www.cryptrac.com/blog/${post.slug}`,
    },
  };
}

export default function ChoosingRightCryptocurrenciesBusiness() {
  const post = getBlogPostBySlug('choosing-right-cryptocurrencies-business');
  
  if (!post) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    author: {
      '@type': 'Person',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Cryptrac',
      url: 'https://www.cryptrac.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.cryptrac.com/logo.png',
      },
    },
    datePublished: post.date,
    dateModified: post.date,
    image: `https://www.cryptrac.com${post.image}`,
    url: `https://www.cryptrac.com/blog/${post.slug}`,
    keywords: post.tags.join(', '),
    articleSection: post.category,
    wordCount: post.content.split(' ').length,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogPostLayout post={post} />
    </>
  );
}