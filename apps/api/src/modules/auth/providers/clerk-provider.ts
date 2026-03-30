import { clerkClient } from '@clerk/fastify';

// Types
import type {
  ClerkIdentifyProviderPort,
  ClerkUserProfile,
  ClerkWebhookEventPayload,
  ClerkWebhookVerifierPort
} from '../ports';
import type { FastifyRequest } from 'fastify';
import { verifyWebhook } from '@clerk/fastify/webhooks';

export class ClerkProvider
  implements ClerkIdentifyProviderPort, ClerkWebhookVerifierPort
{
  private readonly fallbackEmailDomain = 'clerk.local';

  /**
   * Retrieves a Clerk user profile by their Clerk user ID.
   *
   * If the user has an email address associated with their Clerk profile,
   * that email address is returned. Otherwise, a fallback email address
   * is generated using the Clerk user ID and the
   * `CLERK_FALLBACK_EMAIL_DOMAIN` environment variable.
   *
   * @param {string} clerkUserId - the Clerk user ID to retrieve a profile for
   * @returns {Promise<ClerkUserProfile>} - a promise that resolves to a Clerk user profile
   */
  async getUserProfile(clerkUserId: string): Promise<ClerkUserProfile> {
    const user = await clerkClient.users.getUser(clerkUserId);

    // Generate a fallback email using the clerkUserId
    const emailFallback = `${user.id}@${this.fallbackEmailDomain}`;

    return {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress ?? emailFallback,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null
    };
  }

  /**
   * Verifies a Clerk webhook event payload.
   *
   * Called by the Clerk webhook handler to validate incoming events.
   *
   * If the event type is 'user.created' or 'user.updated', the method
   * returns a new event payload with the primary email address.
   *
   * If the event type is not recognized, the method returns a new event
   * payload with all fields set to null.
   *
   * @param {FastifyRequest} req - the Fastify request object
   * @returns {Promise<ClerkWebhookEventPayload>} - a promise that resolves to a Clerk webhook event payload
   */
  async verifyWebhook(req: FastifyRequest): Promise<ClerkWebhookEventPayload> {
    const event = await verifyWebhook(req);

    if (event.type === 'user.created' || event.type === 'user.updated') {
      const primaryEmail =
        event.data.email_addresses.find(
          (emailAddress: { id: string; email_address: string }) =>
            emailAddress.id === event.data.primary_email_address_id
        )?.email_address ?? event.data.email_addresses[0]?.email_address;

      return {
        type: event.type,
        data: {
          id: event.data.id,
          email:
            primaryEmail ??
            `${event.data.id ?? 'unknown'}@${this.fallbackEmailDomain}`,
          firstName: event.data.first_name ?? null,
          lastName: event.data.last_name ?? null
        }
      };
    }

    return {
      type: event.type,
      data: {
        id: event.data.id,
        email: null,
        firstName: null,
        lastName: null
      }
    };
  }
}
