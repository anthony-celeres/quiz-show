import { QuizAttempt, Question } from '@/types/quiz';
import { Button } from '@/components/ui/Button';
import { CircleCheck as CheckCircle, CircleX as XCircle, Clock, Trophy } from 'lucide-react';
import React, { useState } from 'react';

interface QuizResultsProps {
  attempt: QuizAttempt;
  onClose: () => void;
  onToggleLeaderboard?: () => void;
  showLeaderboard?: boolean;
  leaderboardContent?: React.ReactNode;
}

const normalizeType = (question: Question) => {
  const rawType = (question.type as string) || 'multiple';
  return rawType === 'numeric' ? 'identification' : rawType;
};

const normalizeForComparison = (question: Question, value: unknown) => {
  const type = normalizeType(question);

  if (type === 'truefalse') {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lowered = value.trim().toLowerCase();
      if (lowered === 'true') return true;
      if (lowered === 'false') return false;
    }
    if (typeof value === 'number') {
      if (value === 1) return true;
      if (value === 0) return false;
    }
    return null;
  }

  if (type === 'identification') {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value.trim().toLowerCase();
    if (typeof value === 'number') return value.toString().trim().toLowerCase();
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    return '';
  }

  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const hasProvidedAnswer = (question: Question, value: unknown) => {
  if (value === null || value === undefined) return false;
  const type = normalizeType(question);

  if (type === 'truefalse') {
    return normalizeForComparison(question, value) !== null;
  }

  if (type === 'identification') {
    if (typeof value === 'string') return value.trim() !== '';
    if (typeof value === 'number') return value.toString().trim() !== '';
    return false;
  }

  return normalizeForComparison(question, value) !== null;
};

const isAnswerCorrect = (question: Question, studentValue: unknown) => {
  const type = normalizeType(question);
  if (!hasProvidedAnswer(question, studentValue)) return false;

  const normalizedStudent = normalizeForComparison(question, studentValue);
  const normalizedCorrect = normalizeForComparison(question, question.correct_answer);

  if (type === 'identification') {
    return (
      typeof normalizedStudent === 'string' &&
      normalizedStudent.length > 0 &&
      normalizedStudent === normalizedCorrect
    );
  }

  if (type === 'truefalse' || type === 'multiple') {
    return normalizedStudent !== null && normalizedStudent === normalizedCorrect;
  }

  return false;
};

const formatMultiple = (question: Question, value: unknown) => {
  const index = normalizeForComparison(question, value);
  if (typeof index !== 'number' || !Number.isFinite(index)) return 'Not answered';
  const optionLabel = question.options?.[index];
  return optionLabel ? `Option ${index + 1}: ${optionLabel}` : `Option ${index + 1}`;
};

const formatIdentification = (value: unknown) => {
  if (value === null || value === undefined) return 'Not answered';
  if (typeof value === 'string') return value.trim() || 'Not answered';
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value ? 'True' : 'False';
  return 'Not answered';
};

const formatTrueFalse = (question: Question, value: unknown) => {
  const normalized = normalizeForComparison(question, value);
  if (normalized === null) return 'Not answered';
  return normalized ? 'True' : 'False';
};

const formatAnswer = (question: Question, value: unknown) => {
  const type = normalizeType(question);
  if (type === 'truefalse') return formatTrueFalse(question, value);
  if (type === 'identification') return formatIdentification(value);
  return formatMultiple(question, value);
};

const buildStatus = (question: Question, studentValue: unknown) => {
  const answered = hasProvidedAnswer(question, studentValue);
  const correct = isAnswerCorrect(question, studentValue);

  if (!answered) {
    return {
      label: 'Not Answered',
      icon: <Clock className="w-4 h-4" />,
      badgeClass: 'bg-gray-100 text-gray-600 border border-gray-200',
      containerClass: 'border-gray-200 bg-gray-50',
    };
  }

  if (correct) {
    return {
      label: 'Correct',
      icon: <CheckCircle className="w-4 h-4" />,
      badgeClass: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
      containerClass: 'border-emerald-200 bg-emerald-50/80',
    };
  }

  return {
    label: 'Incorrect',
    icon: <XCircle className="w-4 h-4" />,
    badgeClass: 'bg-rose-100 text-rose-700 border border-rose-200',
    containerClass: 'border-rose-200 bg-rose-50/70',
  };
};

