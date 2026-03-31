'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AreaTrendChart } from '@/components/ui/dashboard-charts';
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
        title="Workspace overview"
        description="Queue health, performance, and the next actions for today."
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
            <SectionHeading
              eyebrow="Performance"
              title="Engagement trend"
              description="Track the engagement curve for the selected window and spot weekly movement fast."
            />

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
              containerClassName="flex rounded-lg border border-[var(--line)] bg-[var(--panel-muted)] p-1"
              itemClassName="inline-flex rounded-md px-3 py-2 text-sm font-medium transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--accent)]"
              activeClassName="bg-[var(--accent)] text-white"
              inactiveClassName="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
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
          <SectionHeading
            eyebrow="AI Summary"
            title="Recommended next moves"
            description="Fast operational suggestions based on connected pages, posting cadence, and current plan usage."
          />

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
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                  {item.detail}
                </p>
              </Card>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-5">
          <SectionHeading
            eyebrow="Schedule Queue"
            title="Upcoming posts"
            description="The next scheduled items in the queue with publish timing visible immediately."
          />

          <div className="mt-6 space-y-3">
            {scheduledPosts.map(post => (
              <Card
                key={post.id}
                className={`${subtlePanelClassName} p-4 shadow-none`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">
                    {post.title ?? 'Untitled post'}
                  </p>
                  <StatusBadge tone={getStatusTone(post.status)}>
                    {post.status}
                  </StatusBadge>
                </div>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  {formatDate(post.scheduledAt)}
                </p>
              </Card>
            ))}

            {scheduledPosts.length === 0 ? (
              <Card className="border-dashed border-[var(--line-strong)] px-4 py-6 text-sm text-[var(--muted-foreground)] shadow-none">
                No posts scheduled yet.
              </Card>
            ) : null}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <SectionHeading
              eyebrow="Recent Content"
              title="Latest post activity"
              description="A denser operational list for the latest content entering or leaving the queue."
            />
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
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {post.title ?? 'Untitled post'}
                  </p>
                  <p className="mt-1 truncate text-sm text-[var(--muted-foreground)]">
                    {post.content}
                  </p>
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
              <div className="py-6 text-sm text-[var(--muted-foreground)]">
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
