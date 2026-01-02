/**
 * Authentication Test Helpers
 * Utilities for managing authenticated test sessions
 */

export class AuthTestHelper {
  private baseUrl: string;
  private authCookie: string | null = null;
  private userId: string | null = null;

  constructor(baseUrl: string = 'http://localhost:4321') {
    this.baseUrl = baseUrl;
  }

  /**
   * Register a new test user
   */
  async registerUser(email: string, password: string) {
    const response = await fetch(`${this.baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error(`Registration failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Login and store authentication cookie
   */
  async login(email: string, password: string) {
    const response = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }

    const cookies = response.headers.get('set-cookie');
    if (cookies) {
      this.authCookie = cookies;
    }

    const data = await response.json();
    if (data.user?.id) {
      this.userId = data.user.id;
    }

    return data;
  }

  /**
   * Logout and clear authentication
   */
  async logout() {
    if (!this.authCookie) {
      return;
    }

    const response = await fetch(`${this.baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: {
        Cookie: this.authCookie,
      },
    });

    this.authCookie = null;
    this.userId = null;

    return response.ok;
  }

  /**
   * Get current authentication cookie
   */
  getAuthCookie(): string {
    if (!this.authCookie) {
      throw new Error('Not authenticated. Call login() first.');
    }
    return this.authCookie;
  }

  /**
   * Get current user ID
   */
  getUserId(): string {
    if (!this.userId) {
      throw new Error('User ID not available. Call login() first.');
    }
    return this.userId;
  }

  /**
   * Check if currently authenticated
   */
  isAuthenticated(): boolean {
    return this.authCookie !== null;
  }

  /**
   * Make authenticated request
   */
  async authenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const headers = {
      ...options.headers,
      Cookie: this.getAuthCookie(),
    };

    return fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });
  }

  /**
   * Create a test user and login
   */
  async createAndLoginTestUser(email?: string, password?: string) {
    const testEmail = email || `test-${Date.now()}@example.com`;
    const testPassword = password || 'TestPass123!';

    try {
      await this.registerUser(testEmail, testPassword);
    } catch (error) {
      // User might already exist, try to login
    }

    return this.login(testEmail, testPassword);
  }

  /**
   * Clean up - logout and delete test user
   */
  async cleanup() {
    if (this.isAuthenticated()) {
      // TBD: Implement account deletion
      // await this.deleteAccount();
      await this.logout();
    }
  }
}

/**
 * Create a fresh auth helper for each test
 */
export function createAuthHelper(baseUrl?: string): AuthTestHelper {
  return new AuthTestHelper(baseUrl);
}

/**
 * Setup and teardown authenticated session for tests
 */
export async function withAuthenticatedUser<T>(
  callback: (helper: AuthTestHelper) => Promise<T>
): Promise<T> {
  const helper = createAuthHelper();

  try {
    await helper.createAndLoginTestUser();
    return await callback(helper);
  } finally {
    await helper.cleanup();
  }
}
