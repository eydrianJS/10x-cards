/**
 * Unit Tests for Deck Domain Entity
 * Tests deck business logic and operations
 */

import { Deck } from '../../../../src/domain/entities/Deck';

describe('Deck Entity', () => {
  const baseDeckData = {
    id: 'deck-id-1',
    userId: 'user-id-1',
    name: 'Biology 101',
    description: 'Cell biology fundamentals',
    createdAt: new Date('2025-01-01'),
    isPublic: false,
    flashcardCount: 0,
  };

  describe('Constructor', () => {
    it('should create a deck with all properties', () => {
      const deck = new Deck(baseDeckData);

      expect(deck.id).toBe('deck-id-1');
      expect(deck.userId).toBe('user-id-1');
      expect(deck.name).toBe('Biology 101');
      expect(deck.description).toBe('Cell biology fundamentals');
      expect(deck.isPublic).toBe(false);
      expect(deck.flashcardCount).toBe(0);
    });

    it('should default isPublic to false if not provided', () => {
      const { isPublic, ...dataWithoutIsPublic } = baseDeckData;
      const deck = new Deck(dataWithoutIsPublic as any);

      expect(deck.isPublic).toBe(false);
    });

    it('should default flashcardCount to 0 if not provided', () => {
      const { flashcardCount, ...dataWithoutCount } = baseDeckData;
      const deck = new Deck(dataWithoutCount as any);

      expect(deck.flashcardCount).toBe(0);
    });

    it('should set updatedAt to createdAt initially', () => {
      const deck = new Deck(baseDeckData);

      expect(deck.updatedAt.getTime()).toBe(baseDeckData.createdAt.getTime());
    });
  });

  describe('updateMetadata()', () => {
    it('should update name and description', () => {
      const deck = new Deck(baseDeckData);

      const updated = deck.updateMetadata('Biology 102', 'Advanced cell biology');

      expect(updated.name).toBe('Biology 102');
      expect(updated.description).toBe('Advanced cell biology');
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(deck.createdAt.getTime());
    });

    it('should update isPublic status', () => {
      const deck = new Deck(baseDeckData);

      const updated = deck.updateMetadata('Biology 101', undefined, true);

      expect(updated.isPublic).toBe(true);
    });

    it('should preserve other properties', () => {
      const deck = new Deck(baseDeckData);

      const updated = deck.updateMetadata('New Name');

      expect(updated.id).toBe(deck.id);
      expect(updated.userId).toBe(deck.userId);
      expect(updated.flashcardCount).toBe(deck.flashcardCount);
    });
  });

  describe('incrementFlashcardCount()', () => {
    it('should increment count from 0', () => {
      const deck = new Deck(baseDeckData);

      const updated = deck.incrementFlashcardCount();

      expect(updated.flashcardCount).toBe(1);
    });

    it('should increment count from existing value', () => {
      const deck = new Deck({ ...baseDeckData, flashcardCount: 5 });

      const updated = deck.incrementFlashcardCount();

      expect(updated.flashcardCount).toBe(6);
    });

    it('should update updatedAt timestamp', () => {
      const deck = new Deck(baseDeckData);

      const updated = deck.incrementFlashcardCount();

      expect(updated.updatedAt).toBeDefined();
      expect(updated.updatedAt instanceof Date).toBe(true);
    });
  });

  describe('decrementFlashcardCount()', () => {
    it('should decrement count', () => {
      const deck = new Deck({ ...baseDeckData, flashcardCount: 5 });

      const updated = deck.decrementFlashcardCount();

      expect(updated.flashcardCount).toBe(4);
    });

    it('should not go below 0', () => {
      const deck = new Deck({ ...baseDeckData, flashcardCount: 0 });

      const updated = deck.decrementFlashcardCount();

      expect(updated.flashcardCount).toBe(0);
    });

    it('should handle undefined flashcardCount', () => {
      const { flashcardCount, ...dataWithoutCount } = baseDeckData;
      const deck = new Deck({ ...dataWithoutCount, flashcardCount: 0 });

      const updated = deck.decrementFlashcardCount();

      expect(updated.flashcardCount).toBe(0);
    });
  });

  describe('setFlashcardCount()', () => {
    it('should set count to specific value', () => {
      const deck = new Deck(baseDeckData);

      const updated = deck.setFlashcardCount(42);

      expect(updated.flashcardCount).toBe(42);
    });

    it('should not allow negative values', () => {
      const deck = new Deck(baseDeckData);

      const updated = deck.setFlashcardCount(-5);

      expect(updated.flashcardCount).toBe(0);
    });
  });

  describe('belongsTo()', () => {
    it('should return true for owner', () => {
      const deck = new Deck(baseDeckData);

      expect(deck.belongsTo('user-id-1')).toBe(true);
    });

    it('should return false for non-owner', () => {
      const deck = new Deck(baseDeckData);

      expect(deck.belongsTo('different-user-id')).toBe(false);
    });
  });

  describe('isAccessibleTo()', () => {
    it('should return true for owner', () => {
      const deck = new Deck({ ...baseDeckData, isPublic: false });

      expect(deck.isAccessibleTo('user-id-1')).toBe(true);
    });

    it('should return true for public deck with non-owner', () => {
      const deck = new Deck({ ...baseDeckData, isPublic: true });

      expect(deck.isAccessibleTo('different-user-id')).toBe(true);
    });

    it('should return false for private deck with non-owner', () => {
      const deck = new Deck({ ...baseDeckData, isPublic: false });

      expect(deck.isAccessibleTo('different-user-id')).toBe(false);
    });
  });

  describe('getStats()', () => {
    it('should return deck statistics summary', () => {
      const deck = new Deck({ ...baseDeckData, flashcardCount: 25 });

      const stats = deck.getStats();

      expect(stats).toEqual({
        id: deck.id,
        name: deck.name,
        description: deck.description,
        flashcardCount: 25,
        isPublic: deck.isPublic,
        createdAt: deck.createdAt,
        updatedAt: deck.updatedAt,
      });
    });

    it('should default flashcardCount to 0 in stats', () => {
      const { flashcardCount, ...dataWithoutCount } = baseDeckData;
      const deck = new Deck(dataWithoutCount as any);

      const stats = deck.getStats();

      expect(stats.flashcardCount).toBe(0);
    });
  });
});
