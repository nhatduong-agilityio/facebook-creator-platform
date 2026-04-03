export function formatDate(value?: string | null): string {
  if (!value) {
    return 'Not set';
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en').format(value);
}

export function getPostDisplayTitle(
  title?: string | null,
  content?: string | null
): string {
  const normalizedTitle = title?.trim();

  if (normalizedTitle) {
    return normalizedTitle;
  }

  const normalizedContent = content?.replace(/\s+/g, ' ').trim();

  if (!normalizedContent) {
    return 'Untitled post';
  }

  const firstSentence =
    normalizedContent.match(/^[^.?!]{1,72}[.?!]?/)?.[0]?.trim() ??
    normalizedContent.slice(0, 72).trim();

  return firstSentence.length < normalizedContent.length
    ? `${firstSentence}...`
    : firstSentence;
}

export function getPostExcerpt(content?: string | null, max = 140): string {
  const normalizedContent = content?.replace(/\s+/g, ' ').trim();

  if (!normalizedContent) {
    return 'No caption added yet.';
  }

  if (normalizedContent.length <= max) {
    return normalizedContent;
  }

  return `${normalizedContent.slice(0, max).trim()}...`;
}

export function getSafeMediaUrl(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    const isSecure = url.protocol === 'https:';
    const isBlob = url.protocol === 'blob:';
    const isLocalHttp =
      url.protocol === 'http:' &&
      ['localhost', '127.0.0.1'].includes(url.hostname);

    return isSecure || isLocalHttp || isBlob ? url.toString() : null;
  } catch {
    return null;
  }
}

export function getMediaKind(value?: string | null): 'image' | 'video' | null {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    const extension = url.pathname.split('.').pop()?.toLowerCase() ?? '';

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return 'image';
    }

    if (['mp4', 'mov', 'webm'].includes(extension)) {
      return 'video';
    }
  } catch {
    return null;
  }

  return null;
}

export function formatLimit(value?: number | null): string {
  if (value === undefined || value === null) {
    return 'Loading';
  }

  return value <= 0 ? 'Unlimited' : formatNumber(value);
}

export function formatPostStatus(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function getStatusTone(
  value: string
): 'connected' | 'warning' | 'danger' | 'muted' {
  if (value === 'published' || value === 'connected') {
    return 'connected';
  }

  if (value === 'scheduled' || value === 'warning') {
    return 'warning';
  }

  if (value === 'failed' || value === 'danger' || value === 'expired') {
    return 'danger';
  }

  return 'muted';
}

export function toDateTimeLocalValue(value?: string | null): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function summarizePlan(code: 'free' | 'pro'): string {
  return code === 'pro' ? 'Pro' : 'Free';
}
