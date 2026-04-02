import type { Job } from 'bullmq';
import type { PostService } from '@/modules/posts/service';
import type { PublishPostJobData } from '../queues/publish-post-queue';

export class PublishPostProcessor {
  constructor(private readonly postService: PostService) {}

  /**
   * Handles a job from the publish_post_job queue.
   * If the job is successful, marks the post as published.
   * If the job fails, marks the post as failed and re-throws the error.
   * @param {Job<PublishPostJobData>} job - the job to handle
   * @returns {Promise<void>} - a promise that resolves to nothing
   */
  async handle(job: Job<PublishPostJobData>): Promise<void> {
    try {
      await this.postService.publishQueuedPost(job.data.postId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to publish post';

      await this.postService.markPostFailed(job.data.postId, message);

      throw error;
    }
  }
}
