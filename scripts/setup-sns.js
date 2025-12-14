#!/usr/bin/env node

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as readline from 'readline/promises';
import { createRequire } from 'module';

// Use require to load the CommonJS AWS SDK module
const require = createRequire(import.meta.url);
const AWS_SNS = require('@aws-sdk/client-sns');
const {
  SNSClient,
  CreateSMSSandboxPhoneNumberCommand,
  VerifySMSSandboxPhoneNumberCommand,
  ListSMSSandboxPhoneNumbersCommand
} = AWS_SNS;

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

const phoneNumber = process.env.SMS_NOTIFICATION_PHONE;
const region = 'us-east-2';

if (!phoneNumber) {
  console.error('❌ Error: SMS_NOTIFICATION_PHONE not set in .env file');
  process.exit(1);
}

const snsClient = new SNSClient({ region });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function checkPhoneNumberStatus() {
  try {
    console.log('\n📋 Checking current sandbox phone numbers...\n');
    const command = new ListSMSSandboxPhoneNumbersCommand({});
    const response = await snsClient.send(command);

    if (response.PhoneNumbers && response.PhoneNumbers.length > 0) {
      console.log('Current verified phone numbers:');
      response.PhoneNumbers.forEach(phone => {
        const status = phone.Status === 'Verified' ? '✅' : '⏳';
        console.log(`  ${status} ${phone.PhoneNumber} - ${phone.Status}`);
      });

      const alreadyVerified = response.PhoneNumbers.find(
        phone => phone.PhoneNumber === phoneNumber && phone.Status === 'Verified'
      );

      if (alreadyVerified) {
        console.log(`\n✅ ${phoneNumber} is already verified!`);
        return 'verified';
      }

      const pending = response.PhoneNumbers.find(
        phone => phone.PhoneNumber === phoneNumber && phone.Status === 'Pending'
      );

      if (pending) {
        return 'pending';
      }
    } else {
      console.log('  No phone numbers verified yet.');
    }

    return 'not-added';
  } catch (error) {
    console.error('Error checking status:', error.message);
    return 'error';
  }
}

async function addPhoneNumber() {
  try {
    console.log(`\n📱 Adding ${phoneNumber} to SNS sandbox...\n`);

    const command = new CreateSMSSandboxPhoneNumberCommand({
      PhoneNumber: phoneNumber,
      LanguageCode: 'en-US'
    });

    await snsClient.send(command);

    console.log('✅ Phone number added successfully!');
    console.log('📨 AWS is sending a verification code to your phone...\n');

    return true;
  } catch (error) {
    if (error.name === 'OptedOutException') {
      console.error('❌ This phone number has opted out of SMS. You need to text START to the short code first.');
    } else if (error.message.includes('already exists')) {
      console.log('ℹ️  Phone number already added, waiting for verification...');
      return true;
    } else {
      console.error('❌ Error adding phone number:', error.message);
    }
    return false;
  }
}

async function verifyPhoneNumber(code) {
  try {
    console.log('\n🔍 Verifying code...\n');

    const command = new VerifySMSSandboxPhoneNumberCommand({
      PhoneNumber: phoneNumber,
      OneTimePassword: code
    });

    await snsClient.send(command);

    console.log('✅ Phone number verified successfully!\n');
    console.log('🎉 You can now receive SMS notifications from your app!\n');

    return true;
  } catch (error) {
    if (error.name === 'InvalidParameterException') {
      console.error('❌ Invalid verification code. Please try again.\n');
    } else {
      console.error('❌ Error verifying phone number:', error.message);
    }
    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('       AWS SNS Phone Number Verification Setup');
  console.log('═══════════════════════════════════════════════════\n');
  console.log(`Phone number: ${phoneNumber}`);
  console.log(`Region: ${region}\n`);

  // Check current status
  const status = await checkPhoneNumberStatus();

  if (status === 'verified') {
    console.log('\n✅ Setup complete! No action needed.');
    rl.close();
    return;
  }

  if (status === 'error') {
    console.log('\n⚠️  Could not check status. Make sure AWS credentials are configured:');
    console.log('   Run: aws configure');
    rl.close();
    process.exit(1);
  }

  // Add phone number if not added yet
  if (status === 'not-added') {
    const added = await addPhoneNumber();
    if (!added) {
      rl.close();
      process.exit(1);
    }
  } else if (status === 'pending') {
    console.log('\n📨 A verification code was already sent to your phone.');
  }

  // Ask for verification code
  console.log('⏳ Waiting for verification code...');
  console.log('   Check your phone for a text message from AWS.\n');

  const code = await rl.question('Enter the 6-digit verification code: ');

  const verified = await verifyPhoneNumber(code.trim());

  if (verified) {
    console.log('Next steps:');
    console.log('  1. Test CLI notification: npm run notify "Test" "Test"');
    console.log('  2. Deploy your app: npx ampx sandbox\n');
  }

  rl.close();
}

main().catch(error => {
  console.error('Fatal error:', error);
  rl.close();
  process.exit(1);
});
