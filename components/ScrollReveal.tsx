"use client";

import React, { useEffect, useRef } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  threshold?: number;
  rootMargin?: string;
}

export default function ScrollReveal({
  children,
  className = "",
  threshold = 0.1,
  rootMargin = "0px 0px -40px 0px",
}: ScrollRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // If intersection observer isn't supported, immediately show
    if (!("IntersectionObserver" in window)) {
      el.querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-scale").forEach((child) => {
        child.classList.add("is-visible");
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            // Once visible, don't observe again to preserve performance
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    // If the container itself has a reveal class
    if (
      el.classList.contains("reveal") ||
      el.classList.contains("reveal-left") ||
      el.classList.contains("reveal-right") ||
      el.classList.contains("reveal-scale")
    ) {
      observer.observe(el);
    }

    // Observe children with reveal classes
    const targets = el.querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-scale");
    targets.forEach((target) => observer.observe(target));

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
