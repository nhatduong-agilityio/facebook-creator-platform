declare module '@clerk/fastify/webhooks' {
  import type { WebhookEvent } from '@clerk/fastify';
  import type { FastifyRequest } from 'fastify';

  export type VerifyWebhookOptions = {
    signingSecret?: string;
  };

  export function verifyWebhook(
    req: FastifyRequest,
    options?: VerifyWebhookOptions
  ): Promise<WebhookEvent>;
}
