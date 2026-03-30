// Shared
import { BaseController } from '@/shared/controller';

// Middlewares
import { createAuthContextMiddleware } from '@/middlewares/auth-context';
import { clerkAuthMiddleware } from '@/middlewares/clerk-auth';

// Types
import type { FacebookServicePort } from '../ports';
import type { AuthServicePort } from '@/modules/auth/ports';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

// Contracts
import {
  connectCallbackBodySchema,
  type FacebookAccountDto,
  toFacebookAccountDto
} from '../contracts';

export class FacebookController extends BaseController {
  private readonly authContextMiddleware: ReturnType<
    typeof createAuthContextMiddleware
  >;

  constructor(
    private readonly facebookService: FacebookServicePort,
    authService: AuthServicePort
  ) {
    super();
    this.authContextMiddleware = createAuthContextMiddleware(authService);
  }

  /**
   * Register all routes for this controller on the given Fastify instance.
   *
   * This implementation registers the following endpoints:
   *   - GET /connect-url: returns a Facebook OAuth connect URL
   *   - GET /accounts: returns a list of connected Facebook accounts for the authenticated user
   *   - POST /callback: handles the Facebook OAuth callback (connect/disconnect)
   */
  override routes(fastify: FastifyInstance): void {
    const protectedHandlers = [clerkAuthMiddleware, this.authContextMiddleware];

    fastify.get(
      '/connect-url',
      { preHandler: protectedHandlers },
      this.getConnectUrl.bind(this)
    );
    fastify.get(
      '/accounts',
      { preHandler: protectedHandlers },
      this.listAccounts.bind(this)
    );
    fastify.post(
      '/callback',
      { preHandler: protectedHandlers },
      this.callback.bind(this)
    );
  }

  /**
   * Returns a Facebook OAuth connect URL for the authenticated user.
   *
   * @returns {Promise<void>} - a promise that resolves to a JSON response with the connect URL
   */
  private async getConnectUrl(
    req: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    return reply.send({
      success: true,
      data: {
        url: this.facebookService.buildConnectUrl(req.user.id)
      }
    });
  }

  /**
   * Lists all Facebook accounts associated with the authenticated user.
   * Returns an array of Facebook account entities ordered by creation date (ASC).
   * @returns {Promise<void>} - a promise that resolves to a JSON response with the list of Facebook accounts
   */
  private async listAccounts(
    req: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const accounts = await this.facebookService.listAccounts(req.user.id);

    return reply.send({
      success: true,
      data: accounts.map(account => this.serializeAccount(account))
    });
  }

  /**
   * Connects a Facebook account to the authenticated user.
   * This endpoint is called by Facebook after the user has authorized the app.
   * It expects a JSON body with the following properties:
   * - code: the Facebook authorization code
   * - pageId: the Facebook page ID (optional)
   * @returns {Promise<void>} - a promise that resolves to a JSON response with the connected Facebook account entity
   */
  private async callback(
    req: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const body = connectCallbackBodySchema.parse(req.body);

    const account = await this.facebookService.connectAccount({
      userId: req.user.id,
      code: body.code,
      pageId: body.pageId
    });

    return reply.send({
      success: true,
      data: this.serializeAccount(account)
    });
  }

  /**
   * Serializes a Facebook account entity to a Facebook account DTO.
   * @param {Object} account - the Facebook account entity to serialize
   * @returns {FacebookAccountDto} - the serialized Facebook account DTO
   */
  private serializeAccount(account: {
    id: string;
    pageId: string;
    pageName: string;
    tokenExpiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): FacebookAccountDto {
    return toFacebookAccountDto(account);
  }
}
