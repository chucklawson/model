import { PDFParse } from 'pdf-parse';
import fs from 'fs';

async function debug() {
  const dataBuffer = fs.readFileSync('D:\\Market\\VanguardTransactions\\customActivityReport (7).pdf');
  const parser = new PDFParse({ data: dataBuffer });
  const result = await parser.getText();

  const lines = result.text.split('\n');

  // Find the first few transaction lines
  console.log('=== First 50 lines ===');
  for (let i = 0; i < Math.min(50, lines.length); i++) {
    console.log(`Line ${i}: "${lines[i]}"`);
  }

  await parser.destroy();
}

debug();
