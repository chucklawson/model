// ============================================
// Import Vanguard CSV Modal Component Tests
// ============================================
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ImportVanguardCSVModal from './ImportVanguardCSVModal';

// Mock AWS Amplify
vi.mock('aws-amplify/data', () => ({
  generateClient: () => ({}),
}));

describe('ImportVanguardCSVModal', () => {
  const mockOnClose = vi.fn();
  const mockOnImportComplete = vi.fn();

  it('should render upload step initially', () => {
    render(
      <ImportVanguardCSVModal
        onClose={mockOnClose}
        onImportComplete={mockOnImportComplete}
      />
    );

    expect(screen.getByText('Import Vanguard CSV')).toBeInTheDocument();
    expect(screen.getByText(/Click to select Vanguard CSV file/)).toBeInTheDocument();
  });

  it('should display close button', () => {
    render(
      <ImportVanguardCSVModal
        onClose={mockOnClose}
        onImportComplete={mockOnImportComplete}
      />
    );

    const closeButton = screen.getByRole('button', { name: '' }); // X button has no text
    expect(closeButton).toBeInTheDocument();
  });

  it('should show what will be imported', () => {
    render(
      <ImportVanguardCSVModal
        onClose={mockOnClose}
        onImportComplete={mockOnImportComplete}
      />
    );

    expect(screen.getByText(/Holdings snapshot/)).toBeInTheDocument();
    expect(screen.getByText(/Transaction history/)).toBeInTheDocument();
    expect(screen.getByText(/Matched buy\/sell pairs/)).toBeInTheDocument();
    expect(screen.getByText(/Dividend payments/)).toBeInTheDocument();
  });

  it('should have file input with CSV accept attribute', () => {
    render(
      <ImportVanguardCSVModal
        onClose={mockOnClose}
        onImportComplete={mockOnImportComplete}
      />
    );

    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('accept', '.csv');
  });
});
