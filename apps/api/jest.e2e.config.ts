import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/e2e'],
  testMatch: ['**/*.e2e.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  globalSetup: '<rootDir>/src/e2e/global-setup.ts',
  globalTeardown: '<rootDir>/src/e2e/global-teardown.ts',
  setupFilesAfterEnv: ['<rootDir>/src/e2e/setup.ts']
};

export default config;
