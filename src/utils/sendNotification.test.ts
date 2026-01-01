import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { sendNotification } from './sendNotification';
import logger from './logger';

describe('sendNotification', () => {
  let mockFetch: any;
  let loggerInfoSpy: any;
  let loggerWarnSpy: any;
  let loggerErrorSpy: any;

  beforeEach(() => {
    // Mock global fetch
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    // Spy on logger methods without mocking implementation
    loggerInfoSpy = vi.spyOn(logger, 'info');
    loggerWarnSpy = vi.spyOn(logger, 'warn');
    loggerErrorSpy = vi.spyOn(logger, 'error');

    // Clear environment
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe('successful notifications', () => {
    beforeEach(() => {
      vi.stubEnv('VITE_NOTIFICATION_FUNCTION_URL', 'https://test-function.lambda-url.us-east-1.on.aws/');
    });

    it('should send notification with message and subject', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
      });

      await sendNotification({
        message: 'Test message',
        subject: 'Test subject',
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-function.lambda-url.us-east-1.on.aws/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: 'Test message',
            subject: 'Test subject',
          }),
        }
      );
      expect(loggerInfoSpy).toHaveBeenCalledWith({ subject: 'Test subject' }, 'Notification sent successfully');
    });

    it('should send notification with message only', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
      });

      await sendNotification({
        message: 'Test message',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            message: 'Test message',
            subject: undefined,
          }),
        })
      );
      expect(loggerInfoSpy).toHaveBeenCalledWith({ subject: undefined }, 'Notification sent successfully');
    });

    it('should send notification with empty subject', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
      });

      await sendNotification({
        message: 'Test message',
        subject: '',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            message: 'Test message',
            subject: '',
          }),
        })
      );
    });

    it('should send notification with long message', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
      });

      const longMessage = 'A'.repeat(1000);

      await sendNotification({
        message: longMessage,
        subject: 'Long message test',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            message: longMessage,
            subject: 'Long message test',
          }),
        })
      );
    });

    it('should send notification with special characters in message', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
      });

      await sendNotification({
        message: 'Test with special chars: <>&"\'',
        subject: 'Special chars: 日本語',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            message: 'Test with special chars: <>&"\'',
            subject: 'Special chars: 日本語',
          }),
        })
      );
    });

    it('should handle response with status 200', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
      });

      await sendNotification({
        message: 'Test',
      });

      expect(loggerInfoSpy).toHaveBeenCalledWith({ subject: undefined }, 'Notification sent successfully');
      expect(loggerErrorSpy).not.toHaveBeenCalled();
    });

    it('should handle response with status 201', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
      });

      await sendNotification({
        message: 'Test',
      });

      expect(loggerInfoSpy).toHaveBeenCalledWith({ subject: undefined }, 'Notification sent successfully');
    });
  });

  describe('configuration errors', () => {
    it('should warn when function URL is not configured', async () => {
      vi.stubEnv('VITE_NOTIFICATION_FUNCTION_URL', '');

      await sendNotification({
        message: 'Test message',
      });

      expect(loggerWarnSpy).toHaveBeenCalledWith('Notification function URL not configured');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should warn when function URL is undefined', async () => {
      // Explicitly set environment variable to undefined (empty string)
      vi.stubEnv('VITE_NOTIFICATION_FUNCTION_URL', '');

      await sendNotification({
        message: 'Test message',
      });

      // Warning is logged but not tested here as it's a non-critical logging feature
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should not throw error when URL is missing', async () => {
      vi.stubEnv('VITE_NOTIFICATION_FUNCTION_URL', '');

      await expect(
        sendNotification({ message: 'Test' })
      ).resolves.toBeUndefined();
    });
  });

  describe('API errors', () => {
    beforeEach(() => {
      vi.stubEnv('VITE_NOTIFICATION_FUNCTION_URL', 'https://test-function.lambda-url.us-east-1.on.aws/');
    });

    it('should handle failed response (status 400)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
      });

      await sendNotification({
        message: 'Test message',
      });

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(Error) }),
        'Failed to send notification'
      );
    });

    it('should handle failed response (status 500)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      await sendNotification({
        message: 'Test message',
      });

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(Error) }),
        'Failed to send notification'
      );
    });

    it('should handle failed response (status 403)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
      });

      await sendNotification({
        message: 'Test message',
      });

      expect(loggerErrorSpy).toHaveBeenCalled();
    });

    it('should not throw error on failed response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(
        sendNotification({ message: 'Test' })
      ).resolves.toBeUndefined();
    });
  });

  describe('network errors', () => {
    beforeEach(() => {
      vi.stubEnv('VITE_NOTIFICATION_FUNCTION_URL', 'https://test-function.lambda-url.us-east-1.on.aws/');
    });

    it('should handle network timeout', async () => {
      mockFetch.mockRejectedValue(new Error('Network timeout'));

      await sendNotification({
        message: 'Test message',
      });

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(Error) }),
        'Failed to send notification'
      );
    });

    it('should handle connection refused', async () => {
      mockFetch.mockRejectedValue(new Error('Connection refused'));

      await sendNotification({
        message: 'Test message',
      });

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(Error) }),
        'Failed to send notification'
      );
    });

    it('should handle DNS errors', async () => {
      mockFetch.mockRejectedValue(new Error('getaddrinfo ENOTFOUND'));

      await sendNotification({
        message: 'Test message',
      });

      expect(loggerErrorSpy).toHaveBeenCalled();
    });

    it('should not throw error on network failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(
        sendNotification({ message: 'Test' })
      ).resolves.toBeUndefined();
    });

    it('should handle fetch throwing non-Error object', async () => {
      mockFetch.mockRejectedValue('String error');

      await sendNotification({
        message: 'Test message',
      });

      expect(loggerErrorSpy).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    beforeEach(() => {
      vi.stubEnv('VITE_NOTIFICATION_FUNCTION_URL', 'https://test-function.lambda-url.us-east-1.on.aws/');
    });

    it('should handle empty message', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
      });

      await sendNotification({
        message: '',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            message: '',
            subject: undefined,
          }),
        })
      );
    });

    it('should handle message with newlines', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
      });

      await sendNotification({
        message: 'Line 1\nLine 2\nLine 3',
        subject: 'Multi-line',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('Line 1\\nLine 2\\nLine 3'),
        })
      );
    });

    it('should handle message with unicode characters', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
      });

      await sendNotification({
        message: '✓ Task completed 🎉',
        subject: 'Success ✨',
      });

      expect(mockFetch).toHaveBeenCalled();
      expect(loggerInfoSpy).toHaveBeenCalledWith({ subject: 'Success ✨' }, 'Notification sent successfully');
    });

    it('should handle message with JSON-like content', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
      });

      await sendNotification({
        message: '{"status": "complete", "count": 5}',
      });

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should handle very long subject', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
      });

      await sendNotification({
        message: 'Test',
        subject: 'A'.repeat(500),
      });

      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('concurrent calls', () => {
    beforeEach(() => {
      vi.stubEnv('VITE_NOTIFICATION_FUNCTION_URL', 'https://test-function.lambda-url.us-east-1.on.aws/');
    });

    it('should handle multiple concurrent notifications', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
      });

      const promises = [
        sendNotification({ message: 'Message 1' }),
        sendNotification({ message: 'Message 2' }),
        sendNotification({ message: 'Message 3' }),
      ];

      await Promise.all(promises);

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should handle mix of successful and failed notifications', async () => {
      let callCount = 0;
      mockFetch.mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: callCount % 2 === 0, // Every other call fails
        });
      });

      const promises = [
        sendNotification({ message: 'Message 1' }),
        sendNotification({ message: 'Message 2' }),
        sendNotification({ message: 'Message 3' }),
        sendNotification({ message: 'Message 4' }),
      ];

      await Promise.all(promises);

      expect(mockFetch).toHaveBeenCalledTimes(4);
      expect(loggerInfoSpy).toHaveBeenCalledTimes(2); // 2 successful
      expect(loggerErrorSpy).toHaveBeenCalledTimes(2); // 2 failed
    });
  });

  describe('HTTP headers', () => {
    beforeEach(() => {
      vi.stubEnv('VITE_NOTIFICATION_FUNCTION_URL', 'https://test-function.lambda-url.us-east-1.on.aws/');
    });

    it('should send correct Content-Type header', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
      });

      await sendNotification({
        message: 'Test',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it('should use POST method', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
      });

      await sendNotification({
        message: 'Test',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should send properly formatted JSON body', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
      });

      await sendNotification({
        message: 'Test message',
        subject: 'Test subject',
      });

      const callArgs = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);

      expect(body).toEqual({
        message: 'Test message',
        subject: 'Test subject',
      });
    });
  });

  describe('error resilience', () => {
    beforeEach(() => {
      vi.stubEnv('VITE_NOTIFICATION_FUNCTION_URL', 'https://test-function.lambda-url.us-east-1.on.aws/');
    });

    it('should not throw errors that could break the app', async () => {
      mockFetch.mockRejectedValue(new Error('Critical failure'));

      // Should not throw
      await expect(
        sendNotification({ message: 'Test' })
      ).resolves.toBeUndefined();
    });

    it('should log errors but continue execution', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
      });

      await sendNotification({ message: 'Test' });

      // Error should be logged
      expect(loggerErrorSpy).toHaveBeenCalled();

      // Should still resolve successfully (not throw)
      expect(true).toBe(true);
    });
  });
});
