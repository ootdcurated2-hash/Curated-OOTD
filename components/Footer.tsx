"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Sparkles, Heart, Coffee, Copy, Check, ExternalLink, X } from "lucide-react";

export default function Footer() {
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  // Dihitung di client setelah mount. `new Date()` saat prerender dianggap
  // unstable value oleh Cache Components dan menggagalkan static shell.
  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
    setMounted(true);
  }, []);

  // Kunci scroll saat modal terbuka agar user langsung fokus pada modal di viewport saat ini
  useEffect(() => {
    if (showDonateModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showDonateModal]);

  // Nomor rekening / e-wallet untuk donasi
  const donateAccounts: Record<
    "dana" | "gopay",
    {
      name: string;
      number: string;
      recipient: string;
      deeplink: string;
      fallback: string;
      color: string;
      appUrl?: string;
    }
  > = {
    dana: {
      name: "DANA",
      number: "089674935980",
      recipient: "My Curated OOTD Team",
      deeplink: "https://link.dana.id",
      fallback: "https://dana.id",
      color: "bg-blue-500 hover:bg-blue-600 text-white",
    },
    gopay: {
      name: "GoPay",
      number: "089674935980",
      recipient: "My Curated OOTD Team",
      deeplink: "https://link.gopay.co.id",
      fallback: "https://gopay.co.id",
      appUrl: "gojek://gopay/transfer",
      color: "bg-emerald-600 hover:bg-emerald-700 text-white",
    },
  };

  const handleCopy = (type: "dana" | "gopay", number: string) => {
    navigator.clipboard.writeText(number);
    setCopiedAccount(type);
    setTimeout(() => {
      setCopiedAccount(null);
    }, 2000);
  };

  const handleOpenApp = (type: "dana" | "gopay") => {
    const acc = donateAccounts[type];
    // Salin nomornya terlebih dahulu
    navigator.clipboard.writeText(acc.number);
    setCopiedAccount(type);

    if (type === "gopay") {
      // Coba buka scheme app GoPay / Gojek, lalu fallback ke URL resmi GoPay
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile) {
        window.location.href = acc.appUrl || acc.deeplink;
        setTimeout(() => {
          window.open(acc.fallback, "_blank");
        }, 1500);
      } else {
        window.open(acc.fallback, "_blank");
      }
    } else {
      window.open(acc.deeplink, "_blank");
    }
  };

  const socialLinks = [
    {
      name: "Gmail / Email",
      href: "mailto:ootdcurated@gmail.com",
      label: "ootdcurated@gmail.com",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
        </svg>
      ),
      color: "hover:text-red-500 hover:border-red-500/40",
    },
    {
      name: "WhatsApp",
      href: "https://wa.me/62895326595608?text=Halo%20Curated%20OOTD,%20saya%20tertarik%20dengan%20koleksi%20outfit%20Anda",
      label: "Chat WhatsApp",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.13 7.39C8.94 7.39 8.63 7.46 8.37 7.74C8.11 8.03 7.37 8.72 7.37 10.13C7.37 11.54 8.4 12.9 8.54 13.1C8.68 13.29 10.53 16.15 13.43 17.4C14.12 17.7 14.66 17.88 15.08 18.01C15.78 18.24 16.42 18.21 16.92 18.13C17.48 18.05 18.64 17.43 18.88 16.74C19.12 16.06 19.12 15.47 19.05 15.35C18.98 15.23 18.79 15.16 18.51 15.03C18.23 14.89 16.86 14.21 16.6 14.12C16.35 14.03 16.16 13.98 15.98 14.26C15.79 14.54 15.26 15.16 15.1 15.35C14.94 15.54 14.78 15.56 14.5 15.42C14.22 15.28 13.33 14.99 12.27 14.05C11.45 13.31 10.89 12.41 10.73 12.13C10.57 11.85 10.71 11.7 10.85 11.56C10.98 11.43 11.14 11.22 11.28 11.06C11.42 10.9 11.47 10.78 11.56 10.6C11.65 10.41 11.61 10.25 11.54 10.11C11.47 9.97 10.91 8.6 10.68 8.04C10.45 7.5 10.22 7.58 10.05 7.57C9.9 7.57 9.71 7.57 9.53 7.57C9.34 7.57 9.13 7.39 9.13 7.39Z" />
        </svg>
      ),
      color: "hover:text-emerald-500 hover:border-emerald-500/40",
    },
    {
      name: "Instagram",
      href: "https://www.instagram.com/mycuratedootd?xtok=MW9zcWNpbnl3eDIxdQ==",
      label: "@mycuratedootd",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
      color: "hover:text-pink-500 hover:border-pink-500/40",
    },
    {
      name: "TikTok",
      href: "https://www.tiktok.com/@curatedootd10",
      label: "@curatedootd10",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      ),
      color: "hover:text-cyan-400 hover:border-cyan-400/40",
    },
  ];

  return (
    <>
      <footer className="w-full border-t border-border/80 bg-white/80 backdrop-blur-xl relative">
        {/* Delicate warm rose accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="container max-w-7xl pt-10 sm:pt-16 pb-28 sm:pb-16 px-4 sm:px-8">
          <div className="flex flex-col items-center justify-center gap-8 sm:gap-12 pb-8 sm:pb-12 border-b border-border">
            {/* Logo & Deskripsi + Social Icons */}
            <div className="text-center space-y-4 max-w-xl w-full">
              <Link href="/" className="inline-flex items-center justify-center gap-3 group">
                <div className="icon-3d h-14 w-14 rounded-2xl border border-border bg-white p-2 shadow-cartoon-sm transition-all duration-300 group-hover:rotate-6 group-hover:scale-110">
                  <img
                    src="/logo-icon.png"
                    alt="Curated OOTD Logo"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="flex flex-col text-left">
                  <div className="text-2xl font-black tracking-tighter font-nunito leading-none text-foreground">
                    <span>My Curated</span>
                    <span className="text-primary ml-1">OOTD</span>
                  </div>
                  <span className="text-[10px] text-foreground/60 font-black uppercase tracking-widest mt-1">
                    Pakaian Pilihan • Gaya Lebih Baik
                  </span>
                </div>
              </Link>
              <p className="text-sm font-bold text-foreground/60 leading-relaxed">
                Inspirasi koleksi outfit kurasi harian dengan hotspot interaktif untuk belanja langsung dari marketplace pilihan.
              </p>
              {/* Social Icon Circles */}
              <div className="flex items-center justify-center gap-3 pt-1">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.name}
                    title={social.label}
                    className={`flex items-center justify-center h-10 w-10 rounded-full border border-border bg-white shadow-cartoon-sm text-foreground/60 transition-all duration-200 hover:scale-110 hover:shadow-cartoon ${social.color}`}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Section Menu Footer: Tentang Kami, Informasi, Kontak */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8 sm:py-12 border-b border-border/80">
            {/* Kolom 1: Tentang Kami */}
            <div className="space-y-3">
              <h4 className="text-sm sm:text-base font-black font-nunito text-foreground tracking-tight">
                Tentang Kami
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm font-semibold text-foreground/70">
                <li>
                  <Link href="/about" className="hover:text-primary transition-colors">
                    Tentang
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-primary transition-colors">
                    Blog & Artikel
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-primary transition-colors">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Kolom 2: Informasi */}
            <div className="space-y-3">
              <h4 className="text-sm sm:text-base font-black font-nunito text-foreground tracking-tight">
                Informasi
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm font-semibold text-foreground/70">
                <li>
                  <Link href="/help" className="hover:text-primary transition-colors">
                    Pusat Bantuan
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-primary transition-colors">
                    Syarat & Ketentuan
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-primary transition-colors">
                    Privasi
                  </Link>
                </li>
              </ul>
            </div>

            {/* Kolom 3: Kontak Langsung */}
            <div className="space-y-3">
              <h4 className="text-sm sm:text-base font-black font-nunito text-foreground tracking-tight">
                Hubungi Kami
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm font-semibold text-foreground/70">
                <li>
                  <a
                    href="mailto:ootdcurated@gmail.com"
                    className="inline-flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    <svg className="h-4 w-4 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                    <span>ootdcurated@gmail.com</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://wa.me/62895326595608"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 hover:text-emerald-600 transition-colors"
                  >
                    <svg className="h-4 w-4 text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.13 7.39C8.94 7.39 8.63 7.46 8.37 7.74C8.11 8.03 7.37 8.72 7.37 10.13C7.37 11.54 8.4 12.9 8.54 13.1C8.68 13.29 10.53 16.15 13.43 17.4C14.12 17.7 14.66 17.88 15.08 18.01C15.78 18.24 16.42 18.21 16.92 18.13C17.48 18.05 18.64 17.43 18.88 16.74C19.12 16.06 19.12 15.47 19.05 15.35C18.98 15.23 18.79 15.16 18.51 15.03C18.23 14.89 16.86 14.21 16.6 14.12C16.35 14.03 16.16 13.98 15.98 14.26C15.79 14.54 15.26 15.16 15.1 15.35C14.94 15.54 14.78 15.56 14.5 15.42C14.22 15.28 13.33 14.99 12.27 14.05C11.45 13.31 10.89 12.41 10.73 12.13C10.57 11.85 10.71 11.7 10.85 11.56C10.98 11.43 11.14 11.22 11.28 11.06C11.42 10.9 11.47 10.78 11.56 10.6C11.65 10.41 11.61 10.25 11.54 10.11C11.47 9.97 10.91 8.6 10.68 8.04C10.45 7.5 10.22 7.58 10.05 7.57C9.9 7.57 9.71 7.57 9.53 7.57C9.34 7.57 9.13 7.39 9.13 7.39Z" />
                    </svg>
                    <span>0895326595608</span>
                  </a>
                </li>
              </ul>
              {/* Tombol Dukung Kami */}
              <button
                type="button"
                onClick={() => setShowDonateModal(true)}
                className="mt-2 inline-flex items-center gap-2 rounded-full border border-border bg-primary px-4 py-2 text-xs font-black text-white shadow-cartoon-sm hover:scale-105 hover:shadow-cartoon transition-all"
              >
                <Coffee className="h-4 w-4" />
                <span>Dukung / Sawer Kami</span>
              </button>
            </div>
          </div>

          {/* Copyright & Info Pembuat */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 text-xs sm:text-sm font-semibold text-foreground/70 text-center sm:text-left pb-4 sm:pb-0">
            <p>© <span suppressHydrationWarning>{currentYear || "2026"}</span> My Curated OOTD. All Rights Reserved.</p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-foreground/70">
              <Link href="/privacy" className="hover:text-primary transition-colors">
                Privasi
              </Link>
              <span>•</span>
              <Link href="/terms" className="hover:text-primary transition-colors">
                Syarat & Ketentuan
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal / Dialog Fitur Dukung (DANA & GoPay) yang di-render langsung ke body via Portal */}
      {showDonateModal && mounted && typeof document !== "undefined" && createPortal(
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDonateModal(false);
          }}
        >
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[2.5rem] border border-white/20 bg-white/95 backdrop-blur-2xl p-6 sm:p-8 shadow-cartoon-lg space-y-6 sm:space-y-8 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowDonateModal(false)}
              className="absolute right-5 top-5 sm:right-6 sm:top-6 rounded-full p-2.5 text-foreground/40 hover:bg-foreground/5 hover:text-foreground transition-all"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="text-center space-y-3">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-cartoon-sm">
                <Coffee className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-black tracking-tighter text-foreground font-nunito">Dukung My Curated OOTD</h3>
              <p className="text-sm font-bold text-foreground/50 text-balance">
                Dukungan Anda sangat berarti untuk membantu kami terus menyajikan inspirasi fashion outfit terbaik.
              </p>
            </div>

            <div className="space-y-4 sm:space-y-6">
              {/* Opsi DANA */}
              <div className="rounded-[2rem] border border-blue-500/20 bg-blue-500/5 p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-blue-500 text-white font-black text-[10px] tracking-widest">
                      DANA
                    </span>
                    <span className="text-sm font-black text-foreground">{donateAccounts.dana.recipient}</span>
                  </div>
                  <button
                    onClick={() => handleCopy("dana", donateAccounts.dana.number)}
                    className="inline-flex items-center gap-2 text-xs font-black text-blue-500 hover:text-blue-600 transition-colors"
                  >
                    {copiedAccount === "dana" ? (
                      <>
                        <Check className="h-4 w-4" /> Disalin
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" /> Salin Nomor
                      </>
                    )}
                  </button>
                </div>
                <div className="text-xl font-black tracking-widest text-foreground font-mono">
                  {donateAccounts.dana.number}
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenApp("dana")}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full py-3 text-xs font-black bg-blue-500 hover:bg-blue-600 text-white transition-all shadow-cartoon-sm hover:scale-[1.02]"
                >
                  Buka Aplikasi DANA <ExternalLink className="h-4 w-4" />
                </button>
              </div>

              {/* Opsi GoPay */}
              <div className="rounded-[2rem] border border-emerald-500/20 bg-emerald-500/5 p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-black text-[10px] tracking-widest">
                      GOPAY
                    </span>
                    <span className="text-sm font-black text-foreground">{donateAccounts.gopay.recipient}</span>
                  </div>
                  <button
                    onClick={() => handleCopy("gopay", donateAccounts.gopay.number)}
                    className="inline-flex items-center gap-2 text-xs font-black text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    {copiedAccount === "gopay" ? (
                      <>
                        <Check className="h-4 w-4" /> Disalin
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" /> Salin Nomor
                      </>
                    )}
                  </button>
                </div>
                <div className="text-xl font-black tracking-widest text-foreground font-mono">
                  {donateAccounts.gopay.number}
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenApp("gopay")}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full py-3 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-cartoon-sm hover:scale-[1.02]"
                >
                  Buka Aplikasi GoPay <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>

            <p className="text-[10px] text-center font-bold text-foreground/40 uppercase tracking-widest">
              Nomor akan otomatis tersalin ke clipboard saat Anda menekan tombol buka aplikasi
            </p>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
