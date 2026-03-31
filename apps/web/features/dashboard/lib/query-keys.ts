export const dashboardQueryKeys = {
  session: ['auth', 'session'] as const,
  billing: ['billing', 'subscription'] as const,
  accounts: ['facebook', 'accounts'] as const,
  connectUrl: ['facebook', 'connect-url'] as const,
  posts: ['posts'] as const,
  analyticsOverview: ['analytics', 'overview'] as const,
  analyticsPosts: ['analytics', 'posts'] as const
};
