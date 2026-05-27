import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BookmarkProvider } from "@/lib/useBookmarks";

const inter = Inter({ subsets: ["latin"] });

const AD_CLIENT = "ca-pub-5094484375937981";

export const metadata: Metadata = {
  title: "Calcoder - Scalable Micro-Tools & Calculators",
  description: "A comprehensive suite of scalable micro-tools and calculators for finance, marketing, and developers.",
  verification: {
    google: "c-ExQOZ8CesTXRGsw1wo1dzRPy7AcpV_zdIZPAzNmVQ",
  },
  other: {
    "google-adsense-account": AD_CLIENT,
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.svg",
    shortcut: "/icon.svg",
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    title: "Calcoder",
    statusBarStyle: "default",
    capable: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col bg-background text-foreground antialiased`}>
        <BookmarkProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </BookmarkProvider>
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CLIENT}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
