import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

interface ManualCardFormProps {
  deckId: string;
  onCardAdded: () => void;
}

export default function ManualCardForm({ deckId, onCardAdded }: ManualCardFormProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim() || !answer.trim()) {
      setError('Question and answer are required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.trim(),
          answer: answer.trim(),
          deckId,
          creationMethod: 'manual',
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to create flashcard');
      }

      // Reset form
      setQuestion('');
      setAnswer('');
      setSuccess(true);

      // Call callback to refresh the card list
      onCardAdded();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create flashcard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Flashcard Manually</CardTitle>
        <CardDescription>Create a new flashcard for this deck</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-500/10 border border-green-500 rounded-md">
              <p className="text-sm text-green-700 dark:text-green-400">
                Flashcard created successfully!
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="question" className="text-sm font-medium">
              Question *
            </label>
            <Input
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter your question"
              disabled={loading}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">{question.length}/500 characters</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="answer" className="text-sm font-medium">
              Answer *
            </label>
            <Textarea
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Enter the answer"
              disabled={loading}
              maxLength={2000}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">{answer.length}/2000 characters</p>
          </div>

          <Button type="submit" disabled={loading || !question.trim() || !answer.trim()}>
            {loading ? 'Creating...' : 'Add Flashcard'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
