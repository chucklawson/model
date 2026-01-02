// Test Amplify Connection
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from './amplify/data/resource';
import outputs from './src/amplify_outputs.json';

// Configure Amplify
Amplify.configure(outputs);

const client = generateClient<Schema>();

async function testConnection() {
  try {
    console.log('Testing Amplify connection...');
    console.log('Amplify configured with:', {
      region: outputs.data.aws_region,
      url: outputs.data.url
    });

    // Try to count transactions
    const { data: transactions } = await client.models.Transaction.list();
    console.log('✅ Successfully connected!');
    console.log('Transaction count:', transactions?.length || 0);

    // Try to count holdings
    const { data: lots } = await client.models.TickerLot.list();
    console.log('TickerLot count:', lots?.length || 0);

  } catch (error) {
    console.error('❌ Connection failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }
}

testConnection();
