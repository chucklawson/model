import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import type { Handler } from 'aws-lambda';

const snsClient = new SNSClient({ region: process.env.AWS_REGION || 'us-east-2' });

export const handler: Handler = async (event) => {
  try {
    const { message, subject } = JSON.parse(event.body || '{}');

    if (!message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Message is required' })
      };
    }

    const phoneNumber = process.env.SMS_NOTIFICATION_PHONE;

    if (!phoneNumber) {
      throw new Error('SMS_NOTIFICATION_PHONE not configured');
    }

    const command = new PublishCommand({
      PhoneNumber: phoneNumber,
      Message: `[Model App] ${subject ? subject + ': ' : ''}${message}`,
    });

    await snsClient.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Notification sent' })
    };
  } catch (error) {
    console.error('Error sending notification:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to send notification',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
