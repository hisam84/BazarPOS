'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SalerBalanceRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/staff');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <p className="text-xs text-slate-400">Redirecting to Staff Performance...</p>
    </div>
  );
}
