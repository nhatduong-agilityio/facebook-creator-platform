export type BillingPlan = {
  code: 'free' | 'pro';
  name: string;
  isPro: boolean;
  postLimit: number;
  scheduledLimit: number;
  status: string;
  currentPeriodEnd: string | null;
};

export type SessionRecord = {
  id: string;
  clerkUserId: string;
  email: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FacebookAccount = {
  id: string;
  pageId: string;
  pageName: string;
  tokenExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BillingSummary = {
  plan: BillingPlan;
  stripeSubscriptionId: string | null;
};

export type MediaUploadPayload = {
  fileName: string;
  mimeType: string;
  base64Data: string;
};

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';

export type PostRecord = {
  id: string;
  userId: string;
  facebookAccountId: string | null;
  title: string | null;
  content: string;
  mediaUrl: string | null;
  status: PostStatus;
  scheduledAt: string | null;
  publishedAt: string | null;
  facebookPostId: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AnalyticsOverview = {
  totalPosts: number;
  scheduledPosts: number;
  publishedPosts: number;
  totalLikes: number;
  totalComments: number;
  totalReach: number;
  totalEngagement: number;
};

export type AnalyticsPost = {
  id: string;
  title: string | null;
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  facebookPostId: string | null;
  metrics: {
    likes: number;
    comments: number;
    reach: number;
    engagement: number;
    fetchedAt: string | null;
  };
};
