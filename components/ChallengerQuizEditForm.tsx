'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { ChallengerQuizForm } from './ChallengerQuizForm';
import { Quiz } from '@/types/quiz';

interface ChallengerQuizEditFormProps {
  quizId: string;
}

export default function ChallengerQuizEditForm({ quizId }: ChallengerQuizEditFormProps) {
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await fetch(`/api/quizzes/${quizId}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch quiz');
        }

        setQuiz(result.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">Loading quiz...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !quiz) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-destructive">{error || 'Quiz not found'}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ChallengerQuizForm
      quizToEdit={quiz}
      onSuccess={(updatedQuiz) => {
        router.push('/challenger/quizzes');
      }}
      onCancel={() => {
        router.push('/challenger/quizzes');
      }}
    />
  );
}
