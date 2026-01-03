import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Context, Callback } from 'aws-lambda';

// Use vi.hoisted to create mocks that are available in the factory
const { mockSend, mockScanCommand } = vi.hoisted(() => {
  return {
    mockSend: vi.fn(),
    mockScanCommand: vi.fn(),
  };
});

vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: class MockDynamoDBClient {
    constructor() {}
  },
}));

vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: vi.fn(() => ({
      send: mockSend,
    })),
  },
  ScanCommand: class MockScanCommand {
    constructor(params: Record<string, unknown>) {
      mockScanCommand(params);
      Object.assign(this, params);
    }
  },
}));

// Mock fetch
global.fetch = vi.fn();

// Import handler after mocks are set up
import { handler } from './handler';

// Test event type
type TestEvent = {
  body?: string;
};

// Mock Context and Callback for testing
const createMockContext = (): Context => ({
  callbackWaitsForEmptyEventLoop: true,
  functionName: 'test-function',
  functionVersion: '1',
  invokedFunctionArn: 'arn:aws:lambda:us-east-2:123456789012:function:test-function',
  memoryLimitInMB: '128',
  awsRequestId: 'test-request-id',
  logGroupName: '/aws/lambda/test-function',
  logStreamName: '2024/01/01/[$LATEST]test',
  getRemainingTimeInMillis: () => 30000,
  done: () => {},
  fail: () => {},
  succeed: () => {},
});

const createMockCallback = (): Callback => vi.fn();

