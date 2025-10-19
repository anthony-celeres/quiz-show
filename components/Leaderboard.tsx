import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy } from 'lucide-react';

interface LeaderboardEntry {
  user_id: string;
  user_email: string;
  username?: string;
  display_name?: string;
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
      // Get all attempts with profile information using the view
      const { data, error } = await supabase
        .from('quiz_attempts_with_profiles')
        .select('user_id, user_email, username, display_name, percentage, score, total_points');

      if (error) throw error;

      // Calculate average performance per user
      const userStats = new Map<string, {
        user_email: string;
        username?: string;
        display_name?: string;
        percentages: number[];
        scores: number[];
        totalPoints: number[];
      }>();

      data?.forEach(attempt => {
        const userId = attempt.user_id;
        if (!userStats.has(userId)) {
          userStats.set(userId, {
            user_email: attempt.user_email || 'Unknown User',
            username: attempt.username,
            display_name: attempt.display_name,
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
          username: stats.username,
          display_name: stats.display_name,
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
    return <div className="modern-card p-6 sm:p-8">Loading leaderboard...</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center">
        <h2 className="text-3xl sm:text-4xl font-bold gradient-text mb-2 sm:mb-3">Leaderboard</h2>
        <p className="text-muted-foreground text-base sm:text-lg px-4">
          Top performers based on average performance
        </p>
      </div>
      
      {leaders.length === 0 ? (
        <div className="modern-card p-8 sm:p-12 text-center">
          <div className="mx-auto mb-4 sm:mb-6 flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-muted">
            <Trophy className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">No Scores Yet</h3>
          <p className="text-sm sm:text-base text-muted-foreground px-4">
            Be the first to take a quiz and appear on the leaderboard!
          </p>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {leaders.map((leader, index) => {
            const rank = getRankDisplay(index + 1);
            const isTopThree = index < 3;
            
            return (
              <div
                key={leader.user_id}
                className={`modern-card p-3 sm:p-5 hover:shadow-md transition-shadow ${
                  isTopThree ? 'border-l-4 border-l-primary' : ''
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-4">
                  {/* Rank */}
                  <div className={`text-xl sm:text-2xl font-bold min-w-[2.5rem] sm:min-w-[3rem] text-center ${rank.color} flex-shrink-0`}>
                    {rank.emoji}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">
                      {leader.display_name || leader.username || leader.user_email}
                    </h3>
                    {leader.username && (
                      <p className="text-xs text-muted-foreground truncate">
                        @{leader.username}
                      </p>
                    )}
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {leader.total_attempts} quiz{leader.total_attempts !== 1 ? 'zes' : ''} taken
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm flex-shrink-0">
                    <div className="text-right">
                      <div className={`text-lg sm:text-xl font-bold ${rank.color}`}>
                        {leader.avg_percentage}%
                      </div>
                      <div className="text-xs text-muted-foreground hidden sm:block">
                        avg score
                      </div>
                    </div>

                    <div className="text-right hidden sm:block">
                      <div className="text-lg font-semibold text-foreground">
                        {leader.best_score}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        best score
                      </div>
                    </div>

                    <div className="text-right hidden md:block text-muted-foreground">
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