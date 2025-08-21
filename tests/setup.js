/**
 * Jest setup file for Gemini integration tests
 * Configures global test environment and mocks
 */

// Set test timeout for async operations
jest.setTimeout(30000);

// Mock environment variables
process.env.GEMINI_API_KEY = 'test-gemini-api-key';
process.env.OPENAI_APIKEY = 'test-openai-api-key';

// Global test utilities
global.createMockContext = () => ({
  log: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
});

// Global constants for testing
global.MOCK_TIMEOUT_ERROR = {
  message: 'The operation was aborted due to timeout',
  code: 'ECONNABORTED',
  response: {
    status: 408,
    statusText: 'Request Timeout'
  }
};

global.MOCK_CONTROL_CHARACTERS = {
  NULL: '\u0000',
  BACKSPACE: '\u0008', 
  FORM_FEED: '\u000C',
  DELETE: '\u007F'
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

console.log('🧪 Gemini Integration Test Suite - BOT-6453');
console.log('Testing timeout and JSON parsing issues with Gemini LLM integration'); 