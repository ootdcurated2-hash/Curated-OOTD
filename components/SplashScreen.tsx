"use client";

import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Bersihkan elemen Netlify preview bar jika ada
    function purgeNetlify() {
      const els = document.querySelectorAll(
        'netlify-drawer, #netlify-drawer, iframe[src*="netlify"], [data-netlify-drawer], [data-netlify-deploy-preview]'
      );
      els.forEach((el) => el.remove());
    }
    purgeNetlify();
    const observer = new MutationObserver(purgeNetlify);
    observer.observe(document.documentElement, { childList: true, subtree: true });

    // Mode standalone (PWA) atau first load di browser
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    // Tampilkan pada mode standalone atau jika belum pernah ditampilkan pada session
    const shown = sessionStorage.getItem("splash_shown");
    
    // Aktifkan untuk standalone atau kunjungan pertama sesi ini
    if (!isStandalone && shown) {
      return () => observer.disconnect();
    }

    sessionStorage.setItem("splash_shown", "1");
    setVisible(true);

    // Animasi fade out setelah 2.2 detik
    const fadeTimer = setTimeout(() => setFadeOut(true), 2200);
    // Hapus dari DOM setelah 2.8 detik
    const removeTimer = setTimeout(() => setVisible(false), 2800);

    return () => {
      observer.disconnect();
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[999999] flex flex-col items-center justify-center overflow-hidden select-none"
      style={{
        background: "radial-gradient(ellipse at 50% 38%, #ffffff 0%, #fff4f8 50%, #ffe3ef 100%)",
        transition: "opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        opacity: fadeOut ? 0 : 1,
        transform: fadeOut ? "scale(1.04)" : "scale(1)",
        pointerEvents: fadeOut ? "none" : "auto",
        perspective: "1200px",
      }}
    >
      {/* ── Subtle Ambient Glow ── */}
      <div
        className="absolute w-96 h-96 rounded-full pointer-events-none opacity-60"
        style={{
          background: "radial-gradient(circle, rgba(232,74,120,0.18) 0%, rgba(251,240,243,0.05) 60%, transparent 80%)",
          filter: "blur(40px)",
        }}
      />

      {/* ── Konten Utama ── */}
      <div
        className="relative z-10 flex flex-col items-center gap-6 px-6"
        style={{
          animation: "splashCardEntrance 0.7s cubic-bezier(0.16, 1, 0.3, 1) both",
        }}
      >
        {/* Logo Card yang Bersih & Elegan */}
        <div className="relative">
          <div className="relative flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center rounded-3xl border border-white/80 bg-white/90 p-5 shadow-xl shadow-pink-500/10 backdrop-blur-xl">
            <img
              src="/icon-512-transparent.png"
              alt="My Curated OOTD Logo"
              className="w-full h-full object-contain select-none transition-transform duration-500"
            />
          </div>
        </div>

        {/* Brand Text & Slogan */}
        <div className="flex flex-col items-center text-center space-y-1.5 pt-1">
          <h1 className="text-2xl sm:text-3xl font-black font-nunito tracking-tight text-foreground leading-none">
            My{" "}
            <span className="text-primary">
              Curated
            </span>{" "}
            OOTD
          </h1>

          <p className="text-xs sm:text-sm font-semibold text-muted-foreground tracking-wide">
            Pakaian Pilihan • Gaya Lebih Baik Setiap Hari
          </p>
        </div>

        {/* Minimalist Progress Indicator */}
        <div className="w-36 sm:w-44 h-1.5 rounded-full bg-rose-100/80 overflow-hidden mt-2">
          <div
            className="h-full rounded-full bg-primary"
            style={{
              animation: "splashLoadProgress 1.9s cubic-bezier(0.65, 0, 0.35, 1) forwards",
            }}
          />
        </div>
      </div>

      {/* Clean Footer Branding */}
      <div className="absolute bottom-7 flex items-center gap-2 text-center text-[10px] font-bold text-foreground/40 tracking-widest uppercase">
        <span>Outfit of the Day</span>
        <span className="text-primary">•</span>
        <span>Curated for You</span>
      </div>

      <style>{`
        @keyframes splashCardEntrance {
          0% {
            opacity: 0;
            transform: translateY(16px) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes splashLoadProgress {
          0% {
            width: 0%;
          }
          45% {
            width: 70%;
          }
          85% {
            width: 92%;
          }
          100% {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
