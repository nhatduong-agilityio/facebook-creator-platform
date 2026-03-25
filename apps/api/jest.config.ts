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
    '!src/config/**',
    '!src/**/index.ts'
  ],
  coverageThreshold: {
    global: { lines: 70, functions: 70 }
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts']
};

export default config;
