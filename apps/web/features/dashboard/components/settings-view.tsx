'use client';

import { useUser } from '@clerk/nextjs';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  GlassTag,
  InfoRow,
  PageHeader,
  SectionHeading,
  StatusBadge,
  subtlePanelClassName
} from '@/components/ui/dashboard-primitives';
import {
  useDashboardAccountsQuery,
  useDashboardBillingQuery,
  useDashboardSessionQuery
} from '@/features/dashboard/hooks/use-dashboard-queries';
import { formatDate, formatLimit } from '@/features/dashboard/lib/format';

export function SettingsView() {
  const { user } = useUser();
  const sessionQuery = useDashboardSessionQuery();
  const billingQuery = useDashboardBillingQuery();
  const accountsQuery = useDashboardAccountsQuery();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const currentPlan = billingQuery.data?.plan;
  const displayName = user?.fullName ?? sessionQuery.data?.name ?? 'Not set';
  const displayEmail =
    user?.primaryEmailAddress?.emailAddress ??
    sessionQuery.data?.email ??
    'Loading';

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Settings"
        tags={
          <>
            <GlassTag tone="neutral">
              {accountsQuery.data?.length ?? 0} page
              {(accountsQuery.data?.length ?? 0) === 1 ? '' : 's'}
            </GlassTag>
            <GlassTag tone={currentPlan?.code === 'pro' ? 'success' : 'accent'}>
              {currentPlan?.name ?? 'Loading'}
            </GlassTag>
          </>
        }
        actions={
          <>
            <Button asChild>
              <Link href="/dashboard/billing">Open billing</Link>
            </Button>
          </>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="space-y-5 p-5">
          <SectionHeading eyebrow="Identity" title="Account" />

          <div className="space-y-3">
            <InfoRow label="Name" value={displayName} />
            <InfoRow label="Email" value={displayEmail} />
            <InfoRow
              label="Access"
              value={currentPlan?.code.toUpperCase() ?? 'Loading'}
            />
            <InfoRow
              label="Created"
              value={formatDate(sessionQuery.data?.createdAt)}
            />
          </div>
        </Card>

        <Card className="space-y-5 p-5">
          <SectionHeading eyebrow="Workspace" title="Overview" />

          <div className="space-y-3">
            <InfoRow label="Timezone" value={timezone.replace('_', ' ')} />
            <InfoRow
              label="Connected pages"
              value={String(accountsQuery.data?.length ?? 0)}
            />
            <InfoRow
              label="Current plan"
              value={currentPlan?.name ?? 'Loading'}
            />
            <InfoRow
              label="Plan status"
              value={currentPlan?.status ?? 'Loading'}
            />
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <Card className="space-y-5 p-5">
          <SectionHeading eyebrow="Access" title="Plan limits" />

          <Card
            className={`${subtlePanelClassName} flex items-center justify-between gap-4 p-4 shadow-none`}
          >
            <div>
              <p className="font-semibold">Current plan</p>
            </div>
            <StatusBadge tone={currentPlan?.code === 'pro' ? 'pro' : 'free'}>
              {currentPlan?.name ?? 'Loading'}
            </StatusBadge>
          </Card>

          <div className="space-y-3">
            <InfoRow
              label="Subscription status"
              value={currentPlan?.status ?? 'Loading'}
            />
            <InfoRow
              label="Current period end"
              value={formatDate(currentPlan?.currentPeriodEnd)}
            />
            <InfoRow
              label="Post limit"
              value={formatLimit(currentPlan?.postLimit)}
            />
            <InfoRow
              label="Scheduled limit"
              value={formatLimit(currentPlan?.scheduledLimit)}
            />
          </div>
        </Card>

        <Card className="space-y-5 p-5">
          <SectionHeading eyebrow="Shortcuts" title="Quick actions" />

          <div className="grid gap-3 sm:grid-cols-2">
            <Button asChild variant="outline">
              <Link href="/dashboard/posts">Open posts</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/scheduler">Open scheduler</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/analytics">Open analytics</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/accounts">Manage pages</Link>
            </Button>
          </div>
        </Card>
      </section>
    </>
  );
}
