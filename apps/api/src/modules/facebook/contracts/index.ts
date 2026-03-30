import z from 'zod';

// Types
import type { FacebookAccountEntity } from '../entity';

export const connectCallbackBodySchema = z.object({
  code: z.string().trim().min(1),
  pageId: z.string().trim().min(1).optional()
});

export type ConnectCallbackBodyDto = z.infer<typeof connectCallbackBodySchema>;

export type FacebookConnectUrlDto = {
  url: string;
};

export type FacebookAccountDto = {
  id: string;
  pageId: string;
  pageName: string;
  tokenExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type FacebookPostMetricsDto = {
  likes: number;
  comments: number;
  reach: number;
  engagement: number;
};

export function toFacebookAccountDto(
  account: Pick<
    FacebookAccountEntity,
    'id' | 'pageId' | 'pageName' | 'tokenExpiresAt' | 'createdAt' | 'updatedAt'
  >
): FacebookAccountDto {
  return {
    id: account.id,
    pageId: account.pageId,
    pageName: account.pageName,
    tokenExpiresAt: account.tokenExpiresAt,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt
  };
}
