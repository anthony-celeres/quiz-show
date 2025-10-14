import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Quiz, Question } from '@/types/quiz';
import { Button } from '@/components/ui/Button';
import { Clock, CircleCheck as CheckCircle } from 'lucide-react';

interface QuizAttemptProps {
  quiz: Quiz;
  onComplete: () => void;
  onCancel: () => void;
}

export const QuizAttempt = ({ quiz, onComplete, onCancel }: QuizAttemptProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
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


  const handleAnswerChange = (questionId: string, answerIndex: number) => {
    setAnswers({ ...answers, [questionId]: answerIndex });
  };

  const calculateScore = useCallback(() => {
    let score = 0;
    questions.forEach((question) => {
      if (answers[question.id] === question.correct_answer) {
        score += question.points;
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

      const { data: existingAttempt, error: existingAttemptError } = await supabase
        .from('quiz_attempts')
        .select('id')
        .eq('quiz_id', quiz.id)
        .eq('user_id', user.user.id)
        .maybeSingle();

      if (existingAttemptError) throw existingAttemptError;

      if (existingAttempt) {
        alert('You have already attempted this quiz. Showing your latest results.');
        onComplete();
        return;
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
  }, [answers, calculateScore, quiz.id, quiz.total_points, onComplete, startTime, submitting]);

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
    <div className="max-w-4xl mx-auto modern-card p-8 fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold gradient-text mb-2">{quiz.title}</h2>
          <p className="text-gray-600">Test your knowledge and see how you perform!</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg transition-all duration-200 ${
            timeLeft < 300 
              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white animate-pulse' 
              : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
          }`}>
            <Clock className="w-5 h-5" />
            <span className="font-mono font-bold text-lg">{formatTime(timeLeft)}</span>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 rounded-xl">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">
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

      <div className="space-y-8">
        {questions.map((question, index) => (
          <div key={question.id} className="modern-card p-8 group hover:shadow-xl transition-all duration-300">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 leading-relaxed">
                    {question.question_text}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {question.points} {question.points === 1 ? 'point' : 'points'}
                    </span>
                    {answers[question.id] !== undefined && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Answered
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {question.options.map((option, optionIndex) => (
                <label
                  key={optionIndex}
                  className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 group/option ${
                    answers[question.id] === optionIndex
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={optionIndex}
                    checked={answers[question.id] === optionIndex}
                    onChange={() => handleAnswerChange(question.id, optionIndex)}
                    className="w-5 h-5 mr-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <span className="text-gray-900 font-medium leading-relaxed">{option}</span>
                  </div>
                  {answers[question.id] === optionIndex && (
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 p-6 bg-gray-50 rounded-2xl">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-center sm:text-left">
            <p className="text-sm text-gray-600 mb-1">Quiz Progress</p>
            <p className="text-lg font-semibold text-gray-900">
              {Object.keys(answers).length} of {questions.length} questions answered
            </p>
            <div className="progress-bar mt-2">
              <div 
                className="progress-fill" 
                style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="secondary" 
              onClick={onCancel}
              className="min-w-[120px]"
            >
              Cancel Quiz
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || Object.keys(answers).length === 0}
              loading={submitting}
              size="lg"
              className="min-w-[160px]"
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </Button>
          </div>
        </div>
        
        {Object.keys(answers).length < questions.length && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-yellow-800 font-medium">
                Please answer all questions before submitting
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};