'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface QuizLeaderboardEntry {
  id: string;
  user_email: string;
  percentage: number;
  score: number;
  total_points: number;
  time_taken: number;
  completed_at: string;
}

interface QuizLeaderboardProps {
  quizId: string;
  isVisible?: boolean;
  onToggle?: () => void;
}

export const QuizLeaderboard = ({ quizId, isVisible = true, onToggle }: QuizLeaderboardProps) => {
  const [attempts, setAttempts] = useState<QuizLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizLeaderboard = async () => {
      if (!supabase) return;
      
      try {
        const { data, error } = await supabase
          .from('quiz_attempts')
          .select('id, user_email, percentage, score, total_points, time_taken, completed_at')
          .eq('quiz_id', quizId)
          .order('percentage', { ascending: false })
          .order('time_taken', { ascending: true })
          .limit(10);

        if (error) throw error;
        
        setAttempts(data || []);
      } catch (error) {
        console.error('Error fetching quiz leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizLeaderboard();
  }, [quizId]);

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return { emoji: '🥇', color: 'text-yellow-600' };
    if (rank === 2) return { emoji: '🥈', color: 'text-gray-500' };
    if (rank === 3) return { emoji: '🥉', color: 'text-amber-600' };
    return { emoji: `#${rank}`, color: 'text-muted-foreground' };
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="modern-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Quiz Leaderboard</h3>
          {onToggle && (
            <button
              onClick={onToggle}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="Toggle leaderboard"
            >
              {isVisible ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
          )}
        </div>
        {isVisible && <p className="text-sm text-muted-foreground">Loading...</p>}
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <div className="modern-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Quiz Leaderboard</h3>
          {onToggle && (
            <button
              onClick={onToggle}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="Toggle leaderboard"
            >
              {isVisible ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
          )}
        </div>
        {isVisible && <p className="text-sm text-muted-foreground">No attempts yet. Be the first!</p>}
      </div>
    );
  }

  return (
    <div className="modern-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Quiz Leaderboard</h3>
          <span className="text-sm text-muted-foreground">Top {attempts.length}</span>
        </div>
        {onToggle && (
          <button
            onClick={onToggle}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Toggle leaderboard"
          >
            {isVisible ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        )}
      </div>
      
      {isVisible && (
        <div className="space-y-2">
          {attempts.map((attempt, index) => {
          const rank = getRankDisplay(index + 1);
          const isTopThree = index < 3;
          
          return (
            <div
              key={attempt.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                isTopThree ? 'border-primary/30 bg-primary/5' : 'border-border hover:bg-muted/50'
              }`}
            >
              {/* Rank */}
              <div className={`text-lg font-bold min-w-[2.5rem] text-center ${rank.color}`}>
                {rank.emoji}
              </div>

              {/* User */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {attempt.user_email}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(attempt.completed_at).toLocaleDateString()}
                </p>
              </div>

              {/* Score */}
              <div className="text-right">
                <div className={`text-lg font-bold ${rank.color}`}>
                  {attempt.percentage}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {attempt.score}/{attempt.total_points}
                </div>
              </div>

              {/* Time */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-[4rem] justify-end">
                <Clock className="h-3 w-3" />
                <span>{formatTime(attempt.time_taken)}</span>
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
};
