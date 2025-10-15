'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { QuizForm } from '@/components/admin/QuizForm';
import { supabase } from '@/lib/supabase';
import { Quiz } from '@/types/quiz';

export default function AdminEditQuizPage() {
  const params = useParams<{ quizId: string }>();
  const router = useRouter();
  const quizId = params?.quizId;
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!quizId) return;
    const client = supabase;
    if (!client) {
      setError('Supabase is not configured.');
      setLoading(false);
      return;
    }

    const fetchQuiz = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await client
          .from('quizzes')
          .select(
            `*,
             questions (*)
            `
          )
          .eq('id', quizId)
          .maybeSingle();

        if (fetchError) throw fetchError;
        if (!data) {
          setError('Quiz not found.');
          setQuiz(null);
          return;
        }

        setQuiz(data as Quiz);
      } catch (fetchErr: any) {
        setError(fetchErr?.message || 'Failed to load quiz.');
        setQuiz(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchQuiz();
  }, [quizId]);

  const handleSuccess = useCallback(() => {
    router.push('/admin/quizzes');
    router.refresh();
  }, [router]);

  const handleCancel = useCallback(() => {
    router.push('/admin/quizzes');
  }, [router]);

  if (loading) {
    return <div className="modern-card p-8">Loading quiz details...</div>;
  }

  if (error) {
    return <div className="modern-card p-8 text-destructive">{error}</div>;
  }

  if (!quiz) {
    return <div className="modern-card p-8">Quiz data unavailable.</div>;
  }

  return <QuizForm quizToEdit={quiz} onSuccess={handleSuccess} onCancel={handleCancel} />;
}
