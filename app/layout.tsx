import type { Metadata, Viewport } from "next";
import "./globals.css";
import ToasterWrapper from './components/ToasterWrapper'; // Import wrapper (client-safe)
import { TimezoneProvider } from '@/lib/contexts/TimezoneContext';
import { ViewportHeightUpdater } from '@/app/components/layout/viewport-height-updater';
import { MobileMetricsTracker } from '@/app/components/analytics/mobile-metrics-tracker';

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: {
    default: "Cryptrac — Get Paid in Crypto",
    template: "%s | Cryptrac"
  },
  description: "Modern, non-custodial crypto payments for Bitcoin, Ethereum, Solana, and more.",
  openGraph: {
    title: "Cryptrac — Get Paid in Crypto",
    description: "Modern, non-custodial crypto payments for Bitcoin, Ethereum, Solana, and more.",
    siteName: "Cryptrac"
  },
  twitter: {
    card: "summary_large_image",
    title: "Cryptrac — Get Paid in Crypto",
    description: "Modern, non-custodial crypto payments for Bitcoin, Ethereum, Solana, and more."
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png?v=3", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png?v=3", sizes: "16x16", type: "image/png" }
    ],
    apple: [
      { url: "/apple-touch-icon.png?v=3", sizes: "180x180" }
    ]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="antialiased">
        <TimezoneProvider>
          <ToasterWrapper /> {/* Wrapper handles dynamic/ssr */}
          <ViewportHeightUpdater />
          <MobileMetricsTracker />
          {children}
        </TimezoneProvider>
      </body>
    </html>
  );
}
