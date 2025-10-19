'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useState } from 'react';
import { GraduationCap, LogOut, Menu, X, Home, FileText, Trophy, Plus } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/lib/supabase';

const challengerNav = [
  { href: '/challenger/quizzes', label: 'Quizzes', icon: Home },
  { href: '/challenger/history', label: 'History', icon: FileText },
  { href: '/challenger/leaderboard', label: 'Leaderboard', icon: Trophy },
];

export default function ChallengerLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
    router.refresh();
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile Header - Visible only on mobile */}
      <header className="md:hidden sticky top-0 z-50 border-b border-border bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <Link href="/challenger/quizzes" className="text-base font-semibold text-primary hover:text-primary/80 transition-colors">
                QuizMaster
              </Link>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Desktop Minimal Header - Compact with burger menu */}
      <header className="hidden md:block sticky top-0 z-50 border-b border-border bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <GraduationCap className="h-5 w-5" />
            </div>
            <Link href="/challenger/quizzes" className="text-lg font-semibold text-primary hover:text-primary/80 transition-colors">
              QuizMaster
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="hidden lg:inline text-sm font-medium text-gray-700 dark:text-gray-300">{user?.email ?? 'Challenger'}</span>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="text-xs px-3 py-1.5">
              <LogOut className="mr-1.5 h-3.5 w-3.5" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[55] backdrop-blur-sm"
          onClick={closeMobileMenu}
        />
      )}

      {/* Menu Sidebar - Mobile: slides from right, Desktop: slides from left */}
      <div className={`fixed top-0 h-full w-72 bg-white dark:bg-gray-900 shadow-2xl z-[60] transform transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full md:-translate-x-full'}
        right-0 md:right-auto md:left-0
      `}>
        <div className="flex flex-col h-full">
          {/* Menu Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-primary">QuizMaster</div>
                  <div className="text-xs text-muted-foreground">Challenger</div>
                </div>
              </div>
              <button
                onClick={closeMobileMenu}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
            <div className="text-xs text-muted-foreground truncate">{user?.email ?? 'Challenger'}</div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {challengerNav.map((item) => {
              const isActive = pathname?.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-white shadow'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
            
            {/* Create Quiz Button */}
            <Link
              href="/challenger/quizzes/new"
              onClick={closeMobileMenu}
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors shadow-md mt-4"
            >
              <Plus size={20} />
              <span className="font-medium">Create Quiz</span>
            </Link>
          </nav>

          {/* Sign Out Button */}
          <div className="p-4 border-t border-border">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                handleSignOut();
                closeMobileMenu();
              }}
            >
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 md:px-6 py-4 md:py-10">{children}</main>
    </div>
  );
}
