// ============================================
// FILE: src/utils/csvImporter.test.ts
// CSV Importer Test Suite
// ============================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { importCSVData, formatImportSummary } from './csvImporter';
import logger from './logger';
import type {
  ValidationResult,
  ParsedCSVRow,
  Portfolio,
  Ticker,
  ImportProgress,
  ImportResult,
} from '../types';

describe('csvImporter', () => {
  // Mock client for AWS Amplify
  const createMockClient = () => {
    const mockCreate = vi.fn();
    return {
      models: {
        Portfolio: {
          create: mockCreate,
        },
        Ticker: {
          create: mockCreate,
        },
        TickerLot: {
          create: mockCreate,
        },
      },
      _mockCreate: mockCreate, // For easy access in tests
    };
  };

  // Helper function to create a valid parsed CSV row
  const createValidRow = (overrides: Partial<ParsedCSVRow> = {}): ParsedCSVRow => ({
    ticker: 'AAPL',
    companyName: 'Apple Inc.',
    baseYield: 0.5,
    expectedFiveYearGrowth: 10.0,
    shares: 100,
    costPerShare: 150.0,
    purchaseDate: '2024-01-15',
    portfolios: ['Tech'],
    calculateAccumulatedProfitLoss: true,
    isDividend: false,
    notes: 'Test note',
    rowIndex: 1,
    originalRow: 'AAPL,Apple Inc.,0.5,10.0,100,150.0,2024-01-15,Tech,true,false,Test note',
    ...overrides,
  });

  // Helper function to create a valid validation result
  const createValidationResult = (
    overrides: Partial<ValidationResult> = {}
  ): ValidationResult => ({
    row: createValidRow(),
    status: 'valid',
    errors: [],
    isDuplicate: false,
    ...overrides,
  });

  // Mock existing data
  const mockExistingPortfolios: Portfolio[] = [
    {
      id: '1',
      name: 'Tech',
      description: 'Technology portfolio',
    },
    {
      id: '2',
      name: 'Growth',
      description: 'Growth portfolio',
    },
  ];

  const mockExistingTickers: Ticker[] = [
    {
      id: '1',
      symbol: 'AAPL',
      companyName: 'Apple Inc.',
      baseYield: 0.5,
      expectedFiveYearGrowth: 10.0,
    },
    {
      id: '2',
      symbol: 'MSFT',
      companyName: 'Microsoft Corp.',
      baseYield: 0.8,
      expectedFiveYearGrowth: 12.0,
    },
  ];

  describe('importCSVData', () => {
    describe('Basic Import Functionality', () => {
      it('should import valid rows successfully', async () => {
        const mockClient = createMockClient();
        mockClient._mockCreate.mockResolvedValue({ data: {} });

        const validationResults: ValidationResult[] = [
          createValidationResult({
            row: createValidRow({ ticker: 'AAPL', portfolios: ['Tech'] }),
          }),
        ];

        const result = await importCSVData(
          validationResults,
          mockClient as any,
          mockExistingTickers,
          mockExistingPortfolios
        );

        expect(result.totalRows).toBe(1);
        expect(result.imported).toBe(1);
        expect(result.failed).toBe(0);
        expect(result.skipped).toBe(0);
        expect(result.details).toHaveLength(1);
        expect(result.details[0].status).toBe('success');
      });

      it('should import multiple valid rows', async () => {
        const mockClient = createMockClient();
        mockClient._mockCreate.mockResolvedValue({ data: {} });

        const validationResults: ValidationResult[] = [
          createValidationResult({
            row: createValidRow({ ticker: 'AAPL', shares: 100 }),
          }),
          createValidationResult({
            row: createValidRow({ ticker: 'GOOGL', shares: 50 }),
          }),
          createValidationResult({
            row: createValidRow({ ticker: 'MSFT', shares: 75 }),
          }),
        ];

        const result = await importCSVData(
          validationResults,
          mockClient as any,
          mockExistingTickers,
          mockExistingPortfolios
        );

        expect(result.totalRows).toBe(3);
        expect(result.imported).toBe(3);
        expect(result.failed).toBe(0);
        expect(result.details).toHaveLength(3);
        expect(result.details.every(d => d.status === 'success')).toBe(true);
      });

      it('should calculate totalCost correctly when creating lots', async () => {
        const mockClient = createMockClient();
        mockClient._mockCreate.mockResolvedValue({ data: {} });

        const validationResults: ValidationResult[] = [
          createValidationResult({
            row: createValidRow({ shares: 100, costPerShare: 150.50 }),
          }),
        ];

        await importCSVData(
          validationResults,
          mockClient as any,
          mockExistingTickers,
          mockExistingPortfolios
        );

        const tickerLotCall = mockClient._mockCreate.mock.calls.find(
          call => call[0].ticker === 'AAPL'
        );
        expect(tickerLotCall[0].totalCost).toBe(15050); // 100 * 150.50
      });

      it('should use default values for optional fields', async () => {
        const mockClient = createMockClient();
        mockClient._mockCreate.mockResolvedValue({ data: {} });

        const validationResults: ValidationResult[] = [
          createValidationResult({
            row: createValidRow({
              calculateAccumulatedProfitLoss: undefined,
              isDividend: undefined,
              notes: undefined,
            }),
          }),
        ];

        await importCSVData(
          validationResults,
          mockClient as any,
          mockExistingTickers,
          mockExistingPortfolios
        );

        const tickerLotCall = mockClient._mockCreate.mock.calls.find(
          call => call[0].ticker === 'AAPL'
        );
        expect(tickerLotCall[0].calculateAccumulatedProfitLoss).toBe(true);
        expect(tickerLotCall[0].isDividend).toBe(false);
        expect(tickerLotCall[0].notes).toBe('');
      });
    });

    describe('Portfolio Creation', () => {
      it('should create new portfolios that do not exist', async () => {
        const mockClient = createMockClient();
        mockClient._mockCreate.mockResolvedValue({ data: {} });

        const validationResults: ValidationResult[] = [
          createValidationResult({
            row: createValidRow({ portfolios: ['NewPortfolio'] }),
          }),
        ];

        const result = await importCSVData(
          validationResults,
          mockClient as any,
          mockExistingTickers,
          mockExistingPortfolios
        );

        expect(result.portfoliosCreated).toContain('NewPortfolio');
        const portfolioCall = mockClient._mockCreate.mock.calls.find(
          call => call[0].name === 'NewPortfolio'
        );
        expect(portfolioCall).toBeDefined();
        expect(portfolioCall[0].description).toBe('Auto-created from CSV import');
      });

      it('should not create portfolios that already exist (case-insensitive)', async () => {
        const mockClient = createMockClient();
        mockClient._mockCreate.mockResolvedValue({ data: {} });

        const validationResults: ValidationResult[] = [
          createValidationResult({
            row: createValidRow({ portfolios: ['tech'] }), // lowercase, already exists
          }),
        ];

        const result = await importCSVData(
          validationResults,
          mockClient as any,
          mockExistingTickers,
          mockExistingPortfolios
        );

        expect(result.portfoliosCreated).toHaveLength(0);
        const portfolioCalls = mockClient._mockCreate.mock.calls.filter(
          call => call[0].name === 'tech' || call[0].name === 'Tech'
        );
        expect(portfolioCalls).toHaveLength(0);
      });

      it('should create multiple new portfolios', async () => {
        const mockClient = createMockClient();
        mockClient._mockCreate.mockResolvedValue({ data: {} });

        const validationResults: ValidationResult[] = [
          createValidationResult({
            row: createValidRow({ portfolios: ['Portfolio1', 'Portfolio2'] }),
          }),
          createValidationResult({
            row: createValidRow({ portfolios: ['Portfolio2', 'Portfolio3'] }),
          }),
        ];

        const result = await importCSVData(
          validationResults,
          mockClient as any,
          mockExistingTickers,
          mockExistingPortfolios
        );

        expect(result.portfoliosCreated).toHaveLength(3);
        expect(result.portfoliosCreated).toContain('Portfolio1');
        expect(result.portfoliosCreated).toContain('Portfolio2');
        expect(result.portfoliosCreated).toContain('Portfolio3');
      });

      it('should handle portfolio creation errors gracefully', async () => {
        const mockClient = createMockClient();
        mockClient._mockCreate.mockImplementation((data: any) => {
          if (data.name === 'FailPortfolio') {
            return Promise.reject(new Error('Portfolio creation failed'));
          }
          return Promise.resolve({ data: {} });
        });

        const loggerErrorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});

        const validationResults: ValidationResult[] = [
          createValidationResult({
            row: createValidRow({ portfolios: ['FailPortfolio'] }),
          }),
        ];

        const result = await importCSVData(
          validationResults,
          mockClient as any,
          mockExistingTickers,
          mockExistingPortfolios
        );

        expect(result.portfoliosCreated).toHaveLength(0);
        expect(loggerErrorSpy).toHaveBeenCalled();

        loggerErrorSpy.mockRestore();
      });

      it('should sort portfolios to create alphabetically', async () => {
        const mockClient = createMockClient();
        const createdPortfolios: string[] = [];
        mockClient._mockCreate.mockImplementation((data: any) => {
          if (data.name) {
            createdPortfolios.push(data.name);
          }
          return Promise.resolve({ data: {} });
        });

        const validationResults: ValidationResult[] = [
          createValidationResult({
            row: createValidRow({ portfolios: ['Zebra', 'Alpha', 'Beta'] }),
          }),
        ];

        await importCSVData(
          validationResults,
          mockClient as any,
          mockExistingTickers,
          mockExistingPortfolios
        );

        const portfolioNames = createdPortfolios.filter(
          name => ['Alpha', 'Beta', 'Zebra'].includes(name)
        );
        expect(portfolioNames).toEqual(['Alpha', 'Beta', 'Zebra']);
      });
    });

    describe('Ticker Creation', () => {
      it('should create new tickers that do not exist', async () => {
        const mockClient = createMockClient();
        mockClient._mockCreate.mockResolvedValue({ data: {} });

        const validationResults: ValidationResult[] = [
          createValidationResult({
            row: createValidRow({
              ticker: 'GOOGL',
              companyName: 'Alphabet Inc.',
              baseYield: 0.3,
            }),
          }),
        ];

        const result = await importCSVData(
          validationResults,
          mockClient as any,
          mockExistingTickers,
          mockExistingPortfolios
        );

        expect(result.tickersCreated).toBe(1);
        const tickerCall = mockClient._mockCreate.mock.calls.find(
          call => call[0].symbol === 'GOOGL'
        );
        expect(tickerCall).toBeDefined();
        expect(tickerCall[0].companyName).toBe('Alphabet Inc.');
        expect(tickerCall[0].baseYield).toBe(0.3);
      });

      it('should skip creating tickers that already exist', async () => {
        const mockClient = createMockClient();
        mockClient._mockCreate.mockResolvedValue({ data: {} });

        const validationResults: ValidationResult[] = [
          createValidationResult({
            row: createValidRow({ ticker: 'AAPL' }), // Already exists
          }),
        ];

        const result = await importCSVData(
          validationResults,
          mockClient as any,
          mockExistingTickers,
          mockExistingPortfolios
        );

        expect(result.tickersCreated).toBe(0);
        expect(result.tickersSkipped).toBe(1);
        const tickerCalls = mockClient._mockCreate.mock.calls.filter(
          call => call[0].symbol === 'AAPL'
        );
        expect(tickerCalls).toHaveLength(0);
      });

      it('should check ticker existence case-insensitively', async () => {
        const mockClient = createMockClient();
        mockClient._mockCreate.mockResolvedValue({ data: {} });

        const validationResults: ValidationResult[] = [
          createValidationResult({
            row: createValidRow({ ticker: 'aapl' }), // lowercase, but AAPL exists
          }),
        ];

        const result = await importCSVData(
          validationResults,
          mockClient as any,
          mockExistingTickers,
          mockExistingPortfolios
        );

        expect(result.tickersCreated).toBe(0);
        expect(result.tickersSkipped).toBe(1);
      });

      it('should create tickers with default values for missing fields', async () => {
        const mockClient = createMockClient();
        mockClient._mockCreate.mockResolvedValue({ data: {} });

        const validationResults: ValidationResult[] = [
          createValidationResult({
            row: createValidRow({
              ticker: 'GOOGL',
              companyName: undefined,
              baseYield: undefined,
            }),
          }),
        ];

        await importCSVData(
          validationResults,
          mockClient as any,
          mockExistingTickers,
          mockExistingPortfolios
        );

        const tickerCall = mockClient._mockCreate.mock.calls.find(
          call => call[0].symbol === 'GOOGL'
        );
        expect(tickerCall[0].companyName).toBe('');
        expect(tickerCall[0].baseYield).toBe(0);
      });

      it('should handle ticker creation errors gracefully', async () => {
        const mockClient = createMockClient();
        mockClient._mockCreate.mockImplementation((data: any) => {
          if (data.symbol === 'FAIL') {
            return Promise.reject(new Error('Ticker creation failed'));
          }
          return Promise.resolve({ data: {} });
        });

        const loggerErrorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});

        const validationResults: ValidationResult[] = [
          createValidationResult({
            row: createValidRow({ ticker: 'FAIL' }),
          }),
        ];

        const result = await importCSVData(
          validationResults,
          mockClient as any,
          mockExistingTickers,
          mockExistingPortfolios
        );

        expect(result.tickersCreated).toBe(0);
        expect(loggerErrorSpy).toHaveBeenCalled();

        loggerErrorSpy.mockRestore();
      });

      it('should create each unique ticker only once even if used in multiple rows', async () => {
        const mockClient = createMockClient();
        mockClient._mockCreate.mockResolvedValue({ data: {} });

        const validationResults: ValidationResult[] = [
          createValidationResult({
            row: createValidRow({ ticker: 'GOOGL', shares: 100 }),
          }),
          createValidationResult({
            row: createValidRow({ ticker: 'GOOGL', shares: 50 }),
          }),
          createValidationResult({
            row: createValidRow({ ticker: 'GOOGL', shares: 75 }),
          }),
        ];

        const result = await importCSVData(
          validationResults,
          mockClient as any,
          mockExistingTickers,
          mockExistingPortfolios
        );

        expect(result.tickersCreated).toBe(1);
        const tickerCalls = mockClient._mockCreate.mock.calls.filter(
          call => call[0].symbol === 'GOOGL'
        );
        expect(tickerCalls).toHaveLength(1);
      });
    });

    describe('Duplicate and Invalid Row Handling', () => {
      it('should skip duplicate rows', async () => {
        const mockClient = createMockClient();
        mockClient._mockCreate.mockResolvedValue({ data: {} });

        const validationResults: ValidationResult[] = [
          createValidationResult({
            row: createValidRow({ ticker: 'AAPL' }),
            status: 'duplicate',
            isDuplicate: true,
            duplicateReason: 'Identical lot already exists',
          }),
        ];

        const result = await importCSVData(
          validationResults,
          mockClient as any,
          mockExistingTickers,
          mockExistingPortfolios
        );

        expect(result.totalRows).toBe(1);
        expect(result.imported).toBe(0);
        expect(result.skipped).toBe(1);
        expect(result.details[0].status).toBe('skipped');
        expect(result.details[0].reason).toBe('Identical lot already exists');
      });

      it('should skip invalid rows', async () => {
        const mockClient = createMockClient();
        mockClient._mockCreate.mockResolvedValue({ data: {} });

        const validationResults: ValidationResult[] = [
          createValidationResult({
            row: createValidRow({ ticker: '' }),
            status: 'invalid',
            errors: [
              { field: 'ticker', message: 'Ticker symbol is required' },
            ],
          }),
        ];

        const result = await importCSVData(
          validationResults,
          mockClient as any,
          mockExistingTickers,
          mockExistingPortfolios
        );

        expect(result.totalRows).toBe(1);
        expect(result.imported).toBe(0);
        expect(result.details[0].status).toBe('skipped');
        expect(result.details[0].reason).toBe('Ticker symbol is required');
      });

      it('should handle mix of valid, duplicate, and invalid rows', async () => {
        const mockClient = createMockClient();
        mockClient._mockCreate.mockResolvedValue({ data: {} });

        const validationResults: ValidationResult[] = [
          createValidationResult({
            row: createValidRow({ ticker: 'AAPL', shares: 100 }),
            status: 'valid',
          }),
          createValidationResult({
            row: createValidRow({ ticker: 'MSFT', shares: 50 }),
            status: 'duplicate',
            duplicateReason: 'Duplicate',
          }),
          createValidationResult({
            row: createValidRow({ ticker: '', shares: 75 }),
            status: 'invalid',
            errors: [{ field: 'ticker', message: 'Required' }],
          }),
          createValidationResult({
            row: createValidRow({ ticker: 'GOOGL', shares: 25 }),
            status: 'valid',
          }),
        ];

        const result = await importCSVData(
          validationResults,
          mockClient as any,
          mockExistingTickers,
          mockExistingPortfolios
        );

        expect(result.totalRows).toBe(4);
        expect(result.imported).toBe(2);
        expect(result.skipped).toBe(1);
        expect(result.details.filter(d => d.status === 'success')).toHaveLength(2);
        expect(result.details.filter(d => d.status === 'skipped')).toHaveLength(2);
      });

      it('should combine multiple error messages for invalid rows', async () => {
        const mockClient = createMockClient();
        mockClient._mockCreate.mockResolvedValue({ data: {} });

        const validationResults: ValidationResult[] = [
          createValidationResult({
            row: createValidRow(),
            status: 'invalid',
            errors: [
              { field: 'ticker', message: 'Invalid ticker' },
              { field: 'shares', message: 'Invalid shares' },
            ],
          }),
        ];

        const result = await importCSVData(
          validationResults,
          mockClient as any,
          mockExistingTickers,
          mockExistingPortfolios
        );

        expect(result.details[0].status).toBe('skipped');
        expect(result.details[0].reason).toBe('Invalid ticker, Invalid shares');
      });
    });

    describe('Error Handling', () => {
      it('should handle lot creation errors and continue processing', async () => {
        const mockClient = createMockClient();
        mockClient._mockCreate.mockImplementation((data: any) => {
          if (data.ticker === 'FAIL') {
            return Promise.reject(new Error('Database error'));
          }
          return Promise.resolve({ data: {} });
        });

        const loggerErrorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});

        const validationResults: ValidationResult[] = [
          createValidationResult({
            row: createValidRow({ ticker: 'FAIL' }),
          }),
          createValidationResult({
            row: createValidRow({ ticker: 'AAPL' }),
          }),
        ];

        const result = await importCSVData(
          validationResults,
          mockClient as any,
          mockExistingTickers,
          mockExistingPortfolios
        );

        expect(result.imported).toBe(1);
        expect(result.failed).toBe(1);
        expect(result.details.find(d => d.row.ticker === 'FAIL')?.status).toBe('failed');
        expect(result.details.find(d => d.row.ticker === 'FAIL')?.reason).toBe('Database error');
        expect(result.details.find(d => d.row.ticker === 'AAPL')?.status).toBe('success');

        loggerErrorSpy.mockRestore();
      });

      it('should include error message in failed lot details', async () => {
        const mockClient = createMockClient();
        mockClient._mockCreate.mockRejectedValue(new Error('Connection timeout'));

        const loggerErrorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});

        const validationResults: ValidationResult[] = [
          createValidationResult({
            row: createValidRow({ ticker: 'AAPL' }),
          }),
        ];

        const result = await importCSVData(
          validationResults,
          mockClient as any,
          mockExistingTickers,
          mockExistingPortfolios
        );

        expect(result.failed).toBe(1);
        expect(result.details[0].status).toBe('failed');
        expect(result.details[0].reason).toBe('Connection timeout');

        loggerErrorSpy.mockRestore();
      });

      it('should handle non-Error exceptions', async () => {
        const mockClient = createMockClient();
        mockClient._mockCreate.mockRejectedValue('String error');

        const loggerErrorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});

        const validationResults: ValidationResult[] = [
          createValidationResult({
            row: createValidRow({ ticker: 'AAPL' }),
          }),
        ];

        const result = await importCSVData(
          validationResults,
          mockClient as any,
          mockExistingTickers,
          mockExistingPortfolios
        );

        expect(result.failed).toBe(1);
        expect(result.details[0].reason).toBe('Unknown error');

        loggerErrorSpy.mockRestore();
      });
    });

    describe('Progress Callback', () => {
      it('should call progress callback with correct values', async () => {
        const mockClient = createMockClient();
        mockClient._mockCreate.mockResolvedValue({ data: {} });

        const progressUpdates: ImportProgress[] = [];
        const onProgress = (progress: ImportProgress) => {
          progressUpdates.push({ ...progress });
        };

        const validationResults: ValidationResult[] = [
          createValidationResult({
            row: createValidRow({ ticker: 'AAPL' }),
          }),
        ];

        await importCSVData(
          validationResults,
          mockClient as any,
          mockExistingTickers,
          mockExistingPortfolios,
          onProgress
        );

        expect(progressUpdates.length).toBeGreaterThan(0);
        expect(progressUpdates[0].current).toBe(1);
        expect(progressUpdates[0].total).toBeGreaterThan(0);
        expect(progressUpdates[0].percentage).toBeGreaterThanOrEqual(0);
        expect(progressUpdates[0].percentage).toBeLessThanOrEqual(100);
        expect(progressUpdates[0].currentOperation).toBeDefined();
      });

      it('should not fail if progress callback is not provided', async () => {
        const mockClient = createMockClient();
        mockClient._mockCreate.mockResolvedValue({ data: {} });

        const validationResults: ValidationResult[] = [
          createValidationResult({
            row: createValidRow({ ticker: 'AAPL' }),
          }),
        ];

        await expect(
          importCSVData(
            validationResults,
            mockClient as any,
            mockExistingTickers,
            mockExistingPortfolios
          )
        ).resolves.toBeDefined();
      });

      it('should update progress percentage correctly', async () => {
        const mockClient = createMockClient();
        mockClient._mockCreate.mockResolvedValue({ data: {} });

        const progressUpdates: ImportProgress[] = [];
        const onProgress = (progress: ImportProgress) => {
          progressUpdates.push({ ...progress });
        };

        const validationResults: ValidationResult[] = [
          createValidationResult({
            row: createValidRow({ ticker: 'AAPL', portfolios: ['Tech'] }),
          }),
        ];

        await importCSVData(
          validationResults,
          mockClient as any,
          mockExistingTickers,
          mockExistingPortfolios,
          onProgress
        );

        // Check that percentage increases monotonically
        for (let i = 1; i < progressUpdates.length; i++) {
          expect(progressUpdates[i].percentage).toBeGreaterThanOrEqual(
            progressUpdates[i - 1].percentage
          );
        }

        // Should have multiple progress updates
        expect(progressUpdates.length).toBeGreaterThan(0);

        // First update should start low
        expect(progressUpdates[0].percentage).toBeGreaterThan(0);

        // Find the "Import complete!" update
        const completeUpdate = progressUpdates.find(p => p.currentOperation === 'Import complete!');
        expect(completeUpdate).toBeDefined();
        if (completeUpdate) {
          expect(completeUpdate.percentage).toBeGreaterThan(0);
        }
      });

      it('should include descriptive operation messages', async () => {
        const mockClient = createMockClient();
        mockClient._mockCreate.mockResolvedValue({ data: {} });

        const progressUpdates: ImportProgress[] = [];
        const onProgress = (progress: ImportProgress) => {
          progressUpdates.push({ ...progress });
        };

        const validationResults: ValidationResult[] = [
          createValidationResult({
            row: createValidRow({
              ticker: 'GOOGL',
              shares: 100,
              portfolios: ['NewPortfolio'],
            }),
          }),
        ];

        await importCSVData(
          validationResults,
          mockClient as any,
          mockExistingTickers,
          mockExistingPortfolios,
          onProgress
        );

        const operations = progressUpdates.map(p => p.currentOperation);
        expect(operations).toContain('Checking portfolios...');
        expect(operations).toContain('Creating portfolio: NewPortfolio');
        expect(operations).toContain('Processing tickers...');
        expect(operations).toContain('Creating ticker: GOOGL');
        expect(operations.some(op => op.includes('Importing GOOGL'))).toBe(true);
        expect(operations).toContain('Import complete!');
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty validation results', async () => {
        const mockClient = createMockClient();
        mockClient._mockCreate.mockResolvedValue({ data: {} });

        const validationResults: ValidationResult[] = [];

        const result = await importCSVData(
          validationResults,
          mockClient as any,
          mockExistingTickers,
          mockExistingPortfolios
        );

        expect(result.totalRows).toBe(0);
        expect(result.imported).toBe(0);
        expect(result.skipped).toBe(0);
        expect(result.failed).toBe(0);
        expect(result.details).toHaveLength(0);
      });

      it('should handle rows with multiple portfolios', async () => {
        const mockClient = createMockClient();
        mockClient._mockCreate.mockResolvedValue({ data: {} });

        const validationResults: ValidationResult[] = [
          createValidationResult({
            row: createValidRow({
              portfolios: ['Tech', 'Growth', 'Dividend'],
            }),
          }),
        ];

        const result = await importCSVData(
          validationResults,
          mockClient as any,
          mockExistingTickers,
          mockExistingPortfolios
        );

        expect(result.imported).toBe(1);
        const lotCall = mockClient._mockCreate.mock.calls.find(
          call => call[0].ticker === 'AAPL'
        );
        expect(lotCall[0].portfolios).toEqual(['Tech', 'Growth', 'Dividend']);
      });

      it('should handle rows with empty portfolio names (filtered out)', async () => {
        const mockClient = createMockClient();
        mockClient._mockCreate.mockResolvedValue({ data: {} });

        const validationResults: ValidationResult[] = [
          createValidationResult({
            row: createValidRow({
              portfolios: ['Tech', '  ', 'Growth'],
            }),
          }),
        ];

        const result = await importCSVData(
          validationResults,
          mockClient as any,
          mockExistingTickers,
          mockExistingPortfolios
        );

        // Empty/whitespace portfolio should not be created
        const portfolioCreationCalls = mockClient._mockCreate.mock.calls.filter(
          call => call[0].description === 'Auto-created from CSV import'
        );
        const emptyPortfolio = portfolioCreationCalls.find(
          call => call[0].name.trim() === ''
        );
        expect(emptyPortfolio).toBeUndefined();
      });

      it('should handle large batch of rows', async () => {
        const mockClient = createMockClient();
        mockClient._mockCreate.mockResolvedValue({ data: {} });

        const validationResults: ValidationResult[] = Array.from(
          { length: 100 },
          (_, i) =>
            createValidationResult({
              row: createValidRow({
                ticker: `TICK${i}`,
                shares: 10 + i,
                rowIndex: i,
              }),
            })
        );

        const result = await importCSVData(
          validationResults,
          mockClient as any,
          mockExistingTickers,
          mockExistingPortfolios
        );

        expect(result.totalRows).toBe(100);
        expect(result.imported).toBe(100);
        expect(result.failed).toBe(0);
      });

      it('should handle very small share amounts', async () => {
        const mockClient = createMockClient();
        mockClient._mockCreate.mockResolvedValue({ data: {} });

        const validationResults: ValidationResult[] = [
          createValidationResult({
            row: createValidRow({
              shares: 0.001,
              costPerShare: 1000000.0,
            }),
          }),
        ];

        const result = await importCSVData(
          validationResults,
          mockClient as any,
          mockExistingTickers,
          mockExistingPortfolios
        );

        expect(result.imported).toBe(1);
        const lotCall = mockClient._mockCreate.mock.calls.find(
          call => call[0].ticker === 'AAPL'
        );
        expect(lotCall[0].totalCost).toBe(1000); // 0.001 * 1000000
      });

      it('should handle rows with very long notes', async () => {
        const mockClient = createMockClient();
        mockClient._mockCreate.mockResolvedValue({ data: {} });

        const longNotes = 'A'.repeat(1000);
        const validationResults: ValidationResult[] = [
          createValidationResult({
            row: createValidRow({ notes: longNotes }),
          }),
        ];

        const result = await importCSVData(
          validationResults,
          mockClient as any,
          mockExistingTickers,
          mockExistingPortfolios
        );

        expect(result.imported).toBe(1);
        const lotCall = mockClient._mockCreate.mock.calls.find(
          call => call[0].ticker === 'AAPL'
        );
        expect(lotCall[0].notes).toBe(longNotes);
      });
    });

    describe('Complex Scenarios', () => {
      it('should handle complete import workflow with new portfolios and tickers', async () => {
        const mockClient = createMockClient();
        mockClient._mockCreate.mockResolvedValue({ data: {} });

        const validationResults: ValidationResult[] = [
          createValidationResult({
            row: createValidRow({
              ticker: 'GOOGL',
              portfolios: ['NewTech', 'Innovation'],
            }),
          }),
          createValidationResult({
            row: createValidRow({
              ticker: 'AMZN',
              portfolios: ['NewTech', 'Growth'],
            }),
          }),
        ];

        const result = await importCSVData(
          validationResults,
          mockClient as any,
          mockExistingTickers,
          mockExistingPortfolios
        );

        expect(result.imported).toBe(2);
        expect(result.portfoliosCreated).toContain('NewTech');
        expect(result.portfoliosCreated).toContain('Innovation');
        expect(result.tickersCreated).toBe(2);
      });

      it('should maintain correct counts with mixed validation statuses', async () => {
        const mockClient = createMockClient();
        mockClient._mockCreate.mockResolvedValue({ data: {} });

        const validationResults: ValidationResult[] = [
          // Valid
          createValidationResult({
            row: createValidRow({ ticker: 'GOOGL', shares: 100 }),
            status: 'valid',
          }),
          // Duplicate
          createValidationResult({
            row: createValidRow({ ticker: 'AAPL', shares: 50 }),
            status: 'duplicate',
            duplicateReason: 'Duplicate',
          }),
          // Invalid
          createValidationResult({
            row: createValidRow({ ticker: '', shares: 75 }),
            status: 'invalid',
            errors: [{ field: 'ticker', message: 'Required' }],
          }),
          // Valid
          createValidationResult({
            row: createValidRow({ ticker: 'TSLA', shares: 25 }),
            status: 'valid',
          }),
          // Duplicate
          createValidationResult({
            row: createValidRow({ ticker: 'MSFT', shares: 30 }),
            status: 'duplicate',
            duplicateReason: 'Duplicate',
          }),
        ];

        const result = await importCSVData(
          validationResults,
          mockClient as any,
          mockExistingTickers,
          mockExistingPortfolios
        );

        expect(result.totalRows).toBe(5);
        expect(result.imported).toBe(2);
        expect(result.skipped).toBe(2); // Only duplicates counted in skipped
        expect(result.failed).toBe(0);
        expect(result.details).toHaveLength(5);
      });
    });
  });

  describe('formatImportSummary', () => {
    it('should format basic import result', () => {
      const result: ImportResult = {
        totalRows: 10,
        imported: 8,
        skipped: 2,
        failed: 0,
        tickersCreated: 3,
        tickersSkipped: 2,
        portfoliosCreated: [],
        details: [],
      };

      const summary = formatImportSummary(result);

      expect(summary).toContain('Import Complete!');
      expect(summary).toContain('Total rows: 10');
      expect(summary).toContain('✓ Imported: 8 lots');
      expect(summary).toContain('⊝ Skipped: 2 lots (duplicates)');
      expect(summary).toContain('Created: 3 new');
      expect(summary).toContain('Skipped: 2 existing');
    });

    it('should include failed count when failures exist', () => {
      const result: ImportResult = {
        totalRows: 10,
        imported: 7,
        skipped: 2,
        failed: 1,
        tickersCreated: 3,
        tickersSkipped: 2,
        portfoliosCreated: [],
        details: [],
      };

      const summary = formatImportSummary(result);

      expect(summary).toContain('✗ Failed: 1 lots');
    });

    it('should not include failed count when there are no failures', () => {
      const result: ImportResult = {
        totalRows: 10,
        imported: 8,
        skipped: 2,
        failed: 0,
        tickersCreated: 3,
        tickersSkipped: 2,
        portfoliosCreated: [],
        details: [],
      };

      const summary = formatImportSummary(result);

      expect(summary).not.toContain('Failed');
    });

    it('should include created portfolios when they exist', () => {
      const result: ImportResult = {
        totalRows: 10,
        imported: 8,
        skipped: 2,
        failed: 0,
        tickersCreated: 3,
        tickersSkipped: 2,
        portfoliosCreated: ['Tech', 'Growth', 'Dividend'],
        details: [],
      };

      const summary = formatImportSummary(result);

      expect(summary).toContain('Portfolios created: Tech, Growth, Dividend');
    });

    it('should not include portfolio section when none created', () => {
      const result: ImportResult = {
        totalRows: 10,
        imported: 8,
        skipped: 2,
        failed: 0,
        tickersCreated: 3,
        tickersSkipped: 2,
        portfoliosCreated: [],
        details: [],
      };

      const summary = formatImportSummary(result);

      expect(summary).not.toContain('Portfolios created:');
    });

    it('should handle zero values correctly', () => {
      const result: ImportResult = {
        totalRows: 0,
        imported: 0,
        skipped: 0,
        failed: 0,
        tickersCreated: 0,
        tickersSkipped: 0,
        portfoliosCreated: [],
        details: [],
      };

      const summary = formatImportSummary(result);

      expect(summary).toContain('Total rows: 0');
      expect(summary).toContain('✓ Imported: 0 lots');
      expect(summary).toContain('⊝ Skipped: 0 lots (duplicates)');
      expect(summary).toContain('Created: 0 new');
      expect(summary).toContain('Skipped: 0 existing');
    });

    it('should format multi-line output correctly', () => {
      const result: ImportResult = {
        totalRows: 100,
        imported: 95,
        skipped: 3,
        failed: 2,
        tickersCreated: 10,
        tickersSkipped: 5,
        portfoliosCreated: ['Portfolio1', 'Portfolio2'],
        details: [],
      };

      const summary = formatImportSummary(result);
      const lines = summary.split('\n');

      expect(lines[0]).toBe('Import Complete!');
      expect(lines[1]).toBe('');
      expect(lines.length).toBeGreaterThan(5);
    });

    it('should use correct formatting for large numbers', () => {
      const result: ImportResult = {
        totalRows: 10000,
        imported: 9500,
        skipped: 300,
        failed: 200,
        tickersCreated: 1000,
        tickersSkipped: 500,
        portfoliosCreated: [],
        details: [],
      };

      const summary = formatImportSummary(result);

      expect(summary).toContain('Total rows: 10000');
      expect(summary).toContain('✓ Imported: 9500 lots');
      expect(summary).toContain('⊝ Skipped: 300 lots (duplicates)');
      expect(summary).toContain('✗ Failed: 200 lots');
      expect(summary).toContain('Created: 1000 new');
      expect(summary).toContain('Skipped: 500 existing');
    });
  });
});
