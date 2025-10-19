'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Clock, Play, Trophy, Globe, Lock, Edit, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Quiz, QuizAttempt as QuizAttemptType } from '@/types/quiz';

export default function ChallengerQuizzesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<QuizAttemptType[]>([]);
  const [deletingQuizId, setDeletingQuizId] = useState<string | null>(null);

  const canQuery = useMemo(() => Boolean(supabase && user?.id), [user?.id]);

  const fetchQuizzes = useCallback(async () => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuizzes(data ?? []);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    }
  }, []);

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return;
    }

    setDeletingQuizId(quizId);

    try {
      const response = await fetch(`/api/quizzes/${quizId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete quiz');
      }

      // Remove from local state
      setQuizzes(quizzes.filter(q => q.id !== quizId));
    } catch (error: any) {
      console.error('Error deleting quiz:', error);
      alert(error.message || 'Failed to delete quiz');
    } finally {
      setDeletingQuizId(null);
    }
  };

  const fetchAttempts = useCallback(async () => {
    if (!supabase || !user?.id) return;

    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setAttempts(data ?? []);
    } catch (error) {
      console.error('Error fetching attempts:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([fetchQuizzes(), fetchAttempts()])
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  }, [fetchAttempts, fetchQuizzes]);

  if (!supabase) {
    return <div className="modern-card p-8">Supabase is not configured.</div>;
  }

  if (loading) {
    return <div className="modern-card p-8">Loading available quizzes...</div>;
  }

  if (!canQuery) {
    return <div className="modern-card p-8">Sign in to view available quizzes.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold gradient-text mb-3">Available Quizzes</h1>
        <p className="text-muted-foreground text-lg">
          Choose a quiz to test your knowledge and track your progress.
        </p>
      </div>

      {quizzes.length === 0 ? (
        <div className="modern-card p-12 text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">No quizzes available</h2>
          <p className="text-muted-foreground">
            Check back later or create your own quiz to challenge others.
          </p>
        </div>
      ) : (
        <div className="responsive-grid">
          {quizzes.map((quiz, index) => {
            const currentCycle = quiz.activation_cycle ?? 0;
            const userAttempts = attempts.filter(
              (attempt) => attempt.quiz_id === quiz.id && (attempt.activation_cycle ?? 0) === currentCycle
            );
            const attemptCount = userAttempts.length;
            const maxAttempts = quiz.max_attempts ?? 0; // 0 or null means unlimited
            const hasReachedLimit = maxAttempts > 0 && attemptCount >= maxAttempts;
            const disabled = hasReachedLimit;
            const isOwner = quiz.created_by === user?.id;
            const isPrivate = quiz.visibility === 'private';

            return (
              <div
                key={quiz.id}
                className={`modern-card p-8 transition-all duration-300 ${
                  disabled ? 'opacity-70' : 'hover:-translate-y-1 hover:shadow-lg'
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="mb-6 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0056B3] text-white shadow-sm">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-foreground">{quiz.title}</h2>
                        {isOwner && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            Your Quiz
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">
                          Updated {new Date(quiz.created_at).toLocaleDateString()}
                        </p>
                        {isPrivate ? (
                          <div className="flex items-center gap-1 text-xs text-amber-600">
                            <Lock className="h-3 w-3" />
                            <span>Private</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <Globe className="h-3 w-3" />
                            <span>Public</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {isOwner && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => router.push(`/challenger/quizzes/${quiz.id}/edit`)}
                        className="p-2 hover:bg-muted rounded-md transition-colors"
                        title="Edit quiz"
                        disabled={deletingQuizId === quiz.id}
                      >
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuiz(quiz.id)}
                        className="p-2 hover:bg-destructive/10 rounded-md transition-colors"
                        title="Delete quiz"
                        disabled={deletingQuizId === quiz.id}
                      >
                        <Trash2 className={`h-4 w-4 ${deletingQuizId === quiz.id ? 'text-muted-foreground' : 'text-destructive'}`} />
                      </button>
                    </div>
                  )}
                </div>

                <p className="mb-6 text-muted-foreground leading-relaxed line-clamp-3">
                  {quiz.description || 'No description provided'}
                </p>

                <div className="mb-6 grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
                    <Clock className="h-4 w-4 text-[#0056B3]" />
                    <span className="font-medium">{quiz.duration_minutes} minutes</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
                    <Trophy className="h-4 w-4 text-[#F98012]" />
                    <span className="font-medium">{quiz.total_points} points</span>
                  </div>
                </div>

                {/* Show attempts info */}
                {attemptCount > 0 && (
                  <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                    {maxAttempts > 0 ? (
                      <span>Attempts: {attemptCount} / {maxAttempts}</span>
                    ) : (
                      <span>Attempts: {attemptCount} (Unlimited)</span>
                    )}
                  </div>
                )}

                {hasReachedLimit && (
                  <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    You have reached the maximum number of attempts for this quiz.
                  </div>
                )}

                <Button
                  size="lg"
                  className="w-full"
                  disabled={disabled}
                  onClick={() => {
                    if (disabled) return;
                    router.push(`/challenger/quiz/${quiz.id}`);
                  }}
                >
                  <Play className="mr-2 h-5 w-5" />
                  {hasReachedLimit ? 'Max Attempts Reached' : 'Start Quiz'}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
