'use client';

import { useSearchParams } from 'next/navigation';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ErrorCallout,
  GlassTag,
  InfoRow,
  MetricCard,
  PageHeader,
  SectionHeading,
  StatusBadge,
  subtlePanelClassName
} from '@/components/ui/dashboard-primitives';
import { useCheckoutMutation } from '@/features/dashboard/hooks/use-dashboard-mutations';
import {
  useDashboardBillingQuery,
  useDashboardPostsQuery,
  useDashboardSessionQuery
} from '@/features/dashboard/hooks/use-dashboard-queries';
import { buildUsageBreakdown } from '@/features/dashboard/lib/derivations';
import { formatDate, formatLimit } from '@/features/dashboard/lib/format';

export function BillingView() {
  const searchParams = useSearchParams();
  const billingQuery = useDashboardBillingQuery();
  const sessionQuery = useDashboardSessionQuery();
  const postsQuery = useDashboardPostsQuery();
  const checkoutMutation = useCheckoutMutation();

  const checkoutState = searchParams.get('checkout');
  const usageBreakdown = buildUsageBreakdown(
    billingQuery.data,
    postsQuery.data ?? []
  );
  const currentPlan = billingQuery.data?.plan;

  return (
    <>
      <PageHeader
        eyebrow="Billing"
        title="Control access, limits, and upgrade timing"
        description="Keep plan state, operational limits, and Stripe checkout in one place so teams always know when Free is enough and when Pro is justified."
        tags={
          <>
            <GlassTag tone={currentPlan?.isPro ? 'success' : 'accent'}>
              {currentPlan?.name ?? 'Loading'}
            </GlassTag>
            <GlassTag tone="neutral">
              Status {currentPlan?.status ?? 'Loading'}
            </GlassTag>
            <GlassTag tone="neutral">
              Renewal {formatDate(currentPlan?.currentPeriodEnd)}
            </GlassTag>
          </>
        }
        actions={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                void billingQuery.refetch();
              }}
            >
              Refresh billing
            </Button>
            <Button
              type="button"
              onClick={() => {
                void checkoutMutation.mutateAsync();
              }}
              disabled={checkoutMutation.isPending || currentPlan?.isPro}
            >
              {currentPlan?.isPro ? 'Already on Pro' : 'Upgrade to Pro'}
            </Button>
          </>
        }
      />

      {checkoutState === 'success' ? (
        <Alert variant="success" className="px-5 py-4">
          <AlertTitle>Checkout completed</AlertTitle>
          <AlertDescription>
            Refresh billing if the subscription summary has not updated yet.
          </AlertDescription>
        </Alert>
      ) : null}

      {checkoutState === 'cancel' ? (
        <Alert variant="warning" className="px-5 py-4">
          <AlertTitle>Checkout canceled</AlertTitle>
          <AlertDescription>
            Checkout was canceled before payment completed.
          </AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Current plan"
          value={currentPlan?.name ?? 'Loading'}
          accent="blue"
          hint="The active subscription level for this workspace."
        />
        <MetricCard
          label="Access"
          value={sessionQuery.data?.role.toUpperCase() ?? 'LOADING'}
          accent="teal"
          hint="Effective access role derived from the plan."
        />
        <MetricCard
          label="Post limit"
          value={formatLimit(currentPlan?.postLimit)}
          accent="blue"
          hint="Maximum stored posts allowed on the current plan."
        />
        <MetricCard
          label="Scheduled limit"
          value={formatLimit(currentPlan?.scheduledLimit)}
          accent="coral"
          hint="Concurrent scheduled posts allowed in the queue."
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="space-y-5 p-5">
          <SectionHeading
            eyebrow="Usage"
            title="Current workspace usage"
            description="Watch the two limits that matter most: stored content volume and the active scheduled queue."
          />

          <div className="space-y-4">
            {usageBreakdown.map(item => (
              <Card
                key={item.label}
                className={`${subtlePanelClassName} p-4 shadow-none`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{item.label}</p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {item.current}
                    {item.limit > 0 ? ` / ${item.limit}` : ' / Unlimited'}
                  </p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--panel)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent)]"
                    style={{
                      width: `${item.limit > 0 ? Math.max(item.percentage, 6) : 100}%`
                    }}
                  />
                </div>
              </Card>
            ))}
          </div>

          <div className="space-y-3">
            <InfoRow
              label="Account"
              value={sessionQuery.data?.email ?? 'Loading'}
            />
            <InfoRow
              label="Plan status"
              value={currentPlan?.status ?? 'Loading'}
            />
            <InfoRow
              label="Current period end"
              value={formatDate(currentPlan?.currentPeriodEnd)}
            />
            <InfoRow
              label="Subscription ID"
              value={billingQuery.data?.stripeSubscriptionId ?? 'Not connected'}
              mono
            />
          </div>
        </Card>

        <Card className="space-y-5 p-5">
          <SectionHeading
            eyebrow="Plans"
            title="Free versus Pro"
            description="Keep the upgrade decision practical: compare queue room, publishing headroom, and when the current operating pattern starts to outgrow Free."
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className={`${subtlePanelClassName} p-5 shadow-none`}>
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-xl font-semibold">Free</h3>
                <StatusBadge tone="free">Starter</StatusBadge>
              </div>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted-foreground)]">
                <li>Draft, publish, and schedule with lighter queue volume.</li>
                <li>Best for solo creators or low-frequency content plans.</li>
                <li>Simple entry point before regular campaigns scale up.</li>
              </ul>
            </Card>

            <Card className={`${subtlePanelClassName} p-5 shadow-none`}>
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-xl font-semibold">Pro</h3>
                <StatusBadge tone="pro">Scale</StatusBadge>
              </div>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted-foreground)]">
                <li>More room for scheduling and campaign-level posting.</li>
                <li>
                  Better fit for freelancers, marketers, and active brands.
                </li>
                <li>Upgrade when the calendar becomes the main workflow.</li>
              </ul>
            </Card>
          </div>

          <Card
            className={`${subtlePanelClassName} grid gap-4 p-5 shadow-none lg:grid-cols-[1fr_auto]`}
          >
            <div>
              <p className="text-lg font-semibold">Upgrade decision support</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                If the scheduled queue fills up often or your team needs more
                campaign headroom, Pro removes the daily friction points first.
              </p>
            </div>
            <div className="flex items-center">
              <Button
                type="button"
                onClick={() => {
                  void checkoutMutation.mutateAsync();
                }}
                disabled={checkoutMutation.isPending || currentPlan?.isPro}
              >
                {currentPlan?.isPro ? 'Pro active' : 'Start Pro checkout'}
              </Button>
            </div>
          </Card>

          <div className="space-y-3">
            <Card className={`${subtlePanelClassName} p-4 shadow-none`}>
              <p className="font-semibold">Billing history</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                The current API only exposes subscription state, so this area is
                prepared for invoice history once Stripe history sync is added.
              </p>
            </Card>
            <Card className={`${subtlePanelClassName} p-4 shadow-none`}>
              <p className="font-semibold">Current cycle</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                Renewal date: {formatDate(currentPlan?.currentPeriodEnd)}
              </p>
            </Card>
          </div>
        </Card>
      </section>

      {billingQuery.error ? (
        <ErrorCallout
          title="Unable to load billing state"
          error={billingQuery.error}
        />
      ) : null}

      {checkoutMutation.error ? (
        <ErrorCallout
          title="Unable to start checkout"
          error={checkoutMutation.error}
        />
      ) : null}
    </>
  );
}
