// Blog utility types and helpers

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  author_name: string | null;
  tags: string[] | null;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function estimateReadingTime(content: string): number {
  const words = content.replace(/<[^>]+>/g, "").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

/**
 * Normalizes image URLs, specifically converting Pexels web page links
 * to direct CDN image URLs so they render properly in <img> tags.
 */
export function normalizeBlogImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  const trimmed = url.trim();
  // Match pexels.com/photo/...-12345/ or pexels.com/photo/12345/
  const pexelsMatch = trimmed.match(/pexels\.com\/photo\/(?:[^\/]+-)?(\d+)\/?/i);
  if (pexelsMatch && pexelsMatch[1]) {
    const id = pexelsMatch[1];
    return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1200`;
  }
  return trimmed;
}
