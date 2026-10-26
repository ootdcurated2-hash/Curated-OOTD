"use client";

import React, { useEffect, useState } from "react";

interface NavbarClientWrapperProps {
  children: React.ReactNode;
}

export default function NavbarClientWrapper({ children }: NavbarClientWrapperProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 pt-[env(safe-area-inset-top,0px)] ${
        scrolled
          ? "bg-white/85 backdrop-blur-xl shadow-cartoon border-b border-border/80 py-0.5"
          : "bg-white/60 backdrop-blur-lg border-b border-border/50 py-0"
      }`}
    >
      {/* Delicate warm rose accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      {children}
    </header>
  );
}
