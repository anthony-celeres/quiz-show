'use client';

import { useRouter } from 'next/navigation';
import { ChallengerQuizForm } from '@/components/ChallengerQuizForm';

export default function CreateQuizPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/challenger/quizzes');
  };

  const handleCancel = () => {
    router.push('/challenger/quizzes');
  };

  return (
    <div className="py-8">
      <ChallengerQuizForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  );
}
