#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { parseVanguardPdf } from './src/utils/vanguardPdfParser';
import { generateVanguardCSV } from './src/utils/vanguardCsvGenerator';
import { parseVanguardCSV } from './src/utils/vanguardCsvParser';
import { validateVanguardCSV } from './src/utils/vanguardCsvValidator';

/**
 * Command-line interface for converting Vanguard PDF to CSV
 */

interface CliOptions {
  inputPdf: string;
  outputCsv?: string;
  validate: boolean;
  accountOverride?: string;
  verbose: boolean;
}

function printUsage() {
  console.log(`
Usage: convert-vanguard-pdf <input.pdf> [output.csv] [options]

Convert Vanguard PDF transaction reports to VanguardCSV format.

Arguments:
  input.pdf          Path to the Vanguard PDF file (required)
  output.csv         Path for the output CSV file (optional)
                     Default: same name as PDF with .csv extension

Options:
  --validate         Run CSV validator after conversion
  --account <num>    Override account number (if PDF header missing)
  --verbose          Show detailed logging
  --help             Show this help message

Examples:
  convert-vanguard-pdf report.pdf
  convert-vanguard-pdf report.pdf output.csv --validate
  convert-vanguard-pdf report.pdf --account 68411173
`);
}

function parseArguments(args: string[]): CliOptions | null {
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    return null;
  }

  const options: CliOptions = {
    inputPdf: '',
    validate: false,
    verbose: false,
  };

  const positionalArgs: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--validate') {
      options.validate = true;
    } else if (arg === '--verbose') {
      options.verbose = true;
    } else if (arg === '--account') {
      options.accountOverride = args[++i];
    } else if (!arg.startsWith('--')) {
      positionalArgs.push(arg);
    }
  }

  if (positionalArgs.length === 0) {
    console.error('Error: Input PDF file is required');
    printUsage();
    return null;
  }

  options.inputPdf = positionalArgs[0];

  if (positionalArgs.length > 1) {
    options.outputCsv = positionalArgs[1];
  }

  return options;
}

function generateOutputPath(inputPdf: string): string {
  const parsedPath = path.parse(inputPdf);
  const baseName = parsedPath.name;
  const dir = parsedPath.dir;

  const outputPath = path.join(dir, `${baseName}.csv`);

  // Check if file exists, if so add timestamp
  if (fs.existsSync(outputPath)) {
    const timestamp = new Date().toISOString()
      .replace(/:/g, '')
      .replace(/\..+/, '')
      .replace('T', '_');
    return path.join(dir, `${baseName}_${timestamp}.csv`);
  }

  return outputPath;
}

async function main() {
  const args = process.argv.slice(2);
  const options = parseArguments(args);

  if (!options) {
    process.exit(1);
  }

  try {
    // Check if input file exists
    if (!fs.existsSync(options.inputPdf)) {
      console.error(`Error: Input file not found: ${options.inputPdf}`);
      process.exit(1);
    }

    console.log(`Converting Vanguard PDF to CSV...`);
    console.log(`Input:  ${options.inputPdf}`);

    // Parse PDF
    if (options.verbose) {
      console.log('Parsing PDF...');
    }

    const pdfData = await parseVanguardPdf(options.inputPdf);

    // Override account number if provided
    const accountNumber = options.accountOverride || pdfData.accountNumber;

    if (options.verbose) {
      console.log(`Account Number: ${accountNumber}`);
      console.log(`Transactions found: ${pdfData.transactions.length}`);
    }

    if (pdfData.transactions.length === 0) {
      console.warn('Warning: No transactions found in PDF');
    }

    // Generate CSV
    if (options.verbose) {
      console.log('Generating CSV...');
    }

    const csvContent = generateVanguardCSV(accountNumber, pdfData.transactions);

    // Determine output path
    const outputPath = options.outputCsv || generateOutputPath(options.inputPdf);
    console.log(`Output: ${outputPath}`);

    // Write CSV file
    fs.writeFileSync(outputPath, csvContent, 'utf-8');

    console.log(`\n✓ Conversion successful!`);
    console.log(`  Transactions converted: ${pdfData.transactions.length}`);

    // Validate if requested
    if (options.validate) {
      console.log('\nValidating CSV...');

      try {
        const parsed = parseVanguardCSV(csvContent);
        const validation = validateVanguardCSV(parsed);

        if (validation.isValid) {
          console.log('✓ CSV validation passed!');
        } else {
          console.error('✗ CSV validation failed:');
          validation.errors.forEach((error) => {
            console.error(`  - Row ${error.row}, ${error.field}: ${error.message}`);
          });
          process.exit(3);
        }
      } catch (error) {
        console.error('✗ CSV validation error:');
        console.error(`  ${error}`);
        process.exit(3);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('\n✗ Conversion failed:');
    console.error(error);
    process.exit(2);
  }
}

main();
