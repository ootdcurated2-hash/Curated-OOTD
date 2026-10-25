"use client";

import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // ── Bersihkan elemen Netlify preview bar ──────────────────────────────
    function purgeNetlify() {
      const els = document.querySelectorAll(
        'netlify-drawer, #netlify-drawer, iframe[src*="netlify"], [data-netlify-drawer], [data-netlify-deploy-preview]'
      );
      els.forEach((el) => el.remove());
    }
    purgeNetlify();
    const observer = new MutationObserver(purgeNetlify);
    observer.observe(document.documentElement, { childList: true, subtree: true });

    // ── Splash Screen — hanya di mode PWA standalone ─────────────────────
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (!isStandalone) return () => observer.disconnect();

    // Cegah splash muncul ulang di sesi yang sama
    const shown = sessionStorage.getItem("splash_shown");
    if (shown) return () => observer.disconnect();

    sessionStorage.setItem("splash_shown", "1");
    setVisible(true);

    // Mulai fade-out setelah 2.4 detik
    const fadeTimer = setTimeout(() => setFadeOut(true), 2400);
    // Benar-benar hapus dari DOM setelah animasi selesai
    const removeTimer = setTimeout(() => setVisible(false), 3000);

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
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(145deg, #fff0f5 0%, #fff6fb 40%, #fce4ec 100%)",
        transition: "opacity 0.6s ease",
        opacity: fadeOut ? 0 : 1,
        pointerEvents: fadeOut ? "none" : "auto",
      }}
    >
      {/* Blob latar dekoratif */}
      <div style={{
        position: "absolute",
        top: "-80px",
        left: "-80px",
        width: "320px",
        height: "320px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,105,155,0.18) 0%, transparent 70%)",
        animation: "splashPulse 3s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute",
        bottom: "-60px",
        right: "-60px",
        width: "280px",
        height: "280px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,160,190,0.15) 0%, transparent 70%)",
        animation: "splashPulse 3s ease-in-out infinite 1.5s",
      }} />
      <div style={{
        position: "absolute",
        top: "30%",
        right: "10%",
        width: "160px",
        height: "160px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,182,193,0.12) 0%, transparent 70%)",
        animation: "splashPulse 4s ease-in-out infinite 0.8s",
      }} />

      {/* Kartu logo utama */}
      <div style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "28px",
        animation: "splashFadeUp 0.7s cubic-bezier(0.34,1.56,0.64,1) both",
      }}>
        {/* Lingkaran glow di belakang logo */}
        <div style={{
          position: "absolute",
          width: "160px",
          height: "160px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,105,155,0.25) 0%, transparent 70%)",
          animation: "splashPulse 2.5s ease-in-out infinite",
          top: "-20px",
        }} />

        {/* Logo container */}
        <div style={{
          position: "relative",
          width: "110px",
          height: "110px",
          borderRadius: "28px",
          background: "linear-gradient(135deg, #fff 60%, #ffe0ee 100%)",
          boxShadow: "0 12px 48px rgba(255,80,130,0.22), 0 2px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "splashBounce 0.9s cubic-bezier(0.34,1.56,0.64,1) 0.1s both",
          border: "1.5px solid rgba(255,105,155,0.15)",
        }}>
          {/* Ring animasi di sekitar logo */}
          <div style={{
            position: "absolute",
            inset: "-10px",
            borderRadius: "38px",
            border: "2px solid rgba(255,105,155,0.2)",
            animation: "splashRingPop 2.5s ease-in-out infinite",
          }} />
          <div style={{
            position: "absolute",
            inset: "-20px",
            borderRadius: "48px",
            border: "1.5px solid rgba(255,105,155,0.1)",
            animation: "splashRingPop 2.5s ease-in-out infinite 0.4s",
          }} />

          <img
            src="/icon-512-transparent.png"
            alt="My Curated OOTD"
            style={{
              width: "68px",
              height: "68px",
              objectFit: "contain",
              filter: "drop-shadow(0 4px 12px rgba(255,80,130,0.2))",
            }}
          />
        </div>

        {/* Teks nama aplikasi */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          animation: "splashFadeUp 0.7s ease 0.3s both",
        }}>
          <h1 style={{
            margin: 0,
            fontFamily: "var(--font-nunito), Nunito, sans-serif",
            fontWeight: 900,
            fontSize: "clamp(22px, 5vw, 28px)",
            letterSpacing: "-0.5px",
            color: "#1a1a2e",
            lineHeight: 1.1,
            textAlign: "center",
          }}>
            My{" "}
            <span style={{
              background: "linear-gradient(135deg, #ff6b9d, #ff4d8d, #e91e8c)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>Curated</span>
            {" "}OOTD
          </h1>
          <p style={{
            margin: 0,
            fontFamily: "var(--font-nunito), Nunito, sans-serif",
            fontWeight: 700,
            fontSize: "12px",
            color: "#888",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            textAlign: "center",
          }}>
            Outfit of the Day ✨
          </p>
        </div>

        {/* Loading dots */}
        <div style={{
          display: "flex",
          gap: "8px",
          marginTop: "4px",
          animation: "splashFadeUp 0.7s ease 0.5s both",
        }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #ff6b9d, #e91e8c)",
                animation: `splashDot 1.2s ease-in-out infinite ${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Tagline bawah */}
      <p style={{
        position: "absolute",
        bottom: "40px",
        margin: 0,
        fontFamily: "var(--font-nunito), Nunito, sans-serif",
        fontWeight: 600,
        fontSize: "11px",
        color: "rgba(0,0,0,0.3)",
        letterSpacing: "0.06em",
        animation: "splashFadeUp 0.7s ease 0.7s both",
        textAlign: "center",
      }}>
        Temukan Inspirasi Outfit Terbaikmu
      </p>

      <style>{`
        @keyframes splashFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes splashBounce {
          from { opacity: 0; transform: scale(0.5); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes splashPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.15); opacity: 0.7; }
        }
        @keyframes splashRingPop {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50%       { transform: scale(1.08); opacity: 0.2; }
        }
        @keyframes splashDot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%            { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
