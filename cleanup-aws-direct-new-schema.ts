import { DynamoDBClient, ScanCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-2' });
const tableSuffix = 'aobfqsdvibajfnofx3qajb3tfe-NONE';

async function deleteAllItemsTransaction(tableName: string) {
  console.log(`\n🗑️  Deleting all items from ${tableName}...`);

  let deletedCount = 0;
  let lastEvaluatedKey = undefined;

  do {
    const scanResult = await client.send(new ScanCommand({
      TableName: tableName,
      ExclusiveStartKey: lastEvaluatedKey,
    }));

    if (scanResult.Items && scanResult.Items.length > 0) {
      for (const item of scanResult.Items) {
        await client.send(new DeleteItemCommand({
          TableName: tableName,
          Key: {
            transactionId: item.transactionId
          }
        }));
        deletedCount++;
        if (deletedCount % 100 === 0) {
          console.log(`  Deleted ${deletedCount} items...`);
        }
      }
    }

    lastEvaluatedKey = scanResult.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  console.log(`✅ Deleted ${deletedCount} items from ${tableName}`);
}

async function deleteAllItemsCompletedTransaction(tableName: string) {
  console.log(`\n🗑️  Deleting all items from ${tableName}...`);

  let deletedCount = 0;
  let lastEvaluatedKey = undefined;

  do {
    const scanResult = await client.send(new ScanCommand({
      TableName: tableName,
      ExclusiveStartKey: lastEvaluatedKey,
    }));

    if (scanResult.Items && scanResult.Items.length > 0) {
      for (const item of scanResult.Items) {
        await client.send(new DeleteItemCommand({
          TableName: tableName,
          Key: {
            buyTransactionId: item.buyTransactionId,
            sellTransactionId: item.sellTransactionId
          }
        }));
        deletedCount++;
        if (deletedCount % 100 === 0) {
          console.log(`  Deleted ${deletedCount} items...`);
        }
      }
    }

    lastEvaluatedKey = scanResult.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  console.log(`✅ Deleted ${deletedCount} items from ${tableName}`);
}

async function deleteAllItemsDividend(tableName: string) {
  console.log(`\n🗑️  Deleting all items from ${tableName}...`);

  let deletedCount = 0;
  let lastEvaluatedKey = undefined;

  do {
    const scanResult = await client.send(new ScanCommand({
      TableName: tableName,
      ExclusiveStartKey: lastEvaluatedKey,
    }));

    if (scanResult.Items && scanResult.Items.length > 0) {
      for (const item of scanResult.Items) {
        await client.send(new DeleteItemCommand({
          TableName: tableName,
          Key: {
            transactionId: item.transactionId
          }
        }));
        deletedCount++;
        if (deletedCount % 100 === 0) {
          console.log(`  Deleted ${deletedCount} items...`);
        }
      }
    }

    lastEvaluatedKey = scanResult.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  console.log(`✅ Deleted ${deletedCount} items from ${tableName}`);
}

async function deleteAllItemsStandard(tableName: string) {
  console.log(`\n🗑️  Deleting all items from ${tableName}...`);

  let deletedCount = 0;
  let lastEvaluatedKey = undefined;

  do {
    const scanResult = await client.send(new ScanCommand({
      TableName: tableName,
      ExclusiveStartKey: lastEvaluatedKey,
    }));

    if (scanResult.Items && scanResult.Items.length > 0) {
      for (const item of scanResult.Items) {
        await client.send(new DeleteItemCommand({
          TableName: tableName,
          Key: {
            id: item.id
          }
        }));
        deletedCount++;
      }
    }

    lastEvaluatedKey = scanResult.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  console.log(`✅ Deleted ${deletedCount} items from ${tableName}`);
}

async function cleanup() {
  console.log('🧹 Starting cleanup of Vanguard import tables...');

  try {
    await deleteAllItemsTransaction(`Transaction-${tableSuffix}`);
    await deleteAllItemsCompletedTransaction(`CompletedTransaction-${tableSuffix}`);
    await deleteAllItemsDividend(`DividendTransaction-${tableSuffix}`);
    await deleteAllItemsStandard(`ImportHistory-${tableSuffix}`);

    console.log('\n✨ Cleanup complete!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanup();
