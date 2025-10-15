'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { buttonVariants } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export default function AdminAttemptsPage() {
  return (
    <div className="modern-card p-10">
      <h1 className="mb-4 text-3xl font-bold text-foreground">Attempts Overview</h1>
      <p className="mb-6 text-muted-foreground">
        Select a quiz from the management area to review detailed attempts. Use the shortcuts below to jump right in.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/quizzes" className={cn(buttonVariants({ size: 'lg' }))}>
          Manage Quizzes <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
        <Link
          href="/admin/leaderboard"
          className={cn(buttonVariants({ size: 'lg', variant: 'secondary' }))}
        >
          View Leaderboard <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
