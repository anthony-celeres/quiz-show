export interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  // options is optional for numeric questions
  options?: string[];
  // type: 'multiple' = multiple choice (correct_answer is option index),
  // 'identification' = identification/solving (correct_answer can be string or number),
  // 'truefalse' = true/false (correct_answer is boolean)
  type?: 'multiple' | 'identification' | 'truefalse';
  correct_answer: number | string | boolean;
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
  activation_cycle?: number;
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
  // answers keyed by question id; value can be index (number), numeric string/number, or boolean
  answers: Record<string, number | string | boolean>;
  time_taken: number;
  completed_at: string;
  activation_cycle?: number;
  quiz?: Quiz;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'student';
  created_at: string;
}