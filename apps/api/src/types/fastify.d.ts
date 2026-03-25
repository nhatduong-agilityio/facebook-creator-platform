import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    rawBody: string | Buffer<ArrayBufferLike>;
    user: {
      id: string; // Clerk userId — always set after clerkAuthMiddleware
    };
    plan: {
      isPro: boolean;
      postLimit: number; // -1 = unlimited
      scheduledLimit: number; // -1 = unlimited
    };
  }
}
