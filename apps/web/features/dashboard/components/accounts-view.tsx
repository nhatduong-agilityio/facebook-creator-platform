'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  EmptyState,
  ErrorCallout,
  FieldError,
  GlassTag,
  MetricCard,
  PageHeader,
  SectionHeading,
  StatusBadge,
  glassFieldsetClassName,
  subtlePanelClassName,
  tilePanelClassName
} from '@/components/ui/dashboard-primitives';
import { InputControl } from '@/components/ui/form-controls';
import { Label } from '@/components/ui/label';
import { useFacebookCallbackMutation } from '@/features/dashboard/hooks/use-dashboard-mutations';
import {
  useDashboardAccountsQuery,
  useDashboardConnectUrlQuery
} from '@/features/dashboard/hooks/use-dashboard-queries';
import {
  emptyFacebookCallbackForm,
  facebookCallbackSchema,
  type FacebookCallbackValues
} from '@/features/dashboard/lib/schemas';
import { formatDate } from '@/features/dashboard/lib/format';

function getTokenState(tokenExpiresAt: string | null) {
  if (!tokenExpiresAt) {
    return {
      label: 'Connected',
      tone: 'connected' as const
    };
  }

  const daysRemaining =
    (new Date(tokenExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);

  if (daysRemaining <= 0) {
    return {
      label: 'Expired',
      tone: 'danger' as const
    };
  }

  if (daysRemaining <= 7) {
    return {
      label: 'Expires soon',
      tone: 'warning' as const
    };
  }

  return {
    label: 'Connected',
    tone: 'connected' as const
  };
}

export function AccountsView() {
  const accountsQuery = useDashboardAccountsQuery();
  const connectUrlQuery = useDashboardConnectUrlQuery();
  const facebookCallbackMutation = useFacebookCallbackMutation();
  const accounts = accountsQuery.data ?? [];
  const expiringPages = accounts.filter(account => {
    const state = getTokenState(account.tokenExpiresAt);
    return state.tone === 'warning' || state.tone === 'danger';
  }).length;

  const callbackForm = useForm<FacebookCallbackValues>({
    resolver: zodResolver(facebookCallbackSchema),
    defaultValues: emptyFacebookCallbackForm
  });

  return (
    <>
      <PageHeader
        eyebrow="Accounts"
        title="Facebook pages"
        tags={
          <>
            <GlassTag
              tone={
                (accountsQuery.data?.length ?? 0) > 0 ? 'success' : 'warning'
              }
            >
              {accountsQuery.data?.length ?? 0} connected page
              {(accountsQuery.data?.length ?? 0) === 1 ? '' : 's'}
            </GlassTag>
            <GlassTag tone="neutral">OAuth</GlassTag>
          </>
        }
        actions={
          <Button
            type="button"
            onClick={async () => {
              const result = await connectUrlQuery.refetch();

              if (result.data?.url) {
                window.location.assign(result.data.url);
              }
            }}
            disabled={connectUrlQuery.isFetching}
          >
            Connect Facebook
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Connected pages"
          value={accounts.length}
          accent="blue"
          hint="Publishing targets currently available."
        />
        <MetricCard
          label="Needs attention"
          value={expiringPages}
          accent="coral"
          hint="Pages with expiring or expired tokens."
        />
        <MetricCard
          label="OAuth flow"
          value="Ready"
          accent="teal"
          hint="Primary guided connection path."
        />
        <MetricCard
          label="Manual recovery"
          value="Available"
          accent="blue"
          hint="Fallback for edge-case reconnects."
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="space-y-5 p-5">
          <SectionHeading eyebrow="Flow" title="Connection steps" />

          <div className="space-y-3">
            {[
              'Start the Facebook OAuth flow and approve the requested access.',
              'Return to the dashboard and confirm which page should be used for publishing.',
              'Check token state below so expiring access does not surprise the team later.'
            ].map((step, index) => (
              <Card
                key={step}
                className={`${subtlePanelClassName} p-4 shadow-none`}
              >
                <p className="font-semibold">
                  {index + 1}. {step}
                </p>
              </Card>
            ))}
          </div>
        </Card>

        <Card className="space-y-5 p-5">
          <SectionHeading eyebrow="Pages" title="Connected pages" />

          <div className="space-y-3">
            {accounts.map(account => {
              const tokenState = getTokenState(account.tokenExpiresAt);

              return (
                <Card
                  key={account.id}
                  className={`${subtlePanelClassName} grid gap-4 p-4 shadow-none xl:grid-cols-[1fr_auto]`}
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold">
                        {account.pageName}
                      </h3>
                      <StatusBadge tone={tokenState.tone}>
                        {tokenState.label}
                      </StatusBadge>
                    </div>

                    <p className="font-mono text-xs text-[var(--muted-foreground)]">
                      Page ID: {account.pageId}
                    </p>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Card
                        className={`${tilePanelClassName} px-4 py-3 text-sm shadow-none`}
                      >
                        Token expires {formatDate(account.tokenExpiresAt)}
                      </Card>
                      <Card
                        className={`${tilePanelClassName} px-4 py-3 text-sm shadow-none`}
                      >
                        Connected {formatDate(account.createdAt)}
                      </Card>
                    </div>
                  </div>
                </Card>
              );
            })}

            {!accountsQuery.isLoading && accounts.length === 0 ? (
              <EmptyState
                title="No pages connected yet"
                description="Start the Facebook OAuth flow to connect the first page for publishing and scheduling."
              />
            ) : null}
          </div>
        </Card>
      </section>

      <Card className="space-y-5 p-5">
        <SectionHeading eyebrow="Manual callback" title="Recovery mode" />

        <form
          className="space-y-4"
          onSubmit={callbackForm.handleSubmit(values => {
            void facebookCallbackMutation
              .mutateAsync({
                code: values.code,
                pageId: values.pageId || undefined
              })
              .then(() => {
                callbackForm.reset(emptyFacebookCallbackForm);
              });
          })}
        >
          <div
            className={`${glassFieldsetClassName} grid gap-4 lg:grid-cols-2`}
          >
            <label className="block text-sm">
              <Label>Authorization code</Label>
              <InputControl
                placeholder="Paste the code returned by Facebook"
                invalid={Boolean(callbackForm.formState.errors.code)}
                {...callbackForm.register('code')}
              />
              <FieldError
                message={callbackForm.formState.errors.code?.message}
              />
            </label>

            <label className="block text-sm">
              <Label>Page ID override</Label>
              <InputControl
                placeholder="Optional page ID"
                invalid={Boolean(callbackForm.formState.errors.pageId)}
                {...callbackForm.register('pageId')}
              />
              <FieldError
                message={callbackForm.formState.errors.pageId?.message}
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={facebookCallbackMutation.isPending}>
              Save connected page
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                callbackForm.reset(emptyFacebookCallbackForm);
              }}
            >
              Clear form
            </Button>
          </div>
        </form>
      </Card>

      {connectUrlQuery.error ? (
        <ErrorCallout
          title="Unable to load connect URL"
          error={connectUrlQuery.error}
        />
      ) : null}

      {accountsQuery.error ? (
        <ErrorCallout
          title="Unable to load Facebook accounts"
          error={accountsQuery.error}
        />
      ) : null}

      {facebookCallbackMutation.error ? (
        <ErrorCallout
          title="Unable to connect page"
          error={facebookCallbackMutation.error}
        />
      ) : null}
    </>
  );
}
