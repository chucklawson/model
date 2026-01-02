// ============================================
// FILE: src/utils/importDeduplication.test.ts
// Tests for Import Deduplication Utilities
// ============================================

import { describe, it, expect, vi } from 'vitest';
import {
  generateFileHash,
  generateTransactionKey,
  generateBatchId,
  checkDuplicateImport,
  checkDuplicateTransaction,
  batchCheckDuplicateTransactions,
  filterDuplicateTransactions,
  createImportHistory,
  updateImportHistory,
} from './importDeduplication';
import type { VanguardTransaction } from '../types';

// ===== FILE HASH GENERATION =====

describe('generateFileHash', () => {
  it('should generate consistent SHA-256 hash for same content', async () => {
    const content = 'Test file content';
    const hash1 = await generateFileHash(content);
    const hash2 = await generateFileHash(content);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex characters
  });

  it('should generate different hashes for different content', async () => {
    const content1 = 'Test file content 1';
    const content2 = 'Test file content 2';

    const hash1 = await generateFileHash(content1);
    const hash2 = await generateFileHash(content2);

    expect(hash1).not.toBe(hash2);
  });

  it('should handle empty content', async () => {
    const hash = await generateFileHash('');
    expect(hash).toHaveLength(64);
  });

  it('should handle large content', async () => {
    const largeContent = 'A'.repeat(1000000); // 1MB of 'A's
    const hash = await generateFileHash(largeContent);
    expect(hash).toHaveLength(64);
  });
});

// ===== TRANSACTION KEY GENERATION =====

describe('generateTransactionKey', () => {
  it('should generate unique key for transaction', () => {
    const txn: VanguardTransaction = {
      accountNumber: '12345',
      tradeDate: '2024-01-01',
      symbol: 'AAPL',
      shares: 100,
      transactionType: 'Buy',
      commissionsAndFees: 0,
    };

    const key = generateTransactionKey(txn);
    expect(key).toBe('12345|2024-01-01|AAPL|100|Buy');
  });

  it('should generate different keys for different transactions', () => {
    const txn1: VanguardTransaction = {
      accountNumber: '12345',
      tradeDate: '2024-01-01',
      symbol: 'AAPL',
      shares: 100,
      transactionType: 'Buy',
      commissionsAndFees: 0,
    };

    const txn2: VanguardTransaction = {
      accountNumber: '12345',
      tradeDate: '2024-01-01',
      symbol: 'AAPL',
      shares: 50, // Different shares
      transactionType: 'Buy',
      commissionsAndFees: 0,
    };

    const key1 = generateTransactionKey(txn1);
    const key2 = generateTransactionKey(txn2);

    expect(key1).not.toBe(key2);
  });

  it('should generate same key for identical transactions', () => {
    const txn1: VanguardTransaction = {
      accountNumber: '12345',
      tradeDate: '2024-01-01',
      symbol: 'AAPL',
      shares: 100,
      transactionType: 'Buy',
      commissionsAndFees: 0,
    };

    const txn2: VanguardTransaction = {
      accountNumber: '12345',
      tradeDate: '2024-01-01',
      symbol: 'AAPL',
      shares: 100,
      transactionType: 'Buy',
      commissionsAndFees: 5.99, // Different fee, but shouldn't affect key
    };

    const key1 = generateTransactionKey(txn1);
    const key2 = generateTransactionKey(txn2);

    expect(key1).toBe(key2);
  });

  it('should handle negative shares (sells)', () => {
    const txn: VanguardTransaction = {
      accountNumber: '12345',
      tradeDate: '2024-01-01',
      symbol: 'AAPL',
      shares: -100,
      transactionType: 'Sell',
      commissionsAndFees: 0,
    };

    const key = generateTransactionKey(txn);
    expect(key).toBe('12345|2024-01-01|AAPL|-100|Sell');
  });

  it('should handle fractional shares', () => {
    const txn: VanguardTransaction = {
      accountNumber: '12345',
      tradeDate: '2024-01-01',
      symbol: 'AAPL',
      shares: 100.5,
      transactionType: 'Buy',
      commissionsAndFees: 0,
    };

    const key = generateTransactionKey(txn);
    expect(key).toBe('12345|2024-01-01|AAPL|100.5|Buy');
  });
});

