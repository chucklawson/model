const pdfParse = require('pdf-parse');
const fs = require('fs');

console.log('Testing if pdfParse is callable:', typeof pdfParse);
console.log('Testing PDFParse class:', typeof pdfParse.PDFParse);

// Try to use it as a function (the typical usage pattern)
async function test() {
  try {
    const dataBuffer = fs.readFileSync('D:\\Market\\VanguardTransactions\\customActivityReport (6).pdf');

    // Try calling it directly
    console.log('\nAttempting to call pdfParse(dataBuffer)...');
    const result = await pdfParse(dataBuffer);
    console.log('Success! Result:', typeof result);
  } catch (error) {
    console.log('Error calling as function:', error.message);

    // Maybe we need to use PDFParse class?
    console.log('\nTrying PDFParse class instead...');
    try {
      const parser = new pdfParse.PDFParse();
      console.log('PDFParse instance created:', typeof parser);
    } catch (err) {
      console.log('Error with PDFParse class:', err.message);
    }
  }
}

test();
