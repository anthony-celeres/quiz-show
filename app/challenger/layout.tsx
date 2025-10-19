'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode } from 'react';
import { GraduationCap, LogOut } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/lib/supabase';

const challengerNav = [
  { href: '/challenger/quizzes', label: 'Quizzes' },
  { href: '/challenger/history', label: 'History' },
  { href: '/challenger/leaderboard', label: 'Leaderboard' },
];

export default function ChallengerLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0056B3]/10 text-[#0056B3]">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <Link href="/challenger" className="text-xl font-semibold text-[#0056B3]">
                QuizMaster Challenger
              </Link>
              <p className="text-sm text-muted-foreground">Practice. Compete. Improve.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-medium">{user?.email ?? 'Challenger'}</span>
              <span className="text-xs text-muted-foreground">Challenger</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      <nav className="border-b border-border bg-[#0056B3]/5">
        <div className="mx-auto flex max-w-6xl gap-3 px-6 py-3 items-center justify-between">
          <div className="flex gap-3">
            {challengerNav.map((item) => {
              const isActive = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#0056B3] text-white shadow'
                      : 'text-[#0056B3] hover:bg-[#0056B3]/10'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <Link
            href="/challenger/quizzes/new"
            className="rounded-full px-4 py-2 text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            + Create Quiz
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
