'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User2, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/quiz';

interface UsernameSetupProps {
  userId: string;
  userEmail: string;
  onComplete?: () => void;
  showSkip?: boolean;
}

export const UsernameSetup = ({ userId, userEmail, onComplete, showSkip = false }: UsernameSetupProps) => {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [existingProfile, setExistingProfile] = useState<Profile | null>(null);

  useEffect(() => {
    checkExistingProfile();
  }, [userId]);

  const checkExistingProfile = async () => {
    if (!supabase || !userId) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setExistingProfile(data);
        setUsername(data.username);
        setDisplayName(data.display_name || '');
      } else {
        // Set default username from email
        const defaultUsername = userEmail.split('@')[0];
        setUsername(defaultUsername);
        setDisplayName(defaultUsername);
      }
    } catch (err) {
      console.error('Error checking profile:', err);
    }
  };

  const validateUsername = (value: string) => {
    if (value.length < 3) {
      return 'Username must be at least 3 characters';
    }
    if (value.length > 30) {
      return 'Username must be less than 30 characters';
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      return 'Username can only contain letters, numbers, underscores, and hyphens';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const validationError = validateUsername(username);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const method = existingProfile ? 'PUT' : 'POST';
      const response = await fetch('/api/profile', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          display_name: displayName.trim() || username.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to save username');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        if (onComplete) {
          onComplete();
        } else {
          router.push('/challenger/quizzes');
        }
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (onComplete) {
      onComplete();
    } else {
      router.push('/challenger/quizzes');
    }
  };

  if (success) {
    return (
      <div className="modern-card p-8 text-center">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Username Set!</h2>
        <p className="text-muted-foreground">Redirecting you now...</p>
      </div>
    );
  }

  return (
    <div className="modern-card p-8 max-w-md mx-auto">
      <div className="flex items-center justify-center mb-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0056B3] text-white">
          <User2 className="h-8 w-8" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-center mb-2">
        {existingProfile ? 'Update Your Username' : 'Choose Your Username'}
      </h2>
      <p className="text-muted-foreground text-center mb-6">
        This will be displayed on quizzes you create and on the leaderboard
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="username">Username *</Label>
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError('');
            }}
            placeholder="Enter username"
            disabled={loading}
            required
            minLength={3}
            maxLength={30}
            pattern="[a-zA-Z0-9_-]+"
          />
          <p className="text-xs text-muted-foreground mt-1">
            3-30 characters, letters, numbers, underscores, and hyphens only
          </p>
        </div>

        <div>
          <Label htmlFor="displayName">Display Name (Optional)</Label>
          <Input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter display name"
            disabled={loading}
            maxLength={50}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Leave blank to use your username
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Saving...' : existingProfile ? 'Update Username' : 'Set Username'}
          </Button>
          {showSkip && !existingProfile && (
            <Button
              type="button"
              variant="outline"
              onClick={handleSkip}
              disabled={loading}
            >
              Skip
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};
