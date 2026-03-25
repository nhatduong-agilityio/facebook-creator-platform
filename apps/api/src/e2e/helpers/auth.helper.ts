/**
 * Generate mock Bearer tokens for E2E tests.
 * The test setup.ts mocks clerkAuthMiddleware to parse these.
 *
 * Usage:
 *   const headers = authHeader('user-123');
 *   await request(app.server).get('/posts').set(headers).expect(200);
 */
export function mockClerkUserId(userId = 'test-user-id'): string {
  return `Bearer test-token-${userId}`;
}

export function authHeader(userId = 'test-user-id'): Record<string, string> {
  return { Authorization: mockClerkUserId(userId) };
}
