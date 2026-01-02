// ============================================
// Reset Vanguard Import Tables Script
// Deletes ALL records from Vanguard-related tables
// ============================================
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-2' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_PREFIX = 'aobfqsdvibajfnofx3qajb3tfe-NONE';

const TABLES = [
  'Transaction',
  'CompletedTransaction',
  'DividendTransaction',
  'ImportHistory',
];

/**
 * Delete all items from a table
 */
async function emptyTable(tableName: string): Promise<number> {
  console.log(`\nEmptying ${tableName}...`);

  let deletedCount = 0;
  let lastEvaluatedKey: any = undefined;

  do {
    // Scan to get items
    const scanCommand = new ScanCommand({
      TableName: tableName,
      ExclusiveStartKey: lastEvaluatedKey,
      ProjectionExpression: 'id',
    });

    const scanResponse = await docClient.send(scanCommand);

    if (!scanResponse.Items || scanResponse.Items.length === 0) {
      break;
    }

    // Batch delete (max 25 items per batch)
    const batches: any[][] = [];
    for (let i = 0; i < scanResponse.Items.length; i += 25) {
      batches.push(scanResponse.Items.slice(i, i + 25));
    }

    for (const batch of batches) {
      const deleteRequests = batch.map(item => ({
        DeleteRequest: {
          Key: { id: item.id }
        }
      }));

      const batchWriteCommand = new BatchWriteCommand({
        RequestItems: {
          [tableName]: deleteRequests
        }
      });

      await docClient.send(batchWriteCommand);
      deletedCount += deleteRequests.length;

      if (deletedCount % 100 === 0) {
        console.log(`  Deleted ${deletedCount} items...`);
      }
    }

    lastEvaluatedKey = scanResponse.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  console.log(`✅ Deleted ${deletedCount} items from ${tableName}`);
  return deletedCount;
}

/**
 * Main reset function
 */
async function resetTables() {
  try {
    console.log('='.repeat(60));
    console.log('RESET VANGUARD IMPORT TABLES');
    console.log('='.repeat(60));
    console.log('\n⚠️  WARNING: This will delete ALL records from:');
    TABLES.forEach(table => console.log(`  - ${table}`));
    console.log('\nStarting in 3 seconds...\n');

    await new Promise(resolve => setTimeout(resolve, 3000));

    const results: Record<string, number> = {};

    for (const table of TABLES) {
      const fullTableName = `${table}-${TABLE_PREFIX}`;
      const count = await emptyTable(fullTableName);
      results[table] = count;
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ RESET COMPLETE');
    console.log('='.repeat(60));
    console.log('\nSummary:');
    Object.entries(results).forEach(([table, count]) => {
      console.log(`  ${table}: ${count} records deleted`);
    });
    console.log('\nAll tables are now empty and ready for a fresh import.');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Reset failed:', error);
    process.exit(1);
  }
}

// Run reset
resetTables();
