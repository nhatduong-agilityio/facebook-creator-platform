'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AreaTrendChart } from '@/components/ui/dashboard-charts';
import { PostMediaPreview } from '@/components/ui/post-media-preview';
import { SegmentedControl } from '@/components/ui/segmented-control';
import {
  ErrorCallout,
  GlassTag,
  MetricCard,
  PageHeader,
  SectionHeading,
  StatusBadge,
  subtlePanelClassName,
  tilePanelClassName
} from '@/components/ui/dashboard-primitives';
import {
  useDashboardAccountsQuery,
  useDashboardAnalyticsOverviewQuery,
  useDashboardAnalyticsPostsQuery,
  useDashboardBillingQuery,
  useDashboardPostsQuery
} from '@/features/dashboard/hooks/use-dashboard-queries';
import {
  buildOverviewInsights,
  buildPerformanceSeries
} from '@/features/dashboard/lib/derivations';
import {
  formatDate,
  getPostDisplayTitle,
  getPostExcerpt,
  formatNumber,
  getStatusTone
} from '@/features/dashboard/lib/format';
import { dashboardQueryKeys } from '@/features/dashboard/lib/query-keys';

export function OverviewView() {
  const queryClient = useQueryClient();
  const [range, setRange] = useState<7 | 30>(7);

  const billingQuery = useDashboardBillingQuery();
  const accountsQuery = useDashboardAccountsQuery();
  const postsQuery = useDashboardPostsQuery();
  const overviewQuery = useDashboardAnalyticsOverviewQuery();
  const analyticsPostsQuery = useDashboardAnalyticsPostsQuery();

  const recentPosts = (postsQuery.data ?? []).slice(0, 5);
  const scheduledPosts = (postsQuery.data ?? [])
    .filter(post => post.scheduledAt)
    .sort(
      (left, right) =>
        new Date(left.scheduledAt as string).getTime() -
        new Date(right.scheduledAt as string).getTime()
    )
    .slice(0, 4);
  const engagementSeries = buildPerformanceSeries(
    analyticsPostsQuery.data ?? [],
    range,
    'engagement'
  );
  const insights = buildOverviewInsights({
    posts: postsQuery.data ?? [],
    analyticsPosts: analyticsPostsQuery.data ?? [],
    accounts: accountsQuery.data ?? [],
    billing: billingQuery.data
  });

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Overview"
        tags={
          <>
            <GlassTag tone="accent">
              {billingQuery.data?.plan.name ?? 'Loading'} plan
            </GlassTag>
            <GlassTag
              tone={
                (accountsQuery.data?.length ?? 0) > 0 ? 'success' : 'warning'
              }
            >
              {accountsQuery.data?.length ?? 0} page
              {(accountsQuery.data?.length ?? 0) === 1 ? '' : 's'}
            </GlassTag>
          </>
        }
        actions={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                void Promise.all([
                  queryClient.invalidateQueries({
                    queryKey: dashboardQueryKeys.billing
                  }),
                  queryClient.invalidateQueries({
                    queryKey: dashboardQueryKeys.accounts
                  }),
                  queryClient.invalidateQueries({
                    queryKey: dashboardQueryKeys.posts
                  }),
                  queryClient.invalidateQueries({
                    queryKey: dashboardQueryKeys.analyticsOverview
                  }),
                  queryClient.invalidateQueries({
                    queryKey: dashboardQueryKeys.analyticsPosts
                  })
                ]);
              }}
            >
              Refresh
            </Button>
            <Button asChild>
              <Link href="/dashboard/posts">Create Post</Link>
            </Button>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Posts"
          value={formatNumber(overviewQuery.data?.totalPosts ?? 0)}
          accent="blue"
          hint="All posts in the workspace."
        />
        <MetricCard
          label="Scheduled"
          value={formatNumber(overviewQuery.data?.scheduledPosts ?? 0)}
          accent="teal"
          hint="Posts waiting to publish."
        />
        <MetricCard
          label="Reach"
          value={formatNumber(overviewQuery.data?.totalReach ?? 0)}
          accent="blue"
          hint="Audience reached across tracked content."
        />
        <MetricCard
          label="Engagement"
          value={formatNumber(overviewQuery.data?.totalEngagement ?? 0)}
          accent="coral"
          hint="Likes and comments from measured content."
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <SectionHeading eyebrow="Performance" title="Engagement trend" />

            <SegmentedControl
              legend="Engagement range"
              options={[
                { label: '7D', value: '7' },
                { label: '30D', value: '30' }
              ]}
              value={String(range) as '7' | '30'}
              onChange={nextValue => {
                setRange(nextValue === '7' ? 7 : 30);
              }}
              containerClassName="flex rounded-lg border border-border bg-muted p-1"
              itemClassName="inline-flex rounded-md px-3 py-2 text-sm font-medium transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring"
              activeClassName="bg-primary text-primary-foreground shadow-sm"
              inactiveClassName="text-muted-foreground hover:text-foreground"
            />
          </div>

          <div className="mt-6">
            <AreaTrendChart
              points={engagementSeries}
              label={`Engagement over the last ${range} days`}
            />
          </div>
        </Card>

        <Card className="p-5">
          <SectionHeading eyebrow="Highlights" title="What needs attention" />

          <div className="mt-6 space-y-3">
            {insights.map(item => (
              <Card
                key={item.id}
                className={`${subtlePanelClassName} p-4 shadow-none`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{item.title}</p>
                  <GlassTag tone={item.tone}>
                    {item.tone === 'accent'
                      ? 'Suggested'
                      : item.tone === 'success'
                        ? 'Healthy'
                        : 'Attention'}
                  </GlassTag>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.detail}
                </p>
              </Card>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-5">
          <SectionHeading eyebrow="Schedule" title="Upcoming posts" />

          <div className="mt-6 space-y-3">
            {scheduledPosts.map(post => (
              <Card
                key={post.id}
                className={`${subtlePanelClassName} p-4 shadow-none`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {getPostDisplayTitle(post.title, post.content)}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {getPostExcerpt(post.content, 84)}
                    </p>
                  </div>
                  <StatusBadge tone={getStatusTone(post.status)}>
                    {post.status}
                  </StatusBadge>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {formatDate(post.scheduledAt)}
                </p>
              </Card>
            ))}

            {scheduledPosts.length === 0 ? (
              <Card className="border-dashed border-[var(--line-strong)] px-4 py-6 text-sm text-muted-foreground shadow-none">
                No posts scheduled yet.
              </Card>
            ) : null}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <SectionHeading eyebrow="Recent" title="Latest posts" />
            <Button asChild variant="secondary">
              <Link href="/dashboard/posts">View all posts</Link>
            </Button>
          </div>

          <div className="mt-6 divide-y divide-[var(--line)]">
            {recentPosts.map(post => (
              <div
                key={post.id}
                className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto]"
              >
                <div className="flex min-w-0 items-start gap-3">
                  {post.mediaUrl ? (
                    <div className="relative mt-0.5 h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--panel-muted)]">
                      <PostMediaPreview
                        mediaUrl={post.mediaUrl}
                        alt={getPostDisplayTitle(post.title, post.content)}
                        emptyLabel="Media"
                        videoClassName="bg-black"
                      />
                    </div>
                  ) : null}
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {getPostDisplayTitle(post.title, post.content)}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {getPostExcerpt(post.content, 108)}
                    </p>
                  </div>
                </div>
                <Card
                  className={`${tilePanelClassName} px-3 py-2 text-sm shadow-none`}
                >
                  {formatDate(post.updatedAt)}
                </Card>
                <div className="flex items-center">
                  <StatusBadge tone={getStatusTone(post.status)}>
                    {post.status}
                  </StatusBadge>
                </div>
              </div>
            ))}

            {recentPosts.length === 0 ? (
              <div className="py-6 text-sm text-muted-foreground">
                No recent post activity yet.
              </div>
            ) : null}
          </div>
        </Card>
      </section>

      {overviewQuery.error ? (
        <ErrorCallout
          title="Unable to load overview metrics"
          error={overviewQuery.error}
        />
      ) : null}

      {analyticsPostsQuery.error ? (
        <ErrorCallout
          title="Unable to load performance trend"
          error={analyticsPostsQuery.error}
        />
      ) : null}
    </>
  );
}
