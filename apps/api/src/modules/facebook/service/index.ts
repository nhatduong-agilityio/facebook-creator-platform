// Shared
import { BaseService } from '@/shared/service';
import { ValidationError } from '@/shared/errors/errors';

// Types
import type {
  FacebookAccountRepositoryPort,
  FacebookProviderPort,
  FacebookServicePort
} from '../ports';
import type { UserLookupPort } from '@/modules/users/ports';
import type { FacebookAccountEntity } from '../entity';
import type { UserEntity } from '@/modules/users/entity';
import type { FacebookPostMetricsDto } from '../contracts';
import type { AuditLogWritePort } from '@/modules/audit-logs/ports';

export class FacebookService
  extends BaseService
  implements FacebookServicePort
{
  constructor(
    private readonly userRepo: UserLookupPort,
    private readonly accountRepo: FacebookAccountRepositoryPort,
    private readonly auditLogRepo: AuditLogWritePort,
    private readonly facebookProvider: FacebookProviderPort
  ) {
    super();
  }

  /**
   * Builds a Facebook OAuth URL for connecting a page.
   * @param {string} userId - the user ID to use as the state parameter
   * @returns {string} - the Facebook OAuth URL
   * @throws {ValidationError} - if the Facebook app configuration is missing
   */
  buildConnectUrl(userId: string): string {
    return this.facebookProvider.buildConnectUrl(userId);
  }

  /**
   * Connects a Facebook account to the user.
   *
   * @param {Object} input - the connection input
   * @param {string} input.userId - the user ID to connect the Facebook account to
   * @param {string} input.code - the Facebook authorization code
   * @param {string | null | undefined} input.pageId - the Facebook page ID (optional)
   * @returns {Promise<FacebookAccountEntity>} - a promise that resolves to the created or updated Facebook account entity
   * @throws {ValidationError} - if the Facebook app configuration is missing or if the Facebook page was not returned
   */
  async connectAccount(input: {
    userId: string;
    code: string;
    pageId?: string;
  }): Promise<FacebookAccountEntity> {
    const user = await this.requireUser(input.userId);
    const connection = await this.facebookProvider.connectPage(input);
    const account = await this.accountRepo.upsertConnection({
      userId: user.id,
      facebookUserId: connection.facebookUserId,
      pageId: connection.pageId,
      pageName: connection.pageName,
      accessToken: connection.accessToken,
      tokenExpiresAt: connection.tokenExpiresAt
    });

    // Create an audit log entry
    await this.auditLogRepo.createEntry({
      userId: user.id,
      action: 'facebook.account.connected',
      entityType: 'facebook_account',
      entityId: account.id,
      metadata: {
        pageId: account.pageId,
        pageName: account.pageName
      }
    });

    return account;
  }

  /**
   * Lists all Facebook accounts associated with a user.
   * @param {string} userId - the user ID
   * @returns {Promise<FacebookAccountEntity[]>} - a promise that resolves to an array of Facebook account entities
   * @throws {ValidationError} - if the user was not found
   */
  async listAccounts(userId: string): Promise<FacebookAccountEntity[]> {
    const user = await this.requireUser(userId);
    return await this.accountRepo.findAllByUserId(user.id);
  }

  async resolveAccount(
    userId: string,
    facebookAccountId?: string | null
  ): Promise<FacebookAccountEntity> {
    const user = await this.requireUser(userId);
    return await this.resolveAccountForInternalUser(user.id, facebookAccountId);
  }

  /**
   * Resolves a Facebook account for an internal user ID.
   * If a Facebook account ID is provided, it will attempt to find the Facebook account by ID and user ID.
   * If no Facebook account ID is provided, it will attempt to find the default Facebook account for the user.
   * @param {string} userId - the internal user ID
   * @param {string | null | undefined} facebookAccountId - the Facebook account ID (optional)
   * @returns {Promise<FacebookAccountEntity>} - a promise that resolves to the resolved Facebook account entity
   * @throws {ValidationError} - if the Facebook account was not found
   */
  async resolveAccountForInternalUser(
    userId: string,
    facebookAccountId?: string | null
  ): Promise<FacebookAccountEntity> {
    const account = facebookAccountId
      ? await this.accountRepo.findByIdForUser(facebookAccountId, userId)
      : await this.accountRepo.findDefaultByUserId(userId);

    if (!account) {
      throw new ValidationError(
        'Connect a Facebook page before creating or publishing posts'
      );
    }

    return account;
  }

  /**
   * Publishes a post to a Facebook page.
   * @param {FacebookAccountEntity} account - the Facebook account entity associated with the page
   * @param {Object} post - the post object with the content and media URL (optional)
   * @param {string} post.content - the post content
   * @param {string | null | undefined} post.mediaUrl - the media URL (optional)
   * @returns {Promise<{ facebookPostId: string }>} - a promise that resolves to an object with the Facebook post ID
   */
  async publishPost(
    account: FacebookAccountEntity,
    post: { content: string; mediaUrl?: string | null }
  ): Promise<{ facebookPostId: string }> {
    return await this.facebookProvider.publishPagePost({
      pageId: account.pageId,
      accessToken: account.accessToken,
      content: post.content,
      mediaUrl: post.mediaUrl
    });
  }

  /**
   * Fetches the metrics for a Facebook post.
   * @param {FacebookAccountEntity} account - the Facebook account entity associated with the page
   * @param {string} facebookPostId - the Facebook post ID
   * @returns {Promise<FacebookPostMetricsDto>} - a promise that resolves to a Facebook post metrics DTO
   */
  async fetchPostMetrics(
    account: FacebookAccountEntity,
    facebookPostId: string
  ): Promise<FacebookPostMetricsDto> {
    return await this.facebookProvider.fetchPostMetrics({
      accessToken: account.accessToken,
      facebookPostId
    });
  }

  /**
   * Finds a user by Clerk user ID and throws a ValidationError if not found.
   * Used internally to validate that a user profile exists before continuing.
   * @param {string} clerkUserId - the Clerk user ID to find a user for
   * @returns {Promise<UserEntity>} - a promise that resolves to a user entity if found, otherwise throws a ValidationError
   * @throws {ValidationError} - if the user was not found
   */
  private async requireUser(clerkUserId: string): Promise<UserEntity> {
    const user = await this.userRepo.findByClerkId(clerkUserId);

    if (!user) {
      throw new ValidationError(
        'User profile must be created before continuing'
      );
    }

    return user;
  }
}
