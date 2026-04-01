import 'fastify';

// Types
import type { UserEntity } from '@/modules/users/entity';
import type { BillingPlanContext } from '@/modules/billing/contracts';

declare module 'fastify' {
  interface FastifyRequest {
    rawBody: string | Buffer<ArrayBufferLike>;
    user: {
      id: string; // Clerk userId — always set after clerkAuthMiddleware
    };
    currentUser: UserEntity;
    plan: BillingPlanContext;
  }
}
