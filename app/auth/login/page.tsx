import { LoginForm } from "@/components/login-form";

function sanitizeNext(next?: string): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <div className="relative flex min-h-[85vh] w-full items-center justify-center p-4 sm:p-6 md:p-10 overflow-hidden">
      {/* Decorative ambient color spots */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="animate-hero-entry relative w-full max-w-sm z-10">
        <LoginForm nextPath={sanitizeNext(next)} />
      </div>
    </div>
  );
}
