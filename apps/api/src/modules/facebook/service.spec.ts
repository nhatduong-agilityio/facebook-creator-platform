/* eslint-disable @typescript-eslint/unbound-method */
import { mock, type MockProxy } from 'jest-mock-extended';

import type { AuditLogWriterPort } from '@/modules/audit-logs/ports';
import type {
  FacebookAccountRepositoryPort,
  FacebookProviderPort
} from '@/modules/facebook/ports';
import { FacebookService } from '@/modules/facebook/service';
import type { UserLookupPort } from '@/modules/users/ports';
import { makeFacebookAccount, makeUser } from '@/__tests__/helpers/fixtures';
import { ValidationError } from '@/shared/errors/errors';

describe('FacebookService', () => {
  let userRepo: MockProxy<UserLookupPort>;
  let accountRepo: MockProxy<FacebookAccountRepositoryPort>;
  let auditLogRepo: MockProxy<AuditLogWriterPort>;
  let facebookProvider: MockProxy<FacebookProviderPort>;
  let service: FacebookService;

  beforeEach(() => {
    userRepo = mock<UserLookupPort>();
    accountRepo = mock<FacebookAccountRepositoryPort>();
    auditLogRepo = mock<AuditLogWriterPort>();
    facebookProvider = mock<FacebookProviderPort>();
    service = new FacebookService(
      userRepo,
      accountRepo,
      auditLogRepo,
      facebookProvider
    );
  });

  it('connects a Facebook page and writes an audit log', async () => {
    const user = makeUser();
    const account = makeFacebookAccount();
    userRepo.findByClerkId.mockResolvedValue(user);
    facebookProvider.connectPage.mockResolvedValue({
      facebookUserId: 'facebook-user-1',
      pageId: 'page-1',
      pageName: 'Page One',
      accessToken: 'page-token',
      tokenExpiresAt: new Date('2026-12-31T00:00:00.000Z')
    });
    accountRepo.upsertConnection.mockResolvedValue(account);

    const result = await service.connectAccount({
      userId: user.clerkUserId,
      code: 'oauth-code',
      pageId: 'page-1'
    });

    expect(result).toBe(account);
    expect(accountRepo.upsertConnection).toHaveBeenCalledWith({
      userId: user.id,
      facebookUserId: 'facebook-user-1',
      pageId: 'page-1',
      pageName: 'Page One',
      accessToken: 'page-token',
      tokenExpiresAt: new Date('2026-12-31T00:00:00.000Z')
    });
    expect(auditLogRepo.createEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.id,
        action: 'facebook.account.connected'
      })
    );
  });

  it('resolves the default account for an internal user', async () => {
    const account = makeFacebookAccount();
    accountRepo.findDefaultByUserId.mockResolvedValue(account);

    const result =
      await service.resolveAccountForInternalUser('user-internal-1');

    expect(result).toBe(account);
  });

  it('throws when no Facebook account is connected', async () => {
    accountRepo.findDefaultByUserId.mockResolvedValue(null);

    await expect(
      service.resolveAccountForInternalUser('user-internal-1')
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('publishes posts through the provider', async () => {
    const account = makeFacebookAccount();
    facebookProvider.publishPagePost.mockResolvedValue({
      facebookPostId: 'fb-post-1'
    });

    const result = await service.publishPost(account, {
      title: 'Launch',
      content: 'Ship it',
      mediaUrl: 'https://example.com/file.png'
    });

    expect(result).toEqual({ facebookPostId: 'fb-post-1' });
    expect(facebookProvider.publishPagePost).toHaveBeenCalledWith({
      pageId: account.pageId,
      accessToken: account.accessToken,
      title: 'Launch',
      content: 'Ship it',
      mediaUrl: 'https://example.com/file.png'
    });
  });
});
