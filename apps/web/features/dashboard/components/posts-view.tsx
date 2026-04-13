'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent
} from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PostMediaPreview } from '@/components/ui/post-media-preview';
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
  getMediaKind,
  getPostDisplayTitle,
  getPostExcerpt,
  getSafeMediaUrl,
  formatPostStatus,
  getStatusTone,
  toDateTimeLocalValue
} from '@/features/dashboard/lib/format';
import type {
  MediaUploadPayload,
  PostRecord
} from '@/features/dashboard/types';

type PostFilter = 'all' | 'draft' | 'scheduled' | 'published' | 'failed';
type MediaSource = 'url' | 'upload';

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

async function fileToUploadPayload(file: File): Promise<MediaUploadPayload> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return {
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    base64Data: btoa(binary)
  };
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
  const [mediaSource, setMediaSource] = useState<MediaSource>('url');
  const [selectedMediaFile, setSelectedMediaFile] = useState<File | null>(null);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);
  const [mediaInputError, setMediaInputError] = useState<string | null>(null);

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
      setMediaSource('url');
      setSelectedMediaFile(null);
      setMediaInputError(null);
      return;
    }

    form.reset({
      title: editingPost.title ?? '',
      content: editingPost.content,
      mediaUrl: editingPost.mediaUrl ?? '',
      facebookAccountId: editingPost.facebookAccountId ?? ''
    });
    setNewScheduleAt(toDateTimeLocalValue(editingPost.scheduledAt));
    setMediaSource('url');
    setSelectedMediaFile(null);
    setMediaInputError(null);
  }, [editingPost, form]);

  useEffect(() => {
    if (!selectedMediaFile) {
      setUploadPreviewUrl(null);
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(selectedMediaFile);
    setUploadPreviewUrl(nextPreviewUrl);

    return () => {
      URL.revokeObjectURL(nextPreviewUrl);
    };
  }, [selectedMediaFile]);

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
  const previewMediaUrl =
    mediaSource === 'upload'
      ? uploadPreviewUrl
      : getSafeMediaUrl(watchedValues.mediaUrl);
  const previewMediaKind =
    mediaSource === 'upload'
      ? selectedMediaFile?.type.startsWith('video/')
        ? 'video'
        : selectedMediaFile?.type.startsWith('image/')
          ? 'image'
          : null
      : getMediaKind(watchedValues.mediaUrl);
  const scheduledCount =
    statusSummary.find(item => item.status === 'scheduled')?.value ?? 0;
  const failedCount =
    statusSummary.find(item => item.status === 'failed')?.value ?? 0;
  const draftCount =
    statusSummary.find(item => item.status === 'draft')?.value ?? 0;
  const queueLimit = billingQuery.data?.plan.scheduledLimit ?? 0;
  const postLimit = billingQuery.data?.plan.postLimit ?? 0;
  const totalPosts = postsQuery.data?.length ?? 0;
  const remainingQueueSlots =
    queueLimit > 0 ? Math.max(queueLimit - scheduledCount, 0) : null;
  const remainingPostSlots =
    postLimit > 0 ? Math.max(postLimit - totalPosts, 0) : null;
  const isCreateLimitReached =
    !editingPost && postLimit > 0 && totalPosts >= postLimit;
  const scheduledCountExcludingEditing =
    editingPost?.status === 'scheduled'
      ? Math.max(scheduledCount - 1, 0)
      : scheduledCount;
  const isQueueLimitReachedForComposer =
    Boolean(newScheduleAt) &&
    queueLimit > 0 &&
    scheduledCountExcludingEditing >= queueLimit;

  function canSchedulePost(post: PostRecord) {
    if (queueLimit <= 0) {
      return true;
    }

    const queuedWithoutCurrent =
      post.status === 'scheduled'
        ? Math.max(scheduledCount - 1, 0)
        : scheduledCount;

    return queuedWithoutCurrent < queueLimit;
  }

  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Posts"
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
              {postLimit > 0
                ? `${remainingPostSlots ?? 0} content slot${
                    remainingPostSlots === 1 ? '' : 's'
                  } left`
                : 'Content open'}
            </GlassTag>
            <GlassTag tone="neutral">
              {queueLimit > 0
                ? `${remainingQueueSlots ?? 0} schedule slot${
                    remainingQueueSlots === 1 ? '' : 's'
                  } left`
                : 'Queue open'}
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
                setMediaSource('url');
                setSelectedMediaFile(null);
                setMediaInputError(null);
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
          />

          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(async values => {
              const mediaUpload =
                mediaSource === 'upload' && selectedMediaFile
                  ? await fileToUploadPayload(selectedMediaFile)
                  : undefined;
              const saved = await savePostMutation.mutateAsync({
                title: values.title || undefined,
                content: values.content,
                mediaUrl:
                  mediaSource === 'url'
                    ? values.mediaUrl || undefined
                    : undefined,
                mediaUpload,
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
              setMediaSource('url');
              setSelectedMediaFile(null);
              setMediaInputError(null);
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

              <div className="block text-sm">
                <Label>Media source</Label>
                <div className="mt-2">
                  <SegmentedControl
                    legend="Media source"
                    options={[
                      { label: 'Media URL', value: 'url' },
                      { label: 'Upload file', value: 'upload' }
                    ]}
                    value={mediaSource}
                    onChange={value => {
                      setMediaSource(value as MediaSource);
                      setMediaInputError(null);

                      if (value === 'url') {
                        setSelectedMediaFile(null);
                      } else {
                        form.setValue('mediaUrl', '');
                      }
                    }}
                    containerClassName="flex flex-wrap gap-2 rounded-[1rem]"
                    itemClassName="inline-flex rounded-lg border px-3 py-2 text-sm font-medium transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring"
                    activeClassName="border-primary/30 bg-primary/10 text-primary shadow-sm"
                    inactiveClassName="border-[var(--line)] bg-[var(--panel-strong)] text-foreground hover:border-[var(--line-strong)]"
                  />
                </div>
              </div>

              {mediaSource === 'url' ? (
                <label className="block text-sm">
                  <Label>Media URL</Label>
                  <InputControl
                    placeholder="https://..."
                    invalid={Boolean(form.formState.errors.mediaUrl)}
                    {...form.register('mediaUrl')}
                  />
                  <FieldError
                    message={form.formState.errors.mediaUrl?.message}
                  />
                </label>
              ) : (
                <label className="block text-sm">
                  <Label>Upload image or video</Label>
                  <InputControl
                    type="file"
                    accept="image/*,video/*"
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                      const file = event.target.files?.[0] ?? null;

                      if (!file) {
                        setSelectedMediaFile(null);
                        setMediaInputError(null);
                        return;
                      }

                      if (
                        !file.type.startsWith('image/') &&
                        !file.type.startsWith('video/')
                      ) {
                        setSelectedMediaFile(null);
                        setMediaInputError(
                          'Only image and video files are supported.'
                        );
                        return;
                      }

                      if (file.size > MAX_UPLOAD_BYTES) {
                        setSelectedMediaFile(null);
                        setMediaInputError('Uploads must stay under 25MB.');
                        return;
                      }

                      setSelectedMediaFile(file);
                      setMediaInputError(null);
                    }}
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Upload directly from this device or switch back to a public
                    media URL.
                  </p>
                  <FieldError message={mediaInputError ?? undefined} />
                </label>
              )}

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
                <p className="mt-2 text-xs text-muted-foreground">
                  Local scheduling uses {timezone.replace('_', ' ')}.
                </p>
              </label>
            </Card>

            <div className="flex flex-wrap gap-3">
              {isCreateLimitReached ? (
                <Card
                  className={`${dangerPanelClassName} w-full px-4 py-3 text-sm shadow-none`}
                >
                  Post limit reached. Delete an existing item or upgrade before
                  creating another draft.
                </Card>
              ) : null}

              {!isCreateLimitReached && postLimit > 0 ? (
                <Card
                  className={`${subtlePanelClassName} w-full px-4 py-3 text-sm text-muted-foreground shadow-none`}
                >
                  {remainingPostSlots} of {postLimit} content slot
                  {postLimit === 1 ? '' : 's'} remain on the current plan.
                </Card>
              ) : null}

              {newScheduleAt && isQueueLimitReachedForComposer ? (
                <Card
                  className={`${dangerPanelClassName} w-full px-4 py-3 text-sm shadow-none`}
                >
                  Scheduled queue is full. Clear an active scheduled post or
                  upgrade before assigning another publish time.
                </Card>
              ) : null}

              {newScheduleAt &&
              !isQueueLimitReachedForComposer &&
              queueLimit > 0 ? (
                <Card
                  className={`${subtlePanelClassName} w-full px-4 py-3 text-sm text-muted-foreground shadow-none`}
                >
                  Saving this schedule will use 1 of the {queueLimit} active
                  scheduled slot{queueLimit === 1 ? '' : 's'}.
                </Card>
              ) : null}

              <Button
                type="submit"
                disabled={
                  savePostMutation.isPending ||
                  schedulePostMutation.isPending ||
                  isCreateLimitReached ||
                  isQueueLimitReachedForComposer
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
                    setMediaSource('url');
                    setSelectedMediaFile(null);
                    setMediaInputError(null);
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
          <SectionHeading eyebrow="Preview" title="Post preview" />

          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <Card
              className={`${subtlePanelClassName} overflow-hidden shadow-none`}
            >
              {previewMediaUrl ? (
                <div className="relative h-56 w-full border-b border-[var(--line)] bg-[var(--panel)]">
                  <PostMediaPreview
                    mediaUrl={previewMediaUrl}
                    alt="Post preview"
                    emptyLabel="Media preview"
                    videoClassName="bg-black"
                  />
                </div>
              ) : (
                <div className="flex h-56 items-center justify-center border-b border-[var(--line)] bg-[var(--panel-strong)] text-sm text-muted-foreground">
                  Media preview will appear here
                </div>
              )}

              <div className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold">
                      {getPostDisplayTitle(
                        watchedValues.title,
                        watchedValues.content
                      )}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
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
                {previewMediaKind ? (
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                    {previewMediaKind} attached
                  </p>
                ) : null}
              </div>
            </Card>

            <div className="space-y-4">
              <Card className={`${subtlePanelClassName} p-4 shadow-none`}>
                <p className="eyebrow text-[11px] text-[var(--accent-secondary)]">
                  Queue usage
                </p>
                <p className="mt-3 text-3xl font-semibold">
                  {scheduledCount}
                  <span className="ml-2 text-base font-medium text-muted-foreground">
                    / {queueLimit > 0 ? queueLimit : 'Unlimited'}
                  </span>
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {queueLimit > 0
                    ? `${remainingQueueSlots} active scheduling slot${
                        remainingQueueSlots === 1 ? '' : 's'
                      } remain before the queue is full.`
                    : 'Your current plan does not cap active scheduled posts.'}
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
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
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
          <SectionHeading eyebrow="Queue" title="Active content inventory" />

          <SegmentedControl
            legend="Post status filter"
            options={statusSummary.map(item => ({
              label: `${item.label} (${item.value})`,
              value: item.status as PostFilter
            }))}
            value={statusFilter}
            onChange={setStatusFilter}
            containerClassName="flex flex-wrap gap-2 rounded-[1rem]"
            itemClassName="inline-flex rounded-lg border px-3 py-2 text-sm font-medium transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring"
            activeClassName="border-primary/30 bg-primary/10 text-primary shadow-sm"
            inactiveClassName="border-[var(--line)] bg-[var(--panel-strong)] text-foreground hover:border-[var(--line-strong)]"
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
            const displayTitle = getPostDisplayTitle(post.title, post.content);
            const scheduleAvailable = canSchedulePost(post);

            return (
              <Card
                key={post.id}
                className={`${subtlePanelClassName} grid gap-5 p-4 shadow-none xl:grid-cols-[minmax(0,1.2fr)_360px]`}
              >
                <div className="space-y-4">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex min-w-0 flex-1 items-start gap-4">
                      {post.mediaUrl ? (
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--panel)]">
                          <PostMediaPreview
                            mediaUrl={post.mediaUrl}
                            alt={displayTitle}
                            emptyLabel="Media"
                            videoClassName="bg-black"
                          />
                        </div>
                      ) : null}

                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="min-w-0 truncate text-lg font-semibold">
                            {displayTitle}
                          </p>
                          <StatusBadge tone={getStatusTone(post.status)}>
                            {formatPostStatus(post.status)}
                          </StatusBadge>
                        </div>
                        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                          {getPostExcerpt(post.content, 180)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
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
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                          FB ID
                        </p>
                        <p className="break-all">
                          {post.facebookPostId ?? 'Pending'}
                        </p>
                      </div>
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

                <div className="space-y-3 border-t border-[var(--line)] pt-4 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                      Schedule
                    </Label>
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                      <InputControl
                        className="mt-0"
                        type="datetime-local"
                        aria-label={`Schedule time for ${displayTitle}`}
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
                        disabled={
                          schedulePostMutation.isPending ||
                          post.status === 'published' ||
                          !scheduleValue ||
                          !scheduleAvailable
                        }
                      >
                        Save time
                      </Button>
                    </div>
                    {!scheduleAvailable ? (
                      <p className="text-xs text-destructive">
                        Schedule limit reached. This draft cannot be added to
                        the queue until a slot opens.
                      </p>
                    ) : null}
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button
                      type="button"
                      variant="outline"
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
                    <Button asChild variant="outline">
                      <Link href="/dashboard/scheduler">Scheduler</Link>
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
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

                  {post.status === 'published' ? (
                    <p className="text-xs text-muted-foreground">
                      Published posts are locked for editing and rescheduling.
                    </p>
                  ) : null}
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
