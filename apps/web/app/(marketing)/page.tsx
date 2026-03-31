import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import { MarketingHome } from '@/components/marketing/marketing-home';
import { isClerkConfigured } from '@/lib/env';

export default async function HomePage() {
  if (isClerkConfigured) {
    const { isAuthenticated } = await auth();

    if (isAuthenticated) {
      redirect('/dashboard');
    }
  }

  return <MarketingHome clerkConfigured={isClerkConfigured} />;
}
