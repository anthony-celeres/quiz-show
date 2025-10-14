'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { signOut, supabase } from '@/lib/supabase';
import { QuizForm } from '@/components/admin/QuizForm';
import { QuizList } from '@/components/admin/QuizList';
import { QuizAttemptsList } from '@/components/admin/QuizAttemptsList';
import { QuizAttempt } from '@/components/student/QuizAttempt';
import { QuizResults } from '@/components/student/QuizResults';
import { Leaderboard } from '@/components/Leaderboard';
import { QuizHistory } from '@/components/QuizHistory';
import { Button } from '@/components/ui/Button';
import { Quiz, QuizAttempt as QuizAttemptType } from '@/types/quiz';
import { 
  BookOpen, 
  Plus, 
  Trophy, 
  History, 
  LogOut, 
  Play,
  Clock
} from 'lucide-react';

type View = 'quizzes' | 'create' | 'attempt' | 'results' | 'leaderboard' | 'history' | 'attempts';

export default function Home() {
  const { user, loading, isAdmin, isStudent } = useAuth();
  const router = useRouter();
  const [view, setView] = useState<View>('quizzes');
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [lastAttempt, setLastAttempt] = useState<QuizAttemptType | null>(null);
  const [availableQuizzes, setAvailableQuizzes] = useState<Quiz[]>([]);
  const [refreshQuizzes, setRefreshQuizzes] = useState(false);
  const [userAttempts, setUserAttempts] = useState<QuizAttemptType[]>([]);

  const fetchAvailableQuizzes = useCallback(async () => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAvailableQuizzes(data || []);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    }
  }, []);

  const fetchUserAttempts = useCallback(async () => {
    if (!supabase || !user?.id) return;

    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setUserAttempts(data || []);
    } catch (error) {
      console.error('Error fetching user attempts:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!isStudent) return;
    fetchAvailableQuizzes();
  }, [isStudent, refreshQuizzes, fetchAvailableQuizzes]);

  useEffect(() => {
    if (!isStudent || !user?.id) return;
    fetchUserAttempts();
  }, [isStudent, user?.id, refreshQuizzes, fetchUserAttempts]);

  const handleSignOut = async () => {
    await signOut();
    setView('quizzes');
  };

  const handleQuizComplete = async () => {
    if (!supabase || !user || !selectedQuiz) return;
    
    // Fetch the latest attempt
    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          quiz:quizzes (*)
        `)
        .eq('user_id', user.id)
        .eq('quiz_id', selectedQuiz.id)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      setLastAttempt(data);
      setView('results');
    } catch (error) {
      console.error('Error fetching attempt:', error);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center animated-bg">
        <div className="text-center modern-card p-12">
          <div className="w-16 h-16 mx-auto mb-6 relative">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading QuizMaster</h2>
          <p className="text-gray-600">Preparing your experience...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center animated-bg">
        <div className="text-center modern-card p-12">
          <div className="w-16 h-16 mx-auto mb-6 relative">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Redirecting to login</h2>
          <p className="text-gray-600">Hold tight, we are taking you to the sign-in page.</p>
        </div>
      </div>
    );
  }

  const renderNavigation = () => (
    <nav className="glass sticky top-0 z-50 border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold gradient-text">QuizMaster</h1>
            </div>
            
            <div className="hidden md:flex items-center gap-2">
              {isAdmin ? (
                <>
                  <Button
                    variant={view === 'quizzes' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setView('quizzes')}
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Manage Quizzes
                  </Button>
                  <Button
                    variant={view === 'create' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => {
                      setSelectedQuiz(null);
                      setView('create');
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Quiz
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant={view === 'quizzes' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setView('quizzes')}
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Quizzes
                  </Button>
                  <Button
                    variant={view === 'history' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setView('history')}
                  >
                    <History className="w-4 h-4 mr-2" />
                    History
                  </Button>
                </>
              )}
              
              <Button
                variant={view === 'leaderboard' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('leaderboard')}
              >
                <Trophy className="w-4 h-4 mr-2" />
                Leaderboard
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-white/50 rounded-full">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user.email}</p>
                <p className="text-xs text-gray-500">{isAdmin ? 'Administrator' : 'Student'}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );

  const renderContent = () => {
    switch (view) {
      case 'create':
        return (
          <QuizForm
            onSuccess={() => {
              setView('quizzes');
              setRefreshQuizzes(!refreshQuizzes);
            }}
            onCancel={() => setView('quizzes')}
            quizToEdit={selectedQuiz || undefined}
          />
        );

      case 'attempt':
        return selectedQuiz ? (
          <QuizAttempt
            quiz={selectedQuiz}
            onComplete={handleQuizComplete}
            onCancel={() => setView('quizzes')}
          />
        ) : null;

      case 'results':
        return lastAttempt ? (
          <QuizResults
            attempt={lastAttempt}
            onClose={() => {
              setView('quizzes');
              setLastAttempt(null);
              setSelectedQuiz(null);
              setRefreshQuizzes(!refreshQuizzes);
            }}
          />
        ) : null;

      case 'leaderboard':
        return <Leaderboard />;

      case 'history':
        return <QuizHistory />;

      case 'attempts':
        return selectedQuiz ? (
          <QuizAttemptsList 
            quiz={selectedQuiz} 
            onBack={() => setView('quizzes')} 
          />
        ) : null;

      case 'quizzes':
        if (isAdmin) {
          return (
            <QuizList
              onEdit={(quiz) => {
                setSelectedQuiz(quiz);
                setView('create');
              }}
              onViewAttempts={(quiz) => {
                setSelectedQuiz(quiz);
                setView('attempts');
              }}
              refresh={refreshQuizzes}
            />
          );
        } else {
          return (
            <div className="space-y-8 fade-in">
              <div className="text-center">
                <h2 className="text-4xl font-bold gradient-text mb-4">Available Quizzes</h2>
                <p className="text-gray-600 text-lg">Choose a quiz to test your knowledge</p>
              </div>
              
              {availableQuizzes.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Quizzes Available</h3>
                  <p className="text-gray-500">Check back later for new quizzes!</p>
                </div>
              ) : (
                <div className="responsive-grid">
                  {availableQuizzes.map((quiz, index) => {
                    const hasAttempted = userAttempts.some(attempt => attempt.quiz_id === quiz.id);
                    const isDisabled = !quiz.is_active || hasAttempted;
                    
                    return (
                      <div 
                        key={quiz.id} 
                        className={`modern-card p-8 group transition-all duration-300 ${
                          isDisabled ? 'opacity-75' : 'hover:scale-105'
                        }`}
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                isDisabled ? 'bg-gray-400' : 'bg-gradient-to-br from-blue-500 to-purple-600'
                              }`}>
                                <BookOpen className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h3 className={`text-xl font-bold transition-colors ${
                                  isDisabled ? 'text-gray-600' : 'text-gray-900 group-hover:text-blue-600'
                                }`}>
                                  {quiz.title}
                                </h3>
                                <div className={`${
                                  quiz.is_active ? 'status-active' : 'status-inactive'
                                }`}>
                                  {quiz.is_active ? 'Active' : 'Inactive'}
                                </div>
                              </div>
                            </div>
                            
                            <p className="text-gray-600 mb-6 leading-relaxed">{quiz.description}</p>
                            
                            <div className="grid grid-cols-2 gap-4 mb-6">
                              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                                <Clock className="w-4 h-4 text-blue-500" />
                                <span className="font-medium">{quiz.duration_minutes} min</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                                <Trophy className="w-4 h-4 text-yellow-500" />
                                <span className="font-medium">{quiz.total_points} pts</span>
                              </div>
                            </div>
                            
                            {hasAttempted && (
                              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  <span className="text-green-700 font-medium">Already Attempted</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          size="lg"
                          className={`w-full ${
                            isDisabled ? 'opacity-50 cursor-not-allowed' : 'group-hover:shadow-xl'
                          }`}
                          disabled={isDisabled}
                          onClick={() => {
                            if (!isDisabled) {
                              setSelectedQuiz(quiz);
                              setView('attempt');
                            }
                          }}
                        >
                          <Play className="w-5 h-5 mr-2" />
                          {hasAttempted ? 'Already Attempted' : !quiz.is_active ? 'Quiz Inactive' : 'Start Quiz'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {renderNavigation()}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {renderContent()}
      </main>
    </div>
  );
}