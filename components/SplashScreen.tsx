"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

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
      {/* ── Background Ambient Glow & Floating 3D Orbs ── */}
      <div
        className="absolute w-[520px] h-[520px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(255,79,168,0.22) 0%, rgba(255,182,193,0.08) 55%, transparent 75%)",
          filter: "blur(50px)",
          animation: "orbFloat 6s ease-in-out infinite alternate",
        }}
      />
      
      {/* Floating 3D Geometric Ring 1 */}
      <div
        className="absolute w-80 h-80 rounded-full border-[1.5px] border-primary/20 pointer-events-none"
        style={{
          animation: "rotate3dRing 14s linear infinite",
          transformStyle: "preserve-3d",
        }}
      />
      {/* Floating 3D Geometric Ring 2 */}
      <div
        className="absolute w-[420px] h-[420px] rounded-full border border-pink-400/15 pointer-events-none"
        style={{
          animation: "rotate3dRingReverse 18s linear infinite",
          transformStyle: "preserve-3d",
        }}
      />

      {/* ── Konten Utama dengan Perspektif 3D ── */}
      <div
        className="relative z-10 flex flex-col items-center gap-6 px-6"
        style={{
          transformStyle: "preserve-3d",
          animation: "splashFloatCard 4s ease-in-out infinite",
        }}
      >
        {/* 3D Floating Badge Container */}
        <div
          className="relative group"
          style={{
            transformStyle: "preserve-3d",
            animation: "entrance3D 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) both",
          }}
        >
          {/* Layer Bayangan 3D Bawah */}
          <div
            className="absolute -inset-3 rounded-[2.8rem] bg-gradient-to-r from-primary/35 to-rose-400/35 blur-2xl opacity-75"
            style={{
              transform: "translateZ(-40px) translateY(16px) scale(0.92)",
              animation: "shadowPulse 3s ease-in-out infinite alternate",
            }}
          />

          {/* Kartu 3D Utama Logo */}
          <div
            className="relative flex h-32 w-32 sm:h-36 sm:w-36 items-center justify-center rounded-[2.5rem] border border-white/90 bg-gradient-to-b from-white via-pink-50/90 to-rose-50/80 p-5 shadow-[0_24px_60px_rgba(255,79,168,0.28),0_10px_24px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,0.95)] backdrop-blur-2xl"
            style={{
              transformStyle: "preserve-3d",
              transform: "translateZ(30px)",
            }}
          >
            {/* Inner Glare Effect */}
            <div className="absolute inset-0 rounded-[2.4rem] bg-gradient-to-tr from-white/60 via-transparent to-transparent pointer-events-none" />

            {/* Logo Image dengan Efek Pop-out 3D */}
            <div
              className="relative w-full h-full flex items-center justify-center"
              style={{
                transform: "translateZ(45px)",
                filter: "drop-shadow(0 14px 24px rgba(255,79,168,0.25))",
              }}
            >
              <img
                src="/icon-512-transparent.png"
                alt="My Curated OOTD Logo"
                className="w-full h-full object-contain select-none"
                style={{
                  animation: "logoPop 3s ease-in-out infinite alternate",
                }}
              />
            </div>

            {/* Badge Aksen Sparkle Pojok */}
            <div
              className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-rose-500 text-white shadow-cartoon-sm border-2 border-white"
              style={{
                transform: "translateZ(60px)",
                animation: "sparkleBob 2.5s ease-in-out infinite alternate",
              }}
            >
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Teks Judul & Subtitle */}
        <div
          className="flex flex-col items-center text-center space-y-2.5 pt-2"
          style={{
            transformStyle: "preserve-3d",
            transform: "translateZ(25px)",
            animation: "textSlideUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) 0.15s both",
          }}
        >
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-[10px] font-black text-primary uppercase tracking-widest backdrop-blur-md shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Fashion Daily Curation
          </div>

          <h1 className="text-3xl sm:text-4xl font-black font-nunito tracking-tight text-foreground leading-none">
            My{" "}
            <span className="bg-gradient-to-r from-primary via-pink-500 to-rose-500 bg-clip-text text-transparent">
              Curated
            </span>{" "}
            OOTD
          </h1>

          <p className="text-xs sm:text-sm font-bold text-foreground/60 tracking-wide max-w-xs">
            Pakaian Pilihan • Gaya Lebih Baik Setiap Hari
          </p>
        </div>

        {/* 3D Progress Bar / Indicator */}
        <div
          className="w-44 sm:w-52 h-2 rounded-full bg-pink-200/70 p-0.5 overflow-hidden shadow-inner backdrop-blur-md mt-1"
          style={{
            transform: "translateZ(15px)",
            animation: "textSlideUp 0.8s ease 0.3s both",
          }}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary via-pink-500 to-rose-400 shadow-[0_0_12px_rgba(255,107,157,0.8)]"
            style={{
              animation: "splashLoadProgress 2s cubic-bezier(0.65, 0, 0.35, 1) forwards",
            }}
          />
        </div>
      </div>

      {/* Footer Branding Kecil */}
      <div
        className="absolute bottom-6 flex items-center gap-2 text-center text-[11px] font-bold text-foreground/40 tracking-wider uppercase"
        style={{
          animation: "textSlideUp 0.8s ease 0.5s both",
        }}
      >
        <span>Outfit of the Day</span>
        <span className="text-primary">•</span>
        <span>Curated for You</span>
      </div>

      <style>{`
        @keyframes entrance3D {
          0% {
            opacity: 0;
            transform: perspective(1000px) rotateX(30deg) translateY(40px) scale(0.7);
          }
          100% {
            opacity: 1;
            transform: perspective(1000px) rotateX(0deg) translateY(0) scale(1);
          }
        }
        @keyframes splashFloatCard {
          0%, 100% {
            transform: translateY(0px) rotateX(0deg) rotateY(0deg);
          }
          50% {
            transform: translateY(-8px) rotateX(4deg) rotateY(-4deg);
          }
        }
        @keyframes logoPop {
          0% {
            transform: translateZ(45px) scale(1);
          }
          100% {
            transform: translateZ(55px) scale(1.06);
          }
        }
        @keyframes shadowPulse {
          0% {
            opacity: 0.5;
            transform: translateZ(-40px) translateY(14px) scale(0.85);
          }
          100% {
            opacity: 0.85;
            transform: translateZ(-40px) translateY(22px) scale(1.02);
          }
        }
        @keyframes rotate3dRing {
          0% {
            transform: rotateX(65deg) rotateY(25deg) rotateZ(0deg);
          }
          100% {
            transform: rotateX(65deg) rotateY(25deg) rotateZ(360deg);
          }
        }
        @keyframes rotate3dRingReverse {
          0% {
            transform: rotateX(60deg) rotateY(-30deg) rotateZ(360deg);
          }
          100% {
            transform: rotateX(60deg) rotateY(-30deg) rotateZ(0deg);
          }
        }
        @keyframes orbFloat {
          0% {
            transform: translate(-10%, -10%) scale(1);
          }
          100% {
            transform: translate(10%, 10%) scale(1.2);
          }
        }
        @keyframes textSlideUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes sparkleBob {
          0% {
            transform: translateZ(60px) rotate(0deg) scale(1);
          }
          100% {
            transform: translateZ(65px) rotate(15deg) scale(1.15);
          }
        }
        @keyframes splashLoadProgress {
          0% {
            width: 0%;
          }
          40% {
            width: 65%;
          }
          85% {
            width: 90%;
          }
          100% {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
