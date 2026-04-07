import type {
  AnalyticsOverview,
  AnalyticsPost,
  BillingSummary,
  FacebookAccount,
  PostRecord,
  PostStatus
} from '@/features/dashboard/types';

type TimeSeriesPoint = {
  label: string;
  fullLabel: string;
  value: number;
};

export type SchedulerSlot = {
  id: string;
  title: string;
  status: PostStatus;
  date: Date;
  timeLabel: string;
  accountLabel: string;
};

export type SchedulerColumn = {
  key: string;
  label: string;
  dateLabel: string;
  date: Date;
  slots: SchedulerSlot[];
};

export type InsightCard = {
  id: string;
  title: string;
  detail: string;
  tone: 'accent' | 'success' | 'warning';
};

export type CommentInboxItem = {
  id: string;
  postId: string;
  postTitle: string;
  postStatus: string;
  commentCount: number;
  snippet: string;
  updatedAt: string | null;
};

export type StatusSummaryItem = {
  status: 'all' | PostStatus;
  label: string;
  value: number;
};

type PostLookup = Record<string, PostRecord>;

export function buildPostLookup(posts: PostRecord[]): PostLookup {
  return Object.fromEntries(posts.map(post => [post.id, post]));
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, amount: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function toReadableDay(date: Date, style: 'short' | 'long' = 'short') {
  return new Intl.DateTimeFormat('en-US', {
    weekday: style,
    month: style === 'long' ? 'short' : undefined,
    day: 'numeric'
  }).format(date);
}

function formatHourLabel(value: string | null) {
  if (!value) {
    return 'Unscheduled';
  }

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
}

function getReferenceDate(post: PostRecord) {
  return post.scheduledAt ?? post.publishedAt ?? post.createdAt;
}

export function buildPerformanceSeries(
  posts: AnalyticsPost[],
  range: 7 | 30,
  metric: 'reach' | 'engagement' | 'likes' | 'comments'
): TimeSeriesPoint[] {
  const today = startOfDay(new Date());
  const start = addDays(today, -(range - 1));
  const points = Array.from({ length: range }, (_, index) => {
    const date = addDays(start, index);

    return {
      date,
      label: new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric'
      }).format(date),
      fullLabel: toReadableDay(date, 'long'),
      value: 0
    };
  });

  posts.forEach(post => {
    const source =
      post.metrics.fetchedAt ?? post.publishedAt ?? post.scheduledAt;

    if (!source) {
      return;
    }

    const target = startOfDay(new Date(source));
    const match = points.find(point => isSameDay(point.date, target));

    if (!match) {
      return;
    }

    match.value += post.metrics[metric];
  });

  return points.map(point => ({
    label: point.label,
    fullLabel: point.fullLabel,
    value: point.value
  }));
}

export function buildPostPerformanceBars(posts: AnalyticsPost[]) {
  return posts
    .slice()
    .sort((left, right) => right.metrics.engagement - left.metrics.engagement)
    .slice(0, 5)
    .map(post => ({
      id: post.id,
      label: post.title ?? 'Untitled post',
      engagement: post.metrics.engagement,
      reach: post.metrics.reach,
      likes: post.metrics.likes,
      comments: post.metrics.comments
    }));
}

export function buildEngagementMix(overview?: AnalyticsOverview) {
  const likes = overview?.totalLikes ?? 0;
  const comments = overview?.totalComments ?? 0;
  const reach = overview?.totalReach ?? 0;
  const total = likes + comments + reach;

  return [
    {
      label: 'Likes',
      value: likes,
      color: 'hsl(var(--primary))'
    },
    {
      label: 'Comments',
      value: comments,
      color: 'var(--accent-secondary)'
    },
    {
      label: 'Reach',
      value: reach,
      color: 'hsl(var(--chart-4))'
    }
  ].map(segment => ({
    ...segment,
    percentage: total === 0 ? 0 : (segment.value / total) * 100
  }));
}

export function buildOverviewInsights(input: {
  posts: PostRecord[];
  analyticsPosts: AnalyticsPost[];
  accounts: FacebookAccount[];
  billing?: BillingSummary;
}): InsightCard[] {
  const { posts, analyticsPosts, accounts, billing } = input;
  const publishedPosts = posts.filter(post => post.publishedAt);
  const averageEngagement =
    analyticsPosts.length === 0
      ? 0
      : analyticsPosts.reduce(
          (total, post) => total + post.metrics.engagement,
          0
        ) / analyticsPosts.length;

  const bestHour = analyticsPosts
    .filter(
      post => post.publishedAt && post.metrics.engagement >= averageEngagement
    )
    .map(post => new Date(post.publishedAt as string).getHours())
    .sort((left, right) => left - right)[0];

  const scheduledCount = posts.filter(
    post => post.status === 'scheduled'
  ).length;

  return [
    {
      id: 'best-time',
      title: 'Smart scheduling',
      detail:
        bestHour !== undefined
          ? `Your strongest posts are clustering around ${String(bestHour).padStart(2, '0')}:00.`
          : 'Publish a few more posts to unlock time-based recommendations.',
      tone: 'accent'
    },
    {
      id: 'connected-pages',
      title: 'Channel coverage',
      detail:
        accounts.length > 0
          ? `${accounts.length} page${accounts.length === 1 ? '' : 's'} connected and ready for scheduling.`
          : 'Connect a Facebook page to activate publishing and comments workflows.',
      tone: accounts.length > 0 ? 'success' : 'warning'
    },
    {
      id: 'plan-usage',
      title: 'Plan usage',
      detail:
        billing && billing.plan.scheduledLimit > 0
          ? `${scheduledCount}/${billing.plan.scheduledLimit} scheduled slots currently in use.`
          : `You have ${scheduledCount} scheduled post${scheduledCount === 1 ? '' : 's'} in the queue.`,
      tone: billing?.plan.isPro ? 'success' : 'accent'
    },
    {
      id: 'volume',
      title: 'Workflow pace',
      detail:
        publishedPosts.length > 0
          ? `${publishedPosts.length} post${publishedPosts.length === 1 ? '' : 's'} have already been published.`
          : 'You do not have published content yet. Start from drafts or schedule your first post.',
      tone: publishedPosts.length > 0 ? 'success' : 'warning'
    }
  ];
}

