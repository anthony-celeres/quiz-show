'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode } from 'react';
import { LogOut, Plus } from 'lucide-react';

import { Button, buttonVariants } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/lib/supabase';
import { cn } from '@/lib/utils';

const adminNav = [
  { href: '/admin/quizzes', label: 'Quizzes' },
  { href: '/admin/attempts', label: 'Attempts' },
  { href: '/admin/leaderboard', label: 'Leaderboard' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
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
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5">
          <div>
            <Link href="/admin" className="text-xl font-semibold text-[#0056B3]">
              QuizMaster Admin
            </Link>
            <p className="text-sm text-muted-foreground">Manage quizzes and monitor performance</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/quizzes/new"
              className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'hidden sm:inline-flex')}
            >
              <Plus className="mr-2 h-4 w-4" /> New Quiz
            </Link>
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-medium">{user?.email ?? 'Administrator'}</span>
              <span className="text-xs text-muted-foreground">Admin</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 lg:flex-row">
        <aside className="lg:w-64 lg:flex-shrink-0">
          <div className="modern-card sticky top-24 space-y-4 p-6">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Navigation</p>
            </div>
            <nav className="space-y-1">
              {adminNav.map((item) => {
                const isActive = pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#0056B3]/10 text-[#0056B3]'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <Link
                href="/admin/quizzes/new"
                className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'mt-4 flex w-full justify-center lg:hidden')}
              >
                <Plus className="mr-2 h-4 w-4" /> New Quiz
              </Link>
            </nav>
          </div>
        </aside>

        <main className="flex-1 pb-10">
          {children}
        </main>
      </div>
    </div>
  );
}
