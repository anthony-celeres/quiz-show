'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { QuizForm } from '@/components/admin/QuizForm';

export default function AdminNewQuizPage() {
  const router = useRouter();

  const handleSuccess = useCallback(() => {
    router.push('/admin/quizzes');
    router.refresh();
  }, [router]);

  const handleCancel = useCallback(() => {
    router.push('/admin/quizzes');
  }, [router]);

  return <QuizForm onSuccess={handleSuccess} onCancel={handleCancel} />;
}
