// ============================================
// FILE: src/utils/tickerExporter.test.ts
// Ticker Exporter Test Suite
// ============================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateTickerCSV, downloadCSV, exportAllTickers } from './tickerExporter';
import type { TickerLot } from '../types';

describe('tickerExporter', () => {
  describe('generateTickerCSV', () => {
    it('should generate CSV with correct header', () => {
      const lots: TickerLot[] = [];
      const result = generateTickerCSV('AAPL', lots);

      expect(result).toContain('Ticker,Date,Quantity,Cost,Portfolio,BaseYield,CalculatePL,Notes,TotalCost');
    });

    it('should generate CSV for single lot with all fields', () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          calculateAccumulatedProfitLoss: true,
          isDividend: false,
          baseYield: 0.5,
          notes: 'Good entry point',
          totalCost: 15050,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
          owner: 'user1',
        },
      ];

      const result = generateTickerCSV('AAPL', lots);
      const lines = result.split('\n');

      expect(lines).toHaveLength(2); // header + 1 row
      expect(lines[1]).toBe('AAPL,2024-01-15,100,150.5,Tech,0.5,TRUE,"Good entry point",15050');
    });

    it('should generate CSV for multiple lots', () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          calculateAccumulatedProfitLoss: true,
          isDividend: false,
          baseYield: 0.5,
          notes: 'First lot',
          totalCost: 15050,
        },
        {
          id: '2',
          ticker: 'AAPL',
          shares: 50,
          costPerShare: 155.00,
          purchaseDate: '2024-02-01',
          portfolios: ['Growth'],
          calculateAccumulatedProfitLoss: false,
          isDividend: true,
          baseYield: 0.6,
          notes: 'Second lot',
          totalCost: 7750,
        },
      ];

      const result = generateTickerCSV('AAPL', lots);
      const lines = result.split('\n');

      expect(lines).toHaveLength(3); // header + 2 rows
      expect(lines[1]).toBe('AAPL,2024-01-15,100,150.5,Tech,0.5,TRUE,"First lot",15050');
      expect(lines[2]).toBe('AAPL,2024-02-01,50,155,Growth,0.6,FALSE,"Second lot",7750');
    });

    it('should handle multiple portfolios with pipe separator', () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'MSFT',
          shares: 50,
          costPerShare: 380.25,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech', 'Growth', 'Dividend'],
          calculateAccumulatedProfitLoss: true,
          isDividend: false,
          baseYield: 1.2,
          totalCost: 19012.50,
        },
      ];

      const result = generateTickerCSV('MSFT', lots);
      const lines = result.split('\n');

      expect(lines[1]).toContain('Tech|Growth|Dividend');
    });

    it('should escape double quotes in notes', () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          calculateAccumulatedProfitLoss: true,
          isDividend: false,
          baseYield: 0.5,
          notes: 'Company said "great quarter"',
          totalCost: 15050,
        },
      ];

      const result = generateTickerCSV('AAPL', lots);
      const lines = result.split('\n');

      expect(lines[1]).toContain('"Company said ""great quarter"""');
    });

    it('should handle empty notes field', () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          calculateAccumulatedProfitLoss: true,
          isDividend: false,
          baseYield: 0.5,
          totalCost: 15050,
        },
      ];

      const result = generateTickerCSV('AAPL', lots);
      const lines = result.split('\n');

      expect(lines[1]).toContain('""');
    });

    it('should handle undefined notes field', () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          calculateAccumulatedProfitLoss: true,
          isDividend: false,
          baseYield: 0.5,
          notes: undefined,
          totalCost: 15050,
        },
      ];

      const result = generateTickerCSV('AAPL', lots);
      const lines = result.split('\n');

      expect(lines[1]).toContain('""');
    });

    it('should handle notes with commas', () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          calculateAccumulatedProfitLoss: true,
          isDividend: false,
          baseYield: 0.5,
          notes: 'Entry at support, good volume, strong trend',
          totalCost: 15050,
        },
      ];

      const result = generateTickerCSV('AAPL', lots);
      const lines = result.split('\n');

      expect(lines[1]).toContain('"Entry at support, good volume, strong trend"');
    });

    it('should handle notes with newlines', () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          calculateAccumulatedProfitLoss: true,
          isDividend: false,
          baseYield: 0.5,
          notes: 'Line 1\nLine 2\nLine 3',
          totalCost: 15050,
        },
      ];

      const result = generateTickerCSV('AAPL', lots);
      const _lines = result.split('\n');

      expect(result).toContain('"Line 1\nLine 2\nLine 3"');
    });

    it('should convert calculateAccumulatedProfitLoss to TRUE/FALSE', () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          calculateAccumulatedProfitLoss: true,
          isDividend: false,
          baseYield: 0.5,
          totalCost: 15050,
        },
        {
          id: '2',
          ticker: 'AAPL',
          shares: 50,
          costPerShare: 155.00,
          purchaseDate: '2024-02-01',
          portfolios: ['Tech'],
          calculateAccumulatedProfitLoss: false,
          isDividend: false,
          baseYield: 0.5,
          totalCost: 7750,
        },
      ];

      const result = generateTickerCSV('AAPL', lots);
      const lines = result.split('\n');

      expect(lines[1]).toContain(',TRUE,');
      expect(lines[2]).toContain(',FALSE,');
    });

    it('should handle zero baseYield', () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          calculateAccumulatedProfitLoss: true,
          isDividend: false,
          baseYield: 0,
          totalCost: 15050,
        },
      ];

      const result = generateTickerCSV('AAPL', lots);
      const lines = result.split('\n');

      expect(lines[1]).toContain(',0,');
    });

    it('should handle undefined baseYield as 0', () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          calculateAccumulatedProfitLoss: true,
          isDividend: false,
          baseYield: undefined as any,
          totalCost: 15050,
        },
      ];

      const result = generateTickerCSV('AAPL', lots);
      const lines = result.split('\n');

      expect(lines[1]).toContain(',0,');
    });

    it('should handle fractional shares', () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          shares: 100.5,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          calculateAccumulatedProfitLoss: true,
          isDividend: false,
          baseYield: 0.5,
          totalCost: 15125.25,
        },
      ];

      const result = generateTickerCSV('AAPL', lots);
      const lines = result.split('\n');

      expect(lines[1]).toContain(',100.5,');
    });

    it('should handle large cost values', () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'BRK.A',
          shares: 1,
          costPerShare: 540000.00,
          purchaseDate: '2024-01-15',
          portfolios: ['Value'],
          calculateAccumulatedProfitLoss: true,
          isDividend: false,
          baseYield: 0,
          totalCost: 540000.00,
        },
      ];

      const result = generateTickerCSV('BRK.A', lots);
      const lines = result.split('\n');

      expect(lines[1]).toContain(',540000,');
    });

    it('should handle empty portfolio array', () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: [],
          calculateAccumulatedProfitLoss: true,
          isDividend: false,
          baseYield: 0.5,
          totalCost: 15050,
        },
      ];

      const result = generateTickerCSV('AAPL', lots);
      const lines = result.split('\n');

      // Empty array joined with pipe should result in empty string
      expect(lines[1]).toContain(',,');
    });

    it('should generate empty CSV body when no lots provided', () => {
      const result = generateTickerCSV('AAPL', []);
      const lines = result.split('\n');

      expect(lines).toHaveLength(1);
      expect(lines[0]).toBe('Ticker,Date,Quantity,Cost,Portfolio,BaseYield,CalculatePL,Notes,TotalCost');
    });

    it('should handle ticker symbols with special characters', () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'BRK.A',
          shares: 10,
          costPerShare: 540000.00,
          purchaseDate: '2024-01-15',
          portfolios: ['Value'],
          calculateAccumulatedProfitLoss: true,
          isDividend: false,
          baseYield: 0,
          totalCost: 5400000,
        },
      ];

      const result = generateTickerCSV('BRK.A', lots);
      const lines = result.split('\n');

      expect(lines[1]).toContain('BRK.A,');
    });

    it('should preserve decimal precision in costs', () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.567,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          calculateAccumulatedProfitLoss: true,
          isDividend: false,
          baseYield: 0.5,
          totalCost: 15056.7,
        },
      ];

      const result = generateTickerCSV('AAPL', lots);
      const lines = result.split('\n');

      expect(lines[1]).toContain(',150.567,');
    });
  });

  describe('downloadCSV', () => {
    let createElementSpy: any;
    let createObjectURLSpy: any;
    let revokeObjectURLSpy: any;
    let appendChildSpy: any;
    let removeChildSpy: any;
    let clickSpy: any;
    let mockLink: any;

    beforeEach(() => {
      // Mock link element
      mockLink = {
        setAttribute: vi.fn(),
        click: vi.fn(),
        style: {},
      };
      clickSpy = mockLink.click;

      // Mock document.createElement
      createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);

      // Mock document.body methods
      appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
      removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);

      // Mock URL methods
      createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should create a Blob with correct content and type', () => {
      const content = 'Ticker,Date,Quantity\nAAPL,2024-01-15,100';
      const filename = 'AAPL.csv';

      downloadCSV(filename, content);

      // Verify Blob was created (through URL.createObjectURL)
      expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
      const blobArg = createObjectURLSpy.mock.calls[0][0];
      expect(blobArg).toBeInstanceOf(Blob);
      expect(blobArg.type).toBe('text/csv;charset=utf-8;');
    });

    it('should create a link element', () => {
      const content = 'test content';
      const filename = 'test.csv';

      downloadCSV(filename, content);

      expect(createElementSpy).toHaveBeenCalledWith('a');
    });

    it('should set correct attributes on link', () => {
      const content = 'test content';
      const filename = 'AAPL.csv';

      downloadCSV(filename, content);

      expect(mockLink.setAttribute).toHaveBeenCalledWith('href', 'blob:mock-url');
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'AAPL.csv');
    });

    it('should set link visibility to hidden', () => {
      const content = 'test content';
      const filename = 'test.csv';

      downloadCSV(filename, content);

      expect(mockLink.style.visibility).toBe('hidden');
    });

    it('should append link to body, click it, and remove it', () => {
      const content = 'test content';
      const filename = 'test.csv';

      downloadCSV(filename, content);

      expect(appendChildSpy).toHaveBeenCalledWith(mockLink);
      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(removeChildSpy).toHaveBeenCalledWith(mockLink);
    });

    it('should revoke object URL after download', () => {
      const content = 'test content';
      const filename = 'test.csv';

      downloadCSV(filename, content);

      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should handle filenames with special characters', () => {
      const content = 'test content';
      const filename = 'BRK.A-2024.csv';

      downloadCSV(filename, content);

      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'BRK.A-2024.csv');
    });

    it('should handle large CSV content', () => {
      const content = 'Ticker,Date,Quantity\n' + 'AAPL,2024-01-15,100\n'.repeat(1000);
      const filename = 'large.csv';

      downloadCSV(filename, content);

      expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
      expect(clickSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle empty content', () => {
      const content = '';
      const filename = 'empty.csv';

      downloadCSV(filename, content);

      expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
      expect(clickSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('exportAllTickers', () => {
    let _createElementSpy: any;
    let createObjectURLSpy: any;
    let _revokeObjectURLSpy: any;
    let _appendChildSpy: any;
    let _removeChildSpy: any;
    let mockLink: any;

    beforeEach(() => {
      vi.useFakeTimers();

      mockLink = {
        setAttribute: vi.fn(),
        click: vi.fn(),
        style: {},
      };

      _createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      _appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
      _removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);
      createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      _revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.useRealTimers();
    });

    it('should export single ticker', async () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          calculateAccumulatedProfitLoss: true,
          isDividend: false,
          baseYield: 0.5,
          totalCost: 15050,
        },
      ];

      const promise = exportAllTickers(lots);
      await vi.runAllTimersAsync();
      const count = await promise;

      expect(count).toBe(1);
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'AAPL.csv');
    });

    it('should export multiple tickers alphabetically', async () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'MSFT',
          shares: 50,
          costPerShare: 380.25,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          calculateAccumulatedProfitLoss: true,
          isDividend: false,
          baseYield: 1.2,
          totalCost: 19012.50,
        },
        {
          id: '2',
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          calculateAccumulatedProfitLoss: true,
          isDividend: false,
          baseYield: 0.5,
          totalCost: 15050,
        },
        {
          id: '3',
          ticker: 'GOOGL',
          shares: 25,
          costPerShare: 140.00,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          calculateAccumulatedProfitLoss: true,
          isDividend: false,
          baseYield: 0,
          totalCost: 3500,
        },
      ];

      const promise = exportAllTickers(lots);
      await vi.runAllTimersAsync();
      const count = await promise;

      expect(count).toBe(3);

      // Verify alphabetical order: AAPL, GOOGL, MSFT
      const downloadCalls = mockLink.setAttribute.mock.calls
        .filter((call: any) => call[0] === 'download')
        .map((call: any) => call[1]);

      expect(downloadCalls).toEqual(['AAPL.csv', 'GOOGL.csv', 'MSFT.csv']);
    });

    it('should group multiple lots by ticker', async () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          calculateAccumulatedProfitLoss: true,
          isDividend: false,
          baseYield: 0.5,
          totalCost: 15050,
        },
        {
          id: '2',
          ticker: 'AAPL',
          shares: 50,
          costPerShare: 155.00,
          purchaseDate: '2024-02-01',
          portfolios: ['Tech'],
          calculateAccumulatedProfitLoss: false,
          isDividend: false,
          baseYield: 0.5,
          totalCost: 7750,
        },
      ];

      const promise = exportAllTickers(lots);
      await vi.runAllTimersAsync();
      const count = await promise;

      expect(count).toBe(1);
      expect(mockLink.click).toHaveBeenCalledTimes(1);
    });

    it('should convert ticker symbols to uppercase', async () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'aapl',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          calculateAccumulatedProfitLoss: true,
          isDividend: false,
          baseYield: 0.5,
          totalCost: 15050,
        },
        {
          id: '2',
          ticker: 'AAPL',
          shares: 50,
          costPerShare: 155.00,
          purchaseDate: '2024-02-01',
          portfolios: ['Tech'],
          calculateAccumulatedProfitLoss: false,
          isDividend: false,
          baseYield: 0.5,
          totalCost: 7750,
        },
      ];

      const promise = exportAllTickers(lots);
      await vi.runAllTimersAsync();
      const count = await promise;

      // Both lots should be grouped as AAPL
      expect(count).toBe(1);
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'AAPL.csv');
    });

    it('should add delay between downloads', async () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          calculateAccumulatedProfitLoss: true,
          isDividend: false,
          baseYield: 0.5,
          totalCost: 15050,
        },
        {
          id: '2',
          ticker: 'MSFT',
          shares: 50,
          costPerShare: 380.25,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          calculateAccumulatedProfitLoss: true,
          isDividend: false,
          baseYield: 1.2,
          totalCost: 19012.50,
        },
      ];

      const promise = exportAllTickers(lots);

      // First download should happen immediately
      await vi.advanceTimersByTimeAsync(0);
      expect(mockLink.click).toHaveBeenCalledTimes(1);

      // Second download should happen after 100ms delay
      await vi.advanceTimersByTimeAsync(100);
      expect(mockLink.click).toHaveBeenCalledTimes(2);

      const count = await promise;
      expect(count).toBe(2);
    });

    it('should not add delay after last download', async () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          calculateAccumulatedProfitLoss: true,
          isDividend: false,
          baseYield: 0.5,
          totalCost: 15050,
        },
      ];

      const promise = exportAllTickers(lots);
      await vi.runAllTimersAsync();
      const count = await promise;

      expect(count).toBe(1);
      // Should not have any pending timers
      expect(vi.getTimerCount()).toBe(0);
    });

    it('should return 0 for empty lots array', async () => {
      const promise = exportAllTickers([]);
      await vi.runAllTimersAsync();
      const count = await promise;

      expect(count).toBe(0);
      expect(mockLink.click).not.toHaveBeenCalled();
    });

    it('should handle tickers with mixed case in original data', async () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'aApL',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          calculateAccumulatedProfitLoss: true,
          isDividend: false,
          baseYield: 0.5,
          totalCost: 15050,
        },
        {
          id: '2',
          ticker: 'MsFt',
          shares: 50,
          costPerShare: 380.25,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          calculateAccumulatedProfitLoss: true,
          isDividend: false,
          baseYield: 1.2,
          totalCost: 19012.50,
        },
      ];

      const promise = exportAllTickers(lots);
      await vi.runAllTimersAsync();
      const count = await promise;

      expect(count).toBe(2);

      const downloadCalls = mockLink.setAttribute.mock.calls
        .filter((call: any) => call[0] === 'download')
        .map((call: any) => call[1]);

      expect(downloadCalls).toEqual(['AAPL.csv', 'MSFT.csv']);
    });

    it('should handle large number of tickers', async () => {
      const lots: TickerLot[] = Array.from({ length: 10 }, (_, i) => ({
        id: `${i + 1}`,
        ticker: `TICK${i + 1}`,
        shares: 100,
        costPerShare: 50.00,
        purchaseDate: '2024-01-15',
        portfolios: ['Portfolio'],
        calculateAccumulatedProfitLoss: true,
        isDividend: false,
        baseYield: 0,
        totalCost: 5000,
      }));

      const promise = exportAllTickers(lots);
      await vi.runAllTimersAsync();
      const count = await promise;

      expect(count).toBe(10);
      expect(mockLink.click).toHaveBeenCalledTimes(10);
    });

    it('should maintain lot order within each ticker group', async () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          calculateAccumulatedProfitLoss: true,
          isDividend: false,
          baseYield: 0.5,
          notes: 'First',
          totalCost: 15050,
        },
        {
          id: '2',
          ticker: 'AAPL',
          shares: 50,
          costPerShare: 155.00,
          purchaseDate: '2024-02-01',
          portfolios: ['Tech'],
          calculateAccumulatedProfitLoss: false,
          isDividend: false,
          baseYield: 0.5,
          notes: 'Second',
          totalCost: 7750,
        },
        {
          id: '3',
          ticker: 'AAPL',
          shares: 25,
          costPerShare: 160.00,
          purchaseDate: '2024-03-01',
          portfolios: ['Tech'],
          calculateAccumulatedProfitLoss: false,
          isDividend: false,
          baseYield: 0.5,
          notes: 'Third',
          totalCost: 4000,
        },
      ];

      const promise = exportAllTickers(lots);
      await vi.runAllTimersAsync();
      await promise;

      // Verify the CSV content was created with a Blob
      const blobArg = createObjectURLSpy.mock.calls[0][0];
      expect(blobArg).toBeInstanceOf(Blob);

      // Test the underlying function to verify order preservation
      const csv = generateTickerCSV('AAPL', lots);
      const lines = csv.split('\n');

      // Should have header + 3 rows
      expect(lines).toHaveLength(4);

      // Verify order is preserved
      expect(lines[1]).toContain('"First"');
      expect(lines[2]).toContain('"Second"');
      expect(lines[3]).toContain('"Third"');
    });
  });

  describe('Edge Cases and Integration', () => {
    it('should handle lot with all optional fields missing', () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          calculateAccumulatedProfitLoss: false,
          isDividend: false,
          baseYield: 0,
          totalCost: 15050,
        },
      ];

      const result = generateTickerCSV('AAPL', lots);
      const lines = result.split('\n');

      expect(lines).toHaveLength(2);
      expect(lines[1]).toBe('AAPL,2024-01-15,100,150.5,Tech,0,FALSE,"",15050');
    });

    it('should handle negative shares (edge case)', () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          shares: -100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          calculateAccumulatedProfitLoss: true,
          isDividend: false,
          baseYield: 0.5,
          totalCost: -15050,
        },
      ];

      const result = generateTickerCSV('AAPL', lots);
      const lines = result.split('\n');

      expect(lines[1]).toContain(',-100,');
    });

    it('should handle very high precision decimals', () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          shares: 100.123456789,
          costPerShare: 150.987654321,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          calculateAccumulatedProfitLoss: true,
          isDividend: false,
          baseYield: 0.123456789,
          totalCost: 15114.814814789,
        },
      ];

      const result = generateTickerCSV('AAPL', lots);
      const lines = result.split('\n');

      expect(lines[1]).toContain('100.123456789');
      expect(lines[1]).toContain('150.987654321');
    });

    it('should handle notes with special CSV characters', () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          calculateAccumulatedProfitLoss: true,
          isDividend: false,
          baseYield: 0.5,
          notes: 'Special chars: "quotes", commas,, pipes||, newlines\n\nand tabs\t\there',
          totalCost: 15050,
        },
      ];

      const result = generateTickerCSV('AAPL', lots);

      // Should properly escape quotes
      expect(result).toContain('""quotes""');
    });

    it('should handle portfolio names with special characters', () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech-Growth', 'High|Yield', 'Dividend,Income'],
          calculateAccumulatedProfitLoss: true,
          isDividend: false,
          baseYield: 0.5,
          totalCost: 15050,
        },
      ];

      const result = generateTickerCSV('AAPL', lots);

      // Portfolios joined with pipe
      expect(result).toContain('Tech-Growth|High|Yield|Dividend,Income');
    });

    it('should handle date formats consistently', () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          calculateAccumulatedProfitLoss: true,
          isDividend: false,
          baseYield: 0.5,
          totalCost: 15050,
        },
        {
          id: '2',
          ticker: 'AAPL',
          shares: 50,
          costPerShare: 155.00,
          purchaseDate: '2024-12-31',
          portfolios: ['Tech'],
          calculateAccumulatedProfitLoss: false,
          isDividend: false,
          baseYield: 0.5,
          totalCost: 7750,
        },
      ];

      const result = generateTickerCSV('AAPL', lots);
      const lines = result.split('\n');

      expect(lines[1]).toContain(',2024-01-15,');
      expect(lines[2]).toContain(',2024-12-31,');
    });

    it('should handle totalCost of zero', () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          shares: 0,
          costPerShare: 0,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          calculateAccumulatedProfitLoss: true,
          isDividend: false,
          baseYield: 0,
          totalCost: 0,
        },
      ];

      const result = generateTickerCSV('AAPL', lots);
      const lines = result.split('\n');

      expect(lines[1]).toContain(',0');
      expect(lines[1].endsWith(',0')).toBe(true);
    });
  });
});
