// ============================================
// Vanguard Preview Table Component Tests
// ============================================
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VanguardPreviewTable from './VanguardPreviewTable';
import type { ParsedVanguardCSV } from '../types';

const mockData: ParsedVanguardCSV = {
  holdings: [
    {
      accountNumber: '12345',
      investmentName: 'Apple Inc',
      symbol: 'AAPL',
      shares: 100,
      sharePrice: 150.00,
      totalValue: 15000.00,
    },
    {
      accountNumber: '12345',
      investmentName: 'Microsoft Corp',
      symbol: 'MSFT',
      shares: 50,
      sharePrice: 300.00,
      totalValue: 15000.00,
    },
  ],
  transactions: [
    {
      accountNumber: '12345',
      tradeDate: '2024-01-01',
      transactionType: 'Buy',
      symbol: 'AAPL',
      shares: 100,
      sharePrice: 150.00,
      commissionsAndFees: 0,
    },
    {
      accountNumber: '12345',
      tradeDate: '2024-02-01',
      transactionType: 'Sell',
      symbol: 'AAPL',
      shares: -50,
      sharePrice: 160.00,
      netAmount: 8000.00,
      commissionsAndFees: 0,
    },
  ],
  parseDate: '2024-03-01T00:00:00Z',
};

describe('VanguardPreviewTable', () => {
  it('should render with holdings and transactions counts', () => {
    render(<VanguardPreviewTable data={mockData} warnings={[]} />);

    expect(screen.getByText(/Holdings \(2\)/)).toBeInTheDocument();
    expect(screen.getByText(/Transactions \(2\)/)).toBeInTheDocument();
    expect(screen.getByText('Holdings')).toBeInTheDocument();
    expect(screen.getByText('Transactions')).toBeInTheDocument();
  });

  it('should display holdings by default', () => {
    render(<VanguardPreviewTable data={mockData} warnings={[]} />);

    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('MSFT')).toBeInTheDocument();
    expect(screen.getByText('Apple Inc')).toBeInTheDocument();
  });

  it('should switch to transactions tab when clicked', () => {
    render(<VanguardPreviewTable data={mockData} warnings={[]} />);

    const transactionsTab = screen.getByText(/Transactions \(2\)/);
    fireEvent.click(transactionsTab);

    expect(screen.getByText('Buy')).toBeInTheDocument();
    expect(screen.getByText('Sell')).toBeInTheDocument();
  });

  it('should display warnings if provided', () => {
    const warnings = ['Warning 1', 'Warning 2'];
    render(<VanguardPreviewTable data={mockData} warnings={warnings} />);

    expect(screen.getByText(/Warnings \(2\)/)).toBeInTheDocument();
    expect(screen.getByText(/• Warning 1/)).toBeInTheDocument();
  });

  it('should limit displayed warnings to 5', () => {
    const warnings = Array.from({ length: 10 }, (_, i) => `Warning ${i + 1}`);
    render(<VanguardPreviewTable data={mockData} warnings={warnings} />);

    expect(screen.getByText(/Warnings \(10\)/)).toBeInTheDocument();
    expect(screen.getByText(/...and 5 more/)).toBeInTheDocument();
  });

  it('should show holdings count in summary', () => {
    render(<VanguardPreviewTable data={mockData} warnings={[]} />);

    // Check that the holdings count is displayed
    expect(screen.getByText('Holdings')).toBeInTheDocument();
  });

  it('should limit transactions display to first 100', () => {
    const manyTransactions: ParsedVanguardCSV = {
      ...mockData,
      transactions: Array.from({ length: 150 }, (_, i) => ({
        accountNumber: '12345',
        tradeDate: '2024-01-01',
        transactionType: 'Buy',
        symbol: `SYM${i}`,
        shares: 10,
        commissionsAndFees: 0,
      })),
    };

    render(<VanguardPreviewTable data={manyTransactions} warnings={[]} />);

    const transactionsTab = screen.getByText(/Transactions \(150\)/);
    fireEvent.click(transactionsTab);

    expect(screen.getByText(/Showing first 100 of 150 transactions/)).toBeInTheDocument();
  });

  it('should color-code transaction types', () => {
    render(<VanguardPreviewTable data={mockData} warnings={[]} />);

    const transactionsTab = screen.getByText(/Transactions \(2\)/);
    fireEvent.click(transactionsTab);

    const buyBadge = screen.getByText('Buy');
    const sellBadge = screen.getByText('Sell');

    expect(buyBadge).toHaveClass('bg-green-100');
    expect(sellBadge).toHaveClass('bg-red-100');
  });
});
