// Types
import type { AuthServicePort, ClerkWebhookVerifierPort } from '../ports';

// Controllers
import { AuthController } from '../controller';

/**
 * Creates an instance of the AuthController, which handles
 * authentication-related endpoints (/auth/*).
 *
 * @param {AuthServicePort} authService - the authentication service
 * @param {ClerkWebhookVerifierPort} clerkWebhookVerifier - the Clerk webhook verifier
 * @returns {AuthController} - an instance of the AuthController
 */
export function createAuthModule(
  authService: AuthServicePort,
  clerkWebhookVerifier: ClerkWebhookVerifierPort
): AuthController {
  return new AuthController(authService, clerkWebhookVerifier);
}
