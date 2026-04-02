import { getRedisConnection } from '@/config/redis';
import { Queue } from 'bullmq';

export type FetchMetricsJobData = {
  userId?: string;
  postId?: string;
};

let metricsQueue: Queue<FetchMetricsJobData> | null = null;

/**
 * Returns a BullMQ Queue instance for the 'fetch_metrics_job' queue.
 * The queue is used to process jobs that require fetching metrics data.
 * If the queue has not been initialized, it is created with a connection to Redis.
 * @returns {Queue<FetchMetricsJobData>} - the BullMQ Queue instance
 */
function getMetricsQueue(): Queue<FetchMetricsJobData> {
  if (!metricsQueue) {
    metricsQueue = new Queue<FetchMetricsJobData>('fetch_metrics_job', {
      connection: getRedisConnection()
    });
  }
  return metricsQueue;
}

/**
 * Enqueues a job to fetch metrics for a user or post.
 * If data.postId is provided, the job will fetch metrics for the given post.
 * If data.userId is provided, the job will fetch metrics for the given user.
 * If neither data.postId nor data.userId is provided, the job will fetch metrics for all users.
 * The job will be removed from the queue after 100 seconds regardless of whether it completes or fails.
 * @param {FetchMetricsJobData} data - the data to pass to the job
 * @returns {Promise<void>} - a promise that resolves to nothing
 */
export async function enqueueMetricsJob(
  data: FetchMetricsJobData
): Promise<void> {
  const jobId = data.postId
    ? `post-${data.postId}`
    : data.userId
      ? `user-${data.userId}`
      : `all:${Date.now()}`;

  await getMetricsQueue().add('fetch_metrics_job', data, {
    jobId,
    removeOnComplete: 100,
    removeOnFail: 100
  });
}
