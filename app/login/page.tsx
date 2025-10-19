'use client';

import { Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthForm } from '@/components/AuthForm';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirectTo');

  const handleSuccess = useCallback(() => {
    const safeRedirect = redirectParam && redirectParam.startsWith('/') ? redirectParam : '/';
    router.replace(safeRedirect);
    router.refresh();
  }, [redirectParam, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <AuthForm mode="login" onSuccess={handleSuccess} />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center animated-bg">
          <div className="text-center modern-card p-12">
            <div className="w-12 h-12 mx-auto mb-4 border-4 border-primary/30 border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">Preparing sign-in...</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
