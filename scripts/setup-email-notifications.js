#!/usr/bin/env node

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

// Use require to load the CommonJS AWS SDK module
const require = createRequire(import.meta.url);
const {
  SNSClient,
  CreateTopicCommand,
  SubscribeCommand,
  ListTopicsCommand,
  ListSubscriptionsByTopicCommand,
  GetTopicAttributesCommand
} = require('@aws-sdk/client-sns');

const emailAddress = process.env.EMAIL_NOTIFICATION_ADDRESS;
const region = 'us-east-2';
const topicName = 'ModelAppNotifications';

if (!emailAddress || emailAddress === 'your-email@example.com') {
  console.error('❌ Error: EMAIL_NOTIFICATION_ADDRESS not set in .env file');
  console.error('   Please edit .env and add your email address');
  process.exit(1);
}

const snsClient = new SNSClient({ region });

async function findOrCreateTopic() {
  try {
    console.log('\n📋 Checking for existing notification topic...\n');

    // List all topics
    const listCommand = new ListTopicsCommand({});
    const listResponse = await snsClient.send(listCommand);

    // Find our topic
    const existingTopic = listResponse.Topics?.find(topic =>
      topic.TopicArn.endsWith(`:${topicName}`)
    );

    if (existingTopic) {
      console.log(`✅ Found existing topic: ${existingTopic.TopicArn}\n`);
      return existingTopic.TopicArn;
    }

    // Create new topic
    console.log(`📝 Creating new SNS topic: ${topicName}...\n`);
    const createCommand = new CreateTopicCommand({ Name: topicName });
    const createResponse = await snsClient.send(createCommand);

    console.log(`✅ Topic created: ${createResponse.TopicArn}\n`);
    return createResponse.TopicArn;
  } catch (error) {
    console.error('❌ Error managing topic:', error.message);
    return null;
  }
}

async function subscribeEmail(topicArn) {
  try {
    // Check if email is already subscribed
    console.log('📋 Checking existing subscriptions...\n');
    const listSubsCommand = new ListSubscriptionsByTopicCommand({ TopicArn: topicArn });
    const subsResponse = await snsClient.send(listSubsCommand);

    const existingSub = subsResponse.Subscriptions?.find(sub =>
      sub.Protocol === 'email' && sub.Endpoint === emailAddress
    );

    if (existingSub) {
      if (existingSub.SubscriptionArn !== 'PendingConfirmation') {
        console.log(`✅ Email ${emailAddress} is already subscribed and confirmed!\n`);
        return true;
      } else {
        console.log(`⏳ Email ${emailAddress} is subscribed but pending confirmation.\n`);
        console.log('   Please check your email for a confirmation link from AWS.\n');
        return false;
      }
    }

    // Subscribe email
    console.log(`📧 Subscribing ${emailAddress} to notifications...\n`);
    const subscribeCommand = new SubscribeCommand({
      TopicArn: topicArn,
      Protocol: 'email',
      Endpoint: emailAddress,
    });

    await snsClient.send(subscribeCommand);

    console.log('✅ Subscription request sent!\n');
    console.log('📨 AWS is sending a confirmation email to your inbox...\n');
    console.log('⚠️  IMPORTANT: Check your email and click the confirmation link!\n');

    return false;
  } catch (error) {
    console.error('❌ Error subscribing email:', error.message);
    return false;
  }
}

async function saveTopicArn(topicArn) {
  const fs = require('fs');
  const envPath = join(__dirname, '..', '.env');
  let envContent = fs.readFileSync(envPath, 'utf8');

  // Check if SNS_TOPIC_ARN already exists
  if (envContent.includes('SNS_TOPIC_ARN=')) {
    // Replace existing
    envContent = envContent.replace(
      /SNS_TOPIC_ARN=.*/,
      `SNS_TOPIC_ARN=${topicArn}`
    );
  } else {
    // Add new
    envContent += `\n# SNS Topic ARN for notifications (auto-generated)\nSNS_TOPIC_ARN=${topicArn}\n`;
  }

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Topic ARN saved to .env file\n');
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('       AWS Email Notification Setup');
  console.log('═══════════════════════════════════════════════════\n');
  console.log(`Email address: ${emailAddress}`);
  console.log(`Region: ${region}\n`);

  // Step 1: Find or create topic
  const topicArn = await findOrCreateTopic();
  if (!topicArn) {
    console.error('\n❌ Failed to create/find SNS topic');
    process.exit(1);
  }

  // Step 2: Save topic ARN to .env
  await saveTopicArn(topicArn);

  // Step 3: Subscribe email
  const confirmed = await subscribeEmail(topicArn);

  // Step 4: Show next steps
  if (confirmed) {
    console.log('✅ Setup complete! Email notifications are ready to use.\n');
    console.log('Next steps:');
    console.log('  1. Test notification: npm run notify "Test" "Test"');
    console.log('  2. Deploy your app: npx ampx sandbox\n');
  } else {
    console.log('⏳ Almost done! Final steps:');
    console.log('  1. Check your email inbox for AWS SNS confirmation');
    console.log('  2. Click the "Confirm subscription" link in the email');
    console.log('  3. Run this script again to verify: npm run setup-email');
    console.log('  4. Test notification: npm run notify "Test" "Test"\n');
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
