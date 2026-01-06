import { PDFParse } from 'pdf-parse';
import fs from 'fs';

async function test() {
  try {
    const dataBuffer = fs.readFileSync('D:\\Market\\VanguardTransactions\\customActivityReport (6).pdf');

    console.log('Creating PDFParse instance...');
    const parser = new PDFParse({ data: dataBuffer });

    console.log('Extracting text...');
    const result = await parser.getText();

    console.log('✓ Success!');
    console.log('Text length:', result.text.length);
    console.log('First 500 chars:', result.text.substring(0, 500));

    await parser.destroy();
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

test();
