'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AuthForm } from '@/components/AuthForm';

export default function RegisterPage() {
  const router = useRouter();

  const handleSuccess = useCallback(() => {
    router.replace('/');
    router.refresh();
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <AuthForm mode="register" onSuccess={handleSuccess} />
    </div>
  );
}
