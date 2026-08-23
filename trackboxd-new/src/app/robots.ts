import { MetadataRoute } from "next";
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_URL;

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/songs/", "/albums/", "/profile/", "/about", "/tracks/", "/annotations/", "/reviews/", "/api/share/"],
        disallow: ["/api/", "/settings/", "/notifications/", "/my-reviews", "/my-annotations", "/my-likes"],
      },
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "Claude-Web", allow: "/" },
      { userAgent: "anthropic-ai", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "Googlebot", allow: "/" },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
