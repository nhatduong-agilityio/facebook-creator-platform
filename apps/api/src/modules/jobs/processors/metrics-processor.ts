import type { Job } from 'bullmq';
import type { AnalyticsService } from '@/modules/analytics/service';
import type { FetchMetricsJobData } from '../queues/metrics-queue';

export class MetricsProcessor {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Handles a job from the metrics queue.
   * If the job data contains a postId, refreshes the metrics for the given post.
   * If the job data contains a userId, refreshes the metrics for the given user.
   * If the job data contains neither a postId nor a userId, does nothing.
   * @param {Job<FetchMetricsJobData>} job - the job to handle
   * @returns {Promise<void>} - a promise that resolves to nothing
   */
  async handle(job: Job<FetchMetricsJobData>): Promise<void> {
    if (job.data.postId) {
      await this.analyticsService.refreshPostMetrics(job.data.postId);
      return;
    }

    if (job.data.userId) {
      await this.analyticsService.refreshUserMetrics(job.data.userId);
      return;
    }

    if (job.data.refreshAll) {
      await this.analyticsService.refreshAllMetrics();
    }
  }
}
