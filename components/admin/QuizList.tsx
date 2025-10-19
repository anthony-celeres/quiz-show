import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Quiz } from '@/types/quiz';
import { Button } from '@/components/ui/Button';
import { CreditCard as Edit, Trash2, Eye, Users, Calendar, BookOpen, Clock, Trophy } from 'lucide-react';

interface QuizListProps {
  onEdit: (quiz: Quiz) => void;
  onViewAttempts: (quiz: Quiz) => void;
  refresh: boolean;
  onStatusChange?: () => void;
}

export const QuizList = ({ onEdit, onViewAttempts, refresh, onStatusChange }: QuizListProps) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuizzes = async () => {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          questions (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuizzes(data || []);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, [refresh]);

  const toggleQuizStatus = async (quiz: Quiz) => {
    if (!supabase) return;
    const nextStatus = !quiz.is_active;
    const updates: Record<string, unknown> = {
      is_active: nextStatus,
    };

    if (nextStatus) {
      updates.activation_cycle = (quiz.activation_cycle ?? 0) + 1;
    }

    try {
      const { error } = await supabase
        .from('quizzes')
        .update(updates)
        .eq('id', quiz.id);

      if (error) throw error;
      fetchQuizzes();
      onStatusChange?.();
    } catch (error) {
      console.error('Error updating quiz status:', error);
    }
  };

  const deleteQuiz = async (quiz: Quiz) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return;
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quiz.id);

      if (error) throw error;
      fetchQuizzes();
    } catch (error) {
      console.error('Error deleting quiz:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading quizzes...</div>;
  }

  return (
    <div className="space-y-8 fade-in">
      <div className="text-center">
        <h2 className="text-4xl font-bold gradient-text mb-4">Quiz Management</h2>
        <p className="text-gray-600 text-lg">Manage and organize your quizzes</p>
      </div>
      
      {quizzes.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Quizzes Created Yet</h3>
          <p className="text-gray-500">Create your first quiz to get started!</p>
        </div>
      ) : (
        <div className="responsive-grid">
          {quizzes.map((quiz, index) => (
            <div 
              key={quiz.id} 
              className="modern-card p-8 group hover:scale-105 transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {quiz.title}
                      </h3>
                      <div className={quiz.is_active ? 'status-active' : 'status-inactive'}>
                        {quiz.is_active ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-6 leading-relaxed line-clamp-3">
                    {quiz.description || 'No description provided'}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">{quiz.questions?.length || 0} questions</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                      <Clock className="w-4 h-4 text-green-500" />
                      <span className="font-medium">{quiz.duration_minutes} min</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      <span className="font-medium">{quiz.total_points} pts</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                      <Calendar className="w-4 h-4 text-purple-500" />
                      <span className="font-medium">{new Date(quiz.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onViewAttempts(quiz)}
                  className="w-full"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Attempts
                </Button>
                
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onEdit(quiz)}
                  className="w-full"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                
                <Button
                  size="sm"
                  variant={quiz.is_active ? 'warning' : 'success'}
                  onClick={() => toggleQuizStatus(quiz)}
                  className="w-full"
                >
                  {quiz.is_active ? 'Deactivate' : 'Activate'}
                </Button>
                
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteQuiz(quiz)}
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};