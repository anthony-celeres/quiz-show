import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Quiz, Question } from '@/types/quiz';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Clock, CircleCheck as CheckCircle } from 'lucide-react';

interface QuizAttemptProps {
  quiz: Quiz;
  onComplete: () => void;
  onCancel: () => void;
}

export const QuizAttempt = ({ quiz, onComplete, onCancel }: QuizAttemptProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  // answers can be number (option index), string/number (numeric answers), or boolean
  const [answers, setAnswers] = useState<Record<string, number | string | boolean>>({});
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

  return (
    <div className="max-w-4xl mx-auto modern-card p-4 sm:p-6 md:p-8 fade-in">
      <div className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold gradient-text mb-1 sm:mb-2">{quiz.title}</h2>
          <p className="text-sm sm:text-base text-gray-600">Test your knowledge and see how you perform!</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
          <div className={`flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl shadow-lg transition-all duration-200 ${
            timeLeft < 300 
              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white animate-pulse' 
              : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
          }`}>
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="font-mono font-bold text-base sm:text-lg">{formatTime(timeLeft)}</span>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 px-3 sm:px-4 py-2 sm:py-3 rounded-xl flex-1 sm:flex-initial">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                {Object.keys(answers).length} / {questions.length} answered
              </span>
            </div>
            <div className="progress-bar mt-2">
              <div 
                className="progress-fill" 
                style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        {questions.map((question, index) => (
          <div key={question.id} className="modern-card p-4 sm:p-6 md:p-8 group hover:shadow-xl transition-all duration-300">
            <div className="flex items-start justify-between mb-4 sm:mb-6 gap-2">
              <div className="flex items-start gap-2 sm:gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-base sm:text-lg">{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 leading-relaxed break-words">
                    {question.question_text}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 whitespace-nowrap">
                      {question.points} {question.points === 1 ? 'pt' : 'pts'}
                    </span>
                    {answers[question.id] !== undefined && (
                      <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 whitespace-nowrap">
                        <CheckCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                        Answered
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3">
              {/* Render depending on question type */}
              {((question.type as any) === 'numeric' || (question.type as any) === 'identification') ? (
                <div className="space-y-2">
                  <Input
                    placeholder="Enter numeric answer"
                    value={String(answers[question.id] ?? '')}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAnswerChange(question.id, e.target.value)}
                    className="w-full text-base"
                  />
                </div>
              ) : question.type === 'truefalse' ? (
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  {[true, false].map((val) => (
                    <label
                      key={String(val)}
                      className={`flex items-center p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 group/option flex-1 ${
                        answers[question.id] === val
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-md'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 hover:shadow-sm'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={val ? 'true' : 'false'}
                        checked={answers[question.id] === val}
                        onChange={() => handleAnswerChange(question.id, val)}
                        className="w-4 h-4 sm:w-5 sm:h-5 mr-3 sm:mr-4 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-gray-900 dark:text-gray-100 font-medium leading-relaxed text-sm sm:text-base">{val ? 'True' : 'False'}</span>
                      </div>
                      {answers[question.id] === val && (
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              ) : (
                question.options?.map((option, optionIndex) => (
                  <label
                    key={optionIndex}
                    className={`flex items-center p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 group/option ${
                      answers[question.id] === optionIndex
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-md'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 hover:shadow-sm'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={optionIndex}
                      checked={answers[question.id] === optionIndex}
                      onChange={() => handleAnswerChange(question.id, optionIndex)}
                      className="w-4 h-4 sm:w-5 sm:h-5 mr-3 sm:mr-4 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-gray-900 dark:text-gray-100 font-medium leading-relaxed text-sm sm:text-base break-words">{option}</span>
                    </div>
                    {answers[question.id] === optionIndex && (
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      </div>
                    )}
                  </label>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 sm:mt-12 p-4 sm:p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
          <div className="text-center sm:text-left w-full sm:w-auto">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Quiz Progress</p>
            <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
              {Object.keys(answers).length} of {questions.length} questions answered
            </p>
            <div className="progress-bar mt-2">
              <div 
                className="progress-fill" 
                style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Button 
              variant="warning" 
              onClick={onCancel}
              className="w-full sm:w-auto sm:min-w-[120px] text-sm sm:text-base"
              size="default"
            >
              Cancel Quiz
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || Object.keys(answers).length === 0}
              loading={submitting}
              size="default"
              variant="success"
              className="w-full sm:w-auto sm:min-w-[160px] text-sm sm:text-base"
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </Button>
          </div>
        </div>
        
        {Object.keys(answers).length < questions.length && (
          <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
            <div className="flex items-start sm:items-center gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5 sm:mt-0" fill="currentColor" viewBox="0 0 20 20">
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