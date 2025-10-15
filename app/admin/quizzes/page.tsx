'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QuizList } from '@/components/admin/QuizList';
import { Quiz } from '@/types/quiz';

export default function AdminQuizzesPage() {
  const router = useRouter();
  const [refreshFlag, setRefreshFlag] = useState(false);

  const handleEdit = useCallback(
    (quiz: Quiz) => {
      router.push(`/admin/quizzes/${quiz.id}`);
    },
    [router]
  );

  const handleViewAttempts = useCallback(
    (quiz: Quiz) => {
      router.push(`/admin/quizzes/${quiz.id}/attempts`);
    },
    [router]
  );

  return (
    <QuizList
      onEdit={handleEdit}
      onViewAttempts={handleViewAttempts}
      refresh={refreshFlag}
      onStatusChange={() => setRefreshFlag((prev) => !prev)}
    />
  );
}
