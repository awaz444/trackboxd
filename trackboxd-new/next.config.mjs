/** @type {import('next').NextConfig} */
const nextConfig = {
    // Send PostHog traffic through our own domain so ad blockers and Safari's
    // tracker blocking don't drop events (signup_completed is what the SEO
    // agent measures). See src/lib/analytics.ts.
    async rewrites() {
        return [
            {
                source: '/ingest/static/:path*',
                destination: 'https://us-assets.i.posthog.com/static/:path*',
            },
            {
                source: '/ingest/:path*',
                destination: 'https://us.i.posthog.com/:path*',
            },
        ];
    },
    // PostHog API paths end in a trailing slash; don't redirect them.
    skipTrailingSlashRedirect: true,
    async headers() {
        return [
            {
                source: '/sw.js',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
