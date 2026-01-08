// ============================================
// Vanguard Text Import Modal Component
// ============================================
import { useState, useRef } from 'react';
import { Upload, X, FileText, Download, RefreshCw } from 'lucide-react';
import { parseVanguardText } from '../utils/vanguardTextParser';
import { convertToCSV, downloadCSV } from '../utils/vanguardTextToCsv';
import type { ParsedVanguardText } from '../utils/vanguardTextParser';

interface VanguardTextImportModalProps {
  onClose: () => void;
}

export default function VanguardTextImportModal({
  onClose,
}: VanguardTextImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedVanguardText | null>(null);
  const [csvFilename, setCsvFilename] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);

  const handleFileSelect = async (file: File) => {
    setError(null);

    try {
      // Validate file type
      if (!file.name.endsWith('.txt')) {
        throw new Error('Please select a .txt file');
      }

      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        throw new Error('File size exceeds 50MB limit');
      }

      // Read file content
      const content = await file.text();
      setFileContent(content);
      setSelectedFile(file);

      // Parse the content
      const parsed = parseVanguardText(content);
      setParsedData(parsed);

      // Set default CSV filename (remove .txt and add .csv)
      const defaultName = file.name.replace(/\.txt$/i, '.csv');
      setCsvFilename(defaultName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read text file');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDownloadCSV = async () => {
    if (!parsedData) return;

    setIsDownloading(true);
    setDownloadComplete(false);
    setError(null);

    try {
      // Small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 500));

      // Convert to CSV
      const csvContent = convertToCSV(parsedData);

      // Download
      const filename = csvFilename.endsWith('.csv') ? csvFilename : `${csvFilename}.csv`;
      downloadCSV(csvContent, filename);

      // Show success message
      setDownloadComplete(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setDownloadComplete(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate CSV');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 p-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <FileText size={28} />
              <div>
                <h2 className="text-2xl font-bold">Import Vanguard Text File</h2>
                <p className="text-blue-100 text-sm mt-1">
                  Select a Vanguard Realized Gains text file (.txt)
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-all"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedFile ? (
            <>
              {/* Upload Area */}
              <div
                className="border-4 border-dashed border-blue-300 rounded-xl p-12 text-center hover:border-blue-500 transition-all cursor-pointer bg-blue-50"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={64} className="mx-auto mb-4 text-blue-500" />
                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                  Drop your text file here
                </h3>
                <p className="text-slate-600 mb-4">or click to browse</p>
                <p className="text-sm text-slate-500">
                  Supported: .txt files (max 50MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
                  <p className="font-semibold">Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Download Status Messages */}
              {isDownloading && (
                <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-700">
                  <p className="font-semibold flex items-center gap-2">
                    <RefreshCw className="animate-spin" size={16} />
                    Converting to CSV...
                  </p>
                </div>
              )}

              {downloadComplete && (
                <div className="mt-4 p-4 bg-green-50 border-l-4 border-green-500 text-green-700">
                  <p className="font-semibold flex items-center gap-2">
                    <Download size={16} />
                    Download complete! Check your downloads folder.
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* File Selected */}
              <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6 mb-4">
                <div className="flex items-center gap-4">
                  <FileText size={48} className="text-green-600" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-800">
                      {selectedFile.name}
                    </h3>
                    <p className="text-sm text-slate-600">
                      Size: {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                    <p className="text-sm text-slate-600">
                      Characters: {fileContent.length.toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setFileContent('');
                      setParsedData(null);
                      setCsvFilename('');
                      setError(null);
                    }}
                    className="text-red-600 hover:bg-red-100 p-2 rounded-lg transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Parsed Data Summary */}
              {parsedData && (
                <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6 mb-4">
                  <h4 className="font-semibold text-slate-800 mb-3">Parsed Data Summary</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-slate-600">Total Lots</p>
                      <p className="text-2xl font-bold text-blue-600">{parsedData.totalLots}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Accounts</p>
                      <p className="text-2xl font-bold text-blue-600">{parsedData.accountNumbers.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Unique Symbols</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {new Set(parsedData.lots.map(l => l.symbol)).size}
                      </p>
                    </div>
                  </div>
                  {parsedData.accountNumbers.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-slate-600">Account Numbers:</p>
                      <p className="text-sm font-mono text-slate-800">
                        {parsedData.accountNumbers.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* CSV Filename Input */}
              {parsedData && (
                <div className="bg-white border border-slate-300 rounded-xl p-6 mb-4">
                  <label className="block mb-2">
                    <span className="font-semibold text-slate-800">CSV Filename</span>
                    <input
                      type="text"
                      value={csvFilename}
                      onChange={(e) => setCsvFilename(e.target.value)}
                      placeholder="output.csv"
                      className="mt-2 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </label>
                  <p className="text-xs text-slate-500 mt-1">
                    The .csv extension will be added automatically if not present
                  </p>
                </div>
              )}

              {/* Parsed Lots Table */}
              {parsedData && parsedData.lots.length > 0 && (
                <div className="bg-white border border-slate-300 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-slate-800">Parsed Lots</h4>
                    <span className="text-sm text-slate-600">
                      Showing all {parsedData.lots.length} rows (scroll to see more)
                    </span>
                  </div>
                  <div className="overflow-x-auto overflow-y-auto max-h-[600px] border border-slate-200 rounded">
                    <table className="text-xs border-collapse min-w-max">
                      <thead className="bg-slate-100 sticky top-0 z-10">
                        <tr>
                          <th className="border border-slate-300 px-3 py-2 text-center whitespace-nowrap">#</th>
                          <th className="border border-slate-300 px-3 py-2 text-left whitespace-nowrap">Account</th>
                          <th className="border border-slate-300 px-3 py-2 text-left whitespace-nowrap">Symbol</th>
                          <th className="border border-slate-300 px-3 py-2 text-left whitespace-nowrap">Company Name</th>
                          <th className="border border-slate-300 px-3 py-2 text-left whitespace-nowrap">Date Sold</th>
                          <th className="border border-slate-300 px-3 py-2 text-left whitespace-nowrap">Date Acquired</th>
                          <th className="border border-slate-300 px-3 py-2 text-left whitespace-nowrap">Event</th>
                          <th className="border border-slate-300 px-3 py-2 text-left whitespace-nowrap">Cost Basis Method</th>
                          <th className="border border-slate-300 px-3 py-2 text-right whitespace-nowrap">Quantity</th>
                          <th className="border border-slate-300 px-3 py-2 text-right whitespace-nowrap">Total Cost</th>
                          <th className="border border-slate-300 px-3 py-2 text-right whitespace-nowrap">Proceeds</th>
                          <th className="border border-slate-300 px-3 py-2 text-right whitespace-nowrap">Short Term</th>
                          <th className="border border-slate-300 px-3 py-2 text-right whitespace-nowrap">Long Term</th>
                          <th className="border border-slate-300 px-3 py-2 text-right whitespace-nowrap">Total G/L</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedData.lots.map((lot, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="border border-slate-300 px-3 py-2 text-center text-slate-500 whitespace-nowrap">{idx + 1}</td>
                            <td className="border border-slate-300 px-3 py-2 whitespace-nowrap">{lot.accountNumber}</td>
                            <td className="border border-slate-300 px-3 py-2 font-semibold whitespace-nowrap">{lot.symbol}</td>
                            <td className="border border-slate-300 px-3 py-2 whitespace-nowrap">{lot.companyName}</td>
                            <td className="border border-slate-300 px-3 py-2 whitespace-nowrap">{lot.dateSold}</td>
                            <td className="border border-slate-300 px-3 py-2 whitespace-nowrap">{lot.dateAcquired}</td>
                            <td className="border border-slate-300 px-3 py-2 whitespace-nowrap">{lot.event}</td>
                            <td className="border border-slate-300 px-3 py-2 whitespace-nowrap">{lot.costBasisMethod}</td>
                            <td className="border border-slate-300 px-3 py-2 text-right whitespace-nowrap">{lot.quantity}</td>
                            <td className="border border-slate-300 px-3 py-2 text-right whitespace-nowrap">{lot.totalCost}</td>
                            <td className="border border-slate-300 px-3 py-2 text-right whitespace-nowrap">{lot.proceeds}</td>
                            <td className="border border-slate-300 px-3 py-2 text-right whitespace-nowrap">{lot.shortTermGainLoss}</td>
                            <td className="border border-slate-300 px-3 py-2 text-right whitespace-nowrap">{lot.longTermGainLoss}</td>
                            <td className="border border-slate-300 px-3 py-2 text-right whitespace-nowrap">{lot.totalGainLoss}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-6 bg-slate-50 flex justify-between gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 border-2 border-slate-300 rounded-lg hover:bg-slate-100 transition-all font-semibold text-slate-700"
          >
            Cancel
          </button>
          {parsedData && (
            <button
              onClick={handleDownloadCSV}
              disabled={!csvFilename.trim() || isDownloading}
              className="px-6 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloading ? (
                <>
                  <RefreshCw size={20} className="animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <Download size={20} />
                  Download CSV
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
