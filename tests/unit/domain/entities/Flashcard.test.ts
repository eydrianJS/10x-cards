/**
 * Unit Tests for Flashcard Domain Entity
 * Tests SM-2 algorithm implementation and flashcard business logic
 */

import { Flashcard } from '../../../../src/domain/entities/Flashcard';

describe('Flashcard Entity', () => {
  const baseFlashcardData = {
    id: 'test-id-1',
    deckId: 'deck-id-1',
    question: 'What is the capital of France?',
    answer: 'Paris',
    creationMethod: 'manual' as const,
    createdAt: new Date('2025-01-01'),
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReviewDate: new Date('2025-01-01'),
  };

  describe('Constructor', () => {
    it('should create a flashcard with default SM-2 values', () => {
      const flashcard = new Flashcard(baseFlashcardData);

      expect(flashcard.id).toBe('test-id-1');
      expect(flashcard.deckId).toBe('deck-id-1');
      expect(flashcard.question).toBe('What is the capital of France?');
      expect(flashcard.answer).toBe('Paris');
      expect(flashcard.easeFactor).toBe(2.5);
      expect(flashcard.interval).toBe(0);
      expect(flashcard.repetitions).toBe(0);
      expect(flashcard.creationMethod).toBe('manual');
    });

    it('should create a flashcard with custom SM-2 values', () => {
      const flashcard = new Flashcard({
        ...baseFlashcardData,
        easeFactor: 2.0,
        interval: 5,
        repetitions: 3,
      });

      expect(flashcard.easeFactor).toBe(2.0);
      expect(flashcard.interval).toBe(5);
      expect(flashcard.repetitions).toBe(3);
    });

    it('should track original content for AI-generated cards', () => {
      const flashcard = new Flashcard({
        ...baseFlashcardData,
        creationMethod: 'ai',
        originalQuestion: 'Original question',
        originalAnswer: 'Original answer',
        editPercentage: 15.5,
      });

      expect(flashcard.creationMethod).toBe('ai');
      expect(flashcard.originalQuestion).toBe('Original question');
      expect(flashcard.originalAnswer).toBe('Original answer');
      expect(flashcard.editPercentage).toBe(15.5);
    });
  });

  describe('SM-2 Algorithm - applySM2Algorithm()', () => {
    it('should handle quality 0 (Again) - reset card', () => {
      const flashcard = new Flashcard({
        ...baseFlashcardData,
        easeFactor: 2.5,
        interval: 10,
        repetitions: 5,
      });

      const updated = flashcard.applySM2Algorithm(0);

      expect(updated.repetitions).toBe(0);
      expect(updated.interval).toBe(1);
      expect(updated.easeFactor).toBeLessThan(2.5);
      expect(updated.easeFactor).toBeGreaterThanOrEqual(1.3);
      expect(updated.lastReviewedAt).toBeDefined();
    });

    it('should handle quality 1 (Fail) - reset card', () => {
      const flashcard = new Flashcard({
        ...baseFlashcardData,
        easeFactor: 2.5,
        interval: 10,
        repetitions: 5,
      });

      const updated = flashcard.applySM2Algorithm(1);

      expect(updated.repetitions).toBe(0);
      expect(updated.interval).toBe(1);
      expect(updated.easeFactor).toBeLessThan(2.5);
    });

    it('should handle quality 2 (Hard) - reset card', () => {
      const flashcard = new Flashcard({
        ...baseFlashcardData,
        easeFactor: 2.5,
        interval: 10,
        repetitions: 5,
      });

      const updated = flashcard.applySM2Algorithm(2);

      expect(updated.repetitions).toBe(0);
      expect(updated.interval).toBe(1);
      expect(updated.easeFactor).toBeLessThan(2.5);
    });

    it('should handle quality 3 (Good) - first repetition', () => {
      const flashcard = new Flashcard({
        ...baseFlashcardData,
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
      });

      const updated = flashcard.applySM2Algorithm(3);

      expect(updated.repetitions).toBe(1);
      expect(updated.interval).toBe(1);
      expect(updated.easeFactor).toBeCloseTo(2.36, 1);
    });

    it('should handle quality 3 (Good) - second repetition', () => {
      const flashcard = new Flashcard({
        ...baseFlashcardData,
        easeFactor: 2.5,
        interval: 1,
        repetitions: 1,
      });

      const updated = flashcard.applySM2Algorithm(3);

      expect(updated.repetitions).toBe(2);
      expect(updated.interval).toBe(6);
    });

    it('should handle quality 3 (Good) - subsequent repetitions', () => {
      const flashcard = new Flashcard({
        ...baseFlashcardData,
        easeFactor: 2.5,
        interval: 6,
        repetitions: 2,
      });

      const updated = flashcard.applySM2Algorithm(3);

      expect(updated.repetitions).toBe(3);
      expect(updated.interval).toBe(Math.round(6 * 2.5)); // 15
    });

    it('should handle quality 4 (Good) - increase ease factor slightly', () => {
      const flashcard = new Flashcard({
        ...baseFlashcardData,
        easeFactor: 2.5,
        interval: 6,
        repetitions: 2,
      });

      const updated = flashcard.applySM2Algorithm(4);

      expect(updated.repetitions).toBe(3);
      // Quality 4 should increase EF slightly (based on SM-2 formula)
      expect(updated.easeFactor).toBeGreaterThanOrEqual(2.5);
    });

    it('should handle quality 5 (Easy) - increase ease factor more', () => {
      const flashcard = new Flashcard({
        ...baseFlashcardData,
        easeFactor: 2.5,
        interval: 6,
        repetitions: 2,
      });

      const updated = flashcard.applySM2Algorithm(5);

      expect(updated.repetitions).toBe(3);
      expect(updated.easeFactor).toBeGreaterThan(2.5);
      const quality4Updated = flashcard.applySM2Algorithm(4);
      expect(updated.easeFactor).toBeGreaterThan(quality4Updated.easeFactor);
    });

    it('should enforce minimum ease factor of 1.3', () => {
      const flashcard = new Flashcard({
        ...baseFlashcardData,
        easeFactor: 1.3,
        interval: 10,
        repetitions: 5,
      });

      const updated = flashcard.applySM2Algorithm(0);

      expect(updated.easeFactor).toBeGreaterThanOrEqual(1.3);
    });

    it('should update lastReviewedAt and quality', () => {
      const flashcard = new Flashcard(baseFlashcardData);
      const beforeReview = new Date();

      const updated = flashcard.applySM2Algorithm(4);

      expect(updated.lastReviewedAt).toBeDefined();
      expect(updated.lastReviewedAt!.getTime()).toBeGreaterThanOrEqual(beforeReview.getTime());
      expect(updated.quality).toBe(4);
    });

    it('should calculate next review date correctly', () => {
      const flashcard = new Flashcard({
        ...baseFlashcardData,
        repetitions: 2,
        interval: 6,
      });

      const updated = flashcard.applySM2Algorithm(3);
      const daysDiff = Math.ceil(
        (updated.nextReviewDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(daysDiff).toBe(updated.interval);
    });
  });

  describe('isDue()', () => {
    it('should return true when card is due for review', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const flashcard = new Flashcard({
        ...baseFlashcardData,
        nextReviewDate: pastDate,
      });

      expect(flashcard.isDue()).toBe(true);
    });

    it('should return true when card is due today', () => {
      const flashcard = new Flashcard({
        ...baseFlashcardData,
        nextReviewDate: new Date(),
      });

      expect(flashcard.isDue()).toBe(true);
    });

    it('should return false when card is not yet due', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      const flashcard = new Flashcard({
        ...baseFlashcardData,
        nextReviewDate: futureDate,
      });

      expect(flashcard.isDue()).toBe(false);
    });
  });

  describe('getDaysUntilNextReview()', () => {
    it('should return positive days for future review', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const flashcard = new Flashcard({
        ...baseFlashcardData,
        nextReviewDate: futureDate,
      });

      expect(flashcard.getDaysUntilNextReview()).toBe(7);
    });

    it('should return negative days for overdue review', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 3);

      const flashcard = new Flashcard({
        ...baseFlashcardData,
        nextReviewDate: pastDate,
      });

      expect(flashcard.getDaysUntilNextReview()).toBeLessThanOrEqual(0);
    });
  });

  describe('updateContent()', () => {
    it('should update question and answer', () => {
      const flashcard = new Flashcard(baseFlashcardData);

      const updated = flashcard.updateContent('What is the capital of Spain?', 'Madrid');

      expect(updated.question).toBe('What is the capital of Spain?');
      expect(updated.answer).toBe('Madrid');
    });

    it('should preserve original content for AI cards', () => {
      const flashcard = new Flashcard({
        ...baseFlashcardData,
        creationMethod: 'ai',
        originalQuestion: 'Original Q',
        originalAnswer: 'Original A',
      });

      const updated = flashcard.updateContent('New Q', 'New A');

      expect(updated.originalQuestion).toBe('Original Q');
      expect(updated.originalAnswer).toBe('Original A');
    });

    it('should set original content for manual cards on first edit', () => {
      const flashcard = new Flashcard({
        ...baseFlashcardData,
        question: 'Original question',
        answer: 'Original answer',
      });

      const updated = flashcard.updateContent('Updated question', 'Updated answer');

      expect(updated.originalQuestion).toBe('Original question');
      expect(updated.originalAnswer).toBe('Original answer');
    });

    it('should calculate edit percentage', () => {
      const flashcard = new Flashcard(baseFlashcardData);

      const updated = flashcard.updateContent(
        'Completely different question',
        'Completely different answer'
      );

      expect(updated.editPercentage).toBeGreaterThan(0);
    });

    it('should have 0 edit percentage for identical content', () => {
      const flashcard = new Flashcard(baseFlashcardData);

      const updated = flashcard.updateContent(baseFlashcardData.question, baseFlashcardData.answer);

      expect(updated.editPercentage).toBe(0);
    });
  });

  describe('isAccepted()', () => {
    it('should return true for cards with no edits', () => {
      const flashcard = new Flashcard({
        ...baseFlashcardData,
        creationMethod: 'ai',
        editPercentage: 0,
      });

      expect(flashcard.isAccepted()).toBe(true);
    });

    it('should return true for cards with less than 30% edits', () => {
      const flashcard = new Flashcard({
        ...baseFlashcardData,
        creationMethod: 'ai',
        editPercentage: 25,
      });

      expect(flashcard.isAccepted()).toBe(true);
    });

    it('should return false for cards with 30% or more edits', () => {
      const flashcard = new Flashcard({
        ...baseFlashcardData,
        creationMethod: 'ai',
        editPercentage: 30,
      });

      expect(flashcard.isAccepted()).toBe(false);
    });

    it('should return true for cards with undefined editPercentage', () => {
      const flashcard = new Flashcard(baseFlashcardData);

      expect(flashcard.isAccepted()).toBe(true);
    });
  });

  describe('getQualityDescription()', () => {
    it('should return description for quality rating', () => {
      const flashcard = new Flashcard({
        ...baseFlashcardData,
        quality: 3,
      });

      const description = flashcard.getQualityDescription();
      expect(description).toBeDefined();
      expect(typeof description).toBe('string');
    });

    it('should return "Not rated" for undefined quality', () => {
      const flashcard = new Flashcard(baseFlashcardData);

      expect(flashcard.getQualityDescription()).toBe('Not rated');
    });
  });
});
