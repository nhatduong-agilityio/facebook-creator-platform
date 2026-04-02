import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

function getStripeSecretKey(): string {
  const secretKey = process.env.STRIPE_SECRET_KEY as string;

  if (!secretKey) {
    throw new Error('Missing Stripe secret key');
  }

  return secretKey;
}

export function getStripeClient(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(getStripeSecretKey(), {
      apiVersion: '2026-03-25.dahlia'
    });
  }

  return stripeClient;
}
