#!/usr/bin/env node

import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

const phoneNumber = process.env.SMS_NOTIFICATION_PHONE;
const region = process.env.AWS_REGION || 'us-east-2';

if (!phoneNumber) {
  console.error('Error: SMS_NOTIFICATION_PHONE not set in .env file');
  process.exit(1);
}

const snsClient = new SNSClient({ region });

async function sendSMS(message, subject = null) {
  try {
    const fullMessage = subject
      ? `[Model App] ${subject}: ${message}`
      : `[Model App] ${message}`;

    const command = new PublishCommand({
      PhoneNumber: phoneNumber,
      Message: fullMessage,
    });

    const response = await snsClient.send(command);
    console.log('✓ SMS sent successfully');
    console.log('  Message ID:', response.MessageId);
    return true;
  } catch (error) {
    console.error('✗ Failed to send SMS:', error.message);
    return false;
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: node scripts/send-sms.js <message> [subject]');
  console.log('Example: node scripts/send-sms.js "Build completed" "Success"');
  process.exit(1);
}

const message = args[0];
const subject = args[1] || null;

sendSMS(message, subject).then(success => {
  process.exit(success ? 0 : 1);
});
