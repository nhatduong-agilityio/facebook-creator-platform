import type { NextConfig } from 'next';

function getOrigin(value?: string) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

const isDevelopment = process.env.NODE_ENV !== 'production';
const apiOrigin = getOrigin(process.env.NEXT_PUBLIC_API_URL);
const clerkSources = [
  'https://challenges.cloudflare.com',
  'https://*.clerk.com',
  'https://*.clerk.accounts.dev'
];

const connectSources = [
  "'self'",
  ...(apiOrigin ? [apiOrigin] : []),
  ...clerkSources,
  ...(isDevelopment
    ? ['http://localhost:3001', 'ws://localhost:3001', 'ws://127.0.0.1:3001']
    : [])
];

const mediaSources = [
  "'self'",
  'data:',
  'blob:',
  'https:',
  ...(apiOrigin ? [apiOrigin] : []),
  ...(isDevelopment ? ['http://localhost:3000', 'http://127.0.0.1:3000'] : [])
];

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${
    isDevelopment ? "'unsafe-eval' " : ''
  }${clerkSources.join(' ')}`.trim(),
  `style-src 'self' 'unsafe-inline'`,
  `img-src ${mediaSources.join(' ')}`,
  `media-src ${mediaSources.join(' ')}`,
  `font-src 'self' data:`,
  `connect-src ${connectSources.join(' ')}`,
  `frame-src ${clerkSources.join(' ')}`,
  `form-action 'self' ${clerkSources.join(' ')}`,
  `worker-src 'self' blob:`,
  `base-uri 'self'`,
  `frame-ancestors 'none'`,
  `object-src 'none'`
].join('; ');

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: contentSecurityPolicy
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin'
  },
  {
    key: 'Permissions-Policy',
    value:
      'camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=()'
  }
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders
      }
    ];
  }
};

export default nextConfig;
