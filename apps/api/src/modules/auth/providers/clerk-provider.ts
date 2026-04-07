// Types
import type {
  ClerkIdentityProviderPort,
  ClerkUserProfile,
  ClerkWebhookEventPayload,
  ClerkWebhookVerifierPort
} from '../ports';
import type { FastifyRequest } from 'fastify';
import { verifyWebhook } from '@clerk/fastify/webhooks';
import { createRuntimeClerkClient } from '../lib/clerk';

export class ClerkProvider
  implements ClerkIdentityProviderPort, ClerkWebhookVerifierPort
{
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
    const clerkClient = createRuntimeClerkClient();
    const user = await clerkClient.users.getUser(clerkUserId);

    const primaryEmail =
      user.emailAddresses.find(
        emailAddress => emailAddress.id === user.primaryEmailAddressId
      )?.emailAddress ?? user.emailAddresses[0]?.emailAddress;

    if (!primaryEmail) {
      throw new Error('Clerk user is missing a primary email address');
    }

    return {
      id: user.id,
      email: primaryEmail,
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
          email: primaryEmail ?? null,
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
