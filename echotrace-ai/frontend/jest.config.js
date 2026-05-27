const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

const customJestConfig = {
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^socket\\.io-client$': '<rootDir>/__mocks__/socket.io-client.js',
  },
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
    '**/__tests__/**/*.test.js',
  ],
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
};

module.exports = createJestConfig(customJestConfig);
