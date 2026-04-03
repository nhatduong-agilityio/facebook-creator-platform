'use client';

/* eslint-disable @next/next/no-img-element */

import { cn } from '@/lib/utils';
import { getMediaKind, getSafeMediaUrl } from '@/features/dashboard/lib/format';

export function PostMediaPreview({
  mediaUrl,
  alt,
  className,
  emptyLabel = 'Media',
  videoClassName
}: {
  mediaUrl?: string | null;
  alt: string;
  className?: string;
  emptyLabel?: string;
  videoClassName?: string;
}) {
  const safeMediaUrl = getSafeMediaUrl(mediaUrl);
  const mediaKind = getMediaKind(mediaUrl);

  if (!mediaUrl) {
    return (
      <div
        className={cn(
          'flex items-center justify-center px-2 text-center text-[11px] text-[var(--muted-foreground)]',
          className
        )}
      >
        {emptyLabel}
      </div>
    );
  }

  if (!safeMediaUrl) {
    return (
      <div
        className={cn(
          'flex items-center justify-center px-3 text-center text-[11px] text-[var(--muted-foreground)]',
          className
        )}
      >
        Preview is available for HTTPS or local media only.
      </div>
    );
  }

  if (mediaKind === 'video') {
    return (
      <video
        src={safeMediaUrl}
        aria-label={alt}
        className={cn('h-full w-full object-cover', className, videoClassName)}
        muted
        playsInline
        preload="metadata"
      />
    );
  }

  return (
    <img
      src={safeMediaUrl}
      alt={alt}
      className={cn('h-full w-full object-cover', className)}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
}
