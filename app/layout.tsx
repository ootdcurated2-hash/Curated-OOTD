import type { Metadata } from "next";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LayoutWrapper from "@/components/LayoutWrapper";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

const defaultUrl = getSiteUrl();

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "My Curated OOTD - Temukan Inspirasi Outfit & Belanja Produk",
  description: "Kurasi koleksi outfit harian dengan hotspot interaktif untuk belanja produk fashion",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/logo-icon.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  verification: {
    google: "google20edaadf71d53857",
  },
};

import { Nunito, Plus_Jakarta_Sans } from "next/font/google";

const nunito = Nunito({
  variable: "--font-nunito",
  display: "swap",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  display: "swap",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

import InstallPwaPrompt from "@/components/InstallPwaPrompt";
import SplashScreen from "@/components/SplashScreen";
import WishlistToast from "@/components/WishlistToast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${nunito.variable} ${jakarta.variable} ${jakarta.className} antialiased min-h-screen flex flex-col bg-background text-foreground`}>
        <SplashScreen />
        <LayoutWrapper
          navbar={
            <Suspense fallback={<div className="h-[72px] w-full border-b border-border bg-white/60 backdrop-blur-xl" />}>
              <Navbar />
            </Suspense>
          }
          footer={<Footer />}
        >
          {children}
        </LayoutWrapper>
        <InstallPwaPrompt />
        <WishlistToast />
      </body>
    </html>
  );
}