// ===== BATCH ID GENERATION =====

describe('generateBatchId', () => {
  it('should generate batch ID with timestamp', () => {
    const fileName = 'vanguard-data.csv';
    const batchId = generateBatchId(fileName);

    // Should contain file name and timestamp
    expect(batchId).toContain('vanguard-data-csv');
    expect(batchId).toMatch(/^vanguard-data-csv-\d+$/);

    // Timestamp should be recent (within last few seconds)
    const timestamp = parseInt(batchId.split('-').pop()!);
    const now = Date.now();
    expect(timestamp).toBeGreaterThan(now - 5000);
    expect(timestamp).toBeLessThanOrEqual(now);
  });

  it('should include sanitized file name', () => {
    const fileName = 'vanguard-data.csv';
    const batchId = generateBatchId(fileName);

    expect(batchId).toContain('vanguard-data-csv');
  });

  it('should sanitize special characters in file name', () => {
    const fileName = 'my file (2024).csv';
    const batchId = generateBatchId(fileName);

    // Should replace special characters with hyphens
    expect(batchId).toMatch(/^my-file--2024--csv-\d+$/);
  });

  it('should handle file name with no extension', () => {
    const fileName = 'vanguard-data';
    const batchId = generateBatchId(fileName);

    expect(batchId).toContain('vanguard-data');
  });

  it('should include timestamp', () => {
    const fileName = 'test.csv';
    const batchId = generateBatchId(fileName);

    // Should end with a numeric timestamp
    expect(batchId).toMatch(/\d+$/);
  });
});

// ===== DATABASE OPERATIONS (MOCKED) =====

describe('checkDuplicateImport', () => {
  it('should return null when no duplicate found', async () => {
    const mockClient = {
      models: {
        ImportHistory: {
          list: vi.fn().mockResolvedValue({ data: [] }),
        },
      },
    } as any;

    const result = await checkDuplicateImport('abc123', mockClient);

    expect(result).toBeNull();
    expect(mockClient.models.ImportHistory.list).toHaveBeenCalledWith({
      filter: {
        fileHash: { eq: 'abc123' }
      }
    });
  });

  it('should return most recent import when duplicate found', async () => {
    const import1 = {
      id: '1',
      fileHash: 'abc123',
      importDate: '2024-01-01T00:00:00Z',
      sourceFileName: 'file1.csv',
    };

    const import2 = {
      id: '2',
      fileHash: 'abc123',
      importDate: '2024-01-02T00:00:00Z',
      sourceFileName: 'file2.csv',
    };

    const mockClient = {
      models: {
        ImportHistory: {
          list: vi.fn().mockResolvedValue({ data: [import1, import2] }),
        },
      },
    } as any;

    const result = await checkDuplicateImport('abc123', mockClient);

    expect(result).toBe(import2); // Should return most recent
  });

  it('should handle database errors', async () => {
    const mockClient = {
      models: {
        ImportHistory: {
          list: vi.fn().mockRejectedValue(new Error('Database error')),
        },
      },
    } as any;

    await expect(checkDuplicateImport('abc123', mockClient)).rejects.toThrow('Failed to check duplicate import');
  });
});

