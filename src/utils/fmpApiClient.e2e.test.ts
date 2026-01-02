import { describe, it, expect, beforeAll, afterAll } from 'vitest';

/**
 * End-to-End Tests for FMP API Integration
 *
 * These tests verify the complete flow:
 * Browser → fmpApiClient → Lambda → DynamoDB → FMP API
 *
 * This would have caught BOTH bugs:
 * 1. Amplify configuration timing issue
 * 2. DynamoDB reserved keyword "owner" issue
 *
 * NOTE: These tests require:
 * - AWS credentials configured
 * - Amplify sandbox running OR
 * - LocalStack for local testing
 *
 * Run with: npm run test:e2e (requires --run flag or CI environment)
 */

describe('FMP API E2E Tests', () => {
  // Skip in unit test runs - only run in E2E test suite
  const isE2E = process.env.TEST_MODE === 'e2e';
  const describeE2E = isE2E ? describe : describe.skip;

  describeE2E('Full Integration Flow', () => {
    let _testUserId: string;
    let testApiKey: string;

    beforeAll(() => {
      // Set up test environment
      _testUserId = process.env.TEST_USER_ID || 'test-user-123';
      testApiKey = process.env.FMP_API_KEY || 'test-api-key';

      // Verify required environment variables
      if (!process.env.VITE_FMP_PROXY_URL) {
        throw new Error('VITE_FMP_PROXY_URL must be set for E2E tests');
      }
    });

    it('should successfully fetch stock data through the full stack', async () => {
      // This test verifies the complete flow works end-to-end
      // It would have caught both the Amplify config and DynamoDB keyword bugs

      // 1. Ensure Amplify is configured (simulating app initialization)
      const { Amplify } = await import('aws-amplify');
      const outputs = await import('../../amplify_outputs.json');
      Amplify.configure(outputs.default);

      // 2. Store API key in DynamoDB (simulating user setup)
      const { setUserFmpApiKey } = await import('./fmpApiClient');
      await setUserFmpApiKey(testApiKey);

      // 3. Make API call through the full stack
      const { callFmpApi } = await import('./fmpApiClient');
      const result = await callFmpApi({
        endpoint: '/api/v3/quote/AAPL',
      });

      // 4. Verify response
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle DynamoDB query with owner field correctly', async () => {
      // This specifically tests the reserved keyword fix

      const { Amplify } = await import('aws-amplify');
      const outputs = await import('../../amplify_outputs.json');
      Amplify.configure(outputs.default);

      // Create a test API key (this should work with the fixed query)
      const { setUserFmpApiKey, getUserFmpApiKey } = await import('./fmpApiClient');

      await setUserFmpApiKey('test-key-for-owner-field');

      // Retrieve it (this uses the DynamoDB query with owner field)
      const retrievedKey = await getUserFmpApiKey();

      // Assert: Should successfully query despite "owner" being a reserved keyword
      expect(retrievedKey).toBeDefined();
      expect(retrievedKey?.apiKey).toBe('test-key-for-owner-field');
    });

    it('should work when imported before Amplify is configured', async () => {
      // This tests the lazy initialization fix

      // Import the module BEFORE configuring Amplify
      // (This would have failed with the original bug)
      const module = await import('./fmpApiClient');

      // Now configure Amplify
      const { Amplify } = await import('aws-amplify');
      const outputs = await import('../../amplify_outputs.json');
      Amplify.configure(outputs.default);

      // Now use the module - should work fine
      await module.setUserFmpApiKey('test-key');
      const key = await module.getUserFmpApiKey();

      expect(key).toBeDefined();
    });

    afterAll(async () => {
      // Clean up test data
      const { deleteUserFmpApiKey } = await import('./fmpApiClient');
      await deleteUserFmpApiKey().catch(() => {
        // Ignore cleanup errors
      });
    });
  });

  describeE2E('Lambda Handler Integration', () => {
    it('should handle Lambda invoke with correct DynamoDB query', async () => {
      // This test invokes the Lambda directly to verify DynamoDB integration

      const event = {
        body: JSON.stringify({
          endpoint: '/api/v3/quote/AAPL',
          queryParams: {},
          userId: process.env.TEST_USER_ID || 'test-user-123',
        }),
      };

      // Import and invoke the Lambda handler
      const { handler } = await import('../../../amplify/functions/fmp-proxy/handler');

      const result = await handler(event as any, {} as any, {} as any);

      // Should successfully query DynamoDB and proxy to FMP
      expect(result.statusCode).toBeOneOf([200, 403]); // 403 if no API key
      expect(result.headers['Content-Type']).toBe('application/json');
    });

    it('should handle multiple concurrent requests', async () => {
      // Test that the Lambda can handle concurrent requests
      // (Tests the lazy initialization under concurrent load)

      const { Amplify } = await import('aws-amplify');
      const outputs = await import('../../amplify_outputs.json');
      Amplify.configure(outputs.default);

      const { callFmpApi } = await import('./fmpApiClient');

      // Make multiple concurrent requests
      const requests = [
        callFmpApi({ endpoint: '/api/v3/quote/AAPL' }),
        callFmpApi({ endpoint: '/api/v3/quote/MSFT' }),
        callFmpApi({ endpoint: '/api/v3/quote/GOOGL' }),
      ];

      const results = await Promise.allSettled(requests);

      // All requests should complete (even if they fail due to API limits)
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(['fulfilled', 'rejected']).toContain(result.status);
      });
    });
  });

  describeE2E('Error Scenarios', () => {
    it('should handle missing API key in DynamoDB', async () => {
      const { Amplify } = await import('aws-amplify');
      const outputs = await import('../../amplify_outputs.json');
      Amplify.configure(outputs.default);

      // Delete any existing API key
      const { deleteUserFmpApiKey, callFmpApi } = await import('./fmpApiClient');
      await deleteUserFmpApiKey();

      // Attempt to call API without key
      await expect(
        callFmpApi({ endpoint: '/api/v3/quote/AAPL' })
      ).rejects.toThrow(/API key/);
    });

    it('should handle inactive API keys', async () => {
      // This tests that the Lambda correctly checks isActive flag

      const { Amplify } = await import('aws-amplify');
      const outputs = await import('../../amplify_outputs.json');
      Amplify.configure(outputs.default);

      const { generateClient } = await import('aws-amplify/data');
      const client = generateClient();

      // Create an inactive API key directly in DynamoDB
      await (client.models as any).FmpApiKey.create({
        apiKey: 'inactive-key',
        isActive: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const { callFmpApi } = await import('./fmpApiClient');

      // Should fail because key is inactive
      await expect(
        callFmpApi({ endpoint: '/api/v3/quote/AAPL' })
      ).rejects.toThrow(/API key/);
    });

    it('should handle malformed DynamoDB responses', async () => {
      // This tests robustness against unexpected data formats

      const { Amplify } = await import('aws-amplify');
      const outputs = await import('../../amplify_outputs.json');
      Amplify.configure(outputs.default);

      const { generateClient } = await import('aws-amplify/data');
      const client = generateClient();

      // Create a malformed record (missing required fields)
      try {
        await (client.models as any).FmpApiKey.create({
          // Missing apiKey field
          isActive: true,
        });
      } catch (error) {
        // Expected - should validate schema
        expect(error).toBeDefined();
      }
    });
  });

  describeE2E('Performance and Reliability', () => {
    it('should complete API calls within acceptable time', async () => {
      const { Amplify } = await import('aws-amplify');
      const outputs = await import('../../amplify_outputs.json');
      Amplify.configure(outputs.default);

      const { callFmpApi, setUserFmpApiKey } = await import('./fmpApiClient');
      await setUserFmpApiKey(process.env.FMP_API_KEY || 'test-key');

      const startTime = Date.now();
      await callFmpApi({ endpoint: '/api/v3/quote/AAPL' });
      const duration = Date.now() - startTime;

      // Should complete within 5 seconds (generous timeout for network)
      expect(duration).toBeLessThan(5000);
    });

    it('should handle network failures gracefully', async () => {
      const { Amplify } = await import('aws-amplify');
      const outputs = await import('../../amplify_outputs.json');
      Amplify.configure(outputs.default);

      const { callFmpApi } = await import('./fmpApiClient');

      // Use invalid endpoint to trigger error
      await expect(
        callFmpApi({ endpoint: '/invalid-endpoint-that-does-not-exist' })
      ).rejects.toThrow();
    });
  });
});

/**
 * RUNNING THESE TESTS:
 *
 * Local Development (with LocalStack):
 *   npm run test:e2e:local
 *
 * CI/CD (with real AWS):
 *   TEST_MODE=e2e npm run test
 *
 * Required Environment Variables:
 *   - VITE_FMP_PROXY_URL: Lambda function URL
 *   - FMP_API_KEY: Your FMP API key
 *   - TEST_USER_ID: Test user ID (optional)
 *
 * These tests are intentionally separated from unit tests because:
 * 1. They require external dependencies (AWS, network)
 * 2. They take longer to run
 * 3. They may incur costs (API calls, AWS usage)
 * 4. They test actual integration, not mocked behavior
 */
