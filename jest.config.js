module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/index.ts",
    "!src/**/*.test.ts",
    "!src/**/*.spec.ts",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  globalSetup: "<rootDir>/src/tests/globalSetup.ts",
  globalTeardown: "<rootDir>/src/tests/globalTeardown.ts",
  testTimeout: 20000, // Increased for async worker thread processing
  // Define NODE_ENV=test for all tests
  setupFiles: ["<rootDir>/src/tests/env-setup.ts"],
  // Force Jest to exit after tests complete
  forceExit: true,
  // Detect open handles to help debugging
  detectOpenHandles: true,
};
