"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { buttonVariants } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { BookOpen, Trophy, Users, ShieldCheck } from 'lucide-react';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) return;

    router.replace('/challenger');
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center animated-bg">
        <div className="text-center modern-card p-12">
          <div className="w-16 h-16 mx-auto mb-6 relative">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Loading QuizMaster</h2>
          <p className="text-muted-foreground">Preparing your experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-white/95 backdrop-blur dark:bg-gray-900/95 dark:border-gray-700 sticky top-0 z-50 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 sm:px-6 py-4 sm:py-5">
          <Link href="/" className="flex items-center gap-2 text-primary flex-shrink-0">
            <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
              <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <span className="text-xl sm:text-2xl font-bold tracking-tight">QuizMaster</span>
          </Link>
          <nav className="hidden items-center gap-4 lg:gap-6 text-sm font-medium text-foreground md:flex">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-primary transition-colors">How it works</a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Link href="/register" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'hidden sm:inline-flex')}>
              Create account
            </Link>
            <Link href="/login" className={cn(buttonVariants({ size: 'sm' }), 'text-xs sm:text-sm whitespace-nowrap')}>
              Log-in
            </Link>
          </div>
        </div>
      </header>

      <main className="relative overflow-hidden">
        <section className="mx-auto flex max-w-6xl flex-col gap-10 px-4 sm:px-6 py-12 sm:py-20 text-center md:flex-row md:items-center md:text-left">
          <div className="md:w-1/2 space-y-6">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
              Challenge yourself and others
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
              Create quizzes, challenge friends, compete for the top spot.
            </h1>
            <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
              QuizMaster lets you create your own quizzes, take challenges from others, and climb the leaderboard. Everyone is a challenger—create, compete, and conquer.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row md:justify-start">
              <Link
                href="/register"
                className={cn(buttonVariants({ size: 'lg' }), 'w-full sm:w-auto min-w-[160px]')}
              >
                Create account
              </Link>
              <Link
                href="/login"
                className={cn(buttonVariants({ size: 'lg', variant: 'outline' }), 'w-full sm:w-auto min-w-[160px]')}
              >
                Log-in
              </Link>
            </div>
          </div>

          <div className="md:w-1/2">
            <div className="modern-card relative flex flex-col gap-6 p-8">
              <div className="absolute -top-10 -right-10 hidden h-32 w-32 rounded-full bg-primary/10 blur-3xl md:block" />
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Secure & reliable</p>
                  <p className="text-lg font-semibold text-foreground">Supabase-backed authentication for every challenger.</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/20 text-secondary-foreground">
                  <Users className="h-6 w-6 text-[#0056B3]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Challenger success tools</p>
                  <p className="text-lg font-semibold text-foreground">Timed attempts, progress tracking, history, and leaderboard.</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0056B3]/10 text-[#0056B3]">
                  <Trophy className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Advanced analytics</p>
                  <p className="text-lg font-semibold text-foreground">Monitor attempts, scores, and engagement across cohorts.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="bg-muted/40 dark:bg-muted/20 py-12 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-6 sm:gap-8 px-4 sm:px-6 md:grid-cols-3">
            {[
              {
                title: 'Effortless authoring',
                description: 'Create detailed quizzes, mix question types, and control availability with activation cycles.',
              },
              {
                title: 'Challenger-first design',
                description: 'Responsive UI, accessible typography, and calming academic visuals keep learners focused.',
              },
              {
                title: 'Actionable results',
                description: 'Drill into attempts, compare cohorts, and track improvement with intuitive dashboards.',
              },
            ].map((feature) => (
              <div key={feature.title} className="modern-card p-6">
                <h3 className="text-xl font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-3 text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-20">
          <div className="modern-card p-6 sm:p-8 text-center">
            <h3 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">Everyone is a Challenger</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-3xl mx-auto">
              Create your own quizzes to challenge others, take quizzes to test your knowledge, and climb the leaderboard to prove you&apos;re the best. QuizMaster empowers every user to create, compete, and conquer.
            </p>
            <Link
              href="/register"
              className={cn(buttonVariants({ size: 'lg' }), 'mt-4 w-full sm:w-auto min-w-[200px]')}
            >
              Join as a challenger
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 bg-white/95 dark:bg-gray-900/95 dark:border-gray-700">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:px-6 py-6 text-sm text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} QuizMaster. Empowering learning communities.</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-foreground">Sign in</Link>
            <Link href="/register" className="hover:text-foreground">Create account</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}