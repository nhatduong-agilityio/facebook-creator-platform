import dotenv from 'dotenv';

dotenv.config({
  path: '.env.test'
});

// Global test setup — runs before every test file
jest.setTimeout(10000);
