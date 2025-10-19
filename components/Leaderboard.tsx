import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy } from 'lucide-react';

interface LeaderboardEntry {
  user_id: string;
  user_email: string;
  total_attempts: number;
  avg_percentage: number;
  total_score: number;
  total_possible: number;
  best_score: number;
}

export const Leaderboard = () => {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    if (!supabase) return;
    
    try {
      // Get all attempts grouped by user
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('user_id, user_email, percentage, score, total_points');

      if (error) throw error;

      // Calculate average performance per user
      const userStats = new Map<string, {
        user_email: string;
        percentages: number[];
        scores: number[];
        totalPoints: number[];
      }>();

      data?.forEach(attempt => {
        const userId = attempt.user_id;
        if (!userStats.has(userId)) {
          userStats.set(userId, {
            user_email: attempt.user_email || 'Unknown User',
            percentages: [],
            scores: [],
            totalPoints: []
          });
        }
        const stats = userStats.get(userId)!;
        stats.percentages.push(attempt.percentage);
        stats.scores.push(attempt.score);
        stats.totalPoints.push(attempt.total_points);
      });

      // Convert to leaderboard entries
      const leaderboardData: LeaderboardEntry[] = Array.from(userStats.entries()).map(([userId, stats]) => {
        const avgPercentage = stats.percentages.reduce((a, b) => a + b, 0) / stats.percentages.length;
        const totalScore = stats.scores.reduce((a, b) => a + b, 0);
        const totalPossible = stats.totalPoints.reduce((a, b) => a + b, 0);
        const bestScore = Math.max(...stats.percentages);

        return {
          user_id: userId,
          user_email: stats.user_email,
          total_attempts: stats.percentages.length,
          avg_percentage: Math.round(avgPercentage),
          total_score: totalScore,
          total_possible: totalPossible,
          best_score: Math.round(bestScore)
        };
      });

      // Sort by average percentage (desc), then by total attempts (desc)
      leaderboardData.sort((a, b) => {
        if (b.avg_percentage !== a.avg_percentage) {
          return b.avg_percentage - a.avg_percentage;
        }
        return b.total_attempts - a.total_attempts;
      });

      setLeaders(leaderboardData.slice(0, 50)); // Top 50
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return { emoji: '🥇', color: 'text-yellow-600' };
    if (rank === 2) return { emoji: '🥈', color: 'text-gray-500' };
    if (rank === 3) return { emoji: '🥉', color: 'text-amber-600' };
    return { emoji: `#${rank}`, color: 'text-muted-foreground' };
  };

  if (loading) {
    return <div className="modern-card p-8">Loading leaderboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-4xl font-bold gradient-text mb-3">Leaderboard</h2>
        <p className="text-muted-foreground text-lg">
          Top performers based on average performance
        </p>
      </div>
      
      {leaders.length === 0 ? (
        <div className="modern-card p-12 text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
            <Trophy className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No Scores Yet</h3>
          <p className="text-muted-foreground">
            Be the first to take a quiz and appear on the leaderboard!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaders.map((leader, index) => {
            const rank = getRankDisplay(index + 1);
            const isTopThree = index < 3;
            
            return (
              <div
                key={leader.user_id}
                className={`modern-card p-5 hover:shadow-md transition-shadow ${
                  isTopThree ? 'border-l-4 border-l-primary' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className={`text-2xl font-bold min-w-[3rem] text-center ${rank.color}`}>
                    {rank.emoji}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {leader.user_email}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {leader.total_attempts} quiz{leader.total_attempts !== 1 ? 'zes' : ''} taken
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-right">
                      <div className={`text-xl font-bold ${rank.color}`}>
                        {leader.avg_percentage}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        avg score
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-semibold text-foreground">
                        {leader.best_score}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        best score
                      </div>
                    </div>

                    <div className="text-right text-muted-foreground">
                      <div className="text-lg font-semibold">
                        {leader.total_score}/{leader.total_possible}
                      </div>
                      <div className="text-xs">
                        total pts
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};