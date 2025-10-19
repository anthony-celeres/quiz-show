import { FormEvent, useEffect, useState } from 'react';
import { signIn, signUp, supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface AuthFormProps {
  onSuccess: () => void;
  mode?: 'login' | 'register';
}

const AuthForm = ({ onSuccess, mode = 'login' }: AuthFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(mode !== 'register');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [supabaseConfigured, setSupabaseConfigured] = useState(true);

  useEffect(() => {
    setSupabaseConfigured(Boolean(supabase));
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');

    try {
      if (isLogin) {
        const { data, error: signInError } = await signIn(email, password);
        if (signInError) {
          setError(signInError.message);
          return;
        }

        if (!data?.session) {
          setInfo('Please confirm your email address before signing in.');
          return;
        }

        onSuccess();
      } else {
        const { data, error: signUpError } = await signUp(email, password, 'challenger');
        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        // Check if user was created and can immediately log in (email confirmation disabled)
        if (data?.session) {
          setInfo('Account created successfully! Redirecting...');
          setTimeout(() => onSuccess(), 1000);
        } else if (data?.user && !data?.session) {
          // Email confirmation required
          setInfo('Account created! Please check your email to confirm your account before signing in.');
          setIsLogin(true);
        } else {
          setInfo('Account created. You can now sign in.');
          setIsLogin(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <Card className="w-full max-w-md border border-border/60 shadow-lg shadow-primary/5">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <CardTitle className="text-3xl font-semibold">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </CardTitle>
          <CardDescription>
            {isLogin
              ? 'Sign in to continue your quiz journey.'
              : 'Sign up to unlock quizzes and tracking.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {!supabaseConfigured && (
            <div className="rounded-lg border border-amber-300/40 bg-amber-100/80 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-100">
              <strong className="font-semibold">Setup required:</strong> Configure Supabase credentials in your
              <code className="mx-1 rounded bg-amber-200/80 px-1 py-0.5 font-semibold dark:bg-amber-500/25">.env.local</code>
              and restart the dev server.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter a secure password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            {error && (
              <div className="rounded-md border border-destructive/60 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {info && !error && (
              <div className="rounded-md border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary dark:border-primary/30">
                {info}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" loading={loading} disabled={loading}>
              {isLogin ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              {isLogin ? "Don't have an account?" : 'Already registered?'}
            </span>{' '}
            <button
              type="button"
              onClick={() => {
                setError('');
                setInfo('');
                setIsLogin((state) => !state);
              }}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {isLogin ? 'Create one' : 'Sign in'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { AuthForm };
export default AuthForm;