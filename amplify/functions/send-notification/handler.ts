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

    const topicArn = process.env.SNS_TOPIC_ARN;

    if (!topicArn) {
      throw new Error('SNS_TOPIC_ARN not configured');
    }

    const emailSubject = subject
      ? `[Model App] ${subject}`
      : '[Model App] Notification';

    const emailMessage = subject
      ? `${subject}\n\n${message}\n\n---\nSent from Model App`
      : `${message}\n\n---\nSent from Model App`;

    const command = new PublishCommand({
      TopicArn: topicArn,
      Subject: emailSubject,
      Message: emailMessage,
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
