'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ErrorCallout,
  GlassTag,
  MetricCard,
  PageHeader,
  SectionHeading,
  StatusBadge,
  subtlePanelClassName
} from '@/components/ui/dashboard-primitives';
import { InputControl } from '@/components/ui/form-controls';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { useSchedulePostMutation } from '@/features/dashboard/hooks/use-dashboard-mutations';
import {
  useDashboardAccountsQuery,
  useDashboardPostsQuery
} from '@/features/dashboard/hooks/use-dashboard-queries';
import {
  buildPostStatusSummary,
  buildSchedulerColumns,
  buildSchedulerMonth
} from '@/features/dashboard/lib/derivations';
import {
  formatDate,
  formatPostStatus,
  getStatusTone
} from '@/features/dashboard/lib/format';

function getWeekStart(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const delta = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + delta);
  copy.setHours(0, 0, 0, 0);
  return copy;
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

export function SchedulerView() {
  const [mode, setMode] = useState<'week' | 'month'>('week');
  const [anchorDate, setAnchorDate] = useState(() => getWeekStart(new Date()));
  const [quickTime, setQuickTime] = useState('09:00');
  const [draggedPostId, setDraggedPostId] = useState<string | null>(null);

  const postsQuery = useDashboardPostsQuery();
  const accountsQuery = useDashboardAccountsQuery();
  const scheduleMutation = useSchedulePostMutation();

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const today = new Date();
  const draftPosts = (postsQuery.data ?? []).filter(
    post => post.status === 'draft'
  );
  const scheduledPosts = (postsQuery.data ?? []).filter(
    post => post.status === 'scheduled'
  );
  const weekColumns = buildSchedulerColumns(
    scheduledPosts,
    accountsQuery.data ?? [],
    anchorDate
  );
  const monthDays = buildSchedulerMonth(scheduledPosts, anchorDate);
  const statusSummary = buildPostStatusSummary(postsQuery.data ?? []);
  const scheduledCount =
    statusSummary.find(item => item.status === 'scheduled')?.value ?? 0;
  const publishedCount =
    statusSummary.find(item => item.status === 'published')?.value ?? 0;
  const periodLabel = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric'
  }).format(anchorDate);

  async function scheduleToDate(postId: string, date: Date) {
    const [hours, minutes] = quickTime.split(':');
    const nextDate = new Date(date);
    nextDate.setHours(Number(hours), Number(minutes), 0, 0);

    await scheduleMutation.mutateAsync({
      postId,
      scheduledAt: nextDate.toISOString()
    });
  }

  return (
    <>
      <PageHeader
        eyebrow="Scheduler"
        title="Scheduler"
        tags={
          <>
            <GlassTag tone="accent">
              {draftPosts.length} ready to place
            </GlassTag>
            <GlassTag tone="neutral">
              Timezone {timezone.replace('_', ' ')}
            </GlassTag>
            <GlassTag tone="neutral">
              {mode === 'week' ? 'Week view' : 'Month view'}
            </GlassTag>
          </>
        }
        actions={
          <>
            <SegmentedControl
              legend="Scheduler mode"
              options={[
                { label: 'Weekly', value: 'week' },
                { label: 'Monthly', value: 'month' }
              ]}
              value={mode}
              onChange={setMode}
              containerClassName="inline-flex rounded-xl border border-border bg-muted p-1"
              itemClassName="inline-flex min-w-[96px] justify-center rounded-lg px-4 py-2 text-sm font-medium transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring"
              activeClassName="bg-background text-foreground shadow-sm"
              inactiveClassName="text-muted-foreground hover:text-foreground"
            />
            <div className="flex items-center gap-1 rounded-xl border border-border bg-muted p-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAnchorDate(
                    addDays(anchorDate, mode === 'week' ? -7 : -28)
                  );
                }}
              >
                Prev
              </Button>
              <span className="min-w-[84px] text-center text-sm font-medium text-foreground">
                {periodLabel}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAnchorDate(addDays(anchorDate, mode === 'week' ? 7 : 28));
                }}
              >
                Next
              </Button>
            </div>
            <InputControl
              className="mt-0 h-9 w-[128px]"
              type="time"
              aria-label="Quick publish time"
              value={quickTime}
              onChange={event => {
                setQuickTime(event.target.value);
              }}
            />
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Draft queue"
          value={draftPosts.length}
          accent="blue"
          hint="Drafts waiting to be placed onto the calendar."
        />
        <MetricCard
          label="Scheduled"
          value={scheduledCount}
          accent="teal"
          hint="Posts already locked into the calendar."
        />
        <MetricCard
          label="Published"
          value={publishedCount}
          accent="coral"
          hint="Published posts stay visible for reference."
        />
        <MetricCard
          label="Pages"
          value={accountsQuery.data?.length ?? 0}
          accent="blue"
          hint="Connected destinations for scheduling."
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.12fr_0.88fr]">
        <Card className="p-5">
          <SectionHeading
            eyebrow="Calendar"
            title={mode === 'week' ? 'Weekly calendar' : 'Monthly calendar'}
          />

          {mode === 'week' ? (
            <div className="mt-6 overflow-x-auto pb-2">
              <div className="grid min-w-[980px] grid-cols-7 gap-3">
                {weekColumns.map(column => (
                  <div
                    key={column.key}
                    className={`rounded-[1rem] border p-3 ${
                      isSameDay(column.date, today)
                        ? 'border-primary/30 bg-primary/10'
                        : 'border-[var(--line)] bg-[var(--panel-contrast)]'
                    }`}
                    onDragOver={event => {
                      event.preventDefault();
                    }}
                    onDrop={event => {
                      event.preventDefault();

                      if (!draggedPostId) {
                        return;
                      }

                      void scheduleToDate(draggedPostId, column.date).finally(
                        () => {
                          setDraggedPostId(null);
                        }
                      );
                    }}
                  >
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      {column.label}
                    </p>
                    <p className="mt-1 font-semibold">{column.dateLabel}</p>

                    <div className="mt-3 space-y-2">
                      {column.slots.map(slot => (
                        <Card
                          key={slot.id}
                          className={`${subtlePanelClassName} overflow-hidden p-3 shadow-none`}
                        >
                          <p className="line-clamp-2 text-sm font-semibold leading-5">
                            {slot.title}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <StatusBadge tone={getStatusTone(slot.status)}>
                              {formatPostStatus(slot.status)}
                            </StatusBadge>
                            <span className="text-xs text-muted-foreground">
                              {slot.timeLabel}
                            </span>
                          </div>
                          <p className="mt-2 truncate text-xs text-muted-foreground">
                            {slot.accountLabel}
                          </p>
                        </Card>
                      ))}

                      {column.slots.length === 0 ? (
                        <Card className="border-dashed border-[var(--line-strong)] px-3 py-5 text-center text-sm text-muted-foreground shadow-none">
                          Drop here
                        </Card>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
              {monthDays.map(day => (
                <div
                  key={day.key}
                  className={`rounded-[1rem] border p-3 ${
                    day.isCurrentMonth
                      ? isSameDay(day.date, today)
                        ? 'border-primary/30 bg-primary/10'
                        : 'border-[var(--line)] bg-[var(--panel-contrast)]'
                      : 'border-[var(--line)] bg-[var(--panel-strong)] opacity-70'
                  }`}
                  onDragOver={event => {
                    event.preventDefault();
                  }}
                  onDrop={event => {
                    event.preventDefault();

                    if (!draggedPostId) {
                      return;
                    }

                    void scheduleToDate(draggedPostId, day.date).finally(() => {
                      setDraggedPostId(null);
                    });
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{day.label}</p>
                    <span className="text-xs text-muted-foreground">
                      {day.items.length}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    {day.items.slice(0, 3).map(item => (
                      <Card
                        key={item.id}
                        className="rounded-[1rem] bg-[var(--panel)] px-2 py-2 text-xs shadow-none"
                      >
                        <p className="truncate font-medium">{item.title}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {scheduleMutation.error ? (
            <ErrorCallout
              title="Unable to update the schedule"
              error={scheduleMutation.error}
              className="mt-5"
            />
          ) : null}
        </Card>

        <Card className="p-5">
          <SectionHeading eyebrow="Queue" title="Ready to schedule" />

          <div className="mt-6 space-y-3">
            {draftPosts.map(post => (
              <Card
                key={post.id}
                draggable
                onDragStart={() => {
                  setDraggedPostId(post.id);
                }}
                className={`${subtlePanelClassName} cursor-grab p-4 shadow-none active:cursor-grabbing`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {post.title ?? 'Untitled post'}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {post.content}
                    </p>
                  </div>
                  <StatusBadge tone={getStatusTone(post.status)}>
                    {formatPostStatus(post.status)}
                  </StatusBadge>
                </div>
                <p className="mt-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  {post.scheduledAt
                    ? `Scheduled ${formatDate(post.scheduledAt)}`
                    : 'Draft'}
                </p>
              </Card>
            ))}

            {draftPosts.length === 0 ? (
              <Card className="border-dashed border-[var(--line-strong)] px-4 py-6 text-sm text-muted-foreground shadow-none">
                No draft posts are available for the calendar right now.
              </Card>
            ) : null}
          </div>

          <div className="mt-6 grid gap-3">
            <Card className={`${subtlePanelClassName} p-4 shadow-none`}>
              <p className="font-semibold">Current publish time</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Drag-and-drop scheduling uses {quickTime} in{' '}
                {timezone.replace('_', ' ')}.
              </p>
            </Card>
          </div>
        </Card>
      </section>
    </>
  );
}
