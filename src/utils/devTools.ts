import { sendNotification } from './sendNotification';

// Expose to window for console access
declare global {
  interface Window {
    notifyMe: (message: string, subject?: string) => Promise<void>;
  }
}

if (import.meta.env.DEV) {
  window.notifyMe = async (message: string, subject?: string) => {
    console.log('Sending notification:', { message, subject });
    await sendNotification({ message, subject });
  };

  console.log('💡 Dev tool available: window.notifyMe("Your message", "Optional Subject")');
}
