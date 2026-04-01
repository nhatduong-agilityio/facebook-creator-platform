export const PLAN_CODES = {
  FREE: 'free',
  PRO: 'pro'
} as const;

export const DEFAULT_PLANS = [
  {
    code: PLAN_CODES.FREE,
    name: 'Free',
    description: 'Basic creator workflow for small pages.',
    monthlyPrice: 0,
    postLimit: 10,
    scheduledLimit: 3
  },
  {
    code: PLAN_CODES.PRO,
    name: 'Pro',
    description: 'Unlimited publishing and analytics for growing teams.',
    monthlyPrice: 1900,
    postLimit: -1,
    scheduledLimit: -1
  }
];
