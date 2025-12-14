import { sendNotification } from './sendNotification';

interface TaskOptions {
  name: string;
  notifyAfterMs?: number; // Default: 5 minutes
}

export class TaskMonitor {
  private startTime: number;
  private name: string;
  private notifyAfterMs: number;
  private timer: NodeJS.Timeout | null = null;

  constructor({ name, notifyAfterMs = 5 * 60 * 1000 }: TaskOptions) {
    this.name = name;
    this.startTime = Date.now();
    this.notifyAfterMs = notifyAfterMs;
    this.startTimer();
  }

  private startTimer() {
    this.timer = setTimeout(async () => {
      const elapsed = Math.round((Date.now() - this.startTime) / 1000 / 60);
      await sendNotification({
        message: `Task "${this.name}" is still running (${elapsed} minutes)`,
        subject: 'Long Task'
      });
    }, this.notifyAfterMs);
  }

  async complete(success: boolean = true) {
    if (this.timer) {
      clearTimeout(this.timer);
    }

    const elapsed = Math.round((Date.now() - this.startTime) / 1000);

    if (elapsed > 60) { // Only notify if task took more than 1 minute
      await sendNotification({
        message: `Task "${this.name}" ${success ? 'completed' : 'failed'} (${elapsed}s)`,
        subject: success ? 'Task Complete' : 'Task Failed'
      });
    }
  }
}
