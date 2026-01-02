// ============================================
// Cleanup Duplicate Records Script (AWS SDK)
// ============================================
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-2' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_PREFIX = 'aobfqsdvibajfnofx3qajb3tfe-NONE';

interface RecordWithId {
  id: string;
  createdAt: string;
  [key: string]: any;
}

/**
 * Scan all records from a table
 */
async function scanTable(tableName: string): Promise<RecordWithId[]> {
  const records: RecordWithId[] = [];
  let lastEvaluatedKey: any = undefined;

  do {
    const command = new ScanCommand({
      TableName: tableName,
      ExclusiveStartKey: lastEvaluatedKey,
    });

    const response = await docClient.send(command);

    if (response.Items) {
      records.push(...response.Items as RecordWithId[]);
    }

    lastEvaluatedKey = response.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return records;
}

/**
 * Delete a record from a table
 */
async function deleteRecord(tableName: string, id: string): Promise<void> {
  const command = new DeleteCommand({
    TableName: tableName,
    Key: { id },
  });

  await docClient.send(command);
}

/**
 * Remove duplicate dividend records
 */
async function cleanupDuplicateDividends() {
  console.log('\n=== CLEANING UP DUPLICATE DIVIDENDS ===\n');

  const tableName = `DividendTransaction-${TABLE_PREFIX}`;
  console.log('Scanning table:', tableName);

  const allDividends = await scanTable(tableName);
  console.log(`Total dividend records: ${allDividends.length}`);

  // Group by unique key (transactionId)
  const grouped = new Map<string, RecordWithId[]>();

  for (const div of allDividends) {
    const key = div.transactionId;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(div);
  }

  // Find duplicates
  let duplicateCount = 0;
  const toDelete: RecordWithId[] = [];

  for (const [key, records] of grouped.entries()) {
    if (records.length > 1) {
      // Sort by createdAt (keep oldest)
      records.sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      // Mark all except the first for deletion
      for (let i = 1; i < records.length; i++) {
        toDelete.push(records[i]);
        duplicateCount++;
      }

      console.log(`Found ${records.length - 1} duplicates for ${records[0].symbol} on ${records[0].payDate}`);
    }
  }

  console.log(`\nUnique transactions: ${grouped.size}`);
  console.log(`Duplicate records to delete: ${duplicateCount}`);

  // Delete duplicates
  if (toDelete.length > 0) {
    console.log('\nDeleting duplicates...');
    let deleted = 0;

    for (const record of toDelete) {
      try {
        await deleteRecord(tableName, record.id);
        deleted++;

        if (deleted % 50 === 0) {
          console.log(`Deleted ${deleted}/${toDelete.length}...`);
        }
      } catch (error) {
        console.error(`Failed to delete ${record.id}:`, error);
      }
    }

    console.log(`\n✅ Deleted ${deleted} duplicate dividend records`);
  } else {
    console.log('\n✅ No duplicates found');
  }

  return { total: allDividends.length, unique: grouped.size, deleted: toDelete.length };
}

/**
 * Remove duplicate completed transactions
 */
async function cleanupDuplicateCompletedTransactions() {
  console.log('\n=== CLEANING UP DUPLICATE COMPLETED TRANSACTIONS ===\n');

  const tableName = `CompletedTransaction-${TABLE_PREFIX}`;
  console.log('Scanning table:', tableName);

  const allCompleted = await scanTable(tableName);
  console.log(`Total completed transaction records: ${allCompleted.length}`);

  // Group by unique key (buyTransactionId + sellTransactionId)
  const grouped = new Map<string, RecordWithId[]>();

  for (const ct of allCompleted) {
    const key = `${ct.buyTransactionId}|${ct.sellTransactionId}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(ct);
  }

  // Find duplicates
  let duplicateCount = 0;
  const toDelete: RecordWithId[] = [];

  for (const [key, records] of grouped.entries()) {
    if (records.length > 1) {
      // Sort by completedDate (keep oldest)
      records.sort((a, b) =>
        new Date(a.completedDate).getTime() - new Date(b.completedDate).getTime()
      );

      // Mark all except the first for deletion
      for (let i = 1; i < records.length; i++) {
        toDelete.push(records[i]);
        duplicateCount++;
      }

      console.log(`Found ${records.length - 1} duplicates for ${records[0].symbol} buy/sell pair`);
    }
  }

  console.log(`\nUnique completed transactions: ${grouped.size}`);
  console.log(`Duplicate records to delete: ${duplicateCount}`);

  // Delete duplicates
  if (toDelete.length > 0) {
    console.log('\nDeleting duplicates...');
    let deleted = 0;

    for (const record of toDelete) {
      try {
        await deleteRecord(tableName, record.id);
        deleted++;

        if (deleted % 50 === 0) {
          console.log(`Deleted ${deleted}/${toDelete.length}...`);
        }
      } catch (error) {
        console.error(`Failed to delete ${record.id}:`, error);
      }
    }

    console.log(`\n✅ Deleted ${deleted} duplicate completed transaction records`);
  } else {
    console.log('\n✅ No duplicates found');
  }

  return { total: allCompleted.length, unique: grouped.size, deleted: toDelete.length };
}

/**
 * Main cleanup function
 */
async function cleanup() {
  try {
    console.log('='.repeat(60));
    console.log('DUPLICATE RECORD CLEANUP SCRIPT (AWS SDK)');
    console.log('='.repeat(60));

    const dividendResults = await cleanupDuplicateDividends();
    const completedResults = await cleanupDuplicateCompletedTransactions();

    console.log('\n' + '='.repeat(60));
    console.log('✅ CLEANUP COMPLETE');
    console.log('='.repeat(60));
    console.log('\nSUMMARY:');
    console.log(`Dividends: ${dividendResults.total} → ${dividendResults.unique} (deleted ${dividendResults.deleted})`);
    console.log(`Completed: ${completedResults.total} → ${completedResults.unique} (deleted ${completedResults.deleted})`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  }
}

// Run cleanup
cleanup();
