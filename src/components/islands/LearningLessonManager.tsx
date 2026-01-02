import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';

interface Deck {
  id: string;
  name: string;
}

interface LearningLesson {
  id: string;
  name: string;
  description: string | null;
  deck_ids: string[];
  daily_new_cards_limit: number;
  created_at: string;
  updated_at: string;
  decks: Deck[];
}

interface LearningLessonManagerProps {
  onStartLesson: (lessonId: string, deckIds: string[], limit: number) => void;
}

export default function LearningLessonManager({ onStartLesson }: LearningLessonManagerProps) {
  const [lessons, setLessons] = useState<LearningLesson[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use window callback if available, otherwise use prop
  const effectiveOnStartLesson = (window as any).__onStartLesson || onStartLesson;

  // Create lesson form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [lessonName, setLessonName] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const [selectedDeckIds, setSelectedDeckIds] = useState<string[]>([]);
  const [dailyLimit, setDailyLimit] = useState(20);
  const [creating, setCreating] = useState(false);

  // Quick start form state
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [quickStartDeckIds, setQuickStartDeckIds] = useState<string[]>([]);
  const [quickStartLimit, setQuickStartLimit] = useState(20);

  useEffect(() => {
    fetchLessonsAndDecks();
  }, []);

  const fetchLessonsAndDecks = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch lessons
      const lessonsResponse = await fetch('/api/learning-lessons');
      if (!lessonsResponse.ok) {
        throw new Error('Failed to fetch lessons');
      }
      const lessonsData = await lessonsResponse.json();

      // Fetch decks
      const decksResponse = await fetch('/api/decks');
      if (!decksResponse.ok) {
        throw new Error('Failed to fetch decks');
      }
      const decksData = await decksResponse.json();

      setLessons(lessonsData.data || []);
      setDecks(decksData.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLesson = async () => {
    if (!lessonName.trim() || selectedDeckIds.length === 0) {
      setError('Lesson name and at least one deck are required');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/learning-lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: lessonName.trim(),
          description: lessonDescription.trim() || null,
          deck_ids: selectedDeckIds,
          daily_new_cards_limit: dailyLimit,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create lesson');
      }

      const result = await response.json();
      setLessons([result.data, ...lessons]);

      // Reset form
      setShowCreateForm(false);
      setLessonName('');
      setLessonDescription('');
      setSelectedDeckIds([]);
      setDailyLimit(20);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) {
      return;
    }

    try {
      const response = await fetch(`/api/learning-lessons/${lessonId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete lesson');
      }

      setLessons(lessons.filter(l => l.id !== lessonId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleStartLesson = (lesson: LearningLesson) => {
    effectiveOnStartLesson(lesson.id, lesson.deck_ids, lesson.daily_new_cards_limit);
  };

  const handleQuickStart = () => {
    if (quickStartDeckIds.length === 0) {
      setError('Please select at least one deck');
      return;
    }

    effectiveOnStartLesson('', quickStartDeckIds, quickStartLimit);
  };

  const toggleDeckSelection = (deckId: string, isQuickStart: boolean = false) => {
    if (isQuickStart) {
      setQuickStartDeckIds(prev =>
        prev.includes(deckId) ? prev.filter(id => id !== deckId) : [...prev, deckId]
      );
    } else {
      setSelectedDeckIds(prev =>
        prev.includes(deckId) ? prev.filter(id => id !== deckId) : [...prev, deckId]
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-gray-600">Loading lessons...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Header with action buttons */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Daily Learning</h2>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setShowQuickStart(!showQuickStart);
              setShowCreateForm(false);
            }}
            variant="outline"
          >
            Quick Start
          </Button>
          <Button
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setShowQuickStart(false);
            }}
          >
            Create Lesson
          </Button>
        </div>
      </div>

      {/* Quick Start Form */}
      {showQuickStart && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Start Session</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Decks</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {decks.map(deck => (
                  <label key={deck.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={quickStartDeckIds.includes(deck.id)}
                      onChange={() => toggleDeckSelection(deck.id, true)}
                      className="rounded"
                    />
                    <span>{deck.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Daily New Cards Limit</label>
              <Input
                type="number"
                min="1"
                max="100"
                value={quickStartLimit}
                onChange={e => setQuickStartLimit(parseInt(e.target.value))}
                className="w-32"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleQuickStart}>Start Learning</Button>
              <Button variant="outline" onClick={() => setShowQuickStart(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Create Lesson Form */}
      {showCreateForm && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Create New Lesson</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Lesson Name *</label>
              <Input
                type="text"
                value={lessonName}
                onChange={e => setLessonName(e.target.value)}
                placeholder="e.g., Biology + Chemistry"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description (optional)</label>
              <Input
                type="text"
                value={lessonDescription}
                onChange={e => setLessonDescription(e.target.value)}
                placeholder="What is this lesson about?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Select Decks *</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {decks.map(deck => (
                  <label key={deck.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedDeckIds.includes(deck.id)}
                      onChange={() => toggleDeckSelection(deck.id)}
                      className="rounded"
                    />
                    <span>{deck.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Daily New Cards Limit</label>
              <Input
                type="number"
                min="1"
                max="100"
                value={dailyLimit}
                onChange={e => setDailyLimit(parseInt(e.target.value))}
                className="w-32"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateLesson} disabled={creating}>
                {creating ? 'Creating...' : 'Create Lesson'}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Lessons List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Saved Lessons</h3>
        {lessons.length === 0 ? (
          <Card className="p-6 text-center text-gray-500">
            No saved lessons yet. Create your first lesson to get started!
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lessons.map(lesson => (
              <Card key={lesson.id} className="p-6">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-lg">{lesson.name}</h4>
                    {lesson.description && (
                      <p className="text-sm text-gray-600 mt-1">{lesson.description}</p>
                    )}
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Decks:</span>{' '}
                      {lesson.decks.map(d => d.name).join(', ')}
                    </div>
                    <div>
                      <span className="font-medium">Daily limit:</span>{' '}
                      {lesson.daily_new_cards_limit} new cards
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button onClick={() => handleStartLesson(lesson)} className="flex-1">
                      Start
                    </Button>
                    <Button
                      onClick={() => handleDeleteLesson(lesson.id)}
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
