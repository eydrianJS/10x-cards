/**
 * Test Data Factories and Helpers
 * Provides reusable test data for all tests
 */

export const TEST_USERS = {
  valid: {
    email: 'test@example.com',
    password: 'SecurePass123!',
  },
  admin: {
    email: 'admin@example.com',
    password: 'AdminPass123!',
  },
  weakPassword: {
    email: 'weak@example.com',
    password: 'weak',
  },
  invalidEmail: {
    email: 'invalid-email',
    password: 'SecurePass123!',
  },
};

export const TEST_DECKS = {
  biology: {
    name: 'Biology 101',
    description: 'Cell biology fundamentals',
  },
  history: {
    name: 'World History',
    description: 'Major historical events',
  },
  math: {
    name: 'Mathematics',
    description: 'Algebra and calculus',
  },
  empty: {
    name: 'Empty Deck',
    description: 'Deck with no flashcards',
  },
};

export const TEST_FLASHCARDS = {
  manual: {
    question: 'What is 2 + 2?',
    answer: '4',
    creation_method: 'manual' as const,
  },
  aiGenerated: {
    question: 'What is the capital of France?',
    answer: 'Paris',
    creation_method: 'ai' as const,
    original_question: 'What is the capital of France?',
    original_answer: 'Paris',
    edit_percentage: 0,
  },
  aiEdited: {
    question: 'What is the capital city of France?',
    answer: 'Paris is the capital and largest city of France.',
    creation_method: 'ai' as const,
    original_question: 'Capital of France?',
    original_answer: 'Paris',
    edit_percentage: 45.5,
  },
  biology: {
    question: 'What is the powerhouse of the cell?',
    answer: 'Mitochondria',
    creation_method: 'manual' as const,
  },
};

export const TEST_AI_GENERATION_REQUESTS = {
  valid: {
    text: 'Mitochondria are the powerhouse of the cell. They generate ATP through cellular respiration.',
    contentType: 'academic' as const,
    maxCards: 5,
  },
  minimal: {
    text: 'Test text that is long enough for generation',
    contentType: 'general' as const,
    maxCards: 3,
  },
  technical: {
    text: 'React is a JavaScript library for building user interfaces. It uses a component-based architecture.',
    contentType: 'technical' as const,
    maxCards: 10,
  },
  language: {
    text: 'Common greetings and basic vocabulary',
    contentType: 'language' as const,
    maxCards: 8,
    sourceLanguage: 'English',
    targetLanguage: 'Spanish',
  },
  tooShort: {
    text: 'Too short',
    contentType: 'general' as const,
    maxCards: 5,
  },
  tooLong: {
    text: 'a'.repeat(501),
    contentType: 'general' as const,
    maxCards: 5,
  },
  tooManyCards: {
    text: 'Valid text for generation',
    contentType: 'general' as const,
    maxCards: 21,
  },
};

export const TEST_REVIEW_RATINGS = ['again', 'hard', 'good', 'easy'] as const;

export const TEST_SM2_STATES = {
  new: {
    easiness_factor: 2.5,
    repetition_count: 0,
    interval: 0,
  },
  learning: {
    easiness_factor: 2.5,
    repetition_count: 1,
    interval: 1,
  },
  reviewing: {
    easiness_factor: 2.5,
    repetition_count: 5,
    interval: 15,
  },
  difficult: {
    easiness_factor: 1.3,
    repetition_count: 2,
    interval: 3,
  },
  easy: {
    easiness_factor: 3.0,
    repetition_count: 10,
    interval: 60,
  },
};

/**
 * Generate a random test user
 */
export function generateTestUser(override?: Partial<typeof TEST_USERS.valid>) {
  const randomId = Math.random().toString(36).substring(7);
  return {
    email: `test-${randomId}@example.com`,
    password: 'TestPass123!',
    ...override,
  };
}

/**
 * Generate a random test deck
 */
export function generateTestDeck(override?: Partial<typeof TEST_DECKS.biology>) {
  const randomId = Math.random().toString(36).substring(7);
  return {
    name: `Test Deck ${randomId}`,
    description: `Test deck description ${randomId}`,
    ...override,
  };
}

/**
 * Generate a random test flashcard
 */
export function generateTestFlashcard(override?: Partial<typeof TEST_FLASHCARDS.manual>) {
  const randomId = Math.random().toString(36).substring(7);
  return {
    question: `Test question ${randomId}?`,
    answer: `Test answer ${randomId}`,
    creation_method: 'manual' as const,
    ...override,
  };
}

/**
 * Generate multiple test flashcards
 */
export function generateTestFlashcards(count: number) {
  return Array.from({ length: count }, (_, i) =>
    generateTestFlashcard({
      question: `Test question ${i + 1}?`,
      answer: `Test answer ${i + 1}`,
    })
  );
}

/**
 * Create a flashcard that is due for review
 */
export function createDueFlashcard() {
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 1);

  return {
    ...generateTestFlashcard(),
    next_review_date: pastDate.toISOString().split('T')[0],
  };
}

/**
 * Create a flashcard that is not yet due
 */
export function createNotDueFlashcard() {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7);

  return {
    ...generateTestFlashcard(),
    next_review_date: futureDate.toISOString().split('T')[0],
  };
}

/**
 * Mock AI generation response
 */
export function mockAIGenerationResponse(count: number) {
  return {
    success: true,
    data: {
      flashcards: Array.from({ length: count }, (_, i) => ({
        question: `AI generated question ${i + 1}?`,
        answer: `AI generated answer ${i + 1}`,
      })),
    },
  };
}

/**
 * Create date N days from now
 */
export function createDateDaysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * Create ISO date string N days from now
 */
export function createISODateDaysFromNow(days: number): string {
  return createDateDaysFromNow(days).toISOString().split('T')[0];
}