export const QuizResults = ({ attempt, onClose, onToggleLeaderboard, showLeaderboard, leaderboardContent }: QuizResultsProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return { grade: 'A', color: 'text-green-600' };
    if (percentage >= 80) return { grade: 'B', color: 'text-blue-600' };
    if (percentage >= 70) return { grade: 'C', color: 'text-yellow-600' };
    if (percentage >= 60) return { grade: 'D', color: 'text-orange-600' };
    return { grade: 'F', color: 'text-red-600' };
  };

  const scrollToQuestion = (questionId: string) => {
    const element = document.getElementById(`question-${questionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const { grade, color } = getGrade(attempt.percentage);
  const questions = attempt.quiz?.questions ?? [];
  const answers = attempt.answers ?? {};

  // Create question navigation data
  const questionNavigation = questions.map((question, index) => {
    const studentValue = (answers as Record<string, unknown>)[question.id];
    const status = buildStatus(question, studentValue);
    const isCorrect = isAnswerCorrect(question, studentValue);
    const isAnswered = hasProvidedAnswer(question, studentValue);
    
    return {
      id: question.id,
      number: index + 1,
      isCorrect,
      isAnswered,
      status: status.label
    };
  });

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
      <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-4 sm:mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center ${
                attempt.percentage >= 70 ? 'bg-green-100' : 'bg-rose-100'
              }`}
            >
              {attempt.percentage >= 70 ? (
                <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 sm:w-7 sm:h-7 text-rose-600" />
              )}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">Quiz Completed!</h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-words">{attempt.quiz?.title}</p>
            </div>
          </div>
          
          <div className="text-left sm:text-right w-full sm:w-auto">
            <div className={`text-2xl sm:text-3xl font-bold ${color}`}>{attempt.percentage}%</div>
            <div className="text-xs sm:text-sm text-gray-600">Grade: {grade}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-4">
          <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg">
            <div className="text-base sm:text-lg font-bold text-gray-900">{attempt.score}/{attempt.total_points}</div>
            <div className="text-xs text-gray-600">Score</div>
          </div>

          <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg">
            <div className="text-base sm:text-lg font-bold text-gray-900">{formatTime(attempt.time_taken)}</div>
            <div className="text-xs text-gray-600">Time</div>
          </div>

          <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg">
            <div className="text-base sm:text-lg font-bold text-gray-900">{questions.length}</div>
            <div className="text-xs text-gray-600">Questions</div>
          </div>

          <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg">
            <div className="text-base sm:text-lg font-bold text-gray-900">
              {new Date(attempt.completed_at).toLocaleDateString()}
            </div>
            <div className="text-xs text-gray-600">Completed</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
          <Button onClick={onClose} variant="outline" className="w-full sm:w-auto sm:min-w-[160px]">
            Back to Quizzes
          </Button>
          {onToggleLeaderboard && (
            <Button onClick={onToggleLeaderboard} variant="default" className="w-full sm:w-auto sm:min-w-[160px]">
              {showLeaderboard ? 'Hide Leaderboard' : 'View Leaderboard'}
            </Button>
          )}
        </div>
      </div>

      {/* Mini Leaderboard - Rendered between Quiz Completed and Answer Review */}
      {showLeaderboard && leaderboardContent}

      <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-lg">
        <div className="text-center mb-6 sm:mb-8">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Answer Review</h3>
          <p className="text-sm sm:text-base text-gray-600">Compare your responses with the correct answers.</p>
        </div>

        {questions.length === 0 ? (
          <div className="p-6 rounded-2xl border border-gray-200 bg-gray-50 text-center text-gray-600">
            Detailed answers are not available for this quiz.
          </div>
        ) : (
          <div>
            {/* Question Navigation - ABOVE questions on all devices, sticky below header+nav */}
            <div className="sticky top-[142px] z-30 mb-6 -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 py-3 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-y border-gray-200 dark:border-gray-700 shadow-sm">
              <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3">Questions</h4>
              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1.5 sm:gap-2 max-h-[120px] overflow-y-auto">
                {questionNavigation.map((nav) => (
                  <button
                    key={nav.id}
                    onClick={() => scrollToQuestion(nav.id)}
                    className={`w-10 h-10 rounded-lg font-semibold text-xs sm:text-sm transition-all hover:scale-110 ${
                      nav.isCorrect
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : nav.isAnswered
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
                    }`}
                    title={nav.status}
                  >
                    {nav.number}
                  </button>
                ))}
              </div>
            </div>

            {/* Questions List - Full Width */}
            <div className="space-y-4 sm:space-y-6">
            {questions.map((question, index) => {
              const studentValue = (answers as Record<string, unknown>)[question.id];
              const status = buildStatus(question, studentValue);
              const studentAnswer = formatAnswer(question, studentValue);
              const correctAnswer = formatAnswer(question, question.correct_answer);

              return (
                <div
                  key={question.id}
                  id={`question-${question.id}`}
                  className={`rounded-xl sm:rounded-2xl border ${status.containerClass} p-4 sm:p-6 transition-all duration-200`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 sm:gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-2 sm:gap-3 mb-2">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm sm:text-base font-semibold flex items-center justify-center flex-shrink-0">
                          {index + 1}
                        </div>
                        <h4 className="text-base sm:text-lg font-semibold text-gray-900 leading-relaxed break-words">
                          {question.question_text}
                        </h4>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 ml-10 sm:ml-[52px]">
                        <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                          {question.points} {question.points === 1 ? 'pt' : 'pts'}
                        </span>
                        <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide bg-gray-100 text-gray-600">
                          {normalizeType(question) === 'multiple'
                            ? 'Multiple'
                            : normalizeType(question) === 'truefalse'
                            ? 'T/F'
                            : 'ID'}
                        </span>
                      </div>
                    </div>

                    <div className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${status.badgeClass} self-start`}>
                      {status.icon}
                      <span>{status.label}</span>
                    </div>
                  </div>

                  <div className="mt-4 sm:mt-6 grid gap-3 sm:gap-4 md:grid-cols-2">
                    <div className="rounded-xl sm:rounded-2xl border border-white/70 bg-white/80 p-3 sm:p-4 shadow-sm">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Your Answer
                      </p>
                      <p className="mt-2 text-sm text-gray-900 whitespace-pre-wrap break-words">{studentAnswer}</p>
                    </div>
                    <div className="rounded-xl sm:rounded-2xl border border-white/70 bg-white/80 p-3 sm:p-4 shadow-sm">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Correct Answer
                      </p>
                      <p className="mt-2 text-sm text-gray-900 whitespace-pre-wrap break-words">{correctAnswer}</p>
                    </div>
                  </div>

                  {normalizeType(question) === 'multiple' && (question.options?.length ?? 0) > 0 && (
                    <details className="mt-3 sm:mt-4 bg-white/60 rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-4 text-xs sm:text-sm text-gray-700">
                      <summary className="cursor-pointer font-semibold text-gray-800">
                        View all choices
                      </summary>
                      <ol className="mt-2 sm:mt-3 space-y-1.5 sm:space-y-2 list-decimal list-inside">
                        {question.options?.map((option, optionIndex) => (
                          <li key={optionIndex} className="text-gray-700 break-words">
                            {option || <span className="text-gray-400">(Empty option)</span>}
                          </li>
                        ))}
                      </ol>
                    </details>
                  )}
                </div>
              );
            })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};