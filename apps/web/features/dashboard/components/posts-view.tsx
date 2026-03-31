'use client';
/* eslint-disable @next/next/no-img-element */

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  EmptyState,
  ErrorCallout,
  FieldError,
  GlassTag,
  InfoRow,
  MetricCard,
  PageHeader,
  SectionHeading,
  StatusBadge,
  dangerPanelClassName,
  glassFieldsetClassName,
  subtlePanelClassName,
  tilePanelClassName
} from '@/components/ui/dashboard-primitives';
import {
  InputControl,
  SelectControl,
  TextAreaControl
} from '@/components/ui/form-controls';
import { Label } from '@/components/ui/label';
import { SegmentedControl } from '@/components/ui/segmented-control';
import {
  useDeletePostMutation,
  usePublishPostMutation,
  useSavePostMutation,
  useSchedulePostMutation
} from '@/features/dashboard/hooks/use-dashboard-mutations';
import {
  useDashboardAccountsQuery,
  useDashboardBillingQuery,
  useDashboardPostsQuery
} from '@/features/dashboard/hooks/use-dashboard-queries';
import { buildPostStatusSummary } from '@/features/dashboard/lib/derivations';
import {
  emptyPostForm,
  postFormSchema,
  type PostFormValues
} from '@/features/dashboard/lib/schemas';
import {
  formatDate,
  formatPostStatus,
  getStatusTone,
  toDateTimeLocalValue
} from '@/features/dashboard/lib/format';

type PostFilter = 'all' | 'draft' | 'scheduled' | 'published' | 'failed';

function truncateCopy(value: string, max = 160) {
  if (value.length <= max) {
    return value;
  }

  return `${value.slice(0, max).trim()}...`;
}

function getSafePreviewUrl(value?: string | null) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    const isSecure = url.protocol === 'https:';
    const isLocalHttp =
      url.protocol === 'http:' &&
      ['localhost', '127.0.0.1'].includes(url.hostname);

    return isSecure || isLocalHttp ? url.toString() : null;
  } catch {
    return null;
  }
}

