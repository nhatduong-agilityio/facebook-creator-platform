// Types
import type { FacebookPostMetricsDto } from '../contracts';
import type { FacebookAccountEntity } from '../entity';

export interface FacebookAccountRepositoryPort {
  findById(id: string): Promise<FacebookAccountEntity | null>;
  findAllByUserId(userId: string): Promise<FacebookAccountEntity[]>;
  findDefaultByUserId(userId: string): Promise<FacebookAccountEntity | null>;
  findByIdForUser(
    id: string,
    userId: string
  ): Promise<FacebookAccountEntity | null>;
  findByPageIdForUser(
    pageId: string,
    userId: string
  ): Promise<FacebookAccountEntity | null>;
  upsertConnection(data: {
    userId: string;
    facebookUserId: string;
    pageId: string;
    pageName: string;
    accessToken: string;
    tokenExpiresAt?: Date | null;
  }): Promise<FacebookAccountEntity>;
}

export type FacebookProviderConnectionInput = {
  userId: string;
  code: string;
  pageId?: string;
};

export type FacebookProviderPortConnectionResult = {
  facebookUserId: string;
  pageId: string;
  pageName: string;
  accessToken: string;
  tokenExpiresAt?: Date | null;
};

export interface FacebookProviderPort {
  buildConnectUrl(userId: string): string;
  connectPage(
    input: FacebookProviderConnectionInput
  ): Promise<FacebookProviderPortConnectionResult>;
  publishPagePost(input: {
    pageId: string;
    accessToken: string;
    content: string;
    mediaUrl?: string | null;
  }): Promise<{ facebookPostId: string }>;
  fetchPostMetrics(input: {
    accessToken: string;
    facebookPostId: string;
  }): Promise<FacebookPostMetricsDto>;
}

export interface FacebookServicePort {
  buildConnectUrl(userId: string): string;
  connectAccount(input: {
    userId: string;
    code: string;
    pageId?: string;
  }): Promise<FacebookAccountEntity>;
  listAccounts(userId: string): Promise<FacebookAccountEntity[]>;
  resolveAccount(
    userId: string,
    facebookAccountId?: string | null
  ): Promise<FacebookAccountEntity>;
  resolveAccountForInternalUser(
    userId: string,
    facebookAccountId?: string | null
  ): Promise<FacebookAccountEntity>;
  publishPost(
    account: FacebookAccountEntity,
    post: {
      content: string;
      mediaUrl?: string | null;
    }
  ): Promise<{ facebookPostId: string }>;
  fetchPostMetrics(
    account: FacebookAccountEntity,
    facebookPostId: string
  ): Promise<FacebookPostMetricsDto>;
}
