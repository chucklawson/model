import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock dependencies - create singleton mock client inside the factory
vi.mock('aws-amplify/data', async (_importOriginal) => {
  const { vi } = await import('vitest');

  // Create mock functions that will be reused
  const mockList = vi.fn();
  const mockCreate = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();

  // Store references globally so tests can access them
  (global as Record<string, unknown>).__mockFmpApiKeyModel = {
    list: mockList,
    create: mockCreate,
    update: mockUpdate,
    delete: mockDelete,
  };

  return {
    generateClient: vi.fn(() => ({
      models: {
        FmpApiKey: (global as Record<string, unknown>).__mockFmpApiKeyModel,
      },
    })),
  };
});

vi.mock('aws-amplify/auth', () => ({
  fetchAuthSession: vi.fn(),
}));

// Import mocked modules
import { fetchAuthSession } from 'aws-amplify/auth';
import { callFmpApi, getUserFmpApiKey, setUserFmpApiKey, deleteUserFmpApiKey } from './fmpApiClient';
import type { FmpApiClientOptions } from './fmpApiClient';

// Get reference to the mock that was created in the vi.mock factory
const mockAmplifyClient = (global as Record<string, unknown>).__mockFmpApiKeyModel;

describe('fmpApiClient', () => {
  let mockFetch: typeof global.fetch;

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Mock global fetch
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    // Set default environment variable to match actual AWS Lambda URL
    vi.stubEnv('VITE_FMP_PROXY_URL', 'https://qy2fvggpm4zwvqdg3x3sp23bx40llynx.lambda-url.us-east-2.on.aws/');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('callFmpApi', () => {
    const mockSession = {
      tokens: {
        idToken: {
          payload: {
            sub: 'user-123',
          },
          toString: () => 'mock-id-token',
        },
      },
    };

    it('should successfully call FMP API with valid parameters', async () => {
      // Arrange
      const options: FmpApiClientOptions = {
        endpoint: '/api/v3/profile/AAPL',
        queryParams: { apikey: 'test-key' },
      };

      const mockResponse = {
        symbol: 'AAPL',
        companyName: 'Apple Inc.',
      };

      vi.mocked(fetchAuthSession).mockResolvedValue(mockSession);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      const result = await callFmpApi(options);

      // Assert
      expect(fetchAuthSession).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith('https://qy2fvggpm4zwvqdg3x3sp23bx40llynx.lambda-url.us-east-2.on.aws/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-id-token',
        },
        body: JSON.stringify({
          endpoint: '/api/v3/profile/AAPL',
          queryParams: { apikey: 'test-key' },
          userId: 'user-123',
        }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should call FMP API with endpoint only (no query params)', async () => {
      // Arrange
      const options: FmpApiClientOptions = {
        endpoint: '/api/v3/profile/AAPL',
      };

      const mockResponse = { data: 'test' };

      vi.mocked(fetchAuthSession).mockResolvedValue(mockSession);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      const result = await callFmpApi(options);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('https://qy2fvggpm4zwvqdg3x3sp23bx40llynx.lambda-url.us-east-2.on.aws/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-id-token',
        },
        body: JSON.stringify({
          endpoint: '/api/v3/profile/AAPL',
          queryParams: {},
          userId: 'user-123',
        }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when FMP_PROXY_URL is not configured', async () => {
      // Arrange
      vi.stubEnv('VITE_FMP_PROXY_URL', '');

      const options: FmpApiClientOptions = {
        endpoint: '/api/v3/profile/AAPL',
      };

      // Act & Assert
      await expect(callFmpApi(options)).rejects.toThrow('FMP Proxy URL not configured');
      expect(fetchAuthSession).not.toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should throw error when user is not authenticated', async () => {
      // Arrange
      const options: FmpApiClientOptions = {
        endpoint: '/api/v3/profile/AAPL',
      };

      vi.mocked(fetchAuthSession).mockResolvedValue({
        tokens: {
          idToken: {
            payload: {},
            toString: () => 'mock-id-token',
          },
        },
      } as any);

      // Act & Assert
      await expect(callFmpApi(options)).rejects.toThrow('User not authenticated');
      expect(fetchAuthSession).toHaveBeenCalledTimes(1);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should throw error when userId is missing from token', async () => {
      // Arrange
      const options: FmpApiClientOptions = {
        endpoint: '/api/v3/profile/AAPL',
      };

      vi.mocked(fetchAuthSession).mockResolvedValue({
        tokens: {
          idToken: {
            payload: {
              sub: undefined,
            },
            toString: () => 'mock-id-token',
          },
        },
      } as any);

      // Act & Assert
      await expect(callFmpApi(options)).rejects.toThrow('User not authenticated');
    });

    it('should throw error when session tokens are missing', async () => {
      // Arrange
      const options: FmpApiClientOptions = {
        endpoint: '/api/v3/profile/AAPL',
      };

      vi.mocked(fetchAuthSession).mockResolvedValue({
        tokens: undefined,
      } as any);

      // Act & Assert
      await expect(callFmpApi(options)).rejects.toThrow('User not authenticated');
    });

    it('should handle API error response with error message', async () => {
      // Arrange
      const options: FmpApiClientOptions = {
        endpoint: '/api/v3/profile/AAPL',
      };

      const errorResponse = {
        error: 'Invalid API key',
      };

      vi.mocked(fetchAuthSession).mockResolvedValue(mockSession);
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => errorResponse,
      });

      // Act & Assert
      await expect(callFmpApi(options)).rejects.toThrow('Invalid API key');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle API error response without specific error message', async () => {
      // Arrange
      const options: FmpApiClientOptions = {
        endpoint: '/api/v3/profile/AAPL',
      };

      vi.mocked(fetchAuthSession).mockResolvedValue(mockSession);
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({}),
      });

      // Act & Assert
      await expect(callFmpApi(options)).rejects.toThrow('API request failed');
    });

    it('should handle network errors', async () => {
      // Arrange
      const options: FmpApiClientOptions = {
        endpoint: '/api/v3/profile/AAPL',
      };

      vi.mocked(fetchAuthSession).mockResolvedValue(mockSession);
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(callFmpApi(options)).rejects.toThrow('Network error');
    });

    it('should handle auth session fetch errors', async () => {
      // Arrange
      const options: FmpApiClientOptions = {
        endpoint: '/api/v3/profile/AAPL',
      };

      vi.mocked(fetchAuthSession).mockRejectedValue(new Error('Auth session error'));

      // Act & Assert
      await expect(callFmpApi(options)).rejects.toThrow('Auth session error');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle JSON parsing errors in error responses', async () => {
      // Arrange
      const options: FmpApiClientOptions = {
        endpoint: '/api/v3/profile/AAPL',
      };

      vi.mocked(fetchAuthSession).mockResolvedValue(mockSession);
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      // Act & Assert
      await expect(callFmpApi(options)).rejects.toThrow('Invalid JSON');
    });

    it('should handle JSON parsing errors in success responses', async () => {
      // Arrange
      const options: FmpApiClientOptions = {
        endpoint: '/api/v3/profile/AAPL',
      };

      vi.mocked(fetchAuthSession).mockResolvedValue(mockSession);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON response');
        },
      });

      // Act & Assert
      await expect(callFmpApi(options)).rejects.toThrow('Invalid JSON response');
    });

    it('should handle empty response body', async () => {
      // Arrange
      const options: FmpApiClientOptions = {
        endpoint: '/api/v3/profile/AAPL',
      };

      vi.mocked(fetchAuthSession).mockResolvedValue(mockSession);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => null,
      });

      // Act
      const result = await callFmpApi(options);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle array responses', async () => {
      // Arrange
      const options: FmpApiClientOptions = {
        endpoint: '/api/v3/historical-price-full/AAPL',
      };

      const mockArrayResponse = [
        { date: '2024-01-01', close: 150 },
        { date: '2024-01-02', close: 155 },
      ];

      vi.mocked(fetchAuthSession).mockResolvedValue(mockSession);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockArrayResponse,
      });

      // Act
      const result = await callFmpApi<typeof mockArrayResponse>(options);

      // Assert
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(result).toEqual(mockArrayResponse);
    });

    it('should handle complex query parameters', async () => {
      // Arrange
      const options: FmpApiClientOptions = {
        endpoint: '/api/v3/historical-price-full/AAPL',
        queryParams: {
          from: '2024-01-01',
          to: '2024-12-31',
          apikey: 'test-key',
          serietype: 'line',
        },
      };

      vi.mocked(fetchAuthSession).mockResolvedValue(mockSession);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test' }),
      });

      // Act
      await callFmpApi(options);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('https://qy2fvggpm4zwvqdg3x3sp23bx40llynx.lambda-url.us-east-2.on.aws/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-id-token',
        },
        body: JSON.stringify({
          endpoint: '/api/v3/historical-price-full/AAPL',
          queryParams: {
            from: '2024-01-01',
            to: '2024-12-31',
            apikey: 'test-key',
            serietype: 'line',
          },
          userId: 'user-123',
        }),
      });
    });

    it('should use correct authorization header format', async () => {
      // Arrange
      const options: FmpApiClientOptions = {
        endpoint: '/api/v3/profile/AAPL',
      };

      const customToken = 'custom-jwt-token-12345';
      vi.mocked(fetchAuthSession).mockResolvedValue({
        tokens: {
          idToken: {
            payload: { sub: 'user-123' },
            toString: () => customToken,
          },
        },
      } as any);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test' }),
      });

      // Act
      await callFmpApi(options);

      // Assert
      const fetchCall = mockFetch.mock.calls[0];
      expect(fetchCall[1].headers.Authorization).toBe(`Bearer ${customToken}`);
    });
  });

  describe('getUserFmpApiKey', () => {
    it('should return first API key when data exists', async () => {
      // Arrange
      const mockApiKey = {
        id: 'key-123',
        apiKey: 'test-api-key',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockAmplifyClient.list.mockResolvedValue({
        data: [mockApiKey],
      });

      // Act
      const result = await getUserFmpApiKey();

      // Assert
      expect(mockAmplifyClient.list).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockApiKey);
    });

    it('should return null when no API keys exist', async () => {
      // Arrange
      mockAmplifyClient.list.mockResolvedValue({
        data: [],
      });

      // Act
      const result = await getUserFmpApiKey();

      // Assert
      expect(mockAmplifyClient.list).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });

    it('should return null when data is null', async () => {
      // Arrange
      mockAmplifyClient.list.mockResolvedValue({
        data: null,
      });

      // Act
      const result = await getUserFmpApiKey();

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when data is undefined', async () => {
      // Arrange
      mockAmplifyClient.list.mockResolvedValue({
        data: undefined,
      });

      // Act
      const result = await getUserFmpApiKey();

      // Assert
      expect(result).toBeNull();
    });

    it('should return first key when multiple keys exist', async () => {
      // Arrange
      const mockKeys = [
        { id: 'key-1', apiKey: 'first-key', isActive: true },
        { id: 'key-2', apiKey: 'second-key', isActive: false },
      ];

      mockAmplifyClient.list.mockResolvedValue({
        data: mockKeys,
      });

      // Act
      const result = await getUserFmpApiKey();

      // Assert
      expect(result).toEqual(mockKeys[0]);
    });

    it('should handle list operation errors', async () => {
      // Arrange
      mockAmplifyClient.list.mockRejectedValue(
        new Error('Database connection error')
      );

      // Act & Assert
      await expect(getUserFmpApiKey()).rejects.toThrow('Database connection error');
    });
  });

  describe('setUserFmpApiKey', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should create new API key when none exists', async () => {
      // Arrange
      const newApiKey = 'new-test-api-key';
      const mockCreatedKey = {
        id: 'key-new',
        apiKey: newApiKey,
        isActive: true,
        createdAt: '2024-01-15T12:00:00.000Z',
        updatedAt: '2024-01-15T12:00:00.000Z',
      };

      mockAmplifyClient.list.mockResolvedValue({
        data: [],
      });

      mockAmplifyClient.create.mockResolvedValue({
        data: mockCreatedKey,
      });

      // Act
      const result = await setUserFmpApiKey(newApiKey);

      // Assert
      expect(mockAmplifyClient.list).toHaveBeenCalledTimes(1);
      expect(mockAmplifyClient.create).toHaveBeenCalledTimes(1);
      expect(mockAmplifyClient.create).toHaveBeenCalledWith({
        apiKey: newApiKey,
        isActive: true,
        createdAt: '2024-01-15T12:00:00.000Z',
        updatedAt: '2024-01-15T12:00:00.000Z',
      });
      expect(mockAmplifyClient.update).not.toHaveBeenCalled();
      expect(result).toEqual({ data: mockCreatedKey });
    });

    it('should update existing API key when one exists', async () => {
      // Arrange
      const existingKey = {
        id: 'key-existing',
        apiKey: 'old-api-key',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const updatedApiKey = 'updated-api-key';
      const mockUpdatedKey = {
        ...existingKey,
        apiKey: updatedApiKey,
        updatedAt: '2024-01-15T12:00:00.000Z',
      };

      mockAmplifyClient.list.mockResolvedValue({
        data: [existingKey],
      });

      mockAmplifyClient.update.mockResolvedValue({
        data: mockUpdatedKey,
      });

      // Act
      const result = await setUserFmpApiKey(updatedApiKey);

      // Assert
      expect(mockAmplifyClient.list).toHaveBeenCalledTimes(1);
      expect(mockAmplifyClient.update).toHaveBeenCalledTimes(1);
      expect(mockAmplifyClient.update).toHaveBeenCalledWith({
        id: 'key-existing',
        apiKey: updatedApiKey,
        isActive: true,
        updatedAt: '2024-01-15T12:00:00.000Z',
      });
      expect(mockAmplifyClient.create).not.toHaveBeenCalled();
      expect(result).toEqual({ data: mockUpdatedKey });
    });

    it('should set isActive to true when updating', async () => {
      // Arrange
      const existingKey = {
        id: 'key-123',
        apiKey: 'old-key',
        isActive: false,
      };

      mockAmplifyClient.list.mockResolvedValue({
        data: [existingKey],
      });

      mockAmplifyClient.update.mockResolvedValue({
        data: { ...existingKey, isActive: true },
      });

      // Act
      await setUserFmpApiKey('new-key');

      // Assert
      expect(mockAmplifyClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: true,
        })
      );
    });

    it('should handle empty string API key', async () => {
      // Arrange
      mockAmplifyClient.list.mockResolvedValue({
        data: [],
      });

      mockAmplifyClient.create.mockResolvedValue({
        data: { apiKey: '' },
      });

      // Act
      await setUserFmpApiKey('');

      // Assert
      expect(mockAmplifyClient.create).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: '',
        })
      );
    });

    it('should handle database errors during list operation', async () => {
      // Arrange
      mockAmplifyClient.list.mockRejectedValue(
        new Error('List operation failed')
      );

      // Act & Assert
      await expect(setUserFmpApiKey('test-key')).rejects.toThrow('List operation failed');
    });

    it('should handle database errors during create operation', async () => {
      // Arrange
      mockAmplifyClient.list.mockResolvedValue({
        data: [],
      });

      mockAmplifyClient.create.mockRejectedValue(
        new Error('Create operation failed')
      );

      // Act & Assert
      await expect(setUserFmpApiKey('test-key')).rejects.toThrow('Create operation failed');
    });

    it('should handle database errors during update operation', async () => {
      // Arrange
      mockAmplifyClient.list.mockResolvedValue({
        data: [{ id: 'key-123', apiKey: 'old-key' }],
      });

      mockAmplifyClient.update.mockRejectedValue(
        new Error('Update operation failed')
      );

      // Act & Assert
      await expect(setUserFmpApiKey('test-key')).rejects.toThrow('Update operation failed');
    });

    it('should use ISO string format for timestamps', async () => {
      // Arrange
      mockAmplifyClient.list.mockResolvedValue({
        data: [],
      });

      mockAmplifyClient.create.mockResolvedValue({
        data: {},
      });

      // Act
      await setUserFmpApiKey('test-key');

      // Assert
      const createCall = mockAmplifyClient.create.mock.calls[0][0];
      expect(createCall.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(createCall.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('deleteUserFmpApiKey', () => {
    it('should delete existing API key', async () => {
      // Arrange
      const existingKey = {
        id: 'key-123',
        apiKey: 'test-key',
        isActive: true,
      };

      mockAmplifyClient.list.mockResolvedValue({
        data: [existingKey],
      });

      mockAmplifyClient.delete.mockResolvedValue({
        data: existingKey,
      });

      // Act
      const result = await deleteUserFmpApiKey();

      // Assert
      expect(mockAmplifyClient.list).toHaveBeenCalledTimes(1);
      expect(mockAmplifyClient.delete).toHaveBeenCalledTimes(1);
      expect(mockAmplifyClient.delete).toHaveBeenCalledWith({
        id: 'key-123',
      });
      expect(result).toEqual({ data: existingKey });
    });

    it('should not attempt delete when no API key exists', async () => {
      // Arrange
      mockAmplifyClient.list.mockResolvedValue({
        data: [],
      });

      // Act
      const result = await deleteUserFmpApiKey();

      // Assert
      expect(mockAmplifyClient.list).toHaveBeenCalledTimes(1);
      expect(mockAmplifyClient.delete).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('should not attempt delete when data is null', async () => {
      // Arrange
      mockAmplifyClient.list.mockResolvedValue({
        data: null,
      });

      // Act
      const result = await deleteUserFmpApiKey();

      // Assert
      expect(mockAmplifyClient.delete).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('should delete first key when multiple exist', async () => {
      // Arrange
      const mockKeys = [
        { id: 'key-1', apiKey: 'first-key' },
        { id: 'key-2', apiKey: 'second-key' },
      ];

      mockAmplifyClient.list.mockResolvedValue({
        data: mockKeys,
      });

      mockAmplifyClient.delete.mockResolvedValue({
        data: mockKeys[0],
      });

      // Act
      await deleteUserFmpApiKey();

      // Assert
      expect(mockAmplifyClient.delete).toHaveBeenCalledWith({
        id: 'key-1',
      });
    });

    it('should handle database errors during list operation', async () => {
      // Arrange
      mockAmplifyClient.list.mockRejectedValue(
        new Error('Database error')
      );

      // Act & Assert
      await expect(deleteUserFmpApiKey()).rejects.toThrow('Database error');
    });

    it('should handle database errors during delete operation', async () => {
      // Arrange
      mockAmplifyClient.list.mockResolvedValue({
        data: [{ id: 'key-123', apiKey: 'test-key' }],
      });

      mockAmplifyClient.delete.mockRejectedValue(
        new Error('Delete operation failed')
      );

      // Act & Assert
      await expect(deleteUserFmpApiKey()).rejects.toThrow('Delete operation failed');
    });
  });

  describe('Edge Cases and Integration', () => {
    it('should handle rapid successive API calls', async () => {
      // Arrange
      const options: FmpApiClientOptions = {
        endpoint: '/api/v3/profile/AAPL',
      };

      const mockSession = {
        tokens: {
          idToken: {
            payload: { sub: 'user-123' },
            toString: () => 'mock-token',
          },
        },
      };

      vi.mocked(fetchAuthSession).mockResolvedValue(mockSession);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test' }),
      });

      // Act
      const promises = [
        callFmpApi(options),
        callFmpApi(options),
        callFmpApi(options),
      ];

      const results = await Promise.all(promises);

      // Assert
      expect(results).toHaveLength(3);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should handle special characters in endpoint and query params', async () => {
      // Arrange
      const options: FmpApiClientOptions = {
        endpoint: '/api/v3/search?query=test&limit=10',
        queryParams: {
          'company-name': 'Test & Co.',
          symbols: 'AAPL,MSFT',
        },
      };

      const mockSession = {
        tokens: {
          idToken: {
            payload: { sub: 'user-123' },
            toString: () => 'mock-token',
          },
        },
      };

      vi.mocked(fetchAuthSession).mockResolvedValue(mockSession);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test' }),
      });

      // Act
      await callFmpApi(options);

      // Assert
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.queryParams['company-name']).toBe('Test & Co.');
      expect(callBody.queryParams.symbols).toBe('AAPL,MSFT');
    });

    it('should maintain type safety with generic type parameter', async () => {
      // Arrange
      interface CustomResponse {
        symbol: string;
        price: number;
      }

      const options: FmpApiClientOptions = {
        endpoint: '/api/v3/quote/AAPL',
      };

      const mockResponse: CustomResponse = {
        symbol: 'AAPL',
        price: 150.5,
      };

      const mockSession = {
        tokens: {
          idToken: {
            payload: { sub: 'user-123' },
            toString: () => 'mock-token',
          },
        },
      };

      vi.mocked(fetchAuthSession).mockResolvedValue(mockSession);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      const result = await callFmpApi<CustomResponse>(options);

      // Assert
      expect(result.symbol).toBe('AAPL');
      expect(result.price).toBe(150.5);
    });

    it('should handle large response payloads', async () => {
      // Arrange
      const options: FmpApiClientOptions = {
        endpoint: '/api/v3/historical-price-full/AAPL',
      };

      // Create large dataset
      const largeResponse = Array.from({ length: 1000 }, (_, i) => ({
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        close: 150 + Math.random() * 10,
      }));

      const mockSession = {
        tokens: {
          idToken: {
            payload: { sub: 'user-123' },
            toString: () => 'mock-token',
          },
        },
      };

      vi.mocked(fetchAuthSession).mockResolvedValue(mockSession);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => largeResponse,
      });

      // Act
      const result = await callFmpApi(options);

      // Assert
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1000);
    });
  });
});
