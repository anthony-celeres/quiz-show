'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { UsernameSetup } from '@/components/UsernameSetup';
import { useAuth } from '@/hooks/useAuth';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="modern-card p-8">Loading...</div>;
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <UsernameSetup 
        userId={user.id} 
        userEmail={user.email || ''} 
        showSkip={false}
      />
    </div>
  );
}
