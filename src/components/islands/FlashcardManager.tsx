import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  creation_method: 'ai' | 'manual';
  easiness_factor: number;
  repetition_count: number;
  interval: number;
  next_review_date: string;
  created_at: string;
  updated_at: string;
}

interface FlashcardManagerProps {
  initialFlashcards: Flashcard[];
  deckId: string;
}

export default function FlashcardManager({ initialFlashcards, deckId }: FlashcardManagerProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>(initialFlashcards);
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCard = (cardId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(cardId)) {
      newExpanded.delete(cardId);
    } else {
      newExpanded.add(cardId);
    }
    setExpandedCards(newExpanded);
  };

  const startEdit = (card: Flashcard) => {
    setEditingCard(card.id);
    setEditQuestion(card.question);
    setEditAnswer(card.answer);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingCard(null);
    setEditQuestion('');
    setEditAnswer('');
    setError(null);
  };

  const handleUpdate = async (cardId: string) => {
    if (!editQuestion.trim() || !editAnswer.trim()) {
      setError('Question and answer cannot be empty');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/flashcards', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: cardId,
          question: editQuestion.trim(),
          answer: editAnswer.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to update flashcard');
      }

      // Update card in list
      setFlashcards(
        flashcards.map(card =>
          card.id === cardId
            ? { ...card, question: editQuestion.trim(), answer: editAnswer.trim() }
            : card
        )
      );

      cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update flashcard');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cardId: string) => {
    if (!confirm('Are you sure you want to delete this flashcard?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/flashcards/${cardId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to delete flashcard');
      }

      // Remove card from list
      setFlashcards(flashcards.filter(card => card.id !== cardId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete flashcard');
    } finally {
      setLoading(false);
    }
  };

  const isDue = (date: string) => {
    return new Date(date) <= new Date();
  };

  if (flashcards.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            No flashcards yet. Add your first card to get started!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive rounded-md">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {flashcards.length} card{flashcards.length === 1 ? '' : 's'} total •{' '}
          {flashcards.filter(c => isDue(c.next_review_date)).length} due for review
        </p>
      </div>

      <div className="space-y-3">
        {flashcards.map(card => (
          <Card
            key={card.id}
            className={`transition-all ${isDue(card.next_review_date) ? 'border-primary' : ''}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  {editingCard === card.id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Question</label>
                        <Input
                          value={editQuestion}
                          onChange={e => setEditQuestion(e.target.value)}
                          placeholder="Question"
                          disabled={loading}
                          maxLength={500}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Answer</label>
                        <Textarea
                          value={editAnswer}
                          onChange={e => setEditAnswer(e.target.value)}
                          placeholder="Answer"
                          disabled={loading}
                          maxLength={2000}
                          rows={3}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <CardTitle className="text-base font-medium">Q: {card.question}</CardTitle>
                      {expandedCards.has(card.id) && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-sm text-muted-foreground">
                            <strong>A:</strong> {card.answer}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                  <span
                    className={`px-2 py-1 rounded ${
                      card.creation_method === 'ai'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}
                  >
                    {card.creation_method === 'ai' ? '🤖 AI' : '✏️ Manual'}
                  </span>
                  {isDue(card.next_review_date) && (
                    <span className="px-2 py-1 rounded bg-primary/10 text-primary">Due</span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span>EF: {card.easiness_factor.toFixed(2)}</span>
                  <span>•</span>
                  <span>Reviews: {card.repetition_count}</span>
                  <span>•</span>
                  <span>Interval: {card.interval}d</span>
                  <span>•</span>
                  <span>Next: {new Date(card.next_review_date).toLocaleDateString()}</span>
                </div>

                {editingCard === card.id ? (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleUpdate(card.id)}
                      disabled={loading}
                      size="sm"
                      className="flex-1"
                    >
                      {loading ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      onClick={cancelEdit}
                      disabled={loading}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => toggleCard(card.id)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      {expandedCards.has(card.id) ? 'Hide' : 'Show'} Answer
                    </Button>
                    <Button
                      onClick={() => startEdit(card)}
                      variant="outline"
                      size="sm"
                      disabled={loading}
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDelete(card.id)}
                      variant="destructive"
                      size="sm"
                      disabled={loading}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
