'use client';

import { useDeferredValue, useState } from 'react';

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
import {
  InputControl,
  SelectControl,
  TextAreaControl
} from '@/components/ui/form-controls';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { useReplyToCommentsMutation } from '@/features/dashboard/hooks/use-dashboard-mutations';
import {
  useDashboardAnalyticsPostsQuery,
  useDashboardPostsQuery
} from '@/features/dashboard/hooks/use-dashboard-queries';
import {
  buildCommentInbox,
  buildCommentSummary
} from '@/features/dashboard/lib/derivations';
import {
  formatDate,
  formatPostStatus,
  getStatusTone
} from '@/features/dashboard/lib/format';

type InboxFilter = 'all' | 'priority' | 'recent';

const quickReplies = [
  'Thanks for the feedback.',
  'Appreciate the comment. We will review this.',
  'Thanks. Please check your inbox for more details.'
];

export function CommentsView() {
  const [search, setSearch] = useState('');
  const [selectedPostId, setSelectedPostId] = useState<string>('all');
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>('all');
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [referenceNow] = useState(() => Date.now());

  const deferredSearch = useDeferredValue(search);
  const postsQuery = useDashboardPostsQuery();
  const analyticsPostsQuery = useDashboardAnalyticsPostsQuery();
  const replyMutation = useReplyToCommentsMutation();

  const inboxItems = buildCommentInbox(
    analyticsPostsQuery.data ?? [],
    postsQuery.data ?? []
  );
  const summary = buildCommentSummary(inboxItems);

  const filteredItems = inboxItems.filter(item => {
    if (selectedPostId !== 'all' && item.postId !== selectedPostId) {
      return false;
    }

    if (inboxFilter === 'priority' && item.commentCount < 5) {
      return false;
    }

    if (inboxFilter === 'recent') {
      if (!item.updatedAt) {
        return false;
      }

      const age = referenceNow - new Date(item.updatedAt).getTime();

      if (age > 1000 * 60 * 60 * 24 * 3) {
        return false;
      }
    }

    const searchValue = deferredSearch.trim().toLowerCase();

    if (!searchValue) {
      return true;
    }

    return [item.postTitle, item.snippet, item.postStatus]
      .join(' ')
      .toLowerCase()
      .includes(searchValue);
  });

  const activeItem =
    filteredItems.find(item => item.id === activeItemId) ??
    filteredItems[0] ??
    null;

  return (
    <>
      <PageHeader
        eyebrow="Comments"
        title="Comments"
        tags={
          <>
            <GlassTag tone="accent">
              {summary.activeThreads} active thread
              {summary.activeThreads === 1 ? '' : 's'}
            </GlassTag>
            <GlassTag tone="warning">{summary.priority} priority</GlassTag>
            <GlassTag tone="neutral">Inbox</GlassTag>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Threads"
          value={summary.activeThreads}
          accent="blue"
          hint="Posts currently showing comment activity."
        />
        <MetricCard
          label="Priority"
          value={summary.priority}
          accent="coral"
          hint="Higher-volume comment threads to review first."
        />
        <MetricCard
          label="Recent"
          value={summary.recent}
          accent="teal"
          hint="Threads updated in the last three days."
        />
        <MetricCard
          label="Comments"
          value={summary.totalComments}
          accent="blue"
          hint="Total comment count across tracked posts."
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.94fr_1.06fr]">
        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <SectionHeading eyebrow="Inbox" title="Conversation queue" />

            <Card className="bg-[var(--panel-strong)] px-4 py-3 text-sm text-muted-foreground shadow-none">
              Showing {filteredItems.length}
            </Card>
          </div>

          <Card
            className={`${subtlePanelClassName} mt-6 space-y-4 p-4 shadow-none`}
          >
            <SegmentedControl
              legend="Comment inbox filter"
              options={[
                { label: 'All', value: 'all' },
                { label: 'Priority', value: 'priority' },
                { label: 'Recent', value: 'recent' }
              ]}
              value={inboxFilter}
              onChange={setInboxFilter}
              containerClassName="flex flex-wrap gap-2 rounded-[1rem]"
              itemClassName="inline-flex rounded-xl border px-4 py-2 text-sm font-medium transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring"
              activeClassName="border-primary/30 bg-primary/10 text-primary"
              inactiveClassName="border-[var(--line)] bg-[var(--panel-strong)] text-foreground hover:border-[var(--line-strong)]"
            />

            <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
              <InputControl
                className="mt-0"
                value={search}
                onChange={event => {
                  setSearch(event.target.value);
                }}
                aria-label="Search comment inbox"
                autoComplete="off"
                placeholder="Search by post title or content"
              />
              <SelectControl
                className="mt-0"
                aria-label="Filter comments by post"
                value={selectedPostId}
                onChange={event => {
                  setSelectedPostId(event.target.value);
                }}
              >
                <option value="all">All posts</option>
                {inboxItems.map(item => (
                  <option key={item.id} value={item.postId}>
                    {item.postTitle}
                  </option>
                ))}
              </SelectControl>
            </div>
          </Card>

          <div className="mt-6 space-y-3">
            {filteredItems.map(item => (
              <Card
                key={item.id}
                className={`${subtlePanelClassName} w-full p-4 text-left shadow-none ${
                  activeItem?.id === item.id
                    ? 'ring-2 ring-primary/20 border-primary/30'
                    : ''
                }`}
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => {
                    setActiveItemId(item.id);
                  }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="max-w-[78%]">
                      <p className="font-semibold">{item.postTitle}</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {item.snippet}
                      </p>
                    </div>
                    <StatusBadge
                      tone={item.commentCount >= 5 ? 'warning' : 'muted'}
                    >
                      {item.commentCount} comment
                      {item.commentCount === 1 ? '' : 's'}
                    </StatusBadge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    <span>{formatPostStatus(item.postStatus)}</span>
                    <span>•</span>
                    <span>{formatDate(item.updatedAt)}</span>
                  </div>
                </button>
              </Card>
            ))}

            {!analyticsPostsQuery.isLoading && filteredItems.length === 0 ? (
              <Card className="border-dashed border-[var(--line-strong)] px-4 py-6 text-sm text-muted-foreground shadow-none">
                No comment-heavy posts match the current filter.
              </Card>
            ) : null}
          </div>
        </Card>

        <Card className="p-5">
          <SectionHeading eyebrow="Reply" title="Prepare the next response" />

          {activeItem ? (
            <div className="mt-6 space-y-4">
              <Card className={`${subtlePanelClassName} p-4 shadow-none`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="max-w-[78%]">
                    <p className="font-semibold">{activeItem.postTitle}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {activeItem.snippet}
                    </p>
                  </div>
                  <StatusBadge tone={getStatusTone(activeItem.postStatus)}>
                    {formatPostStatus(activeItem.postStatus)}
                  </StatusBadge>
                </div>
              </Card>

              <Card className="bg-[var(--panel-contrast)] p-5">
                <div className="flex flex-wrap gap-2.5">
                  <GlassTag tone="neutral">Live reply</GlassTag>
                  <GlassTag tone="success">Facebook sync</GlassTag>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {quickReplies.map(reply => (
                    <Button
                      key={reply}
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setReplyDraft(reply);
                      }}
                    >
                      {reply}
                    </Button>
                  ))}
                </div>

                <TextAreaControl
                  className="mt-4"
                  value={replyDraft}
                  onChange={event => {
                    setReplyDraft(event.target.value);
                  }}
                  placeholder="Write a thoughtful reply to the selected post comments"
                />

                <div className="mt-4 flex flex-wrap gap-3">
                  <Button
                    type="button"
                    onClick={() => {
                      void replyMutation
                        .mutateAsync({
                          postId: activeItem.postId,
                          message: replyDraft
                        })
                        .then(() => {
                          setReplyDraft('');
                        });
                    }}
                    disabled={
                      replyDraft.trim().length === 0 || replyMutation.isPending
                    }
                  >
                    Send reply
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setReplyDraft('');
                    }}
                  >
                    Clear
                  </Button>
                </div>
                <Card className="mt-4 bg-[var(--panel-strong)] px-4 py-3 text-sm text-muted-foreground shadow-none">
                  Replies are posted to the Facebook post thread for the
                  selected content item.
                </Card>
              </Card>
            </div>
          ) : (
            <Card className="mt-6 border-dashed border-[var(--line-strong)] px-4 py-6 text-sm text-muted-foreground shadow-none">
              No comment activity yet. Publish content and collect comment
              signals to populate this inbox.
            </Card>
          )}
        </Card>
      </section>

      {(postsQuery.error || analyticsPostsQuery.error) && (
        <ErrorCallout
          title="Unable to load comment inbox"
          error={postsQuery.error ?? analyticsPostsQuery.error}
        />
      )}
    </>
  );
}