export function PostsView() {
  const postsQuery = useDashboardPostsQuery();
  const billingQuery = useDashboardBillingQuery();
  const accountsQuery = useDashboardAccountsQuery();

  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [postSearch, setPostSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PostFilter>('all');
  const [scheduleValues, setScheduleValues] = useState<Record<string, string>>(
    {}
  );
  const [newScheduleAt, setNewScheduleAt] = useState('');

  const deferredPostSearch = useDeferredValue(postSearch);
  const savePostMutation = useSavePostMutation(editingPostId);
  const publishPostMutation = usePublishPostMutation();
  const deletePostMutation = useDeletePostMutation();
  const schedulePostMutation = useSchedulePostMutation();

  const editingPost =
    (postsQuery.data ?? []).find(post => post.id === editingPostId) ?? null;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const form = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: emptyPostForm
  });

  useEffect(() => {
    if (!editingPost) {
      form.reset(emptyPostForm);
      setNewScheduleAt('');
      return;
    }

    form.reset({
      title: editingPost.title ?? '',
      content: editingPost.content,
      mediaUrl: editingPost.mediaUrl ?? '',
      facebookAccountId: editingPost.facebookAccountId ?? ''
    });
    setNewScheduleAt(toDateTimeLocalValue(editingPost.scheduledAt));
  }, [editingPost, form]);

  const watchedValues = form.watch();
  const statusSummary = buildPostStatusSummary(postsQuery.data ?? []);

  const filteredPosts = useMemo(() => {
    return (postsQuery.data ?? []).filter(post => {
      const search = deferredPostSearch.trim().toLowerCase();

      if (statusFilter !== 'all' && post.status !== statusFilter) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [
        post.title ?? '',
        post.content,
        post.status,
        post.facebookPostId ?? ''
      ]
        .join(' ')
        .toLowerCase()
        .includes(search);
    });
  }, [deferredPostSearch, postsQuery.data, statusFilter]);

  const selectedAccount = (accountsQuery.data ?? []).find(
    account => account.id === watchedValues.facebookAccountId
  );
  const previewMediaUrl = getSafePreviewUrl(watchedValues.mediaUrl);
  const scheduledCount =
    statusSummary.find(item => item.status === 'scheduled')?.value ?? 0;
  const failedCount =
    statusSummary.find(item => item.status === 'failed')?.value ?? 0;
  const draftCount =
    statusSummary.find(item => item.status === 'draft')?.value ?? 0;
  const queueLimit = billingQuery.data?.plan.scheduledLimit ?? 0;

  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Run the content pipeline from one workspace"
        description="Draft new posts, lock in schedule times, and act on queue items without switching between separate compose and management screens."
        tags={
          <>
            <GlassTag tone="accent">
              {filteredPosts.length} visible item
              {filteredPosts.length === 1 ? '' : 's'}
            </GlassTag>
            <GlassTag tone="neutral">
              {accountsQuery.data?.length ?? 0} page
              {(accountsQuery.data?.length ?? 0) === 1 ? '' : 's'}
            </GlassTag>
            <GlassTag tone="neutral">
              Timezone {timezone.replace('_', ' ')}
            </GlassTag>
          </>
        }
        actions={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setEditingPostId(null);
                form.reset(emptyPostForm);
                setNewScheduleAt('');
              }}
            >
              New draft
            </Button>
            <Button asChild>
              <Link href="/dashboard/scheduler">Open scheduler</Link>
            </Button>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Queue"
          value={statusSummary.find(item => item.status === 'all')?.value ?? 0}
          accent="blue"
          hint="All posts currently stored in the workspace."
        />
        <MetricCard
          label="Drafts"
          value={draftCount}
          accent="teal"
          hint="Posts still being prepared before publish time."
        />
        <MetricCard
          label="Scheduled"
          value={scheduledCount}
          accent="blue"
          hint="Posts waiting in the delivery queue."
        />
        <MetricCard
          label="Needs Review"
          value={failedCount}
          accent="coral"
          hint="Posts that failed to publish or need attention."
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.88fr_1.12fr]">
        <Card className="space-y-5 p-5">
          <SectionHeading
            eyebrow="Compose"
            title={editingPost ? 'Update the selected post' : 'Create a post'}
            description="Keep the composer narrow and operational. Add the caption, choose a target page, and decide whether this draft should enter the schedule immediately."
          />

          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(async values => {
              const saved = await savePostMutation.mutateAsync({
                title: values.title || undefined,
                content: values.content,
                mediaUrl: values.mediaUrl || undefined,
                facebookAccountId: values.facebookAccountId || undefined
              });

              if (newScheduleAt) {
                await schedulePostMutation.mutateAsync({
                  postId: saved.id,
                  scheduledAt: newScheduleAt
                });
              }

              setEditingPostId(null);
              form.reset(emptyPostForm);
              setNewScheduleAt('');
            })}
          >
            <Card
              className={`${glassFieldsetClassName} grid gap-4 shadow-none`}
            >
              <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
                <label className="block text-sm">
                  <Label>Internal title</Label>
                  <InputControl
                    placeholder="Campaign, launch, or content note"
                    invalid={Boolean(form.formState.errors.title)}
                    {...form.register('title')}
                  />
                  <FieldError message={form.formState.errors.title?.message} />
                </label>

                <label className="block text-sm">
                  <Label>Target page</Label>
                  <SelectControl
                    invalid={Boolean(form.formState.errors.facebookAccountId)}
                    {...form.register('facebookAccountId')}
                  >
                    <option value="">Default connected page</option>
                    {(accountsQuery.data ?? []).map(account => (
                      <option key={account.id} value={account.id}>
                        {account.pageName}
                      </option>
                    ))}
                  </SelectControl>
                  <FieldError
                    message={form.formState.errors.facebookAccountId?.message}
                  />
                </label>
              </div>

              <label className="block text-sm">
                <Label>Caption</Label>
                <TextAreaControl
                  placeholder="Write the Facebook caption here"
                  invalid={Boolean(form.formState.errors.content)}
                  {...form.register('content')}
                />
                <FieldError message={form.formState.errors.content?.message} />
              </label>

              <label className="block text-sm">
                <Label>Media URL</Label>
                <InputControl
                  placeholder="https://..."
                  invalid={Boolean(form.formState.errors.mediaUrl)}
                  {...form.register('mediaUrl')}
                />
                <FieldError message={form.formState.errors.mediaUrl?.message} />
              </label>

              <label className="block text-sm">
                <Label>Initial schedule time</Label>
                <InputControl
                  type="datetime-local"
                  aria-label="Initial schedule time"
                  value={newScheduleAt}
                  onChange={event => {
                    setNewScheduleAt(event.target.value);
                  }}
                />
                <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                  Local scheduling uses {timezone.replace('_', ' ')}.
                </p>
              </label>
            </Card>

            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                disabled={
                  savePostMutation.isPending || schedulePostMutation.isPending
                }
              >
                {editingPost ? 'Save changes' : 'Create post'}
              </Button>

              {editingPost ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setEditingPostId(null);
                    form.reset(emptyPostForm);
                    setNewScheduleAt('');
                  }}
                >
                  Cancel edit
                </Button>
              ) : null}
            </div>
          </form>

          {savePostMutation.error ? (
            <ErrorCallout
              title="Unable to save post"
              error={savePostMutation.error}
            />
          ) : null}

          {schedulePostMutation.error ? (
            <ErrorCallout
              title="Unable to schedule post"
              error={schedulePostMutation.error}
            />
          ) : null}
        </Card>

        <Card className="space-y-5 p-5">
          <SectionHeading
            eyebrow="Operator View"
            title="Live preview and queue health"
            description="Keep the draft preview, queue usage, and execution signals visible while you compose."
          />

          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <Card
              className={`${subtlePanelClassName} overflow-hidden shadow-none`}
            >
              {watchedValues.mediaUrl ? (
                <div className="relative h-56 w-full border-b border-[var(--line)] bg-[var(--panel)]">
                  {previewMediaUrl ? (
                    <img
                      src={previewMediaUrl}
                      alt="Post preview"
                      className="h-full w-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-6 text-center text-sm text-[var(--muted-foreground)]">
                      Preview is available for HTTPS media URLs only.
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-56 items-center justify-center border-b border-[var(--line)] bg-[var(--panel-strong)] text-sm text-[var(--muted-foreground)]">
                  Media preview will appear here
                </div>
              )}

              <div className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold">
                      {watchedValues.title || 'Untitled post'}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      {selectedAccount?.pageName ?? 'Default connected page'}
                    </p>
                  </div>
                  <StatusBadge tone={editingPost ? 'warning' : 'muted'}>
                    {editingPost ? 'Editing' : 'Draft'}
                  </StatusBadge>
                </div>

                <p className="text-sm leading-7 text-[var(--foreground-soft)]">
                  {watchedValues.content ||
                    'Start writing to preview how the post will read inside the queue.'}
                </p>
              </div>
            </Card>

            <div className="space-y-4">
              <Card className={`${subtlePanelClassName} p-4 shadow-none`}>
                <p className="eyebrow text-[11px] text-[var(--accent-secondary)]">
                  Queue usage
                </p>
                <p className="mt-3 text-3xl font-semibold">
                  {scheduledCount}
                  <span className="ml-2 text-base font-medium text-[var(--muted-foreground)]">
                    / {queueLimit > 0 ? queueLimit : 'Unlimited'}
                  </span>
                </p>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  Scheduled posts against the current plan allowance.
                </p>
              </Card>

              <Card className={`${subtlePanelClassName} p-4 shadow-none`}>
                <p className="eyebrow text-[11px] text-[var(--accent-secondary)]">
                  Publishing readiness
                </p>
                <div className="mt-3 space-y-3">
                  <InfoRow
                    label="Caption"
                    value={
                      watchedValues.content.trim()
                        ? 'Ready for review'
                        : 'Waiting for content'
                    }
                  />
                  <InfoRow
                    label="Destination"
                    value={selectedAccount?.pageName ?? 'Default page'}
                  />
                  <InfoRow
                    label="Schedule"
                    value={
                      newScheduleAt ? formatDate(newScheduleAt) : 'Draft only'
                    }
                  />
                </div>
              </Card>

              <Card className={`${tilePanelClassName} p-4 shadow-none`}>
                <p className="font-semibold">Operational note</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                  Use the scheduler for bulk timing changes. Use this screen
                  when you need to create, edit, publish, or reschedule one item
                  quickly.
                </p>
              </Card>
            </div>
          </div>
        </Card>
      </section>

      <Card className="space-y-5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <SectionHeading
            eyebrow="Queue"
            title="Active content inventory"
            description="Filter by workflow state, scan each item quickly, and act on scheduling or publishing from the same operational list."
          />

          <SegmentedControl
            legend="Post status filter"
            options={statusSummary.map(item => ({
              label: `${item.label} (${item.value})`,
              value: item.status as PostFilter
            }))}
            value={statusFilter}
            onChange={setStatusFilter}
            containerClassName="flex flex-wrap gap-2 rounded-[1rem]"
            itemClassName="inline-flex rounded-lg border px-3 py-2 text-sm font-medium transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--accent)]"
            activeClassName="border-[color:color-mix(in_srgb,var(--accent)_40%,transparent)] bg-[var(--accent-soft)] text-[var(--accent-deep)]"
            inactiveClassName="border-[var(--line)] bg-[var(--panel-strong)] text-[var(--foreground)] hover:border-[var(--line-strong)]"
          />
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
          <InputControl
            className="mt-0"
            value={postSearch}
            onChange={event => {
              setPostSearch(event.target.value);
            }}
            aria-label="Search posts"
            autoComplete="off"
            placeholder="Search title, caption, status, or Facebook post ID"
          />
          <Card
            className={`${tilePanelClassName} flex items-center px-4 py-3 text-sm shadow-none`}
          >
            {billingQuery.data?.plan.isPro
              ? 'Pro plan active. Queue limit is expanded.'
              : 'Free plan active. Upgrade if the schedule fills up.'}
          </Card>
        </div>

        <div className="space-y-3">
          {filteredPosts.map(post => {
            const scheduleValue =
              scheduleValues[post.id] ?? toDateTimeLocalValue(post.scheduledAt);

            return (
              <Card
                key={post.id}
                className={`${subtlePanelClassName} grid gap-4 p-4 shadow-none xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-lg font-semibold">
                          {post.title ?? 'Untitled post'}
                        </p>
                        <StatusBadge tone={getStatusTone(post.status)}>
                          {formatPostStatus(post.status)}
                        </StatusBadge>
                      </div>
                      <p className="max-w-3xl text-sm leading-6 text-[var(--muted-foreground)]">
                        {truncateCopy(post.content)}
                      </p>
                    </div>

                    {post.mediaUrl ? (
                      <div className="relative hidden h-24 w-24 overflow-hidden rounded-lg border border-[var(--line)] xl:block">
                        {getSafePreviewUrl(post.mediaUrl) ? (
                          <img
                            src={getSafePreviewUrl(post.mediaUrl) as string}
                            alt={post.title ?? 'Post media'}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center px-2 text-center text-[11px] text-[var(--muted-foreground)]">
                            No preview
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <Card
                      className={`${tilePanelClassName} px-4 py-3 text-sm shadow-none`}
                    >
                      Created {formatDate(post.createdAt)}
                    </Card>
                    <Card
                      className={`${tilePanelClassName} px-4 py-3 text-sm shadow-none`}
                    >
                      Scheduled {formatDate(post.scheduledAt)}
                    </Card>
                    <Card
                      className={`${tilePanelClassName} px-4 py-3 text-sm shadow-none`}
                    >
                      Published {formatDate(post.publishedAt)}
                    </Card>
                    <Card
                      className={`${tilePanelClassName} px-4 py-3 text-sm shadow-none`}
                    >
                      FB ID {post.facebookPostId ?? 'Pending'}
                    </Card>
                  </div>

                  {post.lastError ? (
                    <Card
                      className={`${dangerPanelClassName} px-4 py-3 text-sm shadow-none`}
                    >
                      Last error: {post.lastError}
                    </Card>
                  ) : null}
                </div>

                <div className="space-y-3 border-t border-[var(--line)] pt-4 xl:border-t-0 xl:border-l xl:pl-4 xl:pt-0">
                  <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                    <InputControl
                      className="mt-0"
                      type="datetime-local"
                      aria-label={`Schedule time for ${post.title ?? 'post'}`}
                      value={scheduleValue}
                      onChange={event => {
                        setScheduleValues(current => ({
                          ...current,
                          [post.id]: event.target.value
                        }));
                      }}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        if (!scheduleValue) {
                          return;
                        }

                        void schedulePostMutation.mutateAsync({
                          postId: post.id,
                          scheduledAt: scheduleValue
                        });
                      }}
                      disabled={schedulePostMutation.isPending}
                    >
                      Reschedule
                    </Button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setEditingPostId(post.id);
                      }}
                      disabled={post.status === 'published'}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        void publishPostMutation.mutateAsync(post.id);
                      }}
                      disabled={
                        publishPostMutation.isPending ||
                        post.status === 'published'
                      }
                    >
                      Publish
                    </Button>
                    <Button asChild variant="secondary">
                      <Link href="/dashboard/scheduler">Queue view</Link>
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        void deletePostMutation.mutateAsync(post.id);
                      }}
                      disabled={
                        deletePostMutation.isPending ||
                        post.status === 'published'
                      }
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {!postsQuery.isLoading && filteredPosts.length === 0 ? (
          <EmptyState
            title="No posts match the current filter"
            description="Clear the search or switch queue states to find more content."
          />
        ) : null}

        {postsQuery.error ? (
          <ErrorCallout title="Unable to load posts" error={postsQuery.error} />
        ) : null}
        {publishPostMutation.error ? (
          <ErrorCallout
            title="Unable to publish post"
            error={publishPostMutation.error}
          />
        ) : null}
        {deletePostMutation.error ? (
          <ErrorCallout
            title="Unable to delete post"
            error={deletePostMutation.error}
          />
        ) : null}
      </Card>
    </>
  );
}
