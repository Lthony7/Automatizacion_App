/*
 * Jest Configuration - Content Automation Platform FASE 1
 * Minimal configuration for unit and integration tests
*/

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: { module: 'commonjs', target: 'es2021', esModuleInterop: true, emitDecoratorMetadata: true, experimentalDecorators: true, strict: false, strictPropertyInitialization: false, skipLibCheck: true, resolveJsonModule: true, baseUrl: '.', types: ['node', 'jest'], paths: { 'domain-contracts': ['packages/domain-contracts/src/index.ts'], 'domain-contracts/*': ['packages/domain-contracts/src/*'] } } }],
  },
  collectCoverageFrom: [
    'apps/api/src/**/*.ts',
    'packages/**/*.ts',
    '!apps/api/src/**/*.spec.ts',
    '!apps/api/src/**/*.e2e-test.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testMatch: [
    '<rootDir>/apps/api/test/**/*.spec.ts',
    '<rootDir>/apps/api/test/**/*.e2e-test.ts',
  ],
  moduleNameMapper: {
    '^domain-contracts$': '<rootDir>/packages/domain-contracts/src/index.ts',
    '^domain-contracts/(.*)$': '<rootDir>/packages/domain-contracts/src/$1',
    '^@/(.*)$': '<rootDir>/apps/api/src/$1',
    '^@shared/(.*)$': '<rootDir>/packages/shared/src/$1',
    '^@domain/(.*)$': '<rootDir>/packages/domain-contracts/src/$1',
    '^@database/(.*)$': '<rootDir>/packages/database/src/$1',
    '^@config/(.*)$': '<rootDir>/packages/config/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/apps/api/test/setup.ts'],
};
