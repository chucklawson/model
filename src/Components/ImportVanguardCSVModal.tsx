// ============================================
// Import Vanguard CSV Modal Component
// ============================================
import { useState, useRef } from 'react';
import { Upload, ArrowLeft, X, FileText, TrendingUp } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import type {
  ParsedVanguardCSV,
  MatchingMethod,
} from '../types';
import type { ImportStats, ImportProgress } from '../utils/vanguardImporter';
import { parseVanguardCSV } from '../utils/vanguardCsvParser';
import { validateVanguardCSV } from '../utils/vanguardCsvValidator';
import { importVanguardCSV } from '../utils/vanguardImporter';
import VanguardPreviewTable from './VanguardPreviewTable';
import ImportProgressIndicator from './ImportProgressIndicator';

interface ImportVanguardCSVModalProps {
  onClose: () => void;
  onImportComplete: () => Promise<void>;
}

type ImportStep = 'upload' | 'preview' | 'importing' | 'results';

export default function ImportVanguardCSVModal({
  onClose,
  onImportComplete,
}: ImportVanguardCSVModalProps) {
  const client = generateClient<Schema>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [parsedData, setParsedData] = useState<ParsedVanguardCSV | null>(null);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [matchingMethod, setMatchingMethod] = useState<MatchingMethod>('FIFO');
  const [importProgress, setImportProgress] = useState<ImportProgress>({
    stage: 'hashing',
    current: 0,
    total: 100,
    message: '',
  });
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setError(null);

    try {
      // Validate file size (max 10MB for Vanguard files)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size exceeds 10MB limit');
      }

      // Read file content
      const content = await file.text();
      setFileContent(content);

      // Parse CSV
      const data = parseVanguardCSV(content);

      // Validate data
      const validation = validateVanguardCSV(data);

      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      const warnings = validation.warnings.map(w => `Row ${w.row}: ${w.field} - ${w.message}`);

      setParsedData(data);
      setSelectedFile(file);
      setValidationWarnings(warnings);
      setCurrentStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV file');
    }
  };

  const handleImport = async () => {
    if (!fileContent || !selectedFile || !parsedData) return;

    setCurrentStep('importing');
    setError(null);

    try {
      const stats = await importVanguardCSV(
        fileContent,
        selectedFile.name,
        { matchingMethod },
        client,
        (progress) => {
          setImportProgress(progress);
        }
      );

      setImportStats(stats);
      setCurrentStep('results');

      // Refresh data
      await onImportComplete();
    } catch (err) {
      console.error('Import failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Import failed';
      const errorStack = err instanceof Error ? err.stack : '';
      console.error('Error stack:', errorStack);
      setError(`${errorMessage}\n\nCheck browser console for full error details.`);
      setCurrentStep('preview');
    }
  };

  const handleImportAnother = () => {
    setSelectedFile(null);
    setFileContent('');
    setParsedData(null);
    setValidationWarnings([]);
    setImportStats(null);
    setError(null);
    setMatchingMethod('FIFO');
    setCurrentStep('upload');
  };

  const handleClose = () => {
    if (currentStep === 'importing') {
      // Prevent closing during import
      return;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 overflow-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <TrendingUp size={28} />
              Import Vanguard CSV
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

          {/* UPLOAD STEP */}
          {currentStep === 'upload' && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-slate-600 mb-6">
                  Upload your Vanguard CSV file containing holdings snapshot and transaction history.
                  The import will automatically parse both sections, match buy/sell transactions, and calculate realized gains/losses.
                </p>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all"
              >
                <Upload className="mx-auto mb-4 text-slate-400" size={48} />
                <p className="text-lg font-semibold text-slate-700 mb-2">
                  Click to select Vanguard CSV file
                </p>
                <p className="text-sm text-slate-500">
                  Maximum file size: 10MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileSelect(file);
                    }
                  }}
                />
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                  <FileText size={18} />
                  What will be imported:
                </h4>
                <ul className="text-sm text-purple-700 space-y-1 ml-6">
                  <li className="list-disc">Holdings snapshot (current positions)</li>
                  <li className="list-disc">Transaction history (buys, sells, dividends)</li>
                  <li className="list-disc">Matched buy/sell pairs with realized gains/losses</li>
                  <li className="list-disc">Dividend payments and reinvestments</li>
                  <li className="list-disc">Tax year classifications (short-term vs long-term)</li>
                </ul>
              </div>
            </div>
          )}

          {/* PREVIEW STEP */}
          {currentStep === 'preview' && parsedData && (
            <div className="space-y-6">
              {/* Matching Method Selector */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h4 className="font-semibold text-slate-800 mb-3">Lot Matching Method</h4>
                <p className="text-sm text-slate-600 mb-4">
                  Select how to match buy and sell transactions for capital gains calculation:
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setMatchingMethod('FIFO')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      matchingMethod === 'FIFO'
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-lg mb-1">FIFO</div>
                    <div className="text-xs text-slate-600">First In, First Out</div>
                    <div className="text-xs text-slate-500 mt-2">
                      Sells oldest lots first
                    </div>
                  </button>
                  <button
                    onClick={() => setMatchingMethod('LIFO')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      matchingMethod === 'LIFO'
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-lg mb-1">LIFO</div>
                    <div className="text-xs text-slate-600">Last In, First Out</div>
                    <div className="text-xs text-slate-500 mt-2">
                      Sells newest lots first
                    </div>
                  </button>
                  <button
                    onClick={() => setMatchingMethod('SpecID')}
                    disabled
                    className="p-4 rounded-lg border-2 border-slate-200 bg-slate-100 cursor-not-allowed opacity-50"
                  >
                    <div className="font-bold text-lg mb-1">SpecID</div>
                    <div className="text-xs text-slate-600">Specific Identification</div>
                    <div className="text-xs text-slate-500 mt-2">
                      Coming soon
                    </div>
                  </button>
                </div>
              </div>

              <VanguardPreviewTable
                data={parsedData}
                warnings={validationWarnings}
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
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Import with {matchingMethod}
                </button>
              </div>
            </div>
          )}

          {/* IMPORTING STEP */}
          {currentStep === 'importing' && (
            <div className="py-8">
              <ImportProgressIndicator
                progress={{
                  current: importProgress.current,
                  total: importProgress.total,
                  percentage: importProgress.current,
                  currentOperation: importProgress.message,
                }}
              />
            </div>
          )}

          {/* RESULTS STEP */}
          {currentStep === 'results' && importStats && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Import Complete!</h3>
                <p className="text-slate-600">
                  Your Vanguard data has been successfully imported and processed.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-blue-700">{importStats.holdingsCount}</div>
                  <div className="text-sm text-blue-600">Holdings</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-700">{importStats.newTransactions}</div>
                  <div className="text-sm text-green-600">Transactions</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-purple-700">{importStats.matchedPairs}</div>
                  <div className="text-sm text-purple-600">Matched Pairs</div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-orange-700">{importStats.dividendsProcessed}</div>
                  <div className="text-sm text-orange-600">Dividends</div>
                </div>
              </div>

              {importStats.duplicateTransactions > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>Note:</strong> {importStats.duplicateTransactions} duplicate transaction(s) were skipped.
                  </p>
                </div>
              )}

              {importStats.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 font-semibold mb-2">Errors ({importStats.errors.length}):</p>
                  <div className="text-red-700 text-sm space-y-1 max-h-40 overflow-y-auto">
                    {importStats.errors.map((error, i) => (
                      <div key={i}>• {error}</div>
                    ))}
                  </div>
                </div>
              )}

              {importStats.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 font-semibold mb-2">Warnings ({importStats.warnings.length}):</p>
                  <div className="text-yellow-700 text-sm space-y-1 max-h-40 overflow-y-auto">
                    {importStats.warnings.slice(0, 10).map((warning, i) => (
                      <div key={i}>• {warning}</div>
                    ))}
                    {importStats.warnings.length > 10 && (
                      <div className="font-medium">...and {importStats.warnings.length - 10} more</div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Done
                </button>
                <button
                  onClick={handleImportAnother}
                  className="bg-slate-500 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Import Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
