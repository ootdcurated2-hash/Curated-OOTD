"use client";

import { useEffect, useState } from "react";
import { MessageSquareQuote, ThumbsUp, ThumbsDown } from "lucide-react";
import { formatReviewDate } from "@/lib/reviews";
import type { BlogFeedback } from "@/lib/blogFeedback";

interface Props {
  slug: string;
}

export default function BlogFeedbackList({ slug }: Props) {
  const [items, setItems] = useState<BlogFeedback[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/blog/${slug}/feedback`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setItems(Array.isArray(data?.feedback) ? (data.feedback as BlogFeedback[]) : []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Jangan tampilkan apa pun bila memang belum ada catatan yang disetujui
  if (!loaded || items.length === 0) return null;

  return (
    <section className="mt-10" aria-labelledby="reader-notes-title">
      <h2
        id="reader-notes-title"
        className="flex items-center gap-2 text-sm sm:text-base font-black font-nunito tracking-tighter text-foreground"
      >
        <MessageSquareQuote className="h-4 w-4 text-primary" />
        Catatan Pembaca
        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-black text-muted-foreground">
          {items.length}
        </span>
      </h2>

      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-2xl border border-border bg-white/70 px-4 py-3.5 shadow-cartoon-sm"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-foreground truncate">
                {item.display_name || "Pembaca"}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black ${
                  item.vote === "like"
                    ? "border-primary/25 bg-primary/10 text-primary"
                    : "border-border bg-secondary text-foreground/70"
                }`}
                aria-label={item.vote === "like" ? "Suka artikel ini" : "Tidak suka artikel ini"}
              >
                {item.vote === "like" ? (
                  <ThumbsUp className="h-2.5 w-2.5" />
                ) : (
                  <ThumbsDown className="h-2.5 w-2.5" />
                )}
                {item.vote === "like" ? "Suka" : "Kurang suka"}
              </span>
              <span className="ml-auto shrink-0 text-[10px] font-bold text-muted-foreground">
                {formatReviewDate(item.created_at)}
              </span>
            </div>

            <p className="mt-2 text-xs font-semibold leading-relaxed text-foreground/80">
              {item.note}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
