import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface Flashcard {
  id: string;
  deck_id: string;
  deck_name: string;
  question: string;
  answer: string;
  learning_status: string;
  correct_count: number;
  next_review_date: string;
  is_new: boolean;
  is_due: boolean;
}

interface Session {
  id: string;
  deck_ids: string[];
  started_at: string;
  ended_at: string | null;
  cards_studied: number;
  cards_learned: number;
  new_cards_today: number;
  review_cards_today: number;
}

interface Deck {
  id: string;
  name: string;
}

interface DailyLearningSessionProps {
  deckIds: string[];
  dailyLimit: number;
  lessonId?: string;
  onComplete: () => void;
  onExit: () => void;
}

export default function DailyLearningSession({
  deckIds,
  dailyLimit,
  lessonId,
  onComplete,
  onExit,
}: DailyLearningSessionProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [userMarkedCorrect, setUserMarkedCorrect] = useState(false);

  // Use window callbacks if available, otherwise use props
  const effectiveOnComplete = (window as any).__onSessionComplete || onComplete;
  const effectiveOnExit = (window as any).__onSessionExit || onExit;

  useEffect(() => {
    startOrResumeSession();
  }, []);

  const startOrResumeSession = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/daily-learning-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson_id: lessonId || null,
          deck_ids: deckIds,
          daily_new_cards_limit: dailyLimit,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start session');
      }

      const result = await response.json();
      setSession(result.data.session);
      setCards(result.data.cards || []);
      setDecks(result.data.decks || []);

      if (!result.data.cards || result.data.cards.length === 0) {
        // No cards to learn
        await endSession(result.data.session.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRating = async (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!session || !cards[currentCardIndex]) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/daily-learning-sessions/${session.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flashcard_id: cards[currentCardIndex].id,
          rating,
          was_correct: userMarkedCorrect,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit review');
      }

      const result = await response.json();
      setSession(result.data.session);

      // Move to next card
      if (currentCardIndex < cards.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
        setShowAnswer(false);
        setUserMarkedCorrect(false);
      } else {
        // All cards completed
        await endSession(session.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const endSession = async (sessionId: string) => {
    try {
      await fetch(`/api/daily-learning-sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end' }),
      });

      effectiveOnComplete();
    } catch (err) {
      console.error('Error ending session:', err);
      effectiveOnComplete();
    }
  };

  const handleExit = async () => {
    if (session && !session.ended_at) {
      if (confirm('Are you sure you want to exit? Your progress will be saved.')) {
        await endSession(session.id);
        effectiveOnExit();
      }
    } else {
      effectiveOnExit();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-gray-600">Loading session...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={onExit}>Go Back</Button>
      </Card>
    );
  }

  if (!session || cards.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="space-y-4">
          <div className="text-6xl">🎉</div>
          <h2 className="text-2xl font-bold">All done for today!</h2>
          <p className="text-gray-600">
            You've completed all available cards. Come back tomorrow for more!
          </p>
          <Button onClick={effectiveOnComplete}>Back to Dashboard</Button>
        </div>
      </Card>
    );
  }

  const currentCard = cards[currentCardIndex];
  const progress = ((currentCardIndex + 1) / cards.length) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Daily Learning Session</h2>
          <p className="text-sm text-gray-600 mt-1">{decks.map(d => d.name).join(', ')}</p>
        </div>
        <Button variant="outline" onClick={handleExit}>
          Exit
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>
            Card {currentCardIndex + 1} of {cards.length}
          </span>
          <span>
            {session.cards_studied} studied | {session.cards_learned} learned today
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card Display */}
      <Card className="p-8">
        <div className="space-y-6">
          {/* Card Info */}
          <div className="flex items-center gap-2 text-sm">
            <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">
              {currentCard.deck_name}
            </span>
            {currentCard.is_new && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">New</span>
            )}
            {currentCard.is_due && (
              <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">Review</span>
            )}
            {currentCard.learning_status === 'learning' && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                Learning ({currentCard.correct_count}/3)
              </span>
            )}
          </div>

          {/* Question */}
          <div className="min-h-[200px] flex items-center justify-center">
            <div className="text-center space-y-6">
              <div className="text-2xl font-medium">{currentCard.question}</div>

              {!showAnswer && (
                <Button onClick={() => setShowAnswer(true)} size="lg">
                  Show Answer
                </Button>
              )}
            </div>
          </div>

          {/* Answer */}
          {showAnswer && (
            <div className="border-t pt-6 space-y-6">
              <div className="min-h-[100px] flex items-center justify-center">
                <div className="text-xl text-gray-700 text-center">{currentCard.answer}</div>
              </div>

              {/* User marking if learning */}
              {(currentCard.learning_status === 'new' ||
                currentCard.learning_status === 'learning') && (
                <div className="flex items-center justify-center gap-4 pb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userMarkedCorrect}
                      onChange={e => setUserMarkedCorrect(e.target.checked)}
                      className="w-5 h-5 rounded"
                    />
                    <span className="text-sm font-medium">I got this correct</span>
                  </label>
                </div>
              )}

              {/* Rating Buttons */}
              <div className="grid grid-cols-4 gap-3">
                <Button
                  onClick={() => handleRating('again')}
                  disabled={submitting}
                  variant="outline"
                  className="flex-col h-auto py-4 text-red-600 hover:bg-red-50"
                >
                  <span className="text-lg font-semibold">Again</span>
                  <span className="text-xs mt-1">1 day</span>
                </Button>

                <Button
                  onClick={() => handleRating('hard')}
                  disabled={submitting}
                  variant="outline"
                  className="flex-col h-auto py-4 text-orange-600 hover:bg-orange-50"
                >
                  <span className="text-lg font-semibold">Hard</span>
                  <span className="text-xs mt-1">Shorter</span>
                </Button>

                <Button
                  onClick={() => handleRating('good')}
                  disabled={submitting}
                  variant="outline"
                  className="flex-col h-auto py-4 text-green-600 hover:bg-green-50"
                >
                  <span className="text-lg font-semibold">Good</span>
                  <span className="text-xs mt-1">Normal</span>
                </Button>

                <Button
                  onClick={() => handleRating('easy')}
                  disabled={submitting}
                  variant="outline"
                  className="flex-col h-auto py-4 text-blue-600 hover:bg-blue-50"
                >
                  <span className="text-lg font-semibold">Easy</span>
                  <span className="text-xs mt-1">Longer</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Session Stats */}
      <Card className="p-4">
        <div className="grid grid-cols-4 gap-4 text-center text-sm">
          <div>
            <div className="text-2xl font-bold text-blue-600">{session.new_cards_today}</div>
            <div className="text-gray-600">New</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">{session.review_cards_today}</div>
            <div className="text-gray-600">Review</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{session.cards_learned}</div>
            <div className="text-gray-600">Learned</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">{session.cards_studied}</div>
            <div className="text-gray-600">Total</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
