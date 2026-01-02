import { Flashcard as FlashcardType, SM2_QUALITIES } from '../../shared/types';

/**
 * Domain entity for Flashcard with SM-2 spaced repetition algorithm
 * Implements the core business logic for flashcard review scheduling
 */
export class Flashcard implements FlashcardType {
  public readonly id: string;
  public readonly deckId: string;
  public readonly creationMethod: 'ai' | 'manual';
  public readonly createdAt: Date;
  public updatedAt: Date;
  public lastReviewedAt?: Date;

  // SM-2 Algorithm properties
  public easeFactor: number;
  public interval: number;
  public repetitions: number;
  public nextReviewDate: Date;
  public quality?: number;

  // Content properties
  public question: string;
  public answer: string;
  public originalQuestion?: string;
  public originalAnswer?: string;
  public editPercentage?: number;

  constructor(data: Omit<FlashcardType, 'updatedAt'>) {
    this.id = data.id;
    this.deckId = data.deckId;
    this.creationMethod = data.creationMethod;
    this.createdAt = data.createdAt;
    this.updatedAt = data.createdAt; // Initially set to createdAt

    // SM-2 initial values
    this.easeFactor = data.easeFactor || 2.5;
    this.interval = data.interval || 0;
    this.repetitions = data.repetitions || 0;
    this.nextReviewDate = data.nextReviewDate || new Date();

    // Content
    this.question = data.question;
    this.answer = data.answer;
    this.originalQuestion = data.originalQuestion;
    this.originalAnswer = data.originalAnswer;
    this.editPercentage = data.editPercentage;
    this.lastReviewedAt = data.lastReviewedAt;
    this.quality = data.quality;
  }

  /**
   * Apply SM-2 algorithm based on user quality rating
   * @param quality - User rating (0-5)
   * @returns Updated flashcard with new scheduling
   */
  applySM2Algorithm(quality: 0 | 1 | 2 | 3 | 4 | 5): Flashcard {
    const now = new Date();
    let newEaseFactor = this.easeFactor;
    let newInterval = this.interval;
    let newRepetitions = this.repetitions;

    // SM-2 Algorithm Implementation
    if (quality >= 3) {
      // Correct response
      if (newRepetitions === 0) {
        newInterval = 1;
      } else if (newRepetitions === 1) {
        newInterval = 6;
      } else {
        newInterval = Math.round(this.interval * this.easeFactor);
      }
      newRepetitions++;
    } else {
      // Incorrect response
      newRepetitions = 0;
      newInterval = 1;
    }

    // Update ease factor (EF)
    newEaseFactor = this.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

    // Ensure EF doesn't go below 1.3
    newEaseFactor = Math.max(1.3, newEaseFactor);

    // Calculate next review date
    const nextReviewDate = new Date(now);
    nextReviewDate.setDate(now.getDate() + newInterval);

    return new Flashcard({
      ...this,
      easeFactor: newEaseFactor,
      interval: newInterval,
      repetitions: newRepetitions,
      nextReviewDate,
      lastReviewedAt: now,
      quality,
      updatedAt: now,
    });
  }

  /**
   * Check if flashcard is due for review
   */
  isDue(): boolean {
    return new Date() >= this.nextReviewDate;
  }

  /**
   * Calculate days until next review
   */
  getDaysUntilNextReview(): number {
    const diffTime = this.nextReviewDate.getTime() - new Date().getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Update flashcard content (for manual editing)
   */
  updateContent(question: string, answer: string): Flashcard {
    const originalQuestion = this.originalQuestion || this.question;
    const originalAnswer = this.originalAnswer || this.answer;

    // Calculate edit percentage (simple text difference metric)
    const questionDiff = this.calculateTextDifference(originalQuestion, question);
    const answerDiff = this.calculateTextDifference(originalAnswer, answer);
    const editPercentage = Math.max(questionDiff, answerDiff);

    return new Flashcard({
      ...this,
      question,
      answer,
      originalQuestion,
      originalAnswer,
      editPercentage,
      updatedAt: new Date(),
    });
  }

  /**
   * Simple text difference calculation for edit percentage
   */
  private calculateTextDifference(original: string, modified: string): number {
    if (original === modified) return 0;

    const originalWords = original.toLowerCase().split(/\s+/);
    const modifiedWords = modified.toLowerCase().split(/\s+/);

    const originalSet = new Set(originalWords);
    const modifiedSet = new Set(modifiedWords);

    const intersection = new Set([...originalSet].filter((x) => modifiedSet.has(x)));
    const union = new Set([...originalSet, ...modifiedSet]);

    return union.size === 0 ? 0 : ((union.size - intersection.size) / union.size) * 100;
  }

  /**
   * Check if flashcard is considered "accepted" (not heavily modified)
   */
  isAccepted(): boolean {
    return !this.editPercentage || this.editPercentage < 30;
  }

  /**
   * Get quality description for current quality rating
   */
  getQualityDescription(): string {
    const qualityObj = SM2_QUALITIES.find((q) => q.value === this.quality);
    return qualityObj?.description || 'Not rated';
  }
}
