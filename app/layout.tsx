import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BookmarkProvider } from "@/lib/useBookmarks";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import PwaScript from "@/components/PwaScript";

const inter = Inter({ subsets: ["latin"] });

const AD_CLIENT = "ca-pub-5094484375937981";

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

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
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.svg", type: "image/svg+xml" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/icon.svg",
  },
  appleWebApp: {
    title: "Calcoder",
    statusBarStyle: "black-translucent",
    capable: true,
    startupImage: "/icon-512x512.png",
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
        <PwaInstallPrompt />
        <PwaScript />
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CLIENT}`}
        />
      </body>
    </html>
  );
}
