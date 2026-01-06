import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://suparbase.com'),
  title: {
    default: "suparbase - Database Sync & Keep-Alive",
    template: "%s | suparbase",
  },
  description: "Keep your Supabase databases alive and in sync. Prevent free tier pausing with automated health checks. Open-source database synchronization tool with schema validation and migration generation.",
  keywords: ["supabase", "database", "sync", "keep-alive", "postgres", "health check", "monitoring", "database migration", "schema validation", "supabase tools"],
  authors: [{ name: "suparbase" }],
  creator: "suparbase",
  publisher: "suparbase",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "suparbase",
    title: "suparbase - Database Sync & Keep-Alive",
    description: "Keep your Supabase databases alive and in sync. Prevent free tier pausing with automated health checks.",
    url: "https://suparbase.com",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "suparbase - Database Sync & Keep-Alive Tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "suparbase - Database Sync & Keep-Alive",
    description: "Keep your Supabase databases alive and in sync.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    other: [
      {
        rel: "apple-touch-icon",
        url: "/apple-touch-icon.png",
      },
    ],
  },
  verification: {
    // Add Google Search Console verification if available
    // google: 'your-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

