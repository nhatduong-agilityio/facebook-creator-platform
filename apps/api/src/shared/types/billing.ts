import type { PLAN_CODES } from '../constants/billing';

export type PlanCode = (typeof PLAN_CODES)[keyof typeof PLAN_CODES];
