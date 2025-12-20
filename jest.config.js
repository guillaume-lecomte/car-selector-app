/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  transformIgnorePatterns: [
    'node_modules/(?!(@faker-js)/)',
  ],
  
  extensionsToTreatAsEsm: ['.ts'],
  
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        target: 'ES2020',
        lib: ['ES2020'],
        module: 'ESNext',
        moduleResolution: 'bundler',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        isolatedModules: true,
        skipLibCheck: true,
      },
      useESM: false,
    }]
  },
  
  collectCoverageFrom: [
    'src/lib/db/queries/**/*.ts',
    'src/app/api/**/*.ts',
    '!src/lib/db/queries/**/*.test.ts',
    '!src/app/api/**/*.test.ts',
    '!src/lib/db/schema.ts',
    '!src/lib/db/seed.ts',
    '!**/*.d.ts',
  ],
  
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  testTimeout: 15000,
  maxWorkers: '50%',
  
  verbose: true,
  bail: false,
};

module.exports = config;
