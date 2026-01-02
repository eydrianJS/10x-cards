/**
 * Integration Tests for Health API Endpoint
 * Tests: GET /api/health
 */

describe('GET /api/health', () => {
  it('should return healthy status', async () => {
    const response = await fetch('http://localhost:4321/api/health');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.timestamp).toBeDefined();
    expect(data.service).toBe('ai-flashcard-app');
  });

  it('should return JSON content type', async () => {
    const response = await fetch('http://localhost:4321/api/health');

    expect(response.headers.get('content-type')).toContain('application/json');
  });

  it('should include valid ISO timestamp', async () => {
    const response = await fetch('http://localhost:4321/api/health');
    const data = await response.json();

    const timestamp = new Date(data.timestamp);
    expect(timestamp.toISOString()).toBe(data.timestamp);
  });
});
