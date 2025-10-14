import { QuizAttempt, Question } from '@/types/quiz';
import { Button } from '@/components/ui/Button';
import { CircleCheck as CheckCircle, CircleX as XCircle, Clock, Trophy } from 'lucide-react';

interface QuizResultsProps {
  attempt: QuizAttempt;
  onClose: () => void;
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

export const QuizResults = ({ attempt, onClose }: QuizResultsProps) => {
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

  const { grade, color } = getGrade(attempt.percentage);
  const questions = attempt.quiz?.questions ?? [];
  const answers = attempt.answers ?? {};

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-3xl shadow-lg">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center ${
                attempt.percentage >= 70 ? 'bg-green-100' : 'bg-rose-100'
              }`}
            >
              {attempt.percentage >= 70 ? (
                <Trophy className="w-10 h-10 text-green-600" />
              ) : (
                <XCircle className="w-10 h-10 text-rose-600" />
              )}
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-2">Quiz Completed!</h2>
          <p className="text-gray-600">{attempt.quiz?.title}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{attempt.score}</div>
            <div className="text-sm text-gray-600">Score</div>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{attempt.total_points}</div>
            <div className="text-sm text-gray-600">Total Points</div>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className={`text-2xl font-bold ${color}`}>{attempt.percentage}%</div>
            <div className="text-sm text-gray-600">Percentage</div>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className={`text-2xl font-bold ${color}`}>{grade}</div>
            <div className="text-sm text-gray-600">Grade</div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-8 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Time: {formatTime(attempt.time_taken)}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>Completed: {new Date(attempt.completed_at).toLocaleString()}</span>
          </div>
        </div>

        <div className="text-center">
          <Button onClick={onClose}>Back to Quizzes</Button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-lg">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900">Answer Review</h3>
          <p className="text-gray-600">Compare your responses with the correct answers.</p>
        </div>

        {questions.length === 0 ? (
          <div className="p-6 rounded-2xl border border-gray-200 bg-gray-50 text-center text-gray-600">
            Detailed answers are not available for this quiz.
          </div>
        ) : (
          <div className="space-y-6">
            {questions.map((question, index) => {
              const studentValue = (answers as Record<string, unknown>)[question.id];
              const status = buildStatus(question, studentValue);
              const studentAnswer = formatAnswer(question, studentValue);
              const correctAnswer = formatAnswer(question, question.correct_answer);

              return (
                <div
                  key={question.id}
                  className={`rounded-2xl border ${status.containerClass} p-6 transition-all duration-200`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold flex items-center justify-center">
                          {index + 1}
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 leading-relaxed">
                          {question.question_text}
                        </h4>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                          {question.points} {question.points === 1 ? 'point' : 'points'}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide bg-gray-100 text-gray-600">
                          {normalizeType(question) === 'multiple'
                            ? 'Multiple Choice'
                            : normalizeType(question) === 'truefalse'
                            ? 'True / False'
                            : 'Identification'}
                        </span>
                      </div>
                    </div>

                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${status.badgeClass}`}>
                      {status.icon}
                      <span>{status.label}</span>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Your Answer
                      </p>
                      <p className="mt-2 text-sm text-gray-900 whitespace-pre-wrap">{studentAnswer}</p>
                    </div>
                    <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Correct Answer
                      </p>
                      <p className="mt-2 text-sm text-gray-900 whitespace-pre-wrap">{correctAnswer}</p>
                    </div>
                  </div>

                  {normalizeType(question) === 'multiple' && (question.options?.length ?? 0) > 0 && (
                    <details className="mt-4 bg-white/60 rounded-xl border border-gray-200 p-4 text-sm text-gray-700">
                      <summary className="cursor-pointer font-semibold text-gray-800">
                        View all choices
                      </summary>
                      <ol className="mt-3 space-y-2 list-decimal list-inside">
                        {question.options?.map((option, optionIndex) => (
                          <li key={optionIndex} className="text-gray-700">
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
        )}
      </div>
    </div>
  );
};