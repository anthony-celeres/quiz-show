import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { QuizAttempt } from '@/types/quiz';
import { useAuth } from '@/hooks/useAuth';
import { Clock, Calendar, Trophy, History as HistoryIcon } from 'lucide-react';

export const QuizHistory = () => {
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
    if (percentage >= 90) return 'text-green-600 bg-green-100';
    if (percentage >= 80) return 'text-blue-600 bg-blue-100';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100';
    if (percentage >= 60) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return <div className="text-center py-8">Loading history...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto modern-card p-8 fade-in">
      <div className="text-center mb-12">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center">
          <HistoryIcon className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-4xl font-bold gradient-text mb-4">📚 Quiz History</h2>
        <p className="text-gray-600 text-lg">Track your learning progress and achievements</p>
      </div>
      
      {attempts.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <HistoryIcon className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Quiz History Yet</h3>
          <p className="text-gray-500">Start taking quizzes to build your learning history!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {attempts.map((attempt, index) => (
            <div 
              key={attempt.id} 
              className="modern-card p-8 group hover:shadow-xl transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {attempt.quiz?.title}
                    </h3>
                    <p className="text-gray-600 mb-4 leading-relaxed">{attempt.quiz?.description}</p>
                    
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`px-4 py-2 rounded-xl text-lg font-bold ${getGradeColor(attempt.percentage)}`}>
                        {attempt.percentage}%
                      </div>
                      <div className="text-sm text-gray-500">
                        Completed {new Date(attempt.completed_at).toLocaleDateString()} at {new Date(attempt.completed_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <Trophy className="w-6 h-6 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">Score</h4>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">
                    {attempt.score}/{attempt.total_points}
                  </p>
                  <p className="text-sm text-blue-600">points earned</p>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="w-6 h-6 text-green-600" />
                    <h4 className="font-semibold text-green-900">Time Taken</h4>
                  </div>
                  <p className="text-2xl font-bold text-green-700">
                    {formatTime(attempt.time_taken)}
                  </p>
                  <p className="text-sm text-green-600">minutes</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-6 h-6 text-purple-600" />
                    <h4 className="font-semibold text-purple-900">Date</h4>
                  </div>
                  <p className="text-lg font-bold text-purple-700">
                    {new Date(attempt.completed_at).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                  <p className="text-sm text-purple-600">quiz completed</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};