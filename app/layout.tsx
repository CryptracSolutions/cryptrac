import type { Metadata } from "next";
import "./globals.css";
import ToasterWrapper from './components/ToasterWrapper'; // Import wrapper (client-safe)

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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <ToasterWrapper /> {/* Wrapper handles dynamic/ssr */}
        {children}
      </body>
    </html>
  );
}
