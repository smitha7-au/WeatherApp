// jest.config.js
module.exports = {
  // Tells Jest to use a browser-like environment
  testEnvironment: 'jsdom',

  // might need these if you're using ES Modules with Babel:
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  // If your test files are in a specific folder, you might need:
  // testMatch: ['<rootDir>/js/**/*.test.js'],
  // moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'node'],

  // Setup for jest-fetch-mock
  setupFilesAfterEnv: ['jest-fetch-mock'],
};