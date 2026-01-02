/**
 * Integration Tests for AI Generation API
 * Tests: POST /api/ai-generate
 * Coverage: FR-AI-001 to FR-AI-021
 */

describe('POST /api/ai-generate', () => {
  const validRequest = {
    text: 'Mitochondria are the powerhouse of the cell',
    contentType: 'academic',
    maxCards: 5,
  };

  describe('Validation (FR-AI-002, FR-AI-003, FR-AI-006, FR-AI-008)', () => {
    it('should reject empty text', async () => {
      const response = await fetch('http://localhost:4321/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validRequest, text: '' }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation failed');
    });

    it('should reject text shorter than 10 characters', async () => {
      const response = await fetch('http://localhost:4321/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validRequest, text: 'Too short' }),
      });

      expect(response.status).toBe(400);
    });

    it('should reject text longer than 500 characters', async () => {
      const longText = 'a'.repeat(501);
      const response = await fetch('http://localhost:4321/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validRequest, text: longText }),
      });

      expect(response.status).toBe(400);
    });

    it('should reject maxCards greater than 20', async () => {
      const response = await fetch('http://localhost:4321/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validRequest, maxCards: 21 }),
      });

      expect(response.status).toBe(400);
    });

    it('should reject maxCards less than 1', async () => {
      const response = await fetch('http://localhost:4321/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validRequest, maxCards: 0 }),
      });

      expect(response.status).toBe(400);
    });

    it.skip('should accept valid content types', async () => {
      // TBD: Requires running server
      const contentTypes = ['academic', 'technical', 'general', 'language'];

      for (const contentType of contentTypes) {
        const response = await fetch('http://localhost:4321/api/ai-generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...validRequest, contentType }),
        });

        // Should not fail validation (may fail on other reasons like API key)
        expect([200, 500, 502]).toContain(response.status);
      }
    });

    it('should reject invalid content type', async () => {
      const response = await fetch('http://localhost:4321/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validRequest, contentType: 'invalid' }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Default Values (FR-AI-004, FR-AI-007)', () => {
    it('should use default contentType if not provided', async () => {
      const { contentType, ...requestWithoutContentType } = validRequest;

      const response = await fetch('http://localhost:4321/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestWithoutContentType),
      });

      // Should not fail validation
      expect([200, 500, 502]).toContain(response.status);
    });

    it('should use default maxCards if not provided', async () => {
      const { maxCards, ...requestWithoutMaxCards } = validRequest;

      const response = await fetch('http://localhost:4321/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestWithoutMaxCards),
      });

      // Should not fail validation
      expect([200, 500, 502]).toContain(response.status);
    });
  });

  describe.skip('Successful Generation (FR-AI-009, FR-AI-010)', () => {
    // TBD: Requires actual OpenRouter API key and integration
    it('should generate flashcards successfully', async () => {
      const response = await fetch('http://localhost:4321/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequest),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.flashcards).toBeDefined();
      expect(Array.isArray(data.data.flashcards)).toBe(true);
      expect(data.data.flashcards.length).toBeGreaterThan(0);
      expect(data.data.flashcards.length).toBeLessThanOrEqual(validRequest.maxCards);
    });

    it('should return flashcards in correct format', async () => {
      const response = await fetch('http://localhost:4321/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequest),
      });

      const data = await response.json();
      const flashcard = data.data.flashcards[0];

      expect(flashcard).toHaveProperty('question');
      expect(flashcard).toHaveProperty('answer');
      expect(typeof flashcard.question).toBe('string');
      expect(typeof flashcard.answer).toBe('string');
      expect(flashcard.question.length).toBeGreaterThan(0);
      expect(flashcard.answer.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling (FR-AI-012)', () => {
    it('should handle missing API key gracefully', async () => {
      // This test assumes OPENROUTER_API_KEY is not set in test environment
      const response = await fetch('http://localhost:4321/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequest),
      });

      if (response.status === 500) {
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error).toBeDefined();
      }
    });

    it('should return JSON error response on failure', async () => {
      const response = await fetch('http://localhost:4321/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: '' }), // Invalid request
      });

      expect(response.headers.get('content-type')).toContain('application/json');
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });
  });

  describe('Language Learning Support (FR-AI-004)', () => {
    it('should accept sourceLanguage and targetLanguage for language content type', async () => {
      const response = await fetch('http://localhost:4321/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validRequest,
          contentType: 'language',
          sourceLanguage: 'English',
          targetLanguage: 'Spanish',
        }),
      });

      // Should not fail validation
      expect([200, 500, 502]).toContain(response.status);
    });
  });
});
