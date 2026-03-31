'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  GlassTag,
  InfoRow,
  MetricCard,
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
  const sessionQuery = useDashboardSessionQuery();
  const billingQuery = useDashboardBillingQuery();
  const accountsQuery = useDashboardAccountsQuery();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Manage the operating defaults for this workspace"
        description="Keep profile identity, connected page context, and plan guardrails in one simple operations page."
        tags={
          <>
            <GlassTag tone="neutral">Workspace</GlassTag>
            <GlassTag tone="neutral">
              {accountsQuery.data?.length ?? 0} page
              {(accountsQuery.data?.length ?? 0) === 1 ? '' : 's'}
            </GlassTag>
            <GlassTag
              tone={
                billingQuery.data?.plan.code === 'pro' ? 'success' : 'accent'
              }
            >
              {billingQuery.data?.plan.name ?? 'Loading'}
            </GlassTag>
          </>
        }
        actions={
          <>
            <Button asChild variant="secondary">
              <Link href="/dashboard/accounts">Manage pages</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/billing">Open billing</Link>
            </Button>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Workspace role"
          value={sessionQuery.data?.role.toUpperCase() ?? 'LOADING'}
          accent="blue"
          hint="Role derived from the active plan."
        />
        <MetricCard
          label="Connected pages"
          value={accountsQuery.data?.length ?? 0}
          accent="teal"
          hint="Publishing destinations currently linked."
        />
        <MetricCard
          label="Timezone"
          value={timezone.split('/').at(-1)?.replace('_', ' ') ?? timezone}
          accent="blue"
          hint="Local timezone used for schedule entry."
        />
        <MetricCard
          label="Plan"
          value={billingQuery.data?.plan.name ?? 'Loading'}
          accent="coral"
          hint="Current subscription access level."
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.88fr_1.12fr]">
        <Card className="space-y-5 p-5">
          <SectionHeading
            eyebrow="Identity"
            title="Account details"
            description="This is the account currently authenticated through Clerk and used to operate the workspace."
          />

          <div className="space-y-3">
            <InfoRow
              label="Name"
              value={sessionQuery.data?.name ?? 'Not set'}
            />
            <InfoRow
              label="Email"
              value={sessionQuery.data?.email ?? 'Loading'}
            />
            <InfoRow
              label="Created"
              value={formatDate(sessionQuery.data?.createdAt)}
            />
            <InfoRow
              label="Updated"
              value={formatDate(sessionQuery.data?.updatedAt)}
            />
          </div>

          <Card className={`${subtlePanelClassName} p-4 shadow-none`}>
            <p className="font-semibold">Authentication model</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
              Login and signup stay in Clerk. Authorization, ownership checks,
              and plan access are enforced by the API.
            </p>
          </Card>
        </Card>

        <Card className="space-y-5 p-5">
          <SectionHeading
            eyebrow="Workspace"
            title="Publishing defaults"
            description="These are the main workspace assumptions used by the rest of the dashboard."
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Card className={`${subtlePanelClassName} p-4 shadow-none`}>
              <p className="eyebrow text-[11px] text-[var(--accent-secondary)]">
                Channel
              </p>
              <p className="mt-3 text-lg font-semibold">Facebook Pages</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                Connected pages are used for publishing and scheduling targets.
              </p>
            </Card>
            <Card className={`${subtlePanelClassName} p-4 shadow-none`}>
              <p className="eyebrow text-[11px] text-[var(--accent-secondary)]">
                Workflow
              </p>
              <p className="mt-3 text-lg font-semibold">
                Create → Schedule → Analyze
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                The shell is optimized around the main daily content loop.
              </p>
            </Card>
          </div>

          <div className="space-y-3">
            <InfoRow label="Timezone" value={timezone.replace('_', ' ')} />
            <InfoRow
              label="Connected pages"
              value={String(accountsQuery.data?.length ?? 0)}
            />
            <InfoRow
              label="Plan status"
              value={billingQuery.data?.plan.status ?? 'Loading'}
            />
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <Card className="space-y-5 p-5">
          <SectionHeading
            eyebrow="Access policy"
            title="Plan limits and entitlement state"
            description="These values come from the billing summary and are what the API uses to gate scheduling capacity."
          />

          <Card
            className={`${subtlePanelClassName} flex items-center justify-between gap-4 p-4 shadow-none`}
          >
            <div>
              <p className="font-semibold">Current plan</p>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                Effective workspace access level.
              </p>
            </div>
            <StatusBadge
              tone={billingQuery.data?.plan.code === 'pro' ? 'pro' : 'free'}
            >
              {billingQuery.data?.plan.name ?? 'Loading'}
            </StatusBadge>
          </Card>

          <div className="space-y-3">
            <InfoRow
              label="Subscription status"
              value={billingQuery.data?.plan.status ?? 'Loading'}
            />
            <InfoRow
              label="Current period end"
              value={formatDate(billingQuery.data?.plan.currentPeriodEnd)}
            />
            <InfoRow
              label="Post limit"
              value={formatLimit(billingQuery.data?.plan.postLimit)}
            />
            <InfoRow
              label="Scheduled limit"
              value={formatLimit(billingQuery.data?.plan.scheduledLimit)}
            />
          </div>
        </Card>

        <Card className="space-y-5 p-5">
          <SectionHeading
            eyebrow="Operating routine"
            title="Recommended weekly workflow"
            description="A simple cadence that keeps the workspace organized and keeps the queue from becoming a dump of unreviewed content."
          />

          <div className="space-y-3">
            {[
              'Review page health first so publishing targets are active before the team starts scheduling.',
              'Create or edit content next, then move into Scheduler to spread the queue across the week.',
              'Check analytics after posts go live, then upgrade the plan only when the queue capacity becomes the bottleneck.'
            ].map(item => (
              <Card
                key={item}
                className={`${subtlePanelClassName} p-4 shadow-none`}
              >
                <p className="text-sm leading-6 text-[var(--foreground-soft)]">
                  {item}
                </p>
              </Card>
            ))}
          </div>
        </Card>
      </section>
    </>
  );
}
