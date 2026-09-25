import posthog from 'posthog-js';

/**
 * Product analytics (PostHog). A no-op until NEXT_PUBLIC_POSTHOG_KEY is set,
 * so local dev and previews without the key send nothing.
 *
 * The SEO agent (../seo-agent) ties `signup_completed` back to the organic
 * landing page of the same session, so keep that event name stable.
 */
const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
let started = false;

export function initAnalytics() {
  if (started || !key || typeof window === 'undefined') return;
  posthog.init(key, {
    // Proxied through next.config.mjs rewrites (first-party, survives blockers).
    api_host: '/ingest',
    ui_host: 'https://us.posthog.com',
    capture_pageview: 'history_change',
    person_profiles: 'identified_only',
  });
  started = true;
}

export function track(event: string, properties?: Record<string, unknown>) {
  if (started) posthog.capture(event, properties);
}

export function identify(userId: string, properties?: Record<string, unknown>) {
  if (started) posthog.identify(userId, properties);
}
