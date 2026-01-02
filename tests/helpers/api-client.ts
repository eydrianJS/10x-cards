/**
 * Test API Client
 * Simplified client for making API requests in tests
 */

export class TestAPIClient {
  private baseUrl: string;
  private authCookie: string | null = null;

  constructor(baseUrl: string = 'http://localhost:4321', authCookie?: string) {
    this.baseUrl = baseUrl;
    this.authCookie = authCookie || null;
  }

  setAuthCookie(cookie: string) {
    this.authCookie = cookie;
  }

  clearAuth() {
    this.authCookie = null;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.authCookie) {
      headers.Cookie = this.authCookie;
    }

    return fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });
  }

  // Health
  async checkHealth() {
    return this.request('/api/health');
  }

  // Decks
  async getDecks(params?: { sort?: string; order?: string }) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`/api/decks${query}`);
  }

  async getDeck(id: string) {
    return this.request(`/api/decks/${id}`);
  }

  async createDeck(data: { name: string; description?: string }) {
    return this.request('/api/decks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDeck(id: string, data: { name?: string; description?: string; isPublic?: boolean }) {
    return this.request(`/api/decks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteDeck(id: string) {
    return this.request(`/api/decks/${id}`, {
      method: 'DELETE',
    });
  }

  async exportDeck(id: string, format: 'json' | 'csv') {
    return this.request(`/api/decks/${id}/export?format=${format}`);
  }

  // Flashcards
  async getFlashcards(
    deckId: string,
    params?: {
      search?: string;
      due_only?: boolean;
      sort?: string;
      order?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return this.request(`/api/decks/${deckId}/flashcards${query}`);
  }

  async getFlashcard(id: string) {
    return this.request(`/api/flashcards/${id}`);
  }

  async createFlashcard(deckId: string, data: any) {
    return this.request(`/api/decks/${deckId}/flashcards`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createFlashcards(deckId: string, flashcards: any[]) {
    return this.request(`/api/decks/${deckId}/flashcards`, {
      method: 'POST',
      body: JSON.stringify({ flashcards }),
    });
  }

  async updateFlashcard(id: string, data: any) {
    return this.request(`/api/flashcards/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteFlashcard(id: string) {
    return this.request(`/api/flashcards/${id}`, {
      method: 'DELETE',
    });
  }

  // AI Generation
  async generateFlashcards(data: {
    text: string;
    contentType?: string;
    maxCards?: number;
    sourceLanguage?: string;
    targetLanguage?: string;
  }) {
    return this.request('/api/ai-generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Review Sessions
  async startStudySession(deckId: string) {
    return this.request(`/api/decks/${deckId}/study`, {
      method: 'POST',
    });
  }

  async getSession(sessionId: string) {
    return this.request(`/api/review-sessions/${sessionId}`);
  }

  async endSession(sessionId: string) {
    return this.request(`/api/review-sessions/${sessionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'end' }),
    });
  }

  async reviewCard(sessionId: string, flashcardId: string, rating: string) {
    return this.request(`/api/review-sessions/${sessionId}/review`, {
      method: 'POST',
      body: JSON.stringify({ flashcard_id: flashcardId, rating }),
    });
  }

  // Daily Learning
  async createDailyLearningSession(data: {
    deck_ids: string[];
    target_new_cards?: number;
    target_review_cards?: number;
  }) {
    return this.request('/api/daily-learning-sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getDailyLearningSession(sessionId: string) {
    return this.request(`/api/daily-learning-sessions/${sessionId}`);
  }

  async reviewDailyCard(sessionId: string, flashcardId: string, rating: string) {
    return this.request(`/api/daily-learning-sessions/${sessionId}/review`, {
      method: 'POST',
      body: JSON.stringify({ flashcard_id: flashcardId, rating }),
    });
  }

  async getDailyStats() {
    return this.request('/api/daily-stats');
  }

  // Auth
  async signup(email: string, password: string) {
    return this.request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async login(email: string, password: string) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    return this.request('/api/auth/logout', {
      method: 'POST',
    });
  }
}

/**
 * Create a test API client
 */
export function createTestClient(baseUrl?: string, authCookie?: string): TestAPIClient {
  return new TestAPIClient(baseUrl, authCookie);
}
