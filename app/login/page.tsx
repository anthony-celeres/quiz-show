'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthForm } from '@/components/AuthForm';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirectTo');

  const handleSuccess = useCallback(() => {
    const safeRedirect = redirectParam && redirectParam.startsWith('/') ? redirectParam : '/';
    router.replace(safeRedirect);
    router.refresh();
  }, [redirectParam, router]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <AuthForm onSuccess={handleSuccess} />
    </div>
  );
}
