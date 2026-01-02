import type { Deck as DeckType } from '../../shared/types';

/**
 * Domain entity for Deck
 * Represents a collection of flashcards organized by subject/topic
 */
export class Deck implements DeckType {
  public readonly id: string;
  public readonly userId: string;
  public readonly createdAt: Date;
  public updatedAt: Date;

  public name: string;
  public description?: string;
  public isPublic: boolean;
  public flashcardCount?: number;

  constructor(data: Omit<DeckType, 'updatedAt'>) {
    this.id = data.id;
    this.userId = data.userId;
    this.createdAt = data.createdAt;
    this.updatedAt = data.createdAt; // Initially set to createdAt

    this.name = data.name;
    this.description = data.description;
    this.isPublic = data.isPublic ?? false;
    this.flashcardCount = data.flashcardCount ?? 0;
  }

  /**
   * Update deck metadata
   */
  updateMetadata(name: string, description?: string, isPublic?: boolean): Deck {
    return new Deck({
      ...this,
      name,
      description,
      isPublic,
      updatedAt: new Date(),
    });
  }

  /**
   * Increment flashcard count
   */
  incrementFlashcardCount(): Deck {
    return new Deck({
      ...this,
      flashcardCount: (this.flashcardCount ?? 0) + 1,
      updatedAt: new Date(),
    });
  }

  /**
   * Decrement flashcard count
   */
  decrementFlashcardCount(): Deck {
    return new Deck({
      ...this,
      flashcardCount: Math.max(0, (this.flashcardCount ?? 0) - 1),
      updatedAt: new Date(),
    });
  }

  /**
   * Set flashcard count (for bulk operations)
   */
  setFlashcardCount(count: number): Deck {
    return new Deck({
      ...this,
      flashcardCount: Math.max(0, count),
      updatedAt: new Date(),
    });
  }

  /**
   * Check if deck belongs to user
   */
  belongsTo(userId: string): boolean {
    return this.userId === userId;
  }

  /**
   * Check if deck is accessible to user (public or owned by user)
   */
  isAccessibleTo(userId: string): boolean {
    return this.isPublic || this.belongsTo(userId);
  }

  /**
   * Get deck statistics summary
   */
  getStats(): {
    id: string;
    name: string;
    description?: string;
    flashcardCount: number;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      flashcardCount: this.flashcardCount ?? 0,
      isPublic: this.isPublic,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
