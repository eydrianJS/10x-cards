import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

interface Flashcard {
  question: string;
  answer: string;
  originalQuestion?: string;
  originalAnswer?: string;
  editPercentage?: number;
}

type ContentType = 'academic' | 'technical' | 'general' | 'language';
type CreationMode = 'ai' | 'manual';

export default function CreateDeckForm() {
  // Deck info
  const [deckName, setDeckName] = useState('');
  const [deckDescription, setDeckDescription] = useState('');
  const [deckCreated, setDeckCreated] = useState(false);
  const [deckId, setDeckId] = useState<string | null>(null);

  // Creation mode
  const [creationMode, setCreationMode] = useState<CreationMode | null>(null);

  // AI Generation
  const [aiText, setAiText] = useState('');
  const [contentType, setContentType] = useState<ContentType>('general');
  const [maxCards, setMaxCards] = useState(10);
  const [sourceLanguage, setSourceLanguage] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<Flashcard[]>([]);

  // Manual creation
  const [manualQuestion, setManualQuestion] = useState('');
  const [manualAnswer, setManualAnswer] = useState('');

  // UI state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Create deck
  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/decks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin', // Important: include cookies
        body: JSON.stringify({
          name: deckName,
          description: deckDescription,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to create deck');
        setIsLoading(false);
        return;
      }

      setDeckId(data.data.id);
      setDeckCreated(true);
      setSuccess('Deck created! Now add some flashcards.');
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Create deck error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2A: Generate flashcards with AI
  const handleGenerateFlashcards = async () => {
    setError('');
    setIsGenerating(true);

    try {
      const requestBody: any = {
        text: aiText,
        contentType,
        maxCards,
      };

      // Add language parameters if language learning mode
      if (contentType === 'language' && sourceLanguage && targetLanguage) {
        requestBody.sourceLanguage = sourceLanguage;
        requestBody.targetLanguage = targetLanguage;
      }

      const response = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to generate flashcards');
        setIsGenerating(false);
        return;
      }

      // Store generated flashcards with original content for tracking
      const flashcardsWithOriginals = data.data.flashcards.map((card: any) => ({
        question: card.question,
        answer: card.answer,
        originalQuestion: card.question,
        originalAnswer: card.answer,
        editPercentage: 0,
      }));

      setGeneratedCards(flashcardsWithOriginals);
      setSuccess(
        `Generated ${data.data.flashcards.length} flashcards! Review and edit them below.`
      );
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Generate flashcards error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Edit generated flashcard
  const handleEditCard = (index: number, field: 'question' | 'answer', value: string) => {
    const updatedCards = [...generatedCards];
    updatedCards[index][field] = value;

    // Calculate edit percentage
    const original =
      field === 'question'
        ? updatedCards[index].originalQuestion
        : updatedCards[index].originalAnswer;
    if (original) {
      const editPercentage = calculateEditPercentage(original, value);
      updatedCards[index].editPercentage = Math.max(
        updatedCards[index].editPercentage || 0,
        editPercentage
      );
    }

    setGeneratedCards(updatedCards);
  };

  // Delete generated flashcard
  const handleDeleteCard = (index: number) => {
    setGeneratedCards(generatedCards.filter((_, i) => i !== index));
  };

  // Calculate simple edit percentage (character-based)
  const calculateEditPercentage = (original: string, edited: string): number => {
    if (original === edited) return 0;
    if (!original.length) return 100;

    // Simple character diff ratio
    const maxLength = Math.max(original.length, edited.length);
    const lengthDiff = Math.abs(original.length - edited.length);
    const percentage = (lengthDiff / maxLength) * 100;

    return Math.min(100, Math.round(percentage));
  };

  // Save AI-generated flashcards to deck
  const handleSaveAIFlashcards = async () => {
    if (generatedCards.length === 0) {
      setError('No flashcards to save');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const flashcardsData = generatedCards.map(card => ({
        question: card.question,
        answer: card.answer,
        deckId: deckId!,
        creationMethod: 'ai' as const,
        originalQuestion: card.originalQuestion,
        originalAnswer: card.originalAnswer,
        editPercentage: card.editPercentage || 0,
      }));

      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          flashcards: flashcardsData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to save flashcards');
        setIsLoading(false);
        return;
      }

      setSuccess(`Saved ${data.data.length} flashcards! Redirecting to dashboard...`);
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Save flashcards error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2B: Create manual flashcard
  const handleCreateManualFlashcard = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          question: manualQuestion,
          answer: manualAnswer,
          deckId: deckId!,
          creationMethod: 'manual',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to create flashcard');
        setIsLoading(false);
        return;
      }

      setSuccess('Flashcard created!');
      setManualQuestion('');
      setManualAnswer('');

      // Optional: Ask if user wants to create another or finish
      setTimeout(() => {
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Create manual flashcard error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = () => {
    window.location.href = '/dashboard';
  };

  // Render: Step 1 - Create Deck
  if (!deckCreated) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Step 1: Name Your Deck</CardTitle>
          <CardDescription>
            Give your flashcard deck a name and optional description
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleCreateDeck}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-500/10 text-green-600 text-sm p-3 rounded-md">{success}</div>
            )}

            <div className="space-y-2">
              <label htmlFor="deckName" className="text-sm font-medium">
                Deck Name *
              </label>
              <Input
                id="deckName"
                type="text"
                placeholder="e.g., Biology 101, Spanish Vocabulary, AWS Certification"
                value={deckName}
                onChange={e => setDeckName(e.target.value)}
                required
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="deckDescription" className="text-sm font-medium">
                Description (Optional)
              </label>
              <Textarea
                id="deckDescription"
                placeholder="Brief description of what this deck covers..."
                value={deckDescription}
                onChange={e => setDeckDescription(e.target.value)}
                maxLength={500}
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || !deckName.trim()}>
              {isLoading ? 'Creating...' : 'Create Deck'}
            </Button>
          </CardContent>
        </form>
      </Card>
    );
  }

  // Render: Step 2 - Choose creation method
  if (!creationMode) {
    return (
      <div className="space-y-6">
        {success && (
          <div className="bg-green-500/10 text-green-600 text-sm p-3 rounded-md max-w-2xl mx-auto">
            {success}
          </div>
        )}

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Step 2: Add Flashcards</h2>
          <p className="text-muted-foreground">Choose how you want to create your flashcards</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          <Card
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => setCreationMode('ai')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>✨</span> AI Generation
              </CardTitle>
              <CardDescription>
                Paste your text and let AI generate flashcards automatically
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• Fast and efficient</li>
                <li>• Up to 20 cards at once</li>
                <li>• Review and edit before saving</li>
                <li>• Perfect for lecture notes</li>
              </ul>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => setCreationMode('manual')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>✍️</span> Manual Creation
              </CardTitle>
              <CardDescription>Create flashcards one by one with full control</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• Complete control</li>
                <li>• Add specific questions</li>
                <li>• Customize exactly what you need</li>
                <li>• Great for targeted study</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Render: AI Generation Mode
  if (creationMode === 'ai') {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>
        )}
        {success && (
          <div className="bg-green-500/10 text-green-600 text-sm p-3 rounded-md">{success}</div>
        )}

        <Button
          variant="outline"
          onClick={() => {
            setCreationMode(null);
            setGeneratedCards([]);
            setAiText('');
          }}
          className="mb-4"
        >
          ← Change Method
        </Button>

        {generatedCards.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Generate Flashcards with AI</CardTitle>
              <CardDescription>
                Paste your text below and let AI create flashcards for you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="aiText" className="text-sm font-medium">
                    {contentType === 'language' ? 'Topic or Context *' : 'Topic *'}
                  </label>
                  <span className="text-xs text-muted-foreground">
                    {aiText.length}/500 characters
                  </span>
                </div>
                <Textarea
                  id="aiText"
                  placeholder={
                    contentType === 'language'
                      ? 'e.g., "travel and tourism", "business meetings", "restaurant vocabulary"'
                      : contentType === 'academic'
                        ? 'e.g., "photosynthesis", "World War II", "calculus derivatives"'
                        : contentType === 'technical'
                          ? 'e.g., "React hooks", "database normalization", "REST APIs"'
                          : 'e.g., "ancient Egypt", "solar system", "coffee production"'
                  }
                  value={aiText}
                  onChange={e => setAiText(e.target.value.slice(0, 500))}
                  maxLength={500}
                  rows={contentType === 'language' ? 3 : 8}
                  required
                />
              </div>

              {contentType === 'language' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="sourceLanguage" className="text-sm font-medium">
                      From Language *
                    </label>
                    <Input
                      id="sourceLanguage"
                      type="text"
                      placeholder="e.g., English, Spanish, Polish"
                      value={sourceLanguage}
                      onChange={e => setSourceLanguage(e.target.value)}
                      required={contentType === 'language'}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="targetLanguage" className="text-sm font-medium">
                      To Language *
                    </label>
                    <Input
                      id="targetLanguage"
                      type="text"
                      placeholder="e.g., French, German, Japanese"
                      value={targetLanguage}
                      onChange={e => setTargetLanguage(e.target.value)}
                      required={contentType === 'language'}
                    />
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="contentType" className="text-sm font-medium">
                    Content Type
                  </label>
                  <select
                    id="contentType"
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    value={contentType}
                    onChange={e => setContentType(e.target.value as ContentType)}
                  >
                    <option value="general">General Knowledge</option>
                    <option value="academic">Academic</option>
                    <option value="technical">Technical</option>
                    <option value="language">Language Learning</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="maxCards" className="text-sm font-medium">
                    Number of Cards
                  </label>
                  <Input
                    id="maxCards"
                    type="number"
                    min={1}
                    max={20}
                    value={maxCards}
                    onChange={e => setMaxCards(Number(e.target.value))}
                  />
                </div>
              </div>

              <Button
                onClick={handleGenerateFlashcards}
                className="w-full"
                disabled={
                  isGenerating ||
                  aiText.length < 10 ||
                  (contentType === 'language' && (!sourceLanguage || !targetLanguage))
                }
              >
                {isGenerating ? 'Generating...' : '✨ Generate Flashcards'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">
                Review Generated Flashcards ({generatedCards.length})
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setGeneratedCards([]);
                    setAiText('');
                  }}
                >
                  Regenerate
                </Button>
                <Button onClick={handleSaveAIFlashcards} disabled={isLoading}>
                  {isLoading ? 'Saving...' : `Save ${generatedCards.length} Cards`}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {generatedCards.map((card, index) => (
                <Card key={index}>
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Question</label>
                      <Textarea
                        value={card.question}
                        onChange={e => handleEditCard(index, 'question', e.target.value)}
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Answer</label>
                      <Textarea
                        value={card.answer}
                        onChange={e => handleEditCard(index, 'answer', e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      {card.editPercentage && card.editPercentage > 0 ? (
                        <span className="text-xs text-muted-foreground">
                          Edited: {card.editPercentage}%
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Unmodified</span>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteCard(index)}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Render: Manual Creation Mode
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>
      )}
      {success && (
        <div className="bg-green-500/10 text-green-600 text-sm p-3 rounded-md">{success}</div>
      )}

      <Button variant="outline" onClick={() => setCreationMode(null)} className="mb-4">
        ← Change Method
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Create Flashcard Manually</CardTitle>
          <CardDescription>Add as many flashcards as you need, one at a time</CardDescription>
        </CardHeader>
        <form onSubmit={handleCreateManualFlashcard}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="question" className="text-sm font-medium">
                Question *
              </label>
              <Textarea
                id="question"
                placeholder="Enter your question..."
                value={manualQuestion}
                onChange={e => setManualQuestion(e.target.value)}
                required
                maxLength={500}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="answer" className="text-sm font-medium">
                Answer *
              </label>
              <Textarea
                id="answer"
                placeholder="Enter the answer..."
                value={manualAnswer}
                onChange={e => setManualAnswer(e.target.value)}
                required
                maxLength={2000}
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1"
                disabled={isLoading || !manualQuestion.trim() || !manualAnswer.trim()}
              >
                {isLoading ? 'Adding...' : 'Add Flashcard'}
              </Button>
              <Button type="button" variant="outline" onClick={handleFinish}>
                Finish & Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