export function buildPostStatusSummary(
  posts: PostRecord[]
): StatusSummaryItem[] {
  const counts = posts.reduce(
    (result, post) => {
      result[post.status] += 1;
      return result;
    },
    {
      draft: 0,
      scheduled: 0,
      published: 0,
      failed: 0
    }
  );

  return [
    {
      status: 'all',
      label: 'All',
      value: posts.length
    },
    {
      status: 'draft',
      label: 'Drafts',
      value: counts.draft
    },
    {
      status: 'scheduled',
      label: 'Scheduled',
      value: counts.scheduled
    },
    {
      status: 'published',
      label: 'Published',
      value: counts.published
    },
    {
      status: 'failed',
      label: 'Failed',
      value: counts.failed
    }
  ];
}

export function buildCommentSummary(items: CommentInboxItem[]) {
  const priority = items.filter(item => item.commentCount >= 5).length;
  const recent = items.filter(item => {
    if (!item.updatedAt) {
      return false;
    }

    const age = Date.now() - new Date(item.updatedAt).getTime();
    return age <= 1000 * 60 * 60 * 24 * 3;
  }).length;

  const totalComments = items.reduce(
    (result, item) => result + item.commentCount,
    0
  );

  return {
    activeThreads: items.length,
    priority,
    recent,
    totalComments
  };
}

export function buildSchedulerColumns(
  posts: PostRecord[],
  accounts: FacebookAccount[],
  anchorDate: Date
): SchedulerColumn[] {
  const accountLookup = Object.fromEntries(
    accounts.map(account => [account.id, account.pageName])
  );
  const start = startOfDay(anchorDate);

  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(start, index);
    const slots = posts
      .filter(post => {
        const reference = getReferenceDate(post);
        return reference ? isSameDay(new Date(reference), date) : false;
      })
      .sort((left, right) => {
        const leftDate = new Date(getReferenceDate(left) as string).getTime();
        const rightDate = new Date(getReferenceDate(right) as string).getTime();
        return leftDate - rightDate;
      })
      .map(post => ({
        id: post.id,
        title: post.title ?? 'Untitled post',
        status: post.status,
        date: new Date(getReferenceDate(post) as string),
        timeLabel: formatHourLabel(post.scheduledAt ?? post.publishedAt),
        accountLabel:
          (post.facebookAccountId
            ? accountLookup[post.facebookAccountId]
            : undefined) ?? 'Default page'
      }));

    return {
      key: date.toISOString(),
      label: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(
        date
      ),
      dateLabel: new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric'
      }).format(date),
      date,
      slots
    };
  });
}

export function buildSchedulerMonth(posts: PostRecord[], monthDate: Date) {
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const monthEnd = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() + 1,
    0
  );
  const firstCell = addDays(monthStart, -monthStart.getDay());
  const days: Array<{
    key: string;
    date: Date;
    label: number;
    isCurrentMonth: boolean;
    items: Array<{ id: string; title: string; status: PostStatus }>;
  }> = [];

  for (let index = 0; index < 42; index += 1) {
    const date = addDays(firstCell, index);
    const items = posts
      .filter(post => {
        const reference = getReferenceDate(post);
        return reference ? isSameDay(new Date(reference), date) : false;
      })
      .map(post => ({
        id: post.id,
        title: post.title ?? 'Untitled post',
        status: post.status
      }));

    days.push({
      key: date.toISOString(),
      date,
      label: date.getDate(),
      isCurrentMonth:
        date >= monthStart &&
        date <= monthEnd &&
        date.getMonth() === monthStart.getMonth(),
      items
    });
  }

  return days;
}

export function buildCommentInbox(
  analyticsPosts: AnalyticsPost[],
  posts: PostRecord[]
): CommentInboxItem[] {
  const postsById = buildPostLookup(posts);

  return analyticsPosts
    .filter(post => post.metrics.comments > 0)
    .sort((left, right) => right.metrics.comments - left.metrics.comments)
    .map(post => {
      const source = postsById[post.id];

      return {
        id: `comment-${post.id}`,
        postId: post.id,
        postTitle: post.title ?? 'Untitled post',
        postStatus: post.status,
        commentCount: post.metrics.comments,
        snippet:
          source?.content.slice(0, 120) ??
          'Comment activity detected on this post.',
        updatedAt: post.metrics.fetchedAt ?? post.publishedAt
      };
    });
}

export function buildUsageBreakdown(
  billing: BillingSummary | undefined,
  posts: PostRecord[]
) {
  const scheduled = posts.filter(post => post.status === 'scheduled').length;
  const total = posts.length;
  const scheduledLimit = billing?.plan.scheduledLimit ?? 0;
  const postLimit = billing?.plan.postLimit ?? 0;

  return [
    {
      label: 'Active scheduled queue',
      current: scheduled,
      limit: scheduledLimit,
      percentage:
        scheduledLimit > 0
          ? Math.min((scheduled / scheduledLimit) * 100, 100)
          : 0
    },
    {
      label: 'Total content',
      current: total,
      limit: postLimit,
      percentage: postLimit > 0 ? Math.min((total / postLimit) * 100, 100) : 0
    }
  ];
}
