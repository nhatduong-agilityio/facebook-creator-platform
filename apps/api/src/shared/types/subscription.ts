import type { SUBSCRIPTION_STATUSES } from '../constants/subscription';

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];
