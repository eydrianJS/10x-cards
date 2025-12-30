import { ReviewSession as ReviewSessionType } from '../../shared/types';

/**
 * Domain entity for ReviewSession
 * Tracks user study sessions and provides analytics
 */
export class ReviewSession implements ReviewSessionType {
  public readonly id: string;
  public readonly userId: string;
  public readonly deckId: string;
  public readonly startedAt: Date;
  public endedAt?: Date;

  public cardsReviewed: number;
  public totalCards: number;

  constructor(data: ReviewSessionType) {
    this.id = data.id;
    this.userId = data.userId;
    this.deckId = data.deckId;
    this.startedAt = data.startedAt;
    this.endedAt = data.endedAt;
    this.cardsReviewed = data.cardsReviewed;
    this.totalCards = data.totalCards;
  }

  /**
   * End the review session
   */
  endSession(): ReviewSession {
    return new ReviewSession({
      ...this,
      endedAt: new Date(),
    });
  }

  /**
   * Increment cards reviewed count
   */
  incrementCardsReviewed(): ReviewSession {
    return new ReviewSession({
      ...this,
      cardsReviewed: this.cardsReviewed + 1,
    });
  }

  /**
   * Check if session is completed
   */
  isCompleted(): boolean {
    return !!this.endedAt;
  }

  /**
   * Calculate session duration in minutes
   */
  getDurationMinutes(): number {
    const endTime = this.endedAt || new Date();
    const diffMs = endTime.getTime() - this.startedAt.getTime();
    return Math.round(diffMs / (1000 * 60));
  }

  /**
   * Calculate completion percentage
   */
  getCompletionPercentage(): number {
    if (this.totalCards === 0) return 0;
    return Math.round((this.cardsReviewed / this.totalCards) * 100);
  }

  /**
   * Check if session is in progress
   */
  isInProgress(): boolean {
    return !this.isCompleted();
  }

  /**
   * Get session summary
   */
  getSummary(): {
    id: string;
    deckId: string;
    startedAt: Date;
    endedAt?: Date;
    durationMinutes: number;
    cardsReviewed: number;
    totalCards: number;
    completionPercentage: number;
    isCompleted: boolean;
  } {
    return {
      id: this.id,
      deckId: this.deckId,
      startedAt: this.startedAt,
      endedAt: this.endedAt,
      durationMinutes: this.getDurationMinutes(),
      cardsReviewed: this.cardsReviewed,
      totalCards: this.totalCards,
      completionPercentage: this.getCompletionPercentage(),
      isCompleted: this.isCompleted(),
    };
  }
}
