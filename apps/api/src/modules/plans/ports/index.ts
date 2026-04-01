import type { PlanCode } from '@/shared/types/billing';
import type { PlanEntity } from '../entity';

export interface PlanRepositoryPort {
  findById(id: string): Promise<PlanEntity | null>;
  ensureDefaults(): Promise<void>;
  findByCode(code: PlanCode): Promise<PlanEntity | null>;
  getFreePlan(): Promise<PlanEntity>;
  getProPlan(): Promise<PlanEntity>;
}
