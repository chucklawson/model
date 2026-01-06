import { PDFParse } from 'pdf-parse';
import fs from 'fs';

async function debug() {
  const dataBuffer = fs.readFileSync('D:\\Market\\VanguardTransactions\\customActivityReport (6).pdf');
  const parser = new PDFParse({ data: dataBuffer });
  const result = await parser.getText();

  console.log('=== FULL TEXT ===');
  console.log(result.text);
  console.log('\n=== LINES ===');
  const lines = result.text.split('\n');
  lines.forEach((line, i) => {
    console.log(`Line ${i}: "${line}"`);
  });

  await parser.destroy();
}

debug();
