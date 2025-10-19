import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { QuizAttempt } from '@/types/quiz';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Clock, Trophy, History as HistoryIcon, Eye } from 'lucide-react';

interface QuizHistoryProps {
  onViewResults?: (attemptId: string) => void;
}

export const QuizHistory = ({ onViewResults }: QuizHistoryProps) => {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    if (!supabase || !user?.id) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          quiz:quizzes (title, description)
        `)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      setAttempts(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    fetchHistory();
  }, [user?.id, fetchHistory]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-blue-600';
    if (percentage >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  if (loading) {
    return <div className="modern-card p-8">Loading history...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-4xl font-bold gradient-text mb-3">Quiz History</h2>
        <p className="text-muted-foreground text-lg">
          Track your progress and review past attempts
        </p>
      </div>
      
      {attempts.length === 0 ? (
        <div className="modern-card p-8 sm:p-12 text-center">
          <div className="mx-auto mb-4 sm:mb-6 flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-muted">
            <HistoryIcon className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">No Quiz History Yet</h3>
          <p className="text-sm sm:text-base text-muted-foreground px-4">
            Start taking quizzes to build your learning history!
          </p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {attempts.map((attempt) => (
            <div 
              key={attempt.id} 
              className="modern-card p-4 sm:p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                {/* Quiz Title and Score */}
                <div className="flex-1 min-w-0 w-full">
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 sm:mb-1 break-words">
                    {attempt.quiz?.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <Trophy className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">{attempt.score}/{attempt.total_points} pts</span>
                    </span>
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      {formatTime(attempt.time_taken)}
                    </span>
                    <span className="text-xs sm:text-sm">
                      {new Date(attempt.completed_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Percentage Score and Button Container */}
                <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  {/* Percentage Score */}
                  <div className={`text-xl sm:text-2xl font-bold ${getGradeColor(attempt.percentage)} flex-shrink-0`}>
                    {attempt.percentage}%
                  </div>

                  {/* View Details Button */}
                  {onViewResults && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewResults(attempt.id)}
                      className="text-xs sm:text-sm whitespace-nowrap"
                    >
                      <Eye className="h-4 w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Details</span>
                      <span className="sm:hidden">View</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};