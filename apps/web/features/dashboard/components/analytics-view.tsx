'use client';

import { useMemo, useState } from 'react';

import { Card } from '@/components/ui/card';
import {
  AreaTrendChart,
  DonutChart,
  PostPerformanceBars
} from '@/components/ui/dashboard-charts';
import { SegmentedControl } from '@/components/ui/segmented-control';
import {
  EmptyState,
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
  useDashboardAnalyticsOverviewQuery,
  useDashboardAnalyticsPostsQuery
} from '@/features/dashboard/hooks/use-dashboard-queries';
import {
  buildEngagementMix,
  buildPerformanceSeries,
  buildPostPerformanceBars
} from '@/features/dashboard/lib/derivations';
import {
  formatDate,
  formatNumber,
  getStatusTone
} from '@/features/dashboard/lib/format';

export function AnalyticsView() {
  const [range, setRange] = useState<7 | 30>(30);
  const overviewQuery = useDashboardAnalyticsOverviewQuery();
  const postsQuery = useDashboardAnalyticsPostsQuery();

  const trendSeries = buildPerformanceSeries(
    postsQuery.data ?? [],
    range,
    'reach'
  );
  const performanceBars = buildPostPerformanceBars(postsQuery.data ?? []);
  const engagementMix = buildEngagementMix(overviewQuery.data);
  const topPosts = useMemo(() => {
    return [...(postsQuery.data ?? [])]
      .sort((left, right) => right.metrics.engagement - left.metrics.engagement)
      .slice(0, 5);
  }, [postsQuery.data]);

  return (
    <>
      <PageHeader
        eyebrow="Analytics"
        title="Read performance without digging through noise"
        description="Track reach and engagement, isolate the posts driving results, and keep the current measurement window visible across the whole analytics surface."
        tags={
          <>
            <GlassTag tone="accent">{range} day view</GlassTag>
            <GlassTag tone="success">
              Reach {formatNumber(overviewQuery.data?.totalReach ?? 0)}
            </GlassTag>
            <GlassTag tone="neutral">
              Comments {formatNumber(overviewQuery.data?.totalComments ?? 0)}
            </GlassTag>
          </>
        }
        actions={
          <SegmentedControl
            legend="Analytics range"
            options={[
              { label: '7D', value: '7' },
              { label: '30D', value: '30' }
            ]}
            value={String(range) as '7' | '30'}
            onChange={nextValue => {
              setRange(nextValue === '7' ? 7 : 30);
            }}
            containerClassName="flex rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-1"
            itemClassName="inline-flex rounded-md px-3 py-2 text-sm font-medium transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--accent)]"
            activeClassName="bg-[var(--accent)] text-white"
            inactiveClassName="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          />
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Likes"
          value={formatNumber(overviewQuery.data?.totalLikes ?? 0)}
          accent="blue"
          hint="Total likes across tracked posts."
        />
        <MetricCard
          label="Comments"
          value={formatNumber(overviewQuery.data?.totalComments ?? 0)}
          accent="teal"
          hint="All comments included in analytics tracking."
        />
        <MetricCard
          label="Reach"
          value={formatNumber(overviewQuery.data?.totalReach ?? 0)}
          accent="blue"
          hint="Audience reached within the selected data window."
        />
        <MetricCard
          label="Engagement"
          value={formatNumber(overviewQuery.data?.totalEngagement ?? 0)}
          accent="coral"
          hint="Combined interaction volume across tracked content."
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="space-y-5 p-5">
          <SectionHeading
            eyebrow="Reach trend"
            title="Performance curve"
            description="Use this view to check whether current publishing is pushing distribution up, flattening out, or dropping."
          />

          <AreaTrendChart
            points={trendSeries}
            label={`Reach over the last ${range} days`}
          />
        </Card>

        <Card className="space-y-5 p-5">
          <SectionHeading
            eyebrow="Mix"
            title="Engagement distribution"
            description="A compact breakdown of which interaction types are dominating the current content mix."
          />

          <DonutChart
            segments={engagementMix}
            centerLabel={formatNumber(overviewQuery.data?.totalEngagement ?? 0)}
          />
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.86fr_1.14fr]">
        <Card className="space-y-5 p-5">
          <SectionHeading
            eyebrow="Top content"
            title="Posts pulling the strongest engagement"
            description="Use this ranking to identify which content patterns are worth repeating in the next scheduling cycle."
          />

          {performanceBars.length > 0 ? (
            <PostPerformanceBars bars={performanceBars} />
          ) : (
            <EmptyState
              title="No post performance data yet"
              description="Publish content first, then analytics will start surfacing top-performing posts here."
            />
          )}
        </Card>

        <Card className="space-y-5 p-5">
          <SectionHeading
            eyebrow="Tracked posts"
            title="Per-post measurement log"
            description="Each row keeps the latest metrics, publish state, and last successful fetch time visible in one operational list."
          />

          <div className="grid gap-3">
            {topPosts.map(post => (
              <article key={post.id} className="contents">
                <Card
                  className={`${subtlePanelClassName} grid gap-4 p-4 shadow-none xl:grid-cols-[1.15fr_0.85fr]`}
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold">
                        {post.title ?? 'Untitled post'}
                      </h3>
                      <StatusBadge tone={getStatusTone(post.status)}>
                        {post.status}
                      </StatusBadge>
                    </div>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Facebook Post ID: {post.facebookPostId ?? 'Not published'}
                    </p>
                    <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                      Last fetched {formatDate(post.metrics.fetchedAt)}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Card
                      className={`${tilePanelClassName} px-4 py-3 text-sm shadow-none`}
                    >
                      Likes {formatNumber(post.metrics.likes)}
                    </Card>
                    <Card
                      className={`${tilePanelClassName} px-4 py-3 text-sm shadow-none`}
                    >
                      Comments {formatNumber(post.metrics.comments)}
                    </Card>
                    <Card
                      className={`${tilePanelClassName} px-4 py-3 text-sm shadow-none`}
                    >
                      Reach {formatNumber(post.metrics.reach)}
                    </Card>
                    <Card
                      className={`${tilePanelClassName} px-4 py-3 text-sm shadow-none`}
                    >
                      Engagement {formatNumber(post.metrics.engagement)}
                    </Card>
                  </div>
                </Card>
              </article>
            ))}
          </div>

          {!postsQuery.isLoading && topPosts.length === 0 ? (
            <EmptyState
              title="No tracked posts yet"
              description="Analytics detail appears after published posts start flowing through the metrics job."
            />
          ) : null}
        </Card>
      </section>

      {overviewQuery.error ? (
        <ErrorCallout
          title="Unable to load overview metrics"
          error={overviewQuery.error}
        />
      ) : null}

      {postsQuery.error ? (
        <ErrorCallout
          title="Unable to load post analytics"
          error={postsQuery.error}
        />
      ) : null}
    </>
  );
}
