import { Queue } from 'bullmq';
import { getRedisConnection } from '@/config/redis';

export type PublishPostJobData = {
  postId: string;
};

let publishPostQueue: Queue<PublishPostJobData> | null = null;

/**
 * Returns a BullMQ Queue instance for the 'publish_post_job' queue.
 * The queue is used to process jobs that require publishing a post.
 * If the queue has not been initialized, it is created with a connection to Redis.
 * @returns {Queue<PublishPostJobData>} - the BullMQ Queue instance
 */
function getPublishPostQueue(): Queue<PublishPostJobData> {
  if (!publishPostQueue) {
    publishPostQueue = new Queue<PublishPostJobData>('publish_post_job', {
      connection: getRedisConnection()
    });
  }
  return publishPostQueue;
}

/**
 * Enqueues a job to publish a post at a given date.
 * The job will be processed after the given date and will be removed from the queue after 100 seconds regardless of whether it completes or fails.
 * @param {PublishPostJobData} data - the data to pass to the job
 * @param {Date} scheduleAt - the date to schedule the job at
 * @returns {Promise<void>} - a promise that resolves to nothing
 */
export async function enqueuePublishPostJob(
  data: PublishPostJobData,
  scheduleAt: Date
): Promise<void> {
  const delay = Math.max(scheduleAt.getTime() - Date.now(), 0) + 1000; // Add 1 second to ensure job is processed after scheduleAt.getTime)
  const queue = getPublishPostQueue();
  const existingJob = await queue.getJob(data.postId);

  if (existingJob) {
    await existingJob.remove();
  }

  await queue.add('publish_post_job', data, {
    jobId: data.postId,
    delay,
    removeOnComplete: 100,
    removeOnFail: 100
  });
}
