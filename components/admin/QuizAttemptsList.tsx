import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Quiz, QuizAttempt } from '@/types/quiz';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Users, Trophy, Clock, Calendar } from 'lucide-react';

interface QuizAttemptsListProps {
  quiz: Quiz;
  onBack: () => void;
}

export const QuizAttemptsList = ({ quiz, onBack }: QuizAttemptsListProps) => {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchAttempts = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('quiz_id', quiz.id)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      setAttempts(data || []);
    } catch (error) {
      console.error('Error fetching attempts:', error);
    } finally {
      setLoading(false);
    }
  }, [quiz.id]);

  useEffect(() => {
    fetchAttempts();
  }, [fetchAttempts]);

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
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-6 relative">
          <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-gray-600">Loading quiz attempts...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto modern-card p-8 fade-in">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={onBack} size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Quizzes
        </Button>
      </div>

      <div className="text-center mb-12">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center">
          <Users className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-4xl font-bold gradient-text mb-4">Quiz Attempts</h2>
        <p className="text-gray-600 text-lg">{quiz.title}</p>
        <p className="text-gray-500">View all student attempts for this quiz</p>
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6 text-blue-600" />
            <h4 className="font-semibold text-blue-900">Total Attempts</h4>
          </div>
          <p className="text-2xl font-bold text-blue-700">{attempts.length}</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-6 h-6 text-green-600" />
            <h4 className="font-semibold text-green-900">Average Score</h4>
          </div>
          <p className="text-2xl font-bold text-green-700">
            {attempts.length > 0 
              ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / attempts.length)
              : 0}%
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-6 h-6 text-purple-600" />
            <h4 className="font-semibold text-purple-900">Avg Time</h4>
          </div>
          <p className="text-2xl font-bold text-purple-700">
            {attempts.length > 0 
              ? formatTime(Math.round(attempts.reduce((sum, attempt) => sum + attempt.time_taken, 0) / attempts.length))
              : '0:00'}
          </p>
        </div>
      </div>
      
      {attempts.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <Users className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Attempts Yet</h3>
          <p className="text-gray-500">No students have attempted this quiz yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {attempts.map((attempt, index) => (
            <div
              key={attempt.id}
              className="modern-card p-6 group hover:shadow-xl transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-lg">
                    {attempt.user_email.charAt(0).toUpperCase()}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">
                    {attempt.user_email}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Completed {new Date(attempt.completed_at).toLocaleDateString()} at {new Date(attempt.completed_at).toLocaleTimeString()}
                  </p>
                </div>
                
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getGradeColor(attempt.percentage).split(' ')[0]}`}>
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
                  
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(attempt.percentage)}`}>
                    {attempt.percentage >= 90 ? 'Excellent' :
                     attempt.percentage >= 80 ? 'Good' :
                     attempt.percentage >= 70 ? 'Satisfactory' :
                     attempt.percentage >= 60 ? 'Pass' : 'Fail'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
