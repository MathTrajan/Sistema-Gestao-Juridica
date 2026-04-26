import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ]
  },
}

// To enable Sentry error monitoring:
// 1. Run: npm install @sentry/nextjs
// 2. Set NEXT_PUBLIC_SENTRY_DSN in your environment variables
// 3. Uncomment the block below and remove the `export default nextConfig` line
//
// import { withSentryConfig } from '@sentry/nextjs'
// export default withSentryConfig(nextConfig, {
//   silent: !process.env.CI,
//   disableLogger: true,
//   tunnelRoute: '/monitoring',
//   autoInstrumentServerFunctions: true,
// })

export default nextConfig
