const DEFAULT_API_BASE_URL = 'http://localhost:3000/api/v1';

export const publicEnv = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_BASE_URL,
  clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '',
  signInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? '/sign-in',
  signUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? '/sign-up'
} as const;

export const isClerkConfigured = publicEnv.clerkPublishableKey.length > 0;
