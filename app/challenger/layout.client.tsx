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
  { href: '/challenger/profile', label: 'Profile' },
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
      <header className="border-b border-border bg-white/70 backdrop-blur dark:bg-card/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 sm:gap-6 px-3 sm:px-6 py-3 sm:py-5">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#0056B3]/10 text-[#0056B3]">
              <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <Link href="/challenger" className="text-base sm:text-xl font-semibold text-[#0056B3] block truncate">
                QuizMaster
              </Link>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Practice. Compete. Improve.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-medium truncate max-w-[150px]">{user?.email ?? 'Challenger'}</span>
              <span className="text-xs text-muted-foreground">Challenger</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-xs sm:text-sm">
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <nav className="border-b border-border bg-[#0056B3]/5 overflow-x-auto">
        <div className="mx-auto flex max-w-6xl gap-2 sm:gap-3 px-3 sm:px-6 py-2 sm:py-3 min-w-max sm:min-w-0">
          {challengerNav.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
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
      </nav>

      <main className="mx-auto max-w-6xl px-3 sm:px-6 py-6 sm:py-10">{children}</main>
    </div>
  );
}
