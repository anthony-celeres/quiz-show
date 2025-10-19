 'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { QuizResults } from '@/components/challenger/QuizResults';
import { QuizLeaderboard } from '@/components/QuizLeaderboard';
import { supabase } from '@/lib/supabase';
import { QuizAttempt } from '@/types/quiz';

export default function ChallengerQuizResultsPage() {
  const params = useParams<{ quizId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const quizId = params?.quizId;
  const attemptId = searchParams?.get('attemptId');
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(true);

  useEffect(() => {
    if (!quizId) return;
    const client = supabase;
    if (!client) {
      setError('Supabase is not configured.');
      setLoading(false);
      return;
    }

    const fetchAttempt = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: userData } = await client.auth.getUser();
        const user = userData.user;
        if (!user) {
          router.replace(`/login?redirectTo=/challenger/quiz/${quizId}/results`);
          return;
        }

        let data; 
        let fetchError;

        if (attemptId) {
          const response = await client
            .from('quiz_attempts')
            .select(
              `*,
               quiz:quizzes (*, questions (*))
              `
            )
            .eq('user_id', user.id)
            .eq('id', attemptId)
            .maybeSingle();

          data = response.data;
          fetchError = response.error;
        } else {
          const response = await client
            .from('quiz_attempts')
            .select(
              `*,
               quiz:quizzes (*, questions (*))
              `
            )
            .eq('quiz_id', quizId)
            .eq('user_id', user.id)
            .order('completed_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          data = response.data;
          fetchError = response.error;
        }

        if (fetchError) throw fetchError;
        if (!data) {
          setError('No quiz attempt found.');
          setAttempt(null);
          return;
        }

        setAttempt(data as unknown as QuizAttempt);
      } catch (fetchErr: any) {
        setError(fetchErr?.message || 'Failed to load quiz results.');
        setAttempt(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchAttempt();
  }, [attemptId, quizId, router]);

  const handleClose = useCallback(() => {
    router.push('/challenger/history');
  }, [router]);

  if (loading) {
    return <div className="modern-card p-8">Loading results...</div>;
  }

  if (error) {
    return <div className="modern-card p-8 text-destructive">{error}</div>;
  }

  if (!attempt) {
    return <div className="modern-card p-8">No results available.</div>;
  }

  return (
    <QuizResults 
      attempt={attempt} 
      onClose={handleClose}
      onToggleLeaderboard={() => setShowLeaderboard(!showLeaderboard)}
      showLeaderboard={showLeaderboard}
      leaderboardContent={
        quizId ? (
          <QuizLeaderboard 
            quizId={quizId} 
            isVisible={true}
            onToggle={() => setShowLeaderboard(!showLeaderboard)}
          />
        ) : null
      }
    />
  );
}
