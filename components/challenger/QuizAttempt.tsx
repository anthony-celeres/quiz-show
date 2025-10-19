import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Quiz, Question } from '@/types/quiz';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Clock, CircleCheck as CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface QuizAttemptProps {
  quiz: Quiz;
  onComplete: () => void;
  onCancel: () => void;
}

export const QuizAttempt = ({ quiz, onComplete, onCancel }: QuizAttemptProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  // answers can be number (option index), string/number (numeric answers), or boolean
  const [answers, setAnswers] = useState<Record<string, number | string | boolean>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(quiz.duration_minutes * 60);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

  const fetchQuestions = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', quiz.id)
        .order('created_at');

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  }, [quiz.id]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);


  const handleAnswerChange = (questionId: string, value: number | string | boolean) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  // Helper function to check if a question is truly answered (not empty/cleared)
  const isQuestionAnswered = (questionId: string) => {
    const answer = answers[questionId];
    
    // If answer doesn't exist, it's not answered
    if (answer === undefined || answer === null) {
      return false;
    }
    
    // For string/number answers (identification, numeric), check if not empty
    if (typeof answer === 'string') {
      return answer.trim() !== '';
    }
    
    // For number answers (could be 0, which is valid)
    if (typeof answer === 'number') {
      return true;
    }
    
    // For boolean answers (true/false)
    if (typeof answer === 'boolean') {
      return true;
    }
    
    return false;
  };

  // Helper to count how many questions have been answered
  const getAnsweredCount = () => {
    return questions.filter(q => isQuestionAnswered(q.id)).length;
  };

  const calculateScore = useCallback(() => {
    let score = 0;
    questions.forEach((question) => {
      const userAns = answers[question.id];
      const isIdentification = (question.type as any) === 'identification' || (question.type as any) === 'numeric';
      if (isIdentification) {
        const expectedRaw = question.correct_answer;
        const providedRaw = userAns;

        const expectedNumber = Number(expectedRaw);
        const providedNumber = Number(providedRaw);
        const bothNumeric = !Number.isNaN(expectedNumber) && !Number.isNaN(providedNumber);

        if (bothNumeric) {
          if (Math.abs(expectedNumber - providedNumber) < 1e-6) {
            score += question.points;
          }
        } else {
          const normalize = (value: unknown) =>
            typeof value === 'string' || typeof value === 'number'
              ? value.toString().trim().toLowerCase()
              : typeof value === 'boolean'
              ? value.toString()
              : '';

          const normalizedExpected = normalize(expectedRaw);
          const normalizedProvided = normalize(providedRaw);

          if (normalizedProvided && normalizedProvided === normalizedExpected) {
            score += question.points;
          }
        }
      } else if (question.type === 'truefalse') {
        const expected = Boolean(question.correct_answer);
        if (typeof userAns === 'boolean' && userAns === expected) {
          score += question.points;
        }
      } else {
        // default: multiple choice (index comparison)
        if (Number(userAns) === Number(question.correct_answer)) {
          score += question.points;
        }
      }
    });
    return score;
  }, [answers, questions]);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      if (!supabase) throw new Error('Supabase not configured');
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data: latestQuiz, error: latestQuizError } = await supabase
        .from('quizzes')
        .select('activation_cycle, max_attempts')
        .eq('id', quiz.id)
        .maybeSingle();

      if (latestQuizError) throw latestQuizError;
      const currentCycle = latestQuiz?.activation_cycle ?? quiz.activation_cycle ?? 0;
      const maxAttempts = latestQuiz?.max_attempts ?? null;

      // Check if user has reached max attempts limit
      if (maxAttempts !== null && maxAttempts > 0) {
        const { count, error: countError } = await supabase
          .from('quiz_attempts')
          .select('*', { count: 'exact', head: true })
          .eq('quiz_id', quiz.id)
          .eq('user_id', user.user.id)
          .eq('activation_cycle', currentCycle);

        if (countError) throw countError;

        if (count !== null && count >= maxAttempts) {
          alert(`You have reached the maximum number of attempts (${maxAttempts}) for this quiz.`);
          onComplete();
          return;
        }
      }

      const score = calculateScore();
      const percentage = quiz.total_points > 0
        ? Math.round((score / quiz.total_points) * 100)
        : 0;
      const timeTaken = Math.round((Date.now() - startTime) / 1000);

      const { error } = await supabase.from('quiz_attempts').insert({
        quiz_id: quiz.id,
        user_id: user.user.id,
        user_email: user.user.email,
        score,
        total_points: quiz.total_points,
        percentage,
        answers,
        activation_cycle: currentCycle,
        time_taken: timeTaken,
      });

      if (error) throw error;
      onComplete();
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Error submitting quiz: ' + (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  }, [answers, calculateScore, quiz.activation_cycle, quiz.id, quiz.total_points, onComplete, startTime, submitting]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          void handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [handleSubmit]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="text-center py-8">Loading quiz...</div>;
  }

  if (questions.length === 0) {
    return <div className="text-center py-8">No questions available for this quiz.</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const goToNextQuestion = () => {
    if (!isLastQuestion) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (!isFirstQuestion) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  return (
    <div className="max-w-4xl mx-auto modern-card p-4 sm:p-6 md:p-8 fade-in">
      {/* Quiz Header - Compact on mobile, normal on desktop */}
      <div className="sticky top-4 md:top-14 z-30 -mx-4 sm:-mx-6 md:-mx-8 -mt-4 sm:-mt-6 md:-mt-8 mb-4 sm:mb-6 md:mb-8 px-3 sm:px-4 md:px-8 pt-3 sm:pt-4 md:pt-8 pb-2 sm:pb-3 md:pb-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 shadow-sm rounded-b-xl md:rounded-b-none">
        {/* Mobile - Ultra Compact: Title on one line, timer+progress on one line */}
        <div className="md:hidden">
          <h2 className="text-lg font-bold gradient-text mb-2 truncate">{quiz.title}</h2>
          <div className="flex items-center gap-2">
            {/* Timer Badge */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg shadow transition-all duration-200 flex-shrink-0 ${
              timeLeft < 300 
                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white animate-pulse' 
                : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
            }`}>
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="font-mono font-bold text-sm">{formatTime(timeLeft)}</span>
            </div>
            
            {/* Progress inline */}
            <div className="flex-1 flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                {getAnsweredCount()}/{questions.length}
              </span>
              <div className="progress-bar flex-1 h-1.5">
                <div 
                  className="progress-fill h-full" 
                  style={{ width: `${(getAnsweredCount() / questions.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Desktop Compact Header - Title inline with timer */}
        <div className="hidden md:flex md:items-center md:justify-between md:gap-4 mb-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold gradient-text truncate">{quiz.title}</h2>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg shadow-md transition-all duration-200 flex-shrink-0 ${
            timeLeft < 300 
              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white animate-pulse' 
              : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
          }`}>
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span className="font-mono font-bold text-base">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Desktop Progress - Compact single line */}
        <div className="hidden md:flex md:items-center md:gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              {getAnsweredCount()} / {questions.length} answered
            </span>
          </div>
          <div className="progress-bar flex-1 h-2">
            <div 
              className="progress-fill h-full" 
              style={{ width: `${(getAnsweredCount() / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Question Navigation Palette - Sticky and Compact with Smart Pagination */}
      <div className="sticky top-24 md:top-44 z-20 mb-4 sm:mb-6 p-2 sm:p-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700 shadow-md">
        <div className="flex items-center justify-between mb-1.5 px-1">
          <h3 className="text-[10px] sm:text-xs font-semibold text-gray-900 dark:text-gray-100">Questions</h3>
          <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-medium">
            {currentQuestionIndex + 1} / {questions.length}
          </span>
        </div>
        
        {/* Simple Pagination - Show 10 items per page */}
        {questions.length <= 10 ? (
          // Show all questions for quizzes with 10 or fewer questions
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1 sm:gap-1.5">
            {questions.map((q, index) => (
              <button
                key={q.id}
                onClick={() => goToQuestion(index)}
                className={`h-7 sm:h-8 rounded-md font-bold text-[10px] sm:text-xs transition-all hover:scale-105 flex items-center justify-center border-2 ${
                  index === currentQuestionIndex
                    ? 'bg-blue-500 border-blue-600 text-white shadow-sm'
                    : isQuestionAnswered(q.id)
                    ? 'bg-white dark:bg-gray-900/50 border-green-500 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30'
                    : 'bg-white dark:bg-gray-900/50 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20'
                }`}
                title={`Question ${index + 1}${isQuestionAnswered(q.id) ? ' - Answered' : ''}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        ) : (
          // For large quizzes (>10 questions), show 10 items per page with arrows
          <div className="space-y-2">
            {/* Page-based navigation - 10 items per page */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              {(() => {
                const itemsPerPage = 10;
                const currentPage = Math.floor(currentQuestionIndex / itemsPerPage);
                const totalPages = Math.ceil(questions.length / itemsPerPage);
                const startIndex = currentPage * itemsPerPage;
                const endIndex = Math.min(startIndex + itemsPerPage, questions.length);
                const pageQuestions = questions.slice(startIndex, endIndex);
                
                return (
                  <>
                    {/* Left Arrow - Previous Page */}
                    {currentPage > 0 && (
                      <button
                        onClick={() => goToQuestion((currentPage - 1) * itemsPerPage)}
                        className="h-7 sm:h-8 px-2 rounded-md font-bold text-[10px] sm:text-xs transition-all hover:scale-105 flex items-center justify-center border-2 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                        title="Previous page"
                      >
                        ←
                      </button>
                    )}
                    
                    {/* Current Page Questions (10 items) */}
                    <div className="flex-1 grid grid-cols-5 sm:grid-cols-10 gap-1 sm:gap-1.5">
                      {pageQuestions.map((q, idx) => {
                        const index = startIndex + idx;
                        return (
                          <button
                            key={q.id}
                            onClick={() => goToQuestion(index)}
                            className={`h-7 sm:h-8 rounded-md font-bold text-[10px] sm:text-xs transition-all hover:scale-105 flex items-center justify-center border-2 ${
                              index === currentQuestionIndex
                                ? 'bg-blue-500 border-blue-600 text-white shadow-sm'
                                : isQuestionAnswered(q.id)
                                ? 'bg-white dark:bg-gray-900/50 border-green-500 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30'
                                : 'bg-white dark:bg-gray-900/50 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20'
                            }`}
                            title={`Question ${index + 1}${isQuestionAnswered(q.id) ? ' - Answered' : ''}`}
                          >
                            {index + 1}
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* Right Arrow - Next Page */}
                    {currentPage < totalPages - 1 && (
                      <button
                        onClick={() => goToQuestion((currentPage + 1) * itemsPerPage)}
                        className="h-7 sm:h-8 px-2 rounded-md font-bold text-[10px] sm:text-xs transition-all hover:scale-105 flex items-center justify-center border-2 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                        title="Next page"
                      >
                        →
                      </button>
                    )}
                  </>
                );
              })()}
            </div>
            
            {/* Progress indicator */}
            <div className="flex items-center justify-between px-1 pt-1 border-t border-gray-200 dark:border-gray-700">
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                Page {Math.floor(currentQuestionIndex / 10) + 1} of {Math.ceil(questions.length / 10)} • {getAnsweredCount()}/{questions.length} answered
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Current Question */}
      <div className="bg-white dark:bg-gray-900 border-2 border-blue-500 dark:border-blue-600 rounded-xl p-6 sm:p-7 md:p-8 mb-4 sm:mb-6 shadow-sm my-6">
        <div className="flex items-start gap-3 sm:gap-4 mb-5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm sm:text-base">{currentQuestionIndex + 1}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 leading-relaxed">
              {currentQuestion.question_text}
            </h3>
          </div>
        </div>

        <div className="space-y-3 sm:space-y-3.5 mb-4">
          {/* Render depending on question type */}
          {((currentQuestion.type as any) === 'numeric' || (currentQuestion.type as any) === 'identification') ? (
            <Input
              placeholder="Type your answer"
              value={String(answers[currentQuestion.id] ?? '')}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAnswerChange(currentQuestion.id, e.target.value)}
              className="w-full"
              autoFocus
            />
          ) : currentQuestion.type === 'truefalse' ? (
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {[true, false].map((val) => (
                <label
                  key={String(val)}
                  className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all flex-1 ${
                    answers[currentQuestion.id] === val
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-500'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={val ? 'true' : 'false'}
                    checked={answers[currentQuestion.id] === val}
                    onChange={() => handleAnswerChange(currentQuestion.id, val)}
                    className="w-4 h-4 mr-3 text-blue-600 focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{val ? 'True' : 'False'}</span>
                  {answers[currentQuestion.id] === val && (
                    <CheckCircle className="w-5 h-5 text-blue-500 ml-auto" />
                  )}
                </label>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {currentQuestion.options?.map((option, optionIndex) => (
                <label
                  key={optionIndex}
                  className={`flex items-center p-3.5 rounded-lg border-2 cursor-pointer transition-all ${
                    answers[currentQuestion.id] === optionIndex
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-500'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={optionIndex}
                    checked={answers[currentQuestion.id] === optionIndex}
                    onChange={() => handleAnswerChange(currentQuestion.id, optionIndex)}
                    className="w-4 h-4 mr-3 text-blue-600 focus:ring-blue-500 focus:ring-2 flex-shrink-0"
                  />
                  <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100">{option}</span>
                  {answers[currentQuestion.id] === optionIndex && (
                    <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 ml-2" />
                  )}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Points and Status - Below Answer Choices */}
        <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-gray-200 dark:border-gray-700">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            {currentQuestion.points} {currentQuestion.points === 1 ? 'point' : 'points'}
          </span>
          {isQuestionAnswered(currentQuestion.id) && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Answered
            </span>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-2 sm:gap-3 mb-4 sm:mb-6">
        <Button
          onClick={goToPreviousQuestion}
          disabled={isFirstQuestion}
          variant="outline"
          size="sm"
          className="flex-1 sm:flex-initial sm:min-w-[110px] text-xs sm:text-sm py-2"
        >
          <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
          Previous
        </Button>
        
        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-semibold px-2 bg-gray-100 dark:bg-gray-800 rounded-md py-1">
          {currentQuestionIndex + 1} / {questions.length}
        </span>

        <Button
          onClick={goToNextQuestion}
          disabled={isLastQuestion}
          variant="outline"
          size="sm"
          className="flex-1 sm:flex-initial sm:min-w-[110px] text-xs sm:text-sm py-2"
        >
          Next
          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1" />
        </Button>
      </div>

      {/* Submit Section */}
      <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-center sm:text-left w-full sm:w-auto">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Quiz Progress</p>
            <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
              {getAnsweredCount()} of {questions.length} questions answered
            </p>
            <div className="progress-bar mt-2">
              <div 
                className="progress-fill" 
                style={{ width: `${(getAnsweredCount() / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Button 
              variant="warning" 
              onClick={onCancel}
              className="w-full sm:w-auto sm:min-w-[120px]"
              size="default"
            >
              Cancel Quiz
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || getAnsweredCount() === 0}
              loading={submitting}
              size="default"
              variant="success"
              className="w-full sm:w-auto sm:min-w-[160px]"
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </Button>
          </div>
        </div>
        
        {getAnsweredCount() < questions.length && (
          <div className="mt-4 p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
            <div className="flex items-start sm:items-center gap-2">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5 sm:mt-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-300 font-medium">
                Please answer all questions before submitting
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

};
