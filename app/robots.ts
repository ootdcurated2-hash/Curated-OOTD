import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      // File verifikasi Google Site Verification harus boleh diakses crawler.
      allow: [
        "/",
        "/google78e89bd93974faf4.html",
        "/google20edaadf71d53857.html",
      ],
      // Halaman privat / area admin tidak boleh diindeks.
      disallow: ["/admin", "/admin/", "/api/", "/auth/", "/protected"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
