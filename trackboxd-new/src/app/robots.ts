import { MetadataRoute } from "next";
import { SITE_URL } from '@/lib/site';

// Every page a bot fetches can cost server compute, and the site was paused in
// Nov 2026 for running out of it. So:
// - Search engines and AI answer engines (Googlebot, Bingbot, OAI-SearchBot,
//   ChatGPT-User, PerplexityBot, Claude-SearchBot...) follow the default rule.
//   They are how people find Trackboxd, so they keep full access to pages.
//   Do NOT give them their own group: a bot with its own group ignores the
//   default rule, which is how /api/ used to be open to them.
// - AI training crawlers only get the marketing pages, which say what
//   Trackboxd is, not the thousands of generated song/album/review pages.
// - SEO-tool and scraper bots that send no visitors are blocked outright.

const PRIVATE = ["/api/", "/settings/", "/notifications/", "/my-reviews", "/my-annotations", "/my-likes"];

const GENERATED = [
  "/songs/", "/albums/", "/reviews/", "/annotations/", "/profile/",
  "/journals/", "/playlists/", "/search", "/tracks", "/home", "/activity",
];

const AI_TRAINING_BOTS = [
  "GPTBot", "ClaudeBot", "anthropic-ai", "Claude-Web", "CCBot", "Google-Extended",
  "Applebot-Extended", "Meta-ExternalAgent", "Amazonbot", "cohere-ai", "Diffbot",
];

const NO_VALUE_BOTS = [
  "Bytespider", "AhrefsBot", "SemrushBot", "MJ12bot", "DotBot", "PetalBot",
  "DataForSeoBot", "BLEXBot", "ImagesiftBot", "omgili", "Timpibot",
];

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_URL;

  return {
    rules: [
      {
        userAgent: "*",
        // /api/share/ serves link-preview images for social apps.
        allow: ["/", "/api/share/"],
        disallow: PRIVATE,
      },
      {
        userAgent: AI_TRAINING_BOTS,
        allow: ["/$", "/about", "/letterboxd-for-music", "/alternatives", "/song-annotations"],
        disallow: [...PRIVATE, ...GENERATED],
      },
      { userAgent: NO_VALUE_BOTS, disallow: "/" },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