describe('checkDuplicateTransaction', () => {
  const mockTransaction: VanguardTransaction = {
    accountNumber: '12345',
    tradeDate: '2024-01-01',
    symbol: 'AAPL',
    shares: 100,
    transactionType: 'Buy',
    commissionsAndFees: 0,
  };

  it('should return false when no duplicate found', async () => {
    const mockClient = {
      models: {
        Transaction: {
          list: vi.fn().mockResolvedValue({ data: [] }),
        },
      },
    } as any;

    const result = await checkDuplicateTransaction(mockTransaction, mockClient);

    expect(result).toBe(false);
  });

  it('should return true when duplicate found', async () => {
    const mockClient = {
      models: {
        Transaction: {
          list: vi.fn().mockResolvedValue({ data: [{ id: '1' }] }),
        },
      },
    } as any;

    const result = await checkDuplicateTransaction(mockTransaction, mockClient);

    expect(result).toBe(true);
  });

  it('should query with correct filters', async () => {
    const mockClient = {
      models: {
        Transaction: {
          list: vi.fn().mockResolvedValue({ data: [] }),
        },
      },
    } as any;

    await checkDuplicateTransaction(mockTransaction, mockClient);

    expect(mockClient.models.Transaction.list).toHaveBeenCalledWith({
      filter: {
        and: [
          { accountNumber: { eq: '12345' } },
          { tradeDate: { eq: '2024-01-01' } },
          { symbol: { eq: 'AAPL' } },
          { shares: { eq: 100 } },
          { transactionType: { eq: 'Buy' } }
        ]
      }
    });
  });

  it('should handle database errors', async () => {
    const mockClient = {
      models: {
        Transaction: {
          list: vi.fn().mockRejectedValue(new Error('Database error')),
        },
      },
    } as any;

    await expect(checkDuplicateTransaction(mockTransaction, mockClient)).rejects.toThrow('Failed to check duplicate transaction');
  });
});

describe('batchCheckDuplicateTransactions', () => {
  const transactions: VanguardTransaction[] = [
    {
      accountNumber: '12345',
      tradeDate: '2024-01-01',
      symbol: 'AAPL',
      shares: 100,
      transactionType: 'Buy',
      commissionsAndFees: 0,
    },
    {
      accountNumber: '12345',
      tradeDate: '2024-01-02',
      symbol: 'MSFT',
      shares: 50,
      transactionType: 'Buy',
      commissionsAndFees: 0,
    },
  ];

  it('should check all transactions', async () => {
    const mockClient = {
      models: {
        Transaction: {
          list: vi.fn()
            .mockResolvedValueOnce({ data: [{ id: '1' }] }) // First is duplicate
            .mockResolvedValueOnce({ data: [] }), // Second is not
        },
      },
    } as any;

    const results = await batchCheckDuplicateTransactions(transactions, mockClient);

    expect(results).toEqual([true, false]);
    expect(mockClient.models.Transaction.list).toHaveBeenCalledTimes(2);
  });

  it('should handle empty array', async () => {
    const mockClient = {
      models: {
        Transaction: {
          list: vi.fn(),
        },
      },
    } as any;

    const results = await batchCheckDuplicateTransactions([], mockClient);

    expect(results).toEqual([]);
    expect(mockClient.models.Transaction.list).not.toHaveBeenCalled();
  });
});

