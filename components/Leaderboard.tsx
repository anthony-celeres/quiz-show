import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { QuizAttempt } from '@/types/quiz';
import { Trophy, Medal, Award, Clock } from 'lucide-react';

export const Leaderboard = () => {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          quiz:quizzes (title)
        `)
        .order('percentage', { ascending: false })
        .order('time_taken', { ascending: true })
        .limit(50);

      if (error) throw error;
      
      // Ensure user_email is available (it should be stored when creating the attempt)
      const attemptsWithEmails = data?.map(attempt => ({
        ...attempt,
        user_email: attempt.user_email || attempt.user_id || 'Unknown User'
      })) || [];
      
      setAttempts(attemptsWithEmails);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-500">#{rank}</span>;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="text-center py-8">Loading leaderboard...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto modern-card p-8 fade-in">
      <div className="text-center mb-12">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center">
          <Trophy className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-4xl font-bold gradient-text mb-4">🏆 Leaderboard</h2>
        <p className="text-gray-600 text-lg">Top performers across all quizzes</p>
      </div>
      
      {attempts.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <Trophy className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Scores Yet</h3>
          <p className="text-gray-500">Be the first to take a quiz and appear on the leaderboard!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {attempts.map((attempt, index) => (
            <div
              key={attempt.id}
              className={`modern-card p-6 transition-all duration-300 hover:scale-[1.02] ${
                index < 3 ? 'ring-2 ring-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50' : 'hover:shadow-lg'
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center gap-6">
                <div className="flex items-center justify-center w-16 h-16 flex-shrink-0">
                  {index < 3 ? (
                    <div className="relative">
                      {getRankIcon(index + 1)}
                      {index === 0 && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-white">1</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-lg font-bold text-gray-600">#{index + 1}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {attempt.user_email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 truncate">
                        {attempt.user_email}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {attempt.quiz?.title}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${
                      index === 0 ? 'text-yellow-600' : 
                      index === 1 ? 'text-gray-500' : 
                      index === 2 ? 'text-amber-600' : 'text-gray-700'
                    }`}>
                      {attempt.percentage}%
                    </div>
                    <div className="text-sm text-gray-600">
                      {attempt.score}/{attempt.total_points} pts
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-gray-600 mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">{formatTime(attempt.time_taken)}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(attempt.completed_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  {index < 3 && (
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        index === 0 ? 'bg-yellow-100' : 
                        index === 1 ? 'bg-gray-100' : 'bg-amber-100'
                      }`}>
                        <Trophy className={`w-4 h-4 ${
                          index === 0 ? 'text-yellow-600' : 
                          index === 1 ? 'text-gray-500' : 'text-amber-600'
                        }`} />
                      </div>
                    </div>
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