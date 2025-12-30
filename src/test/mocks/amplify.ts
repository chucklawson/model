import { vi } from 'vitest';

// Mock AWS Amplify generateClient
export const mockGenerateClient = vi.fn(() => ({
  models: {
    TickerLot: {
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      observeQuery: vi.fn(() => ({
        subscribe: vi.fn(() => ({
          unsubscribe: vi.fn(),
        })),
      })),
    },
    Ticker: {
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      observeQuery: vi.fn(() => ({
        subscribe: vi.fn(() => ({
          unsubscribe: vi.fn(),
        })),
      })),
    },
    Portfolio: {
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      observeQuery: vi.fn(() => ({
        subscribe: vi.fn(() => ({
          unsubscribe: vi.fn(),
        })),
      })),
    },
  },
}));

// Mock module
vi.mock('aws-amplify/data', () => ({
  generateClient: mockGenerateClient,
}));

// Mock Amplify configuration
vi.mock('aws-amplify', () => ({
  Amplify: {
    configure: vi.fn(),
  },
}));
