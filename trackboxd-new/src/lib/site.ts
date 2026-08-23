/**
 * Canonical origin for the site.
 *
 * The deployment redirects the apex domain to `www`, so every canonical tag,
 * sitemap entry and schema URL must use `www` — pointing them at the apex
 * makes each one a redirect hop and splits the crawler's view of the site.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL || 'https://www.trackboxd.com'
).replace(/\/$/, '');

export const absoluteUrl = (path: string) =>
  `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
