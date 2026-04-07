import type { PostSchedulerPort } from '../ports';
import { enqueuePublishPostJob } from '@/modules/jobs/queues/publish-post-queue';

export class PostSchedulerProvider implements PostSchedulerPort {
  async schedulePublish(postId: string, scheduledAt: Date): Promise<void> {
    await enqueuePublishPostJob({ postId }, scheduledAt);
  }
}
