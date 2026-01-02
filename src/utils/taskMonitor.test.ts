import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TaskMonitor } from './taskMonitor';
import * as sendNotificationModule from './sendNotification';

describe('TaskMonitor', () => {
  let sendNotificationSpy: any;

  beforeEach(() => {
    // Use fake timers
    vi.useFakeTimers();

    // Spy on sendNotification
    sendNotificationSpy = vi.spyOn(sendNotificationModule, 'sendNotification').mockResolvedValue();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create TaskMonitor with default notify time (5 minutes)', () => {
      const monitor = new TaskMonitor({ name: 'Test Task' });

      expect(monitor).toBeInstanceOf(TaskMonitor);
    });

    it('should create TaskMonitor with custom notify time', () => {
      const monitor = new TaskMonitor({
        name: 'Custom Task',
        notifyAfterMs: 60000, // 1 minute
      });

      expect(monitor).toBeInstanceOf(TaskMonitor);
    });

    it('should start timer immediately on construction', () => {
      new TaskMonitor({ name: 'Test Task' });

      // Fast-forward just before the default 5 minutes
      vi.advanceTimersByTime(5 * 60 * 1000 - 1000);
      expect(sendNotificationSpy).not.toHaveBeenCalled();

      // Fast-forward past 5 minutes
      vi.advanceTimersByTime(1000);
      expect(sendNotificationSpy).toHaveBeenCalled();
    });

    it('should accept notifyAfterMs of 0', () => {
      const _monitor = new TaskMonitor({
        name: 'Instant Task',
        notifyAfterMs: 0,
      });

      vi.advanceTimersByTime(0);
      expect(sendNotificationSpy).toHaveBeenCalled();
    });
  });

  describe('timer notifications', () => {
    it('should send notification after default 5 minutes', async () => {
      new TaskMonitor({ name: 'Long Task' });

      // Fast-forward 5 minutes
      await vi.advanceTimersByTimeAsync(5 * 60 * 1000);

      expect(sendNotificationSpy).toHaveBeenCalledTimes(1);
      expect(sendNotificationSpy).toHaveBeenCalledWith({
        message: expect.stringContaining('Long Task'),
        subject: 'Long Task',
      });
    });

    it('should send notification after custom time period', async () => {
      new TaskMonitor({
        name: 'Custom Task',
        notifyAfterMs: 2 * 60 * 1000, // 2 minutes
      });

      // Fast-forward 2 minutes
      await vi.advanceTimersByTimeAsync(2 * 60 * 1000);

      expect(sendNotificationSpy).toHaveBeenCalledTimes(1);
    });

    it('should include elapsed time in notification message', async () => {
      new TaskMonitor({ name: 'Test Task' });

      // Fast-forward 5 minutes
      await vi.advanceTimersByTimeAsync(5 * 60 * 1000);

      expect(sendNotificationSpy).toHaveBeenCalledWith({
        message: expect.stringContaining('5 minutes'),
        subject: 'Long Task',
      });
    });

    it('should format elapsed time correctly for different durations', async () => {
      new TaskMonitor({
        name: 'Test Task',
        notifyAfterMs: 10 * 60 * 1000, // 10 minutes
      });

      // Fast-forward 10 minutes
      await vi.advanceTimersByTimeAsync(10 * 60 * 1000);

      expect(sendNotificationSpy).toHaveBeenCalledWith({
        message: expect.stringContaining('10 minutes'),
        subject: 'Long Task',
      });
    });

    it('should include task name in notification message', async () => {
      new TaskMonitor({
        name: 'Data Processing',
        notifyAfterMs: 1000,
      });

      await vi.advanceTimersByTimeAsync(1000);

      expect(sendNotificationSpy).toHaveBeenCalledWith({
        message: expect.stringContaining('Data Processing'),
        subject: 'Long Task',
      });
    });

    it('should not send notification if completed before timer expires', async () => {
      const monitor = new TaskMonitor({
        name: 'Quick Task',
        notifyAfterMs: 5 * 60 * 1000,
      });

      // Complete task after 2 minutes
      vi.advanceTimersByTime(2 * 60 * 1000);
      await monitor.complete();

      // Fast-forward past the 5-minute mark
      vi.advanceTimersByTime(5 * 60 * 1000);

      // Should not have sent the "still running" notification
      expect(sendNotificationSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Long Task',
        })
      );
    });
  });

  describe('complete method', () => {
    it('should send success notification for task over 1 minute', async () => {
      const monitor = new TaskMonitor({ name: 'Test Task' });

      // Advance 65 seconds
      vi.advanceTimersByTime(65 * 1000);
      await monitor.complete(true);

      expect(sendNotificationSpy).toHaveBeenCalledWith({
        message: expect.stringContaining('completed'),
        subject: 'Task Complete',
      });
    });

    it('should send failure notification for failed task over 1 minute', async () => {
      const monitor = new TaskMonitor({ name: 'Test Task' });

      // Advance 65 seconds
      vi.advanceTimersByTime(65 * 1000);
      await monitor.complete(false);

      expect(sendNotificationSpy).toHaveBeenCalledWith({
        message: expect.stringContaining('failed'),
        subject: 'Task Failed',
      });
    });

    it('should not send notification for task under 1 minute', async () => {
      const monitor = new TaskMonitor({ name: 'Quick Task' });

      // Advance 59 seconds
      vi.advanceTimersByTime(59 * 1000);
      await monitor.complete(true);

      expect(sendNotificationSpy).not.toHaveBeenCalled();
    });

    it('should include elapsed time in seconds in completion message', async () => {
      const monitor = new TaskMonitor({ name: 'Test Task' });

      // Advance 125 seconds
      vi.advanceTimersByTime(125 * 1000);
      await monitor.complete(true);

      expect(sendNotificationSpy).toHaveBeenCalledWith({
        message: expect.stringContaining('125s'),
        subject: 'Task Complete',
      });
    });

    it('should include task name in completion message', async () => {
      const monitor = new TaskMonitor({ name: 'Data Export' });

      // Advance 65 seconds
      vi.advanceTimersByTime(65 * 1000);
      await monitor.complete(true);

      expect(sendNotificationSpy).toHaveBeenCalledWith({
        message: expect.stringContaining('Data Export'),
        subject: 'Task Complete',
      });
    });

    it('should clear timer on completion', async () => {
      const monitor = new TaskMonitor({
        name: 'Test Task',
        notifyAfterMs: 5 * 60 * 1000,
      });

      // Complete immediately
      await monitor.complete(true);

      // Advance past the timer
      vi.advanceTimersByTime(10 * 60 * 1000);

      // Should only have completion notification, not the "still running" notification
      expect(sendNotificationSpy).toHaveBeenCalledTimes(0); // Task was < 60s
    });

    it('should default to success if no argument provided', async () => {
      const monitor = new TaskMonitor({ name: 'Test Task' });

      // Advance 65 seconds
      vi.advanceTimersByTime(65 * 1000);
      await monitor.complete();

      expect(sendNotificationSpy).toHaveBeenCalledWith({
        message: expect.stringContaining('completed'),
        subject: 'Task Complete',
      });
    });

    it('should round elapsed time to nearest second', async () => {
      const monitor = new TaskMonitor({ name: 'Test Task' });

      // Advance 65.7 seconds
      vi.advanceTimersByTime(65700);
      await monitor.complete(true);

      expect(sendNotificationSpy).toHaveBeenCalledWith({
        message: expect.stringContaining('66s'), // Rounded
        subject: 'Task Complete',
      });
    });
  });

  describe('edge cases', () => {
    it('should handle task name with special characters', async () => {
      const _monitor = new TaskMonitor({
        name: 'Task: Process & Export <data>',
        notifyAfterMs: 1000,
      });

      await vi.advanceTimersByTimeAsync(1000);

      expect(sendNotificationSpy).toHaveBeenCalledWith({
        message: expect.stringContaining('Task: Process & Export <data>'),
        subject: 'Long Task',
      });
    });

    it('should handle empty task name', async () => {
      const _monitor = new TaskMonitor({
        name: '',
        notifyAfterMs: 1000,
      });

      await vi.advanceTimersByTimeAsync(1000);

      expect(sendNotificationSpy).toHaveBeenCalled();
    });

    it('should handle very long task names', async () => {
      const longName = 'A'.repeat(500);
      const _monitor = new TaskMonitor({
        name: longName,
        notifyAfterMs: 1000,
      });

      await vi.advanceTimersByTimeAsync(1000);

      expect(sendNotificationSpy).toHaveBeenCalledWith({
        message: expect.stringContaining(longName),
        subject: 'Long Task',
      });
    });

    it('should handle very short notify time', async () => {
      const _monitor = new TaskMonitor({
        name: 'Instant Task',
        notifyAfterMs: 1,
      });

      await vi.advanceTimersByTimeAsync(1);

      expect(sendNotificationSpy).toHaveBeenCalled();
    });

    it('should handle very long notify time', async () => {
      const _monitor = new TaskMonitor({
        name: 'Long Wait Task',
        notifyAfterMs: 24 * 60 * 60 * 1000, // 24 hours
      });

      // Don't advance that far, just verify no errors
      vi.advanceTimersByTime(1000);
      expect(sendNotificationSpy).not.toHaveBeenCalled();
    });

    it('should handle multiple complete calls', async () => {
      const monitor = new TaskMonitor({ name: 'Test Task' });

      vi.advanceTimersByTime(65 * 1000);
      await monitor.complete(true);
      await monitor.complete(true);
      await monitor.complete(true);

      // Each complete call sends a notification (implementation doesn't prevent multiple calls)
      expect(sendNotificationSpy).toHaveBeenCalledTimes(3);
    });

    it('should handle completion at exactly 60 seconds', async () => {
      const monitor = new TaskMonitor({ name: 'Test Task' });

      vi.advanceTimersByTime(60 * 1000);
      await monitor.complete(true);

      // Should NOT send notification (must be > 60s)
      expect(sendNotificationSpy).not.toHaveBeenCalled();
    });

    it('should handle completion at 61 seconds', async () => {
      const monitor = new TaskMonitor({ name: 'Test Task' });

      vi.advanceTimersByTime(61 * 1000);
      await monitor.complete(true);

      // Should send notification (> 60s)
      expect(sendNotificationSpy).toHaveBeenCalled();
    });
  });

  describe('concurrent task monitors', () => {
    it('should handle multiple TaskMonitors simultaneously', async () => {
      const _monitor1 = new TaskMonitor({ name: 'Task 1', notifyAfterMs: 1000 });
      const _monitor2 = new TaskMonitor({ name: 'Task 2', notifyAfterMs: 2000 });
      const _monitor3 = new TaskMonitor({ name: 'Task 3', notifyAfterMs: 3000 });

      // Advance 1 second - only Task 1 should notify
      await vi.advanceTimersByTimeAsync(1000);
      expect(sendNotificationSpy).toHaveBeenCalledTimes(1);
      expect(sendNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Task 1'),
        })
      );

      // Advance 1 more second - Task 2 should notify
      await vi.advanceTimersByTimeAsync(1000);
      expect(sendNotificationSpy).toHaveBeenCalledTimes(2);

      // Advance 1 more second - Task 3 should notify
      await vi.advanceTimersByTimeAsync(1000);
      expect(sendNotificationSpy).toHaveBeenCalledTimes(3);
    });

    it('should handle one monitor completing while others continue', async () => {
      const monitor1 = new TaskMonitor({ name: 'Task 1', notifyAfterMs: 5000 });
      const _monitor2 = new TaskMonitor({ name: 'Task 2', notifyAfterMs: 5000 });

      // Complete monitor1 after 2 seconds
      vi.advanceTimersByTime(2 * 1000);
      await monitor1.complete(true);

      // Advance to 5 seconds - only monitor2 should notify
      await vi.advanceTimersByTimeAsync(3 * 1000);

      expect(sendNotificationSpy).toHaveBeenCalledTimes(1);
      expect(sendNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Task 2'),
        })
      );
    });
  });

  describe('timer accuracy', () => {
    it('should calculate elapsed time accurately for long running tasks', async () => {
      const monitor = new TaskMonitor({ name: 'Long Task' });

      // Simulate a task that runs for 2 hours
      vi.advanceTimersByTime(2 * 60 * 60 * 1000);
      await monitor.complete(true);

      expect(sendNotificationSpy).toHaveBeenCalledWith({
        message: expect.stringContaining('7200s'), // 2 hours = 7200 seconds
        subject: 'Task Complete',
      });
    });

    it('should calculate minutes correctly in notification message', async () => {
      new TaskMonitor({
        name: 'Test Task',
        notifyAfterMs: 7 * 60 * 1000, // 7 minutes
      });

      await vi.advanceTimersByTimeAsync(7 * 60 * 1000);

      expect(sendNotificationSpy).toHaveBeenCalledWith({
        message: expect.stringContaining('7 minutes'),
        subject: 'Long Task',
      });
    });

    it('should handle fractional minutes correctly', async () => {
      new TaskMonitor({
        name: 'Test Task',
        notifyAfterMs: 90 * 1000, // 1.5 minutes
      });

      await vi.advanceTimersByTimeAsync(90 * 1000);

      // Should round to 2 minutes (Math.round)
      expect(sendNotificationSpy).toHaveBeenCalledWith({
        message: expect.stringContaining('2 minutes'),
        subject: 'Long Task',
      });
    });
  });

  // Note: Error handling for sendNotification is tested in sendNotification.test.ts
  // sendNotification catches all errors internally, so TaskMonitor doesn't need
  // to handle rejections - they are already handled within sendNotification

  describe('real-world scenarios', () => {
    it('should handle data processing workflow', async () => {
      const monitor = new TaskMonitor({
        name: 'Data Import',
        notifyAfterMs: 5 * 60 * 1000,
      });

      // Process completes in 3 minutes
      vi.advanceTimersByTime(3 * 60 * 1000);
      await monitor.complete(true);

      // Should send completion notification (> 60s)
      const call = sendNotificationSpy.mock.calls[0][0];
      expect(call.message).toContain('Data Import');
      expect(call.message).toContain('completed');
      expect(call.subject).toBe('Task Complete');
    });

    it('should handle failed task workflow', async () => {
      const monitor = new TaskMonitor({
        name: 'API Sync',
        notifyAfterMs: 10 * 60 * 1000,
      });

      // Task fails after 2 minutes
      vi.advanceTimersByTime(2 * 60 * 1000);
      await monitor.complete(false);

      const call = sendNotificationSpy.mock.calls[0][0];
      expect(call.message).toContain('API Sync');
      expect(call.message).toContain('failed');
      expect(call.subject).toBe('Task Failed');
    });

    it('should handle very long running task', async () => {
      new TaskMonitor({
        name: 'Batch Process',
        notifyAfterMs: 30 * 60 * 1000, // Notify after 30 minutes
      });

      // Advance 30 minutes
      await vi.advanceTimersByTimeAsync(30 * 60 * 1000);

      const call = sendNotificationSpy.mock.calls[0][0];
      expect(call.message).toContain('30 minutes');
      expect(call.message).toContain('still running');
      expect(call.subject).toBe('Long Task');
    });
  });
});
