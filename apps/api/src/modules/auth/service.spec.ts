/* eslint-disable @typescript-eslint/unbound-method */
import { mock, type MockProxy } from 'jest-mock-extended';

import type { ClerkIdentityProviderPort } from '@/modules/auth/ports';
import { AuthService } from '@/modules/auth/service';
import type { UserClerkSyncPort } from '@/modules/users/ports';
import { makeUser } from '@/__tests__/helpers/fixtures';
import { ExternalServiceError } from '@/shared/errors/errors';

describe('AuthService', () => {
  let userRepo: MockProxy<UserClerkSyncPort>;
  let clerkProvider: MockProxy<ClerkIdentityProviderPort>;
  let service: AuthService;

  beforeEach(() => {
    userRepo = mock<UserClerkSyncPort>();
    clerkProvider = mock<ClerkIdentityProviderPort>();
    service = new AuthService(userRepo, clerkProvider);
  });

  it('returns the existing user when Clerk data is unchanged', async () => {
    const existing = makeUser();
    userRepo.findByClerkId.mockResolvedValue(existing);
    clerkProvider.getUserProfile.mockResolvedValue({
      id: existing.clerkUserId,
      email: existing.email,
      firstName: 'Test',
      lastName: 'User'
    });

    const result = await service.getOrCreateUser(existing.clerkUserId);

    expect(result).toBe(existing);
    expect(userRepo.saveClerkUser).not.toHaveBeenCalled();
  });

  it('refreshes a stale fallback user from Clerk', async () => {
    const existing = makeUser({
      email: 'clerk-user-1@clerk.local',
      name: null
    });
    const repaired = makeUser({
      email: 'real@example.com',
      name: 'Real User'
    });
    userRepo.findByClerkId.mockResolvedValue(existing);
    clerkProvider.getUserProfile.mockResolvedValue({
      id: existing.clerkUserId,
      email: 'real@example.com',
      firstName: 'Real',
      lastName: 'User'
    });
    userRepo.saveClerkUser.mockResolvedValue(repaired);

    const result = await service.getOrCreateUser(existing.clerkUserId);

    expect(userRepo.saveClerkUser).toHaveBeenCalledWith({
      clerkUserId: existing.clerkUserId,
      email: 'real@example.com',
      name: 'Real User'
    });
    expect(result).toBe(repaired);
  });

  it('throws when Clerk sync fails and no trusted user exists', async () => {
    userRepo.findByClerkId.mockResolvedValue(
      makeUser({ email: 'clerk-user-1@clerk.local' })
    );
    clerkProvider.getUserProfile.mockRejectedValue(new Error('clerk down'));

    await expect(
      service.getOrCreateUser('clerk-user-1')
    ).rejects.toBeInstanceOf(ExternalServiceError);
  });

  it('syncs user updates from Clerk webhooks', async () => {
    const saved = makeUser({
      email: 'updated@example.com',
      name: 'Updated User'
    });
    userRepo.saveClerkUser.mockResolvedValue(saved);

    const result = await service.syncClerkWebhook({
      type: 'user.updated',
      data: {
        id: 'clerk-user-1',
        email: 'updated@example.com',
        firstName: 'Updated',
        lastName: 'User'
      }
    });

    expect(userRepo.saveClerkUser).toHaveBeenCalledWith({
      clerkUserId: 'clerk-user-1',
      email: 'updated@example.com',
      name: 'Updated User'
    });
    expect(result).toBe(saved);
  });

  it('deletes local users on Clerk delete webhook', async () => {
    userRepo.deleteByClerkId.mockResolvedValue(true);

    const result = await service.syncClerkWebhook({
      type: 'user.deleted',
      data: {
        id: 'clerk-user-1',
        email: null,
        firstName: null,
        lastName: null
      }
    });

    expect(userRepo.deleteByClerkId).toHaveBeenCalledWith('clerk-user-1');
    expect(result).toBeNull();
  });
});
