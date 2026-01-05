import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Supapulse - Database Sync & Keep-Alive",
    template: "%s | Supapulse",
  },
  description: "Keep your Supabase databases alive and in sync. Prevent free tier pausing with automated health checks.",
  keywords: ["supabase", "database", "sync", "keep-alive", "postgres", "health check", "monitoring"],
  authors: [{ name: "Supapulse" }],
  creator: "Supapulse",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Supapulse",
    title: "Supapulse - Database Sync & Keep-Alive",
    description: "Keep your Supabase databases alive and in sync. Prevent free tier pausing with automated health checks.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Supapulse - Database Sync & Keep-Alive",
    description: "Keep your Supabase databases alive and in sync.",
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/logo.svg",
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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

