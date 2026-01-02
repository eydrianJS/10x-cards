import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';

interface Deck {
  id: string;
  name: string;
  description: string | null;
  flashcardCount: number;
  created_at: string;
  updated_at: string;
}

interface DeckManagerProps {
  initialDecks: Deck[];
}

export default function DeckManager({ initialDecks }: DeckManagerProps) {
  const [decks, setDecks] = useState<Deck[]>(initialDecks);
  const [editingDeck, setEditingDeck] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEdit = (deck: Deck) => {
    setEditingDeck(deck.id);
    setEditName(deck.name);
    setEditDescription(deck.description || '');
    setError(null);
  };

  const cancelEdit = () => {
    setEditingDeck(null);
    setEditName('');
    setEditDescription('');
    setError(null);
  };

  const handleUpdate = async (deckId: string) => {
    if (!editName.trim()) {
      setError('Deck name cannot be empty');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/decks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: deckId,
          name: editName.trim(),
          description: editDescription.trim() || null,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to update deck');
      }

      // Update deck in list
      setDecks(
        decks.map((deck) =>
          deck.id === deckId
            ? { ...deck, name: editName.trim(), description: editDescription.trim() || null }
            : deck
        )
      );

      cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update deck');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (deckId: string, deckName: string) => {
    const deck = decks.find((d) => d.id === deckId);

    if (deck && deck.flashcardCount > 0) {
      setError('Cannot delete deck with existing flashcards. Please delete all cards first.');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${deckName}"?`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/decks?id=${deckId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to delete deck');
      }

      // Remove deck from list
      setDecks(decks.filter((deck) => deck.id !== deckId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete deck');
    } finally {
      setLoading(false);
    }
  };

  if (decks.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            No decks yet. Create your first deck to get started!
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {decks.map((deck) => (
          <Card key={deck.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              {editingDeck === deck.id ? (
                <div className="space-y-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Deck name"
                    disabled={loading}
                  />
                  <Input
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Description (optional)"
                    disabled={loading}
                  />
                </div>
              ) : (
                <>
                  <CardTitle className="text-xl">{deck.name}</CardTitle>
                  {deck.description && <CardDescription>{deck.description}</CardDescription>}
                </>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{deck.flashcardCount} cards</span>
                  <span>{new Date(deck.updated_at).toLocaleDateString()}</span>
                </div>

                {editingDeck === deck.id ? (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleUpdate(deck.id)}
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
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => (window.location.href = `/deck/${deck.id}`)}
                      className="w-full"
                      size="sm"
                    >
                      Manage Cards
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => startEdit(deck)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        disabled={loading}
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDelete(deck.id, deck.name)}
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        disabled={loading}
                      >
                        Delete
                      </Button>
                    </div>
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