describe('FMP Proxy Lambda Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.FMPAPIKEY_TABLE_NAME = 'FmpApiKey-test-table';
    process.env.FMP_FALLBACK_API_KEY = '';
  });

  describe('DynamoDB Query Construction', () => {
    it('should use ExpressionAttributeNames to escape reserved keyword "owner"', async () => {
      // Arrange
      const event = {
        body: JSON.stringify({
          endpoint: '/api/v3/quote/AAPL',
          userId: 'user-123',
        }),
      };

      mockSend.mockResolvedValue({
        Items: [{
          id: 'key-1',
          apiKey: 'test-api-key',
          isActive: true,
          owner: 'user-123::user-123',
        }],
      });

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ symbol: 'AAPL' }),
        status: 200,
      } as Response);

      // Act
      await handler(event as TestEvent, createMockContext(), createMockCallback());

      // Assert - This would have caught the reserved keyword bug!
      expect(mockScanCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          FilterExpression: '#owner = :owner',
          ExpressionAttributeNames: {
            '#owner': 'owner',
          },
          ExpressionAttributeValues: {
            ':owner': 'user-123::user-123',
          },
        })
      );
    });

    it('should construct correct owner field format', async () => {
      // Arrange
      const event = {
        body: JSON.stringify({
          endpoint: '/api/v3/quote/AAPL',
          userId: 'abc-123-def',
        }),
      };

      mockSend.mockResolvedValue({ Items: [] });

      // Act
      await handler(event as TestEvent, createMockContext(), createMockCallback());

      // Assert
      expect(mockScanCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          ExpressionAttributeValues: {
            ':owner': 'abc-123-def::abc-123-def',
          },
        })
      );
    });

    it('should limit scan to 1 result for efficiency', async () => {
      // Arrange
      const event = {
        body: JSON.stringify({
          endpoint: '/api/v3/quote/AAPL',
          userId: 'user-123',
        }),
      };

      mockSend.mockResolvedValue({ Items: [] });

      // Act
      await handler(event as TestEvent, createMockContext(), createMockCallback());

      // Assert
      expect(mockScanCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Limit: 1,
        })
      );
    });
  });

  describe('API Key Lookup', () => {
    it('should use API key from DynamoDB when found and active', async () => {
      // Arrange
      const event = {
        body: JSON.stringify({
          endpoint: '/api/v3/quote/AAPL',
          userId: 'user-123',
        }),
      };

      const dbApiKey = 'dynamodb-api-key-12345';
      mockSend.mockResolvedValue({
        Items: [{
          id: 'key-1',
          apiKey: dbApiKey,
          isActive: true,
          owner: 'user-123::user-123',
        }],
      });

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ symbol: 'AAPL' }),
        status: 200,
      } as Response);

      // Act
      await handler(event as TestEvent, createMockContext(), createMockCallback());

      // Assert - Should use DynamoDB key, not fallback
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`apikey=${dbApiKey}`),
      );
    });

    it('should return error when no API key found and no fallback', async () => {
      // Arrange
      const event = {
        body: JSON.stringify({
          endpoint: '/api/v3/quote/AAPL',
          userId: 'user-123',
        }),
      };

      mockSend.mockResolvedValue({ Items: [] });

      // Act
      const result = await handler(event as TestEvent, createMockContext(), createMockCallback());

      // Assert
      expect(result).toEqual({
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'No API key configured. Please add your FMP API key in settings.' }),
      });
    });

    it('should not use inactive API key', async () => {
      // Arrange
      const event = {
        body: JSON.stringify({
          endpoint: '/api/v3/quote/AAPL',
          userId: 'user-123',
        }),
      };

      mockSend.mockResolvedValue({
        Items: [{
          id: 'key-1',
          apiKey: 'inactive-key',
          isActive: false,
          owner: 'user-123::user-123',
        }],
      });

      // Act
      const result = await handler(event as TestEvent, createMockContext(), createMockCallback());

      // Assert
      expect(result).toEqual({
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'No API key configured. Please add your FMP API key in settings.' }),
      });
    });

    it('should use fallback API key when DynamoDB query fails', async () => {
      // Arrange
      const fallbackKey = 'fallback-api-key';
      process.env.FMP_FALLBACK_API_KEY = fallbackKey;

      const event = {
        body: JSON.stringify({
          endpoint: '/api/v3/quote/AAPL',
          userId: 'user-123',
        }),
      };

      mockSend.mockRejectedValue(new Error('DynamoDB error'));

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ symbol: 'AAPL' }),
        status: 200,
      } as Response);

      // Act
      await handler(event as TestEvent, createMockContext(), createMockCallback());

      // Assert
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`apikey=${fallbackKey}`),
      );
    });
  });

  describe('FMP API Proxying', () => {
    it('should proxy request to FMP with correct URL and API key', async () => {
      // Arrange
      const event = {
        body: JSON.stringify({
          endpoint: '/api/v3/quote/AAPL',
          queryParams: { limit: '10' },
          userId: 'user-123',
        }),
      };

      mockSend.mockResolvedValue({
        Items: [{
          id: 'key-1',
          apiKey: 'test-key',
          isActive: true,
        }],
      });

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ symbol: 'AAPL', price: 150 }),
        status: 200,
      } as Response);

      // Act
      await handler(event as TestEvent, createMockContext(), createMockCallback());

      // Assert
      expect(fetch).toHaveBeenCalledWith(
        'https://financialmodelingprep.com/api/v3/quote/AAPL?limit=10&apikey=test-key'
      );
    });

    it('should return FMP response data', async () => {
      // Arrange
      const event = {
        body: JSON.stringify({
          endpoint: '/api/v3/quote/AAPL',
          userId: 'user-123',
        }),
      };

      const fmpResponse = { symbol: 'AAPL', price: 150.50 };

      mockSend.mockResolvedValue({
        Items: [{ id: 'key-1', apiKey: 'test-key', isActive: true }],
      });

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => fmpResponse,
        status: 200,
      } as Response);

      // Act
      const result = await handler(event as TestEvent, createMockContext(), createMockCallback());

      // Assert
      expect(result).toEqual({
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fmpResponse),
      });
    });

    it('should handle FMP API errors', async () => {
      // Arrange
      const event = {
        body: JSON.stringify({
          endpoint: '/api/v3/quote/INVALID',
          userId: 'user-123',
        }),
      };

      mockSend.mockResolvedValue({
        Items: [{ id: 'key-1', apiKey: 'test-key', isActive: true }],
      });

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Invalid symbol' }),
        status: 404,
      } as Response);

      // Act
      const result = await handler(event as TestEvent, createMockContext(), createMockCallback());

      // Assert
      expect(result.statusCode).toBe(404);
    });
  });

  describe('Error Handling', () => {
    it('should return 400 when endpoint is missing', async () => {
      // Arrange
      const event = {
        body: JSON.stringify({
          userId: 'user-123',
        }),
      };

      // Act
      const result = await handler(event as TestEvent, createMockContext(), createMockCallback());

      // Assert
      expect(result).toEqual({
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Endpoint is required' }),
      });
    });

    it('should return 500 when unexpected error occurs', async () => {
      // Arrange
      const event = {
        body: 'invalid-json',
      };

      // Act
      const result = await handler(event as TestEvent, createMockContext(), createMockCallback());

      // Assert
      expect(result).toEqual({
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Failed to proxy FMP API request' }),
      });
    });

    it('should handle missing event body', async () => {
      // Arrange
      const event = {};

      // Act
      const result = await handler(event as TestEvent, createMockContext(), createMockCallback());

      // Assert
      expect(result.statusCode).toBe(400);
    });

    it('should handle DynamoDB reserved keyword error gracefully', async () => {
      // Arrange
      const event = {
        body: JSON.stringify({
          endpoint: '/api/v3/quote/AAPL',
          userId: 'user-123',
        }),
      };

      // Simulate the reserved keyword error we encountered
      mockSend.mockRejectedValue({
        name: 'ValidationException',
        message: 'Invalid FilterExpression: Attribute name is a reserved keyword; reserved keyword: owner',
      });

      // Should fall back to empty key (no fallback set)
      // Act
      const result = await handler(event as TestEvent, createMockContext(), createMockCallback());

      // Assert - Should handle gracefully and return error
      expect(result.statusCode).toBe(403);
    });
  });

  describe('Query Parameter Handling', () => {
    it('should handle empty query parameters', async () => {
      // Arrange
      const event = {
        body: JSON.stringify({
          endpoint: '/api/v3/quote/AAPL',
          queryParams: {},
          userId: 'user-123',
        }),
      };

      mockSend.mockResolvedValue({
        Items: [{ id: 'key-1', apiKey: 'test-key', isActive: true }],
      });

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({}),
        status: 200,
      } as Response);

      // Act
      await handler(event as TestEvent, createMockContext(), createMockCallback());

      // Assert
      expect(fetch).toHaveBeenCalledWith(
        'https://financialmodelingprep.com/api/v3/quote/AAPL?apikey=test-key'
      );
    });

    it('should handle undefined query parameters', async () => {
      // Arrange
      const event = {
        body: JSON.stringify({
          endpoint: '/api/v3/quote/AAPL',
          userId: 'user-123',
        }),
      };

      mockSend.mockResolvedValue({
        Items: [{ id: 'key-1', apiKey: 'test-key', isActive: true }],
      });

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({}),
        status: 200,
      } as Response);

      // Act
      await handler(event as TestEvent, createMockContext(), createMockCallback());

      // Assert
      expect(fetch).toHaveBeenCalledWith(
        'https://financialmodelingprep.com/api/v3/quote/AAPL?apikey=test-key'
      );
    });

    it('should encode special characters in query parameters', async () => {
      // Arrange
      const event = {
        body: JSON.stringify({
          endpoint: '/api/v3/search',
          queryParams: {
            query: 'Apple Inc.',
            limit: '10',
          },
          userId: 'user-123',
        }),
      };

      mockSend.mockResolvedValue({
        Items: [{ id: 'key-1', apiKey: 'test-key', isActive: true }],
      });

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({}),
        status: 200,
      } as Response);

      // Act
      await handler(event as TestEvent, createMockContext(), createMockCallback());

      // Assert
      const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(calledUrl).toContain('query=Apple+Inc.');
      expect(calledUrl).toContain('limit=10');
    });
  });
});
