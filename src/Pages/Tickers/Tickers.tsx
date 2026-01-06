// ============================================
// FILE: src/Pages/Tickers/Tickers.tsx
// ============================================
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import '@aws-amplify/ui-react/styles.css';
import {
  TrendingUp,
  DollarSign,
  RefreshCw,
  Plus,
  Settings,
  Upload,
  Download,
  Percent
} from 'lucide-react';
import type { TickerLot, TickerSummary, LotFormData, Portfolio, Ticker } from '../../types';
import { calculateTickerSummaries, calculateDividendMetrics } from '../../utils/tickerCalculations';
import { exportAllTickers } from '../../utils/tickerExporter';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { STORAGE_KEYS, STORAGE_VERSIONS } from '../../utils/localStorage';
import TickerSummarySpreadsheet from '../../Components/TickerSummarySpreadsheet';
import TickerDetailModal from '../../Components/TickerDetailModal';
import NewTickerModal from '../../Components/NewTickerModal';
import PortfolioManager from '../../Components/PortfolioManager';
import ImportCSVModal from '../../Components/ImportCSVModal';
import ImportVanguardCSVModal from '../../Components/ImportVanguardCSVModal';
import CustomRangePerformanceModal from '../../Components/CustomRangePerformanceModal/CustomRangePerformanceModal';
import { useAfterHoursData } from '../../hooks/useAfterHoursData';
import logger from '../../utils/logger';

