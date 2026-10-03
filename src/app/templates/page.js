'use client';

import { Suspense } from 'react';
import NotificationTemplatesPage from '@/app/notification-templates/page';

export default function TemplatesAliasPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <NotificationTemplatesPage />
    </Suspense>
  );
}