describe('filterDuplicateTransactions', () => {
  const transactions: VanguardTransaction[] = [
    {
      accountNumber: '12345',
      tradeDate: '2024-01-01',
      symbol: 'AAPL',
      shares: 100,
      transactionType: 'Buy',
      commissionsAndFees: 0,
    },
    {
      accountNumber: '12345',
      tradeDate: '2024-01-02',
      symbol: 'MSFT',
      shares: 50,
      transactionType: 'Buy',
      commissionsAndFees: 0,
    },
    {
      accountNumber: '12345',
      tradeDate: '2024-01-03',
      symbol: 'GOOGL',
      shares: 25,
      transactionType: 'Buy',
      commissionsAndFees: 0,
    },
  ];

  it('should separate unique and duplicate transactions', async () => {
    const mockClient = {
      models: {
        Transaction: {
          list: vi.fn()
            .mockResolvedValueOnce({ data: [{ id: '1' }] }) // First is duplicate
            .mockResolvedValueOnce({ data: [] }) // Second is unique
            .mockResolvedValueOnce({ data: [{ id: '2' }] }), // Third is duplicate
        },
      },
    } as any;

    const result = await filterDuplicateTransactions(transactions, mockClient);

    expect(result.unique).toHaveLength(1);
    expect(result.unique[0].symbol).toBe('MSFT');
    expect(result.duplicates).toHaveLength(2);
    expect(result.duplicates[0].symbol).toBe('AAPL');
    expect(result.duplicates[1].symbol).toBe('GOOGL');
  });

  it('should handle all unique transactions', async () => {
    const mockClient = {
      models: {
        Transaction: {
          list: vi.fn().mockResolvedValue({ data: [] }),
        },
      },
    } as any;

    const result = await filterDuplicateTransactions(transactions, mockClient);

    expect(result.unique).toHaveLength(3);
    expect(result.duplicates).toHaveLength(0);
  });

  it('should handle all duplicate transactions', async () => {
    const mockClient = {
      models: {
        Transaction: {
          list: vi.fn().mockResolvedValue({ data: [{ id: '1' }] }),
        },
      },
    } as any;

    const result = await filterDuplicateTransactions(transactions, mockClient);

    expect(result.unique).toHaveLength(0);
    expect(result.duplicates).toHaveLength(3);
  });
});

describe('createImportHistory', () => {
  it('should create import history record', async () => {
    const mockImportHistory = {
      id: '1',
      batchId: 'batch-123',
      fileHash: 'abc123',
    };

    const mockClient = {
      models: {
        ImportHistory: {
          create: vi.fn().mockResolvedValue({ data: mockImportHistory, errors: null }),
        },
      },
    } as any;

    const result = await createImportHistory(
      'batch-123',
      'abc123',
      'test.csv',
      {
        totalTransactions: 100,
        holdingsImported: 10,
        transactionsImported: 90,
        duplicatesSkipped: 5,
        errorsEncountered: 0,
        status: 'completed',
      },
      mockClient
    );

    expect(result).toBe(mockImportHistory);
    expect(mockClient.models.ImportHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        batchId: 'batch-123',
        fileHash: 'abc123',
        sourceFileName: 'test.csv',
        totalTransactions: 100,
        transactionsImported: 90,
        duplicatesSkipped: 5,
        status: 'completed',
      })
    );
  });

  it('should handle errors from database', async () => {
    const mockClient = {
      models: {
        ImportHistory: {
          create: vi.fn().mockResolvedValue({
            data: null,
            errors: [{ message: 'Validation error' }]
          }),
        },
      },
    } as any;

    await expect(
      createImportHistory(
        'batch-123',
        'abc123',
        'test.csv',
        {
          totalTransactions: 100,
          holdingsImported: 10,
          transactionsImported: 90,
          duplicatesSkipped: 5,
          errorsEncountered: 0,
          status: 'completed',
        },
        mockClient
      )
    ).rejects.toThrow('Failed to create import history');
  });
});

describe('updateImportHistory', () => {
  it('should update import history record', async () => {
    const mockUpdated = {
      id: '1',
      status: 'completed',
      transactionsImported: 100,
    };

    const mockClient = {
      models: {
        ImportHistory: {
          update: vi.fn().mockResolvedValue({ data: mockUpdated, errors: null }),
        },
      },
    } as any;

    const result = await updateImportHistory(
      '1',
      {
        status: 'completed',
        transactionsImported: 100,
      },
      mockClient
    );

    expect(result).toBe(mockUpdated);
    expect(mockClient.models.ImportHistory.update).toHaveBeenCalledWith({
      id: '1',
      status: 'completed',
      transactionsImported: 100,
    });
  });

  it('should handle errors from database', async () => {
    const mockClient = {
      models: {
        ImportHistory: {
          update: vi.fn().mockResolvedValue({
            data: null,
            errors: [{ message: 'Update error' }]
          }),
        },
      },
    } as any;

    await expect(
      updateImportHistory('1', { status: 'failed' }, mockClient)
    ).rejects.toThrow('Failed to update import history');
  });
});
