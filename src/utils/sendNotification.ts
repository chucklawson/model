interface NotificationOptions {
  message: string;
  subject?: string;
}

export async function sendNotification({ message, subject }: NotificationOptions): Promise<void> {
  try {
    // Get the Lambda function URL from amplify outputs
    // Note: In a real implementation, you'd get this from amplify_outputs.json
    // For now, this is a placeholder that you'll need to update after deployment
    const functionUrl = import.meta.env.VITE_NOTIFICATION_FUNCTION_URL;

    if (!functionUrl) {
      console.warn('Notification function URL not configured');
      return;
    }

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, subject }),
    });

    if (!response.ok) {
      throw new Error('Failed to send notification');
    }

    console.log('Notification sent successfully');
  } catch (error) {
    console.error('Error sending notification:', error);
    // Don't throw - notifications should never break the app
  }
}
