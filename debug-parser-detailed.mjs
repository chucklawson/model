import { PDFParse } from 'pdf-parse';
import fs from 'fs';

function isTransactionStart(line) {
  const datePattern = /^\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}\/\d{1,2}\/\d{4}/;
  return datePattern.test(line.trim());
}

async function debug() {
  const dataBuffer = fs.readFileSync('D:\\Market\\VanguardTransactions\\customActivityReport (6).pdf');
  const parser = new PDFParse({ data: dataBuffer });
  const result = await parser.getText();
  const text = result.text;
  await parser.destroy();

  const lines = text.split('\n');

  console.log('Total lines:', lines.length);
  console.log('\n=== Testing transaction detection ===');

  let transactionCount = 0;
  let currentTransactionLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip filters
    if (!trimmed ||
        trimmed.includes('Settlement') ||
        trimmed.includes('Custom report') ||
        trimmed.includes('Page ') ||
        trimmed.includes('--') ||
        trimmed.includes('continued') ||
        trimmed.includes('DISCLOSURES')) {
      continue;
    }

    if (isTransactionStart(trimmed)) {
      if (currentTransactionLines.length > 0) {
        transactionCount++;
        const txnText = currentTransactionLines.join(' ');
        console.log(`\nTransaction ${transactionCount}:`);
        console.log(`  Lines accumulated: ${currentTransactionLines.length}`);
        console.log(`  Text: ${txnText.substring(0, 100)}...`);
      }
      currentTransactionLines = [trimmed];
      console.log(`\nLine ${i} starts new transaction: "${trimmed.substring(0, 80)}..."`);
    } else {
      if (currentTransactionLines.length > 0) {
        currentTransactionLines.push(trimmed);
        console.log(`  Line ${i} accumulated: "${trimmed}"`);
      }
    }
  }

  // Last transaction
  if (currentTransactionLines.length > 0) {
    transactionCount++;
    console.log(`\nTransaction ${transactionCount} (last):`);
    console.log(`  Text: ${currentTransactionLines.join(' ')}`);
  }

  console.log(`\n\nTotal transactions detected: ${transactionCount}`);
}

debug();
