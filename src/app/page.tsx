
'use client';

import * as React from 'react';
import { AuthScreen } from '@/components/auth/auth-screen';
import { PageLoader } from '@/components/shared/page-loader';

export default function Home() {
  return (
    <React.Suspense fallback={<PageLoader />}>
      <AuthScreen />
    </React.Suspense>
  );
}
