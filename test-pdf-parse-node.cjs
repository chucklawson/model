const pdfParse = require('pdf-parse/node');

console.log('pdfParse type:', typeof pdfParse);
console.log('pdfParse keys:', Object.keys(pdfParse));
console.log('pdfParse.default:', typeof pdfParse.default);

if (typeof pdfParse === 'function') {
  console.log('✓ pdfParse is a function!');
} else if (typeof pdfParse.default === 'function') {
  console.log('✓ pdfParse.default is a function!');
} else {
  console.log('pdfParse itself:', pdfParse);
}