// Type for old data schema with single portfolio field
interface LegacyLot {
  id: string;
  portfolio?: string;
  portfolios?: string[];
}

  const Tickers = () =>{
  const client = generateClient<Schema>();
  const location = useLocation();
  const previousPathRef = useRef<string>('');
  const [lots, setLots] = useState<TickerLot[]>([]);
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [summaries, setSummaries] = useState<TickerSummary[]>([]);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [showPortfolioManager, setShowPortfolioManager] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showVanguardImportModal, setShowVanguardImportModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);

  // Portfolio filter state (persists to localStorage)
  const [selectedPortfolios, setSelectedPortfolios] = useLocalStorage<string[]>(
    STORAGE_KEYS.TICKER_PORTFOLIO_FILTER,
    STORAGE_VERSIONS.TICKER_PORTFOLIO_FILTER,
    [],
    true // Auto-save on change
  );

  // Filter lots based on selected portfolios
  const filteredLots = useMemo(() => {
    // Empty array means "All" - show everything
    if (selectedPortfolios.length === 0) return lots;

    // Filter to lots that have at least one matching portfolio
    return lots.filter(lot =>
      lot.portfolios.some(p => selectedPortfolios.includes(p))
    );
  }, [lots, selectedPortfolios]);

  useEffect(() => {
    initializeDefaultPortfolio();
    loadLots();
    loadPortfolios();
    loadTickers();

    // Subscribe to real-time updates
    const subscription = client.models.TickerLot.observeQuery().subscribe({
      next: ({ items }) => {
        const tickerLots: TickerLot[] = items
          .filter((item) => item !== null)
          .map((item) => ({
            id: item.id,
            ticker: item.ticker,
            shares: item.shares,
            costPerShare: item.costPerShare,
            purchaseDate: item.purchaseDate,
            portfolios: (item.portfolios ?? []).filter((p: string | null): p is string => p !== null),
            calculateAccumulatedProfitLoss: item.calculateAccumulatedProfitLoss ?? true,
            isDividend: item.isDividend ?? false,
            baseYield: item.baseYield ?? 0,
            notes: item.notes ?? '',
            totalCost: item.totalCost ?? item.shares * item.costPerShare,
            createdAt: item.createdAt ?? undefined,
            updatedAt: item.updatedAt ?? undefined,
            owner: item.owner ?? undefined,
          }));
        setLots(tickerLots);
        setLoading(false);
      },
      error: (err: Error) => {
        logger.error({ error: err }, 'TickerLot subscription error');
        setError('Failed to sync data');
      },
    });

    // Portfolio subscription
    const portfolioSub = client.models.Portfolio.observeQuery().subscribe({
      next: ({ items }) => {
        const portfolioList: Portfolio[] = items.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description ?? '',
          createdAt: item.createdAt ?? undefined,
          updatedAt: item.updatedAt ?? undefined,
          owner: item.owner ?? undefined,
        }));
        setPortfolios(portfolioList);
      },
      error: (err: Error) => logger.error({ error: err }, 'Portfolio subscription error'),
    });

    // Ticker subscription
    const tickerSub = client.models.Ticker.observeQuery().subscribe({
      next: ({ items }) => {
        const tickerList: Ticker[] = items
          .filter(item => item !== null)
          .map((item) => ({
            id: item.id,
            symbol: item.symbol,
            companyName: item.companyName ?? '',
            baseYield: item.baseYield ?? 0,
            expectedFiveYearGrowth: item.expectedFiveYearGrowth ?? 0,
            createdAt: item.createdAt ?? undefined,
            updatedAt: item.updatedAt ?? undefined,
            owner: item.owner ?? undefined,
          }));
        setTickers(tickerList);
      },
      error: (err: Error) => logger.error({ error: err }, 'Ticker subscription error'),
    });

    return () => {
      subscription.unsubscribe();
      portfolioSub.unsubscribe();
      tickerSub.unsubscribe();
    };
  }, []);

  // Recalculate summaries whenever filtered lots or tickers change
  useEffect(() => {
    setSummaries(calculateTickerSummaries(filteredLots, tickers));
  }, [filteredLots, tickers]);

  // Clean up deleted portfolios from filter
  useEffect(() => {
    // Don't run cleanup until portfolios have loaded
    if (portfolios.length === 0) return;
    // No cleanup needed for "All"
    if (selectedPortfolios.length === 0) return;

    const validNames = new Set(portfolios.map(p => p.name));
    const cleaned = selectedPortfolios.filter(p => validNames.has(p));

    // If any portfolios were removed, update the filter
    if (cleaned.length !== selectedPortfolios.length) {
      setSelectedPortfolios(cleaned);
    }
  }, [portfolios, selectedPortfolios, setSelectedPortfolios]);

  const initializeDefaultPortfolio = async () => {
    try {
      const { data: portfolioList } = await client.models.Portfolio.list();
      const hasAnyPortfolios = portfolioList.length > 0;

      // Only create Default portfolio if NO portfolios exist at all
      // If user deleted Default but has other portfolios, respect their choice
      if (!hasAnyPortfolios) {
        await client.models.Portfolio.create({
          name: 'Default',
          description: 'Default portfolio for existing lots',
        });
        // Refresh portfolio list after creating Default
        const { data: refreshedList } = await client.models.Portfolio.list();
        portfolioList.push(...refreshedList);
      }

      // Get first available portfolio as fallback for migration
      const fallbackPortfolioName = portfolioList.length > 0 ? portfolioList[0].name : 'Default';

      // Migrate existing lots to portfolios array format
      const { data: lots } = await client.models.TickerLot.list();
      for (const lot of lots) {
        if (lot) {
          const legacyLot = lot as unknown as LegacyLot;
          // Case 1: Lot has no portfolios field (very old data)
          if (!lot.portfolios && !legacyLot.portfolio) {
            await client.models.TickerLot.update({
              id: lot.id,
              portfolios: [fallbackPortfolioName],
            });
          }
          // Case 2: Lot has old 'portfolio' string field (needs migration)
          else if (legacyLot.portfolio && !lot.portfolios) {
            await client.models.TickerLot.update({
              id: lot.id,
              portfolios: [legacyLot.portfolio],
            });
          }
          // Case 3: Lot already has portfolios array (no action needed)
        }
      }
    } catch (err) {
      logger.error({ error: err }, 'Failed to initialize default portfolio');
    }
  };

  const loadPortfolios = async () => {
    try {
      // Fetch all portfolios with pagination
      let allData: Array<{ id: string; name: string; description?: string | null; createdAt?: string | null; updatedAt?: string | null; owner?: string | null }> = [];
      let nextToken: string | null | undefined = undefined;

      do {
        const response = await client.models.Portfolio.list({
          limit: 1000,
          nextToken: nextToken || undefined,
        });

        if (response.errors) {
          logger.error({ errors: response.errors }, 'Portfolio load errors');
          break;
        }

        allData = [...allData, ...response.data];
        nextToken = response.nextToken as string | null | undefined;
      } while (nextToken);

      const portfolioList: Portfolio[] = allData.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description ?? '',
        createdAt: item.createdAt ?? undefined,
        updatedAt: item.updatedAt ?? undefined,
        owner: item.owner ?? undefined,
      }));
      setPortfolios(portfolioList);
    } catch (err) {
      logger.error({ error: err }, 'Failed to load portfolios');
    }
  };

  const loadTickers = async () => {
    try {
      // Fetch all tickers with pagination
      let allData: Array<{ id: string; symbol: string; companyName?: string | null; baseYield?: number | null; expectedFiveYearGrowth?: number | null; createdAt?: string | null; updatedAt?: string | null; owner?: string | null }> = [];
      let nextToken: string | null | undefined = undefined;

      do {
        const response = await client.models.Ticker.list({
          limit: 1000,
          nextToken: nextToken || undefined,
        });

        if (response.errors) {
          logger.error({ errors: response.errors }, 'Ticker load errors');
          break;
        }

        allData = [...allData, ...response.data];
        nextToken = response.nextToken as string | null | undefined;
      } while (nextToken);

      const tickerList: Ticker[] = allData
        .filter(item => item !== null)
        .map((item) => ({
          id: item.id,
          symbol: item.symbol,
          companyName: item.companyName ?? '',
          baseYield: item.baseYield ?? 0,
          expectedFiveYearGrowth: item.expectedFiveYearGrowth ?? 0,
          createdAt: item.createdAt ?? undefined,
          updatedAt: item.updatedAt ?? undefined,
          owner: item.owner ?? undefined,
        }));
      setTickers(tickerList);
    } catch (err) {
      logger.error({ error: err }, 'Failed to load tickers');
    }
  };

  const loadLots = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all lots with pagination
      let allData: Array<Record<string, unknown>> = [];
      let nextToken: string | null | undefined = undefined;

      do {
        const response = await client.models.TickerLot.list({
          limit: 1000,
          nextToken: nextToken || undefined,
        });

        if (response.errors) {
          logger.error({ errors: response.errors }, 'TickerLot load errors');
          setError('Failed to load lots');
          break;
        }

        allData = [...allData, ...response.data];
        nextToken = response.nextToken as string | null | undefined;
      } while (nextToken);

      const tickerLots: TickerLot[] = allData
        .filter((item) => item !== null)
        .map((item) => ({
          id: item.id,
          ticker: item.ticker,
          shares: item.shares,
          costPerShare: item.costPerShare,
          purchaseDate: item.purchaseDate,
          portfolios: (item.portfolios ?? ['Default']).filter((p: string | null): p is string => p !== null),
          calculateAccumulatedProfitLoss: item.calculateAccumulatedProfitLoss ?? true,
          isDividend: item.isDividend ?? false,
          baseYield: item.baseYield ?? 0,
          notes: item.notes ?? '',
          totalCost: item.totalCost ?? item.shares * item.costPerShare,
          createdAt: item.createdAt ?? undefined,
          updatedAt: item.updatedAt ?? undefined,
          owner: item.owner ?? undefined,
        }));
      setLots(tickerLots);
    } catch (err) {
      logger.error({ error: err }, 'Failed to load ticker lots');
      setError('Failed to load lots');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLot = async (lotData: LotFormData, lotId?: string) => {
    try {
      const totalCost = lotData.shares * lotData.costPerShare;

      if (lotId) {
        await client.models.TickerLot.update({
          id: lotId,
          ticker: lotData.ticker,
          shares: lotData.shares,
          costPerShare: lotData.costPerShare,
          purchaseDate: lotData.purchaseDate,
          portfolios: lotData.portfolios,
          calculateAccumulatedProfitLoss: lotData.calculateAccumulatedProfitLoss,
          isDividend: lotData.isDividend,
          notes: lotData.notes,
          totalCost,
        });
      } else {
        await client.models.TickerLot.create({
          ticker: lotData.ticker,
          shares: lotData.shares,
          costPerShare: lotData.costPerShare,
          purchaseDate: lotData.purchaseDate,
          portfolios: lotData.portfolios,
          calculateAccumulatedProfitLoss: lotData.calculateAccumulatedProfitLoss,
          isDividend: lotData.isDividend,
          notes: lotData.notes,
          totalCost,
        });
      }

      await loadLots();
    } catch (err) {
      logger.error({ error: err, lotData }, 'Failed to save ticker lot');
      setError('Failed to save lot');
      throw err;
    }
  };

  const handleDeleteLot = async (id: string) => {
    try {
      await client.models.TickerLot.delete({ id });
      await loadLots();
    } catch (err) {
      logger.error({ error: err, lotId: id }, 'Failed to delete lot');
      setError('Failed to delete lot');
      throw err;
    }
  };

  const handleDeleteSelected = async (ids: string[]) => {
    try {
      for (const id of ids) {
        await client.models.TickerLot.delete({ id });
      }
      await loadLots();
    } catch (err) {
      logger.error({ error: err, lotIds: ids, lotCount: ids.length }, 'Failed to bulk delete lots');
      setError('Failed to delete selected lots');
      throw err;
    }
  };

  const handleUpdateTicker = async (ticker: Ticker) => {
    try {
      // Check if ticker already exists
      const { data: existing } = await client.models.Ticker.list({
        filter: { symbol: { eq: ticker.symbol } }
      });

      if (existing && existing.length > 0) {
        // Update existing ticker
        await client.models.Ticker.update({
          id: existing[0].id,
          companyName: ticker.companyName,
          baseYield: ticker.baseYield,
          expectedFiveYearGrowth: ticker.expectedFiveYearGrowth,
        });
      } else {
        // Create new ticker
        await client.models.Ticker.create({
          symbol: ticker.symbol,
          companyName: ticker.companyName ?? '',
          baseYield: ticker.baseYield ?? 0,
          expectedFiveYearGrowth: ticker.expectedFiveYearGrowth ?? 0,
        });
      }

      await loadTickers();
    } catch (err) {
      logger.error({ error: err, symbol: ticker.symbol }, 'Failed to update ticker');
      setError('Failed to update ticker');
      throw err;
    }
  };

  const handleExportTickers = async () => {
    try {
      const count = await exportAllTickers(lots);
      logger.info({ count, tickers: summaries.length }, 'Exported ticker files');
    } catch (err) {
      logger.error({ error: err, tickerCount: summaries.length }, 'Failed to export tickers');
      setError('Failed to export tickers');
    }
  };

  const totalPortfolioValue = summaries.reduce((sum, s) => sum + s.totalCost, 0);
  // Only count tickers with actual holdings (exclude watchlist entries with 0 cost or 0 shares)
  const totalTickers = summaries.filter(s => s.totalCost > 0 && s.totalShares > 0).length;

  // Get ticker symbols for price data
  const tickerSymbols = useMemo(() => summaries.map(s => s.ticker), [summaries]);

  // Fetch real-time price data for calculating today's change
  const { regularQuotes, regularPrices, data: afterHoursData, isAfterHours, refetch } = useAfterHoursData({
    tickers: tickerSymbols,
    enabled: true,
    pollingIntervalRegularHours: 600000 // 10 minutes
  });

  // Re-fetch price data when navigating to Tickers tab or when summaries are ready
  useEffect(() => {
    const currentPath = location.pathname;
    const previousPath = previousPathRef.current;

    // Refetch when navigating TO /tickers from a different route
    if (currentPath === '/tickers' && previousPath !== '/tickers' && previousPath !== '') {
      // If we have tickers, refetch immediately
      if (tickerSymbols.length > 0) {
        logger.debug({ tickerCount: tickerSymbols.length }, 'Refetching prices on navigation to Tickers');
        refetch();
        previousPathRef.current = currentPath;
      } else {
        // If we don't have tickers yet, wait for them to load
        // Don't update previousPath yet so we can refetch when tickers are ready
        logger.debug('Waiting for tickers to load before refetching');
      }
    } else if (currentPath === '/tickers' && previousPath !== '/tickers' && tickerSymbols.length > 0) {
      // Tickers just loaded after navigation, refetch now
      logger.debug({ tickerCount: tickerSymbols.length }, 'Refetching prices after tickers loaded');
      refetch();
      previousPathRef.current = currentPath;
    } else {
      // Update the ref for next time (normal case)
      previousPathRef.current = currentPath;
    }
  }, [location.pathname, tickerSymbols.length, refetch]);

  // Calculate total today's change across all positions
  const totalTodaysChange = useMemo(() => {
    return summaries.reduce((total, summary) => {
      const quote = regularQuotes.get(summary.ticker);
      if (quote) {
        return total + (quote.change * summary.totalShares);
      }
      return total;
    }, 0);
  }, [summaries, regularQuotes]);

  // Calculate total portfolio value based on current prices
  const totalValue = useMemo(() => {
    return summaries.reduce((total, summary) => {
      const price = regularPrices.get(summary.ticker);
      if (price) {
        return total + (price * summary.totalShares);
      }
      return total;
    }, 0);
  }, [summaries, regularPrices]);

  // Calculate dividend metrics when only Dividend portfolio is selected
  const isDividendPortfolioSelected = useMemo(() => {
    return selectedPortfolios.length === 1 && selectedPortfolios[0] === 'Dividend';
  }, [selectedPortfolios]);

  const dividendMetrics = useMemo(() => {
    if (!isDividendPortfolioSelected) return null;
    return calculateDividendMetrics(summaries);
  }, [isDividendPortfolioSelected, summaries]);

  // Convert regularPrices Map to object for YTD modal
  const currentPricesObject = useMemo(() => {
    const obj: { [ticker: string]: number } = {};
    regularPrices.forEach((price, ticker) => {
      obj[ticker] = price;
    });
    return obj;
  }, [regularPrices]);

  return (
    <div className="h-screen-safe overflow-auto bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="h-full w-full max-w-7xl mx-auto flex flex-col min-w-0">
        <div className="bg-white rounded-2xl shadow-2xl flex flex-col h-full overflow-auto min-w-0">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 py-2 px-4 text-white overflow-x-auto">
            <div className="flex gap-2 flex-nowrap min-w-max">
                <button
                  onClick={() => setShowPortfolioManager(true)}
                  className="bg-white bg-opacity-20 text-blue-500 px-3 py-1.5 rounded-lg hover:bg-opacity-30 transition-all flex items-center gap-1.5 font-medium text-sm whitespace-nowrap flex-shrink-0"
                >
                  <Settings size={16} />
                  Manage Portfolios
                </button>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="bg-white bg-opacity-20 text-blue-500 px-3 py-1.5 rounded-lg hover:bg-opacity-30 transition-all flex items-center gap-1.5 font-medium text-sm whitespace-nowrap flex-shrink-0"
                >
                  <Upload size={16} />
                  Import CSV
                </button>
                <button
                  onClick={() => setShowVanguardImportModal(true)}
                  className="bg-white bg-opacity-20 text-purple-500 px-3 py-1.5 rounded-lg hover:bg-opacity-30 transition-all flex items-center gap-1.5 font-medium text-sm whitespace-nowrap flex-shrink-0"
                >
                  <TrendingUp size={16} />
                  Import Vanguard
                </button>
                <button
                  onClick={handleExportTickers}
                  className="bg-white bg-opacity-20 text-green-500 px-3 py-1.5 rounded-lg hover:bg-opacity-30 transition-all flex items-center gap-1.5 font-medium text-sm whitespace-nowrap flex-shrink-0"
                >
                  <Download size={16} />
                  Export Tickers
                </button>
                <button
                  onClick={() => setShowPerformanceModal(true)}
                  className="bg-white bg-opacity-20 text-yellow-500 px-3 py-1.5 rounded-lg hover:bg-opacity-30 transition-all flex items-center gap-1.5 font-medium text-sm whitespace-nowrap flex-shrink-0"
                >
                  <TrendingUp size={16} />
                  Performance
                </button>
                <button
                  onClick={() => {
                    loadLots();
                    refetch();
                  }}
                  className="bg-white bg-opacity-20 text-blue-500 px-3 py-1.5 rounded-lg hover:bg-opacity-30 transition-all flex items-center gap-1.5 font-medium text-sm whitespace-nowrap flex-shrink-0"
                >
                  <RefreshCw size={16} strokeWidth={2.5} />
                  Refresh
                </button>
                <button
                  onClick={() => setSelectedTicker('NEW')}
                  className="bg-white text-blue-600 px-4 py-1.5 rounded-lg font-semibold hover:bg-blue-50 transition-all flex items-center gap-1.5 shadow-lg text-sm whitespace-nowrap flex-shrink-0"
                >
                  <Plus size={18} />
                  Add First Lot
                </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 m-6">
              <p className="text-red-700 font-semibold">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-600 underline text-sm mt-2"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Portfolio Stats */}
          <div className="flex gap-2 px-6 py-2 bg-gradient-to-r from-slate-50 to-blue-50 overflow-x-auto">
            <div className="bg-white p-2 rounded-lg shadow border border-green-200 flex-shrink-0 min-w-[200px]">
              <div className="flex items-center gap-2">
                <div className="bg-green-100 p-1 rounded">
                  <DollarSign className="text-green-600" size={16} />
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-semibold uppercase">Total Cost</p>
                  <p className="text-base font-bold text-green-600">
                    ${totalPortfolioValue.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-2 rounded-lg shadow border border-blue-200 flex-shrink-0 min-w-[200px]">
              <div className="flex items-center gap-2">
                <div className="bg-blue-100 p-1 rounded">
                  <DollarSign className="text-blue-600" size={16} />
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-semibold uppercase">Value</p>
                  <p className="text-base font-bold text-blue-600">
                    ${totalValue.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className={`bg-white p-2 rounded-lg shadow border flex-shrink-0 min-w-[200px] ${totalTodaysChange >= 0 ? 'border-green-200' : 'border-red-200'}`}>
              <div className="flex items-center gap-2">
                <div className={`${totalTodaysChange >= 0 ? 'bg-green-100' : 'bg-red-100'} p-1 rounded`}>
                  <TrendingUp className={`${totalTodaysChange >= 0 ? 'text-green-600' : 'text-red-600'}`} size={16} />
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-semibold uppercase">Today's Change</p>
                  <p className={`text-base font-bold ${totalTodaysChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalTodaysChange >= 0 ? '+' : ''}${totalTodaysChange.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-2 rounded-lg shadow border border-purple-200 flex-shrink-0 min-w-[200px]">
              <div className="flex items-center gap-2">
                <div className="bg-purple-100 p-1 rounded">
                  <TrendingUp className="text-purple-600" size={16} />
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-semibold uppercase">Tickers</p>
                  <p className="text-base font-bold text-purple-600">{totalTickers}</p>
                </div>
              </div>
            </div>

            {/* Dividend Portfolio Metrics - Only shown when Dividend portfolio is selected */}
            {isDividendPortfolioSelected && dividendMetrics && (
              <>
                <div className="bg-white p-2 rounded-lg shadow border border-amber-200 flex-shrink-0 min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <div className="bg-amber-100 p-1 rounded">
                      <Percent className="text-amber-600" size={16} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 font-semibold uppercase">Weighted Yield</p>
                      <p className="text-base font-bold text-amber-600">
                        {dividendMetrics.weightedYieldPercentage.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-2 rounded-lg shadow border border-emerald-200 flex-shrink-0 min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <div className="bg-emerald-100 p-1 rounded">
                      <DollarSign className="text-emerald-600" size={16} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 font-semibold uppercase">Annual Income</p>
                      <p className="text-base font-bold text-emerald-600">
                        ${dividendMetrics.annualDividendIncome.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Main Content */}
          <div className="p-6 flex-1 overflow-y-auto overflow-x-auto">
            {loading ? (
              <div className="text-center py-20">
                <RefreshCw size={48} className="mx-auto mb-4 text-blue-600 animate-spin" />
                <p className="text-lg text-slate-600">Loading portfolio data...</p>
              </div>
            ) : (
              <TickerSummarySpreadsheet
                summaries={summaries}
                portfolios={portfolios}
                selectedPortfolios={selectedPortfolios}
                onPortfolioFilterChange={setSelectedPortfolios}
                onViewDetails={(ticker) => setSelectedTicker(ticker)}
                onUpdateTicker={handleUpdateTicker}
                regularPrices={regularPrices}
                regularQuotes={regularQuotes}
                afterHoursData={afterHoursData}
                isAfterHours={isAfterHours}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedTicker && selectedTicker !== 'NEW' && (
        <TickerDetailModal
          ticker={selectedTicker}
          allLots={lots}
          portfolios={portfolios}
          tickers={tickers}
          onClose={() => setSelectedTicker(null)}
          onSaveLot={handleSaveLot}
          onDeleteLot={handleDeleteLot}
          onDeleteSelected={handleDeleteSelected}
          onUpdateTicker={handleUpdateTicker}
        />
      )}

      {/* New Ticker Modal */}
      {selectedTicker === 'NEW' && (
        <NewTickerModal
          portfolios={portfolios}
          onClose={() => setSelectedTicker(null)}
          onSave={handleSaveLot}
        />
      )}

      {/* Portfolio Manager Modal */}
      {showPortfolioManager && (
        <PortfolioManager
          portfolios={portfolios}
          onClose={() => setShowPortfolioManager(false)}
        />
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <ImportCSVModal
          portfolios={portfolios}
          existingTickers={tickers}
          existingLots={lots}
          onClose={() => setShowImportModal(false)}
          onImportComplete={async () => {
            await loadLots();
            await loadTickers();
            await loadPortfolios();
            setShowImportModal(false);
          }}
        />
      )}

      {/* Import Vanguard CSV Modal */}
      {showVanguardImportModal && (
        <ImportVanguardCSVModal
          onClose={() => setShowVanguardImportModal(false)}
          onImportComplete={async () => {
            await loadLots();
            await loadTickers();
            await loadPortfolios();
            // Don't close modal here - let user see results and click "Done"
          }}
        />
      )}

      {/* Performance Analytics Modal */}
      {showPerformanceModal && (
        <CustomRangePerformanceModal
          lots={filteredLots}
          selectedPortfolios={selectedPortfolios}
          currentPrices={currentPricesObject}
          onClose={() => setShowPerformanceModal(false)}
          onTickerClick={(ticker) => setSelectedTicker(ticker)}
        />
      )}
    </div>
  );
}
export default Tickers;