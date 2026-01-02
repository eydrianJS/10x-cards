/**
 * Jest Test Setup
 * Runs before all tests
 */

// Mock environment variables
process.env.PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
process.env.NODE_ENV = 'test';

// Global test utilities
global.console = {
  ...console,
  // Suppress console errors during tests (optional)
  // error: jest.fn(),
  // warn: jest.fn(),
};

// Add custom matchers if needed
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});
