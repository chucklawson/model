import { sendNotification } from './sendNotification';
import logger from './logger';

// Expose to window for console access
declare global {
  interface Window {
    notifyMe: (message: string, subject?: string) => Promise<void>;
  }
}

if (import.meta.env.DEV) {
  window.notifyMe = async (message: string, subject?: string) => {
    logger.debug({ message, subject }, 'Sending notification via dev tool');
    await sendNotification({ message, subject });
  };

  logger.info('Dev tool available: window.notifyMe("Your message", "Optional Subject")');
}
