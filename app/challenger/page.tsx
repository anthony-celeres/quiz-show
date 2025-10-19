'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChallengerDashboardPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to quizzes page since dashboard is no longer used
    router.replace('/challenger/quizzes');
  }, [router]);
  
  // Show loading while redirecting
  return (
    <div className="modern-card p-10">
      <div className="flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <span className="ml-3 text-muted-foreground">Redirecting to Quizzes...</span>
      </div>
    </div>
  );
}
