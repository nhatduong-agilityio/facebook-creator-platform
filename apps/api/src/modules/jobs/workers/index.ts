import { Worker } from 'bullmq';

// Modules
import { PostMetricRepository } from '@/modules/analytics/repository';
import { AnalyticsService } from '@/modules/analytics/service';
import { AuditLogRepository } from '@/modules/audit-logs/repository';
import { FacebookGraphProvider } from '@/modules/facebook/providers/facebook-graph-provider';
import { FacebookAccountRepository } from '@/modules/facebook/repository';
import { FacebookService } from '@/modules/facebook/service';
import { PostSchedulerProvider } from '@/modules/posts/providers/post-scheduler-provider';
import { PostRepository } from '@/modules/posts/repository';
import { PostService } from '@/modules/posts/service';
import { UserRepository } from '@/modules/users/repository';
import { PublishPostProcessor } from '../processors/publish-post-processor';
import { MetricsProcessor } from '../processors/metrics-processor';

// Config
import { getRedisConnection } from '@/config/redis';

// Types
import type { DataSource } from 'typeorm';
import type { PublishPostJobData } from '../queues/publish-post-queue';
import type { FetchMetricsJobData } from '../queues/metrics-queue';

export function startWorkers(dataSource: DataSource): () => Promise<void> {
  const auditLogRepo = new AuditLogRepository(dataSource);
  const userRepo = new UserRepository(dataSource);
  const accountRepo = new FacebookAccountRepository(dataSource);
  const postRepo = new PostRepository(dataSource);
  const metricRepo = new PostMetricRepository(dataSource);
  const facebookProvider = new FacebookGraphProvider();
  const postScheduler = new PostSchedulerProvider();

  const facebookService = new FacebookService(
    userRepo,
    accountRepo,
    auditLogRepo,
    facebookProvider
  );
  const postService = new PostService(
    userRepo,
    postRepo,
    facebookService,
    auditLogRepo,
    postScheduler
  );
  const analyticsService = new AnalyticsService(
    userRepo,
    postRepo,
    metricRepo,
    accountRepo,
    facebookService,
    auditLogRepo
  );

  const publishPostProcessor = new PublishPostProcessor(postService);
  const metricsProcessor = new MetricsProcessor(analyticsService);

  const publishWorker = new Worker<PublishPostJobData>(
    'publish_post_job',
    async job => await publishPostProcessor.handle(job),
    {
      connection: getRedisConnection()
    }
  );

  const metricsWorker = new Worker<FetchMetricsJobData>(
    'fetch_metrics_job',
    async job => await metricsProcessor.handle(job),
    {
      connection: getRedisConnection()
    }
  );

  publishWorker.on('failed', (job, error) => {
    console.error(
      `[Jobs] publish_post_job failed for ${job?.id ?? 'unknown'}: ${error.message}`
    );
  });

  metricsWorker.on('failed', (job, error) => {
    console.error(
      `[Jobs] fetch_metrics_job failed for ${job?.id ?? 'unknown'}: ${error.message}`
    );
  });

  return async () => {
    await Promise.all([publishWorker.close(), metricsWorker.close()]);
  };
}
