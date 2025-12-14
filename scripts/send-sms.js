#!/usr/bin/env node

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';

// Use require to load the CommonJS AWS SDK module
const require = createRequire(import.meta.url);
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

const topicArn = process.env.SNS_TOPIC_ARN;
const emailAddress = process.env.EMAIL_NOTIFICATION_ADDRESS;
const region = 'us-east-2';

if (!topicArn || !emailAddress) {
  console.error('Error: Email notifications not configured');
  console.error('Please run: npm run setup-email');
  process.exit(1);
}

const snsClient = new SNSClient({ region });

async function sendNotification(message, subject = null) {
  try {
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

    const response = await snsClient.send(command);
    console.log('✓ Email notification sent successfully');
    console.log('  Message ID:', response.MessageId);
    console.log(`  Sent to: ${emailAddress}`);
    return true;
  } catch (error) {
    console.error('✗ Failed to send notification:', error.message);
    return false;
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: npm run notify <message> [subject]');
  console.log('Example: npm run notify "Build completed" "Success"');
  process.exit(1);
}

const message = args[0];
const subject = args[1] || null;

sendNotification(message, subject).then(success => {
  process.exit(success ? 0 : 1);
});
