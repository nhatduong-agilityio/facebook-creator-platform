import type { PostSchedulerPort } from '../ports';

export class PostSchedulerProvider implements PostSchedulerPort {
  async schedulePublish(_postId: string, _scheduledAt: Date): Promise<void> {
    // TODO implement post scheduling feature later
  }
}
