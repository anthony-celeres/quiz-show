import { QuizAttempt } from '@/types/quiz';
import { Button } from '@/components/ui/Button';
import { CircleCheck as CheckCircle, Circle as XCircle, Clock, Trophy } from 'lucide-react';

interface QuizResultsProps {
  attempt: QuizAttempt;
  onClose: () => void;
}

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

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
            attempt.percentage >= 70 ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {attempt.percentage >= 70 ? (
              <Trophy className="w-10 h-10 text-green-600" />
            ) : (
              <XCircle className="w-10 h-10 text-red-600" />
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

      <div className="flex items-center justify-center gap-6 mb-8 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>Time: {formatTime(attempt.time_taken)}</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>Completed: {new Date(attempt.completed_at).toLocaleString()}</span>
        </div>
      </div>

      <div className="text-center">
        <Button onClick={onClose}>
          Back to Quizzes
        </Button>
      </div>
    </div>
  );
};