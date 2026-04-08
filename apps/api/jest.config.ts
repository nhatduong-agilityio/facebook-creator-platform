import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.spec.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/main.ts',
    '!src/worker.ts',
    '!src/app.ts',
    '!src/load-env.ts',
    '!src/config/**',
    '!src/**/index.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/e2e/**',
    '!src/__tests__/**',
    '!src/modules/**/controller/**',
    '!src/modules/**/module/**',
    '!src/modules/**/repository/**',
    '!src/modules/**/entity/**',
    '!src/modules/**/providers/**',
    '!src/modules/jobs/**',
    '!src/modules/posts/media-storage.ts',
    '!src/shared/constants/**',
    '!src/modules/auth/lib/**'
  ],
  coverageThreshold: {
    global: { lines: 70, functions: 70 }
  },
  setupFiles: ['<rootDir>/src/__tests__/setup.ts']
};

export default config;
