// Shared
import { BaseRepository } from '@/shared/repository';
import { DEFAULT_PLANS, PLAN_CODES } from '@/shared/constants/billing';
import { NotFoundError } from '@/shared/errors/errors';

// Types
import type { PlanRepositoryPort } from '../ports';
import type { DataSource } from 'typeorm';
import { PlanEntity } from '../entity';
import type { PlanCode } from '@/shared/types/billing';

export class PlanRepository
  extends BaseRepository<PlanEntity>
  implements PlanRepositoryPort
{
  constructor(dataSource: DataSource) {
    super(dataSource, PlanEntity);
  }

  async ensureDefaults(): Promise<void> {
    for (const plan of DEFAULT_PLANS) {
      const existing = await this.findByCode(plan.code);

      if (!existing) {
        await this.repo.save(this.repo.create(plan));
      }
    }
  }

  async findByCode(code: PlanCode): Promise<PlanEntity | null> {
    return await this.repo.findOne({
      where: { code }
    });
  }

  async getFreePlan(): Promise<PlanEntity> {
    await this.ensureDefaults();
    const freePlan = await this.findByCode(PLAN_CODES.FREE);

    if (!freePlan) {
      throw new NotFoundError('Free plan not found');
    }

    return freePlan;
  }

  async getProPlan(): Promise<PlanEntity> {
    await this.ensureDefaults();
    const proPlan = await this.findByCode(PLAN_CODES.PRO);

    if (!proPlan) {
      throw new NotFoundError('Pro plan not found');
    }

    return proPlan;
  }
}
