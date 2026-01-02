import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';

interface AuthFormProps {
  mode: 'login' | 'register';
}

export default function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const endpoint = mode === 'register' ? '/api/auth/signup' : '/api/auth/login';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'An error occurred');
        setIsLoading(false);
        return;
      }

      // Success!
      setSuccess(data.message || 'Success!');

      if (mode === 'login') {
        // Redirect to dashboard after login
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 500);
      } else {
        // Show success message for registration
        setEmail('');
        setPassword('');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Auth error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{mode === 'register' ? 'Create Account' : 'Welcome Back'}</CardTitle>
        <CardDescription>
          {mode === 'register'
            ? 'Sign up to start creating AI-powered flashcards'
            : 'Sign in to your account to continue learning'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>
          )}
          {success && (
            <div className="bg-green-500/10 text-green-600 text-sm p-3 rounded-md">{success}</div>
          )}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder={
                mode === 'register' ? 'Min 8 chars, with uppercase & number' : 'Enter your password'
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
            {mode === 'register' && (
              <p className="text-xs text-muted-foreground">
                Password must be at least 8 characters and include uppercase, lowercase, and a
                number
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Please wait...' : mode === 'register' ? 'Create Account' : 'Sign In'}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            {mode === 'register' ? (
              <>
                Already have an account?{' '}
                <a href="/login" className="text-primary hover:underline">
                  Sign in
                </a>
              </>
            ) : (
              <>
                Don't have an account?{' '}
                <a href="/register" className="text-primary hover:underline">
                  Sign up
                </a>
              </>
            )}
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
