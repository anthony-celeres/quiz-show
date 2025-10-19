import ChallengerQuizEditForm from '@/components/ChallengerQuizEditForm';

export default async function EditQuizPage({ 
  params 
}: { 
  params: Promise<{ quizId: string }> 
}) {
  const { quizId } = await params;
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold gradient-text mb-3">Edit Quiz</h1>
        <p className="text-muted-foreground text-lg">
          Update your quiz details, questions, and visibility settings.
        </p>
      </div>
      <ChallengerQuizEditForm quizId={quizId} />
    </div>
  );
}
