import type { NextConfig } from "next";
import withPWA from 'next-pwa';

const runtimeCaching = [
  {
    urlPattern: ({ request }: { request: Request }) => request.destination === 'document',
    handler: 'NetworkFirst',
    options: {
      cacheName: 'pages-cache',
      networkTimeoutSeconds: 10,
      expiration: {
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60,
      },
    },
  },
  {
    urlPattern: ({ request }: { request: Request }) => ['style', 'script', 'worker'].includes(request.destination),
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'static-resources',
      expiration: {
        maxEntries: 60,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      },
    },
  },
  {
    urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith('/_next/static/'),
    handler: 'CacheFirst',
    options: {
      cacheName: 'next-static',
      expiration: {
        maxEntries: 80,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      },
    },
  },
  {
    urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith('/_next/image'),
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'next-image',
      expiration: {
        maxEntries: 80,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      },
    },
  },
  {
    urlPattern: ({ request }: { request: Request }) => request.destination === 'image',
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'image-cache',
      expiration: {
        maxEntries: 120,
        maxAgeSeconds: 14 * 24 * 60 * 60,
      },
    },
  },
  {
    urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith('/api/'),
    handler: 'NetworkFirst',
    options: {
      cacheName: 'api-cache',
      networkTimeoutSeconds: 10,
      expiration: {
        maxEntries: 60,
        maxAgeSeconds: 24 * 60 * 60,
      },
    },
  },
]

const nextConfig: NextConfig = {
  eslint: {
    // Completely ignore ESLint during builds
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      // Old settings Wallets tab → new dedicated page
      { source: '/merchant/settings/wallets', destination: '/merchant/wallets', permanent: true },
      { source: '/merchant/settings/wallet-addresses', destination: '/merchant/wallets', permanent: true },
      // If your app used tab query (keep if applicable)
      { source: '/merchant/settings', has: [{ type: 'query', key: 'tab', value: 'wallets' }], destination: '/merchant/wallets', permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
        port: '',
        pathname: '/v1/create-qr-code/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Handle WebAssembly modules
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      syncWebAssembly: true,
    };

    // Handle .wasm files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    // Fallback for Node.js modules in browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer'),
        process: require.resolve('process/browser'),
      };
    }

    return config;
  },
};

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching,
  cacheOnFrontEndNav: true,
  fallbacks: {
    document: '/offline',
  },
})(nextConfig);
