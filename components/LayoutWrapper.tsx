"use client";

import { usePathname } from "next/navigation";
import Scene3DDecor from "@/components/Scene3DDecor";

interface LayoutWrapperProps {
  children: React.ReactNode;
  navbar: React.ReactNode;
  footer: React.ReactNode;
}

export default function LayoutWrapper({
  children,
  navbar,
  footer,
}: LayoutWrapperProps) {
  const pathname = usePathname();
  
  // Sembunyikan Navbar dan Footer di halaman auth dan admin agar lebih professional dan fokus
  const isAuthPage = pathname?.startsWith("/auth");
  const isAdminPage = pathname?.startsWith("/admin");

  if (isAuthPage || isAdminPage) {
    return (
      <div className="relative flex-1 flex flex-col w-full depth-root">
        <Scene3DDecor />
        <div className="relative z-[1] flex-1 flex flex-col w-full">{children}</div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 flex flex-col w-full depth-root">
      <Scene3DDecor />
      {navbar}
      <div className="relative z-[1] flex-1 w-full pb-20 md:pb-0">{children}</div>
      {footer}
    </div>
  );
}
