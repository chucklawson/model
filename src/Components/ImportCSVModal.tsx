// ============================================
// Import CSV Modal Component
// ============================================
import { useState, useRef } from 'react';
import { Upload, ArrowLeft, X } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import type {
  Portfolio,
  Ticker,
  TickerLot,
  ParsedCSVData,
  ValidationResult,
  ImportResult,
  ImportProgress,
} from '../types';
import { parseCSVFile, validateFileSize, validateRowCount } from '../utils/csvParser';
import { validateCSVData, getMissingPortfolios } from '../utils/csvValidator';
import { importCSVData } from '../utils/csvImporter';
import CSVPreviewTable from './CSVPreviewTable';
import ImportProgressIndicator from './ImportProgressIndicator';
import ImportResultsSummary from './ImportResultsSummary';

interface ImportCSVModalProps {
  portfolios: Portfolio[];
  existingTickers: Ticker[];
  existingLots: TickerLot[];
  onClose: () => void;
  onImportComplete: () => Promise<void>;
}

type ImportStep = 'upload' | 'preview' | 'importing' | 'results';

export default function ImportCSVModal({
  portfolios,
  existingTickers,
  existingLots,
  onClose,
  onImportComplete,
}: ImportCSVModalProps) {
  const client = generateClient<Schema>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  const [parsedData, setParsedData] = useState<ParsedCSVData | null>(null);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [missingPortfolios, setMissingPortfolios] = useState<string[]>([]);
  const [importProgress, setImportProgress] = useState<ImportProgress>({
    current: 0,
    total: 0,
    percentage: 0,
    currentOperation: '',
  });
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (selectedFile: File) => {
    setError(null);

    try {
      // Validate file size
      validateFileSize(selectedFile);

      // Parse CSV
      const data = await parseCSVFile(selectedFile);

      // Validate row count
      validateRowCount(data);

      // Validate data
      const results = validateCSVData(data, existingLots, portfolios);

      // Get missing portfolios
      const missing = getMissingPortfolios(data, portfolios);

      setParsedData(data);
      setValidationResults(results);
      setMissingPortfolios(missing);
      setCurrentStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV file');
    }
  };

  const handleImport = async () => {
    if (!parsedData || !validationResults) return;

    setCurrentStep('importing');
    setError(null);

    try {
      const result = await importCSVData(
        validationResults,
        client,
        existingTickers,
        portfolios,
        (progress) => {
          setImportProgress(progress);
        }
      );

      setImportResult(result);
      setCurrentStep('results');

      // Refresh data
      await onImportComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setCurrentStep('preview');
    }
  };

  const handleImportAnother = () => {
    setParsedData(null);
    setValidationResults([]);
    setMissingPortfolios([]);
    setImportResult(null);
    setError(null);
    setCurrentStep('upload');
  };

  const handleClose = () => {
    if (currentStep === 'importing') {
      // Prevent closing during import
      return;
    }
    onClose();
  };

  const validCount = validationResults.filter(r => r.status === 'valid').length;
  const canImport = validCount > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 overflow-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Upload size={28} />
              Import CSV
            </h2>
            {currentStep !== 'importing' && (
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all"
              >
                <X size={24} />
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          )}

          {currentStep === 'upload' && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-slate-600 mb-6">
                  Upload a CSV file containing your ticker lots. The file should include columns for:
                  Ticker, Shares/Quantity, Cost/Price, Date, and Portfolio.
                </p>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
              >
                <Upload className="mx-auto mb-4 text-slate-400" size={48} />
                <p className="text-lg font-semibold text-slate-700 mb-2">
                  Click to select CSV file
                </p>
                <p className="text-sm text-slate-500">
                  Maximum file size: 5MB | Maximum rows: 1000
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0];
                    if (selectedFile) {
                      handleFileSelect(selectedFile);
                    }
                  }}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">CSV Format Example:</h4>
                <pre className="text-xs text-blue-700 overflow-x-auto">
{`Ticker,Date,Quantity,Cost,Portfolio
AAPL,1/15/2024,100,150.25,Default
MSFT,2/20/2024,50,380.00,Retirement
GOOGL,3/10/2024,75,140.50,Trading`}
                </pre>
                <p className="text-xs text-blue-600 mt-2">
                  Column names are flexible (e.g., "Shares" or "Quantity", "Cost" or "Price").
                  Date format can be M/D/YYYY or YYYY-MM-DD.
                </p>
              </div>
            </div>
          )}

          {currentStep === 'preview' && parsedData && (
            <div className="space-y-6">
              <CSVPreviewTable
                validationResults={validationResults}
                missingPortfolios={missingPortfolios}
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentStep('upload')}
                  className="flex items-center gap-2 bg-slate-500 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  <ArrowLeft size={20} />
                  Back
                </button>
                <button
                  onClick={handleImport}
                  disabled={!canImport}
                  className={`flex-1 ${
                    canImport
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-slate-300 cursor-not-allowed'
                  } text-white px-6 py-3 rounded-lg font-semibold transition-colors`}
                >
                  Import {validCount} Valid Row{validCount !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          )}

          {currentStep === 'importing' && (
            <ImportProgressIndicator progress={importProgress} />
          )}

          {currentStep === 'results' && importResult && (
            <ImportResultsSummary
              result={importResult}
              onClose={handleClose}
              onImportAnother={handleImportAnother}
            />
          )}
        </div>
      </div>
    </div>
  );
}
