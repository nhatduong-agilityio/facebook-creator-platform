import { createDataSource } from '../config/database';

// Mock Clerk auth middleware for all E2E tests
// jest.mock('../src/middleware/clerk-auth.middleware', () => ({
//   clerkAuthMiddleware: jest.fn(async (req: any) => {
//     const header = req.headers['authorization'] ?? '';
//     // Format: "Bearer test-token-<userId>"
//     const match = header.match(/^Bearer test-token-(.+)$/);
//     if (!match) throw new Error('UNAUTHORIZED');
//     req.user = { id: match[1] };
//   }),
// }));

beforeEach(async () => {
  // Clear all tables in correct FK order before each test
  const entities = createDataSource().entityMetadatas;
  for (const entity of entities.reverse()) {
    const repo = createDataSource().getRepository(entity.name);
    await repo.query(
      `TRUNCATE TABLE "${entity.tableName}" RESTART IDENTITY CASCADE`
    );
  }
});
