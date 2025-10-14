export interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  points: number;
  created_at: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  total_points: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  questions?: Question[];
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  user_email: string;
  score: number;
  total_points: number;
  percentage: number;
  answers: Record<string, number>;
  time_taken: number;
  completed_at: string;
  quiz?: Quiz;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'student';
  created_at: string;
}