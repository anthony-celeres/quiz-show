'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { QuizHistory } from '@/components/QuizHistory';
import { supabase } from '@/lib/supabase';

export default function StudentHistoryPage() {
  const router = useRouter();

  const handleViewResults = useCallback(
    async (attemptId: string) => {
      const client = supabase;
      if (!client) {
        return;
      }

      const { data } = await client
        .from('quiz_attempts')
        .select('quiz_id')
        .eq('id', attemptId)
        .maybeSingle();

      if (data?.quiz_id) {
        router.push(`/student/quiz/${data.quiz_id}/results?attemptId=${attemptId}`);
      }
    },
    [router]
  );

  return <QuizHistory onViewResults={handleViewResults} />;
}
