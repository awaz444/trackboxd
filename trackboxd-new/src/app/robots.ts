import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://trackboxd.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/songs/", "/albums/", "/profile/", "/about", "/tracks/"],
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
