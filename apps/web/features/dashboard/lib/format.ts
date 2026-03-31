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
