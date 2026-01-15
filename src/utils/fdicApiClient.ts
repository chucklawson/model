/**
 * FDIC BankFind Suite API Client
 * Fetches regulatory banking metrics from FDIC's public API
 * No API key required
 */

// Common bank ticker to name mappings for major US banks
// Names must match EXACTLY as they appear in FDIC database (usually all caps)
const BANK_NAME_MAP: Record<string, string> = {
  'JPM': 'JPMORGAN CHASE BANK, NATIONAL ASSOCIATION',
  'BAC': 'BANK OF AMERICA, NATIONAL ASSOCIATION',
  'WFC': 'WELLS FARGO BANK, NATIONAL ASSOCIATION',
  'C': 'CITIBANK, NATIONAL ASSOCIATION',
  'USB': 'U.S. BANK NATIONAL ASSOCIATION',
  'PNC': 'PNC BANK, NATIONAL ASSOCIATION',
  'TFC': 'TRUIST BANK',
  'GS': 'GOLDMAN SACHS BANK USA',
  'MS': 'MORGAN STANLEY BANK, NATIONAL ASSOCIATION',
  'BK': 'THE BANK OF NEW YORK MELLON',
  'STT': 'STATE STREET BANK AND TRUST COMPANY',
  'COF': 'CAPITAL ONE, NATIONAL ASSOCIATION',
  'AXP': 'American Express National  Bank',
  'DFS': 'DISCOVER BANK',
  'SYF': 'SYNCHRONY BANK',
  'SCHW': 'CHARLES SCHWAB BANK, SSB',
  'KEY': 'KEYBANK NATIONAL ASSOCIATION',
  'FITB': 'FIFTH THIRD BANK, NATIONAL ASSOCIATION',
  'MTB': 'MANUFACTURERS AND TRADERS TRUST COMPANY',
  'RF': 'REGIONS BANK',
  'CFG': 'CITIZENS BANK, NATIONAL ASSOCIATION',
  'HBAN': 'HUNTINGTON NATIONAL BANK',
  'ALLY': 'ALLY BANK',
  'CMA': 'COMERICA BANK',
  'ZION': 'ZIONS BANCORPORATION, NATIONAL ASSOCIATION',
};

export interface FDICMetrics {
  nplRatio?: number | 'N/A';
  capitalAdequacyRatio?: number | 'N/A';
  tier1CapitalRatio?: number | 'N/A';
  commonEquityTier1Ratio?: number | 'N/A';
  institutionName?: string;
  cert?: number;
  reportDate?: string;
  nplRatioHistory?: Array<{ date: string; value: number }>;
  carHistory?: Array<{ date: string; value: number }>;
  cte1History?: Array<{ date: string; value: number }>;
}

/**
 * Fetch FDIC regulatory metrics for a bank ticker
 * @param ticker - Stock ticker symbol (e.g., 'JPM', 'WFC')
 * @returns FDIC metrics including NPL ratio and capital ratios
 */
export async function fetchFDICMetrics(ticker: string): Promise<FDICMetrics> {
  try {
    const bankName = BANK_NAME_MAP[ticker.toUpperCase()];

    if (!bankName) {
      return {
        nplRatio: 'N/A',
        capitalAdequacyRatio: 'N/A',
        tier1CapitalRatio: 'N/A',
        commonEquityTier1Ratio: 'N/A'
      };
    }

    // Search for the institution first
    // Use ACTIVE:1 filter to get only active institutions
    const searchUrl = `https://banks.data.fdic.gov/api/institutions?filters=NAME:"${encodeURIComponent(bankName)}" AND ACTIVE:1&fields=NAME,CERT,REPDTE&sort_by=OFFICES&sort_order=DESC&limit=1&offset=0&format=json&download=false&filename=data_file`;

    const searchResponse = await fetch(searchUrl);

    if (!searchResponse.ok) {
      console.error('FDIC search failed:', searchResponse.status);
      return {
        nplRatio: 'N/A',
        capitalAdequacyRatio: 'N/A',
        tier1CapitalRatio: 'N/A',
        commonEquityTier1Ratio: 'N/A'
      };
    }

    const searchData = await searchResponse.json();

    if (!searchData.data || searchData.data.length === 0) {
      return {
        nplRatio: 'N/A',
        capitalAdequacyRatio: 'N/A',
        tier1CapitalRatio: 'N/A',
        commonEquityTier1Ratio: 'N/A'
      };
    }

    const institution = searchData.data[0];
    const cert = institution.data.CERT;

    // Fetch financial data for the institution (last 10 periods for historical charts)
    // NPL ratio fields (looking for percentage versions with AAJ, AJR, R suffixes)
    // Capital ratio fields: RBC1AAJ (Tier 1 leverage), RBCRWAJ (Total risk-based capital), RBCT1AAJ (Tier 1 risk-based)
    // CET1 components: Multiple possible field names
    //   - EQCS, RBCCET1 (Common Equity Tier 1 Capital)
    //   - RWAJX, RWAAJ, A223, RWAJ (Risk-Weighted Assets - trying multiple field names)
    // Request ratio/percentage versions of fields
    const financialUrl = `https://banks.data.fdic.gov/api/financials?filters=CERT:${cert}&fields=CERT,REPDTE,NTLNLSR,NCLNLSR,P9ASSETR,NTLNLSQ,RBC1AAJ,RBCRWAJ,RBCT1AAJ,EQCS,RBCCET1,RWAJX,RWAAJ,A223,RWAJ&sort_by=REPDTE&sort_order=DESC&limit=10&offset=0&format=json&download=false&filename=data_file`;

    const financialResponse = await fetch(financialUrl);

    if (!financialResponse.ok) {
      console.error('FDIC financial data fetch failed:', financialResponse.status);
      return {
        nplRatio: 'N/A',
        capitalAdequacyRatio: 'N/A',
        tier1CapitalRatio: 'N/A',
        institutionName: institution.data.NAME,
        cert
      };
    }

    const financialData = await financialResponse.json();

    if (!financialData.data || financialData.data.length === 0) {
      return {
        nplRatio: 'N/A',
        capitalAdequacyRatio: 'N/A',
        tier1CapitalRatio: 'N/A',
        institutionName: institution.data.NAME,
        cert
      };
    }

    // Extract latest metrics (first record)
    const latestMetrics = financialData.data[0].data;

    // Helper function to extract NPL ratio from a single record
    const extractNPL = (metrics: any): number | undefined => {
      if (metrics.NTLNLSR) return parseFloat(metrics.NTLNLSR);
      if (metrics.NCLNLSR) return parseFloat(metrics.NCLNLSR);
      if (metrics.P9ASSETR) return parseFloat(metrics.P9ASSETR);
      if (metrics.NTLNLSQ) return parseFloat(metrics.NTLNLSQ);
      return undefined;
    };

    // Helper function to extract CAR from a single record
    const extractCAR = (metrics: any): number | undefined => {
      // Prefer total risk-based capital ratio (RBCRWAJ), fallback to Tier 1
      if (metrics.RBCRWAJ) return parseFloat(metrics.RBCRWAJ);
      if (metrics.RBCT1R) return parseFloat(metrics.RBCT1R);
      if (metrics.RBC1AAJ) return parseFloat(metrics.RBC1AAJ);
      return undefined;
    };

    // Helper function to calculate CET1 (Common Equity Tier 1 Ratio) from components
    const extractCET1 = (metrics: any): number | undefined => {
      // Try to calculate from components: CET1 Ratio = Common Equity Tier 1 Capital / Risk-Weighted Assets × 100

      // Try to get Common Equity Tier 1 Capital from multiple field names
      let cet1Capital: number | undefined;
      if (metrics.EQCS) cet1Capital = parseFloat(metrics.EQCS);
      else if (metrics.RBCCET1) cet1Capital = parseFloat(metrics.RBCCET1);

      // Try to get Risk-Weighted Assets from multiple field names
      let riskWeightedAssets: number | undefined;
      if (metrics.RWAJX) riskWeightedAssets = parseFloat(metrics.RWAJX);
      else if (metrics.RWAAJ) riskWeightedAssets = parseFloat(metrics.RWAAJ);
      else if (metrics.RWAJ) riskWeightedAssets = parseFloat(metrics.RWAJ);
      else if (metrics.A223) riskWeightedAssets = parseFloat(metrics.A223);

      // Calculate CET1 Ratio = Common Equity Tier 1 Capital / Risk-Weighted Assets × 100
      if (cet1Capital !== undefined && riskWeightedAssets !== undefined && riskWeightedAssets > 0) {
        const ratio = (cet1Capital / riskWeightedAssets) * 100;
        if (!isNaN(ratio)) return ratio;
      }

      // Fallback: Try Tier 1 Risk-Based Capital Ratio (similar to CET1)
      if (metrics.RBCT1AAJ) {
        const value = parseFloat(metrics.RBCT1AAJ);
        if (!isNaN(value)) return value;
      }

      return undefined;
    };

    // Extract current values
    const nplRatio = extractNPL(latestMetrics);
    const tier1Ratio = latestMetrics.RBC1AAJ ? parseFloat(latestMetrics.RBC1AAJ) : undefined;
    const totalCapitalRatio = latestMetrics.RBCRWAJ ? parseFloat(latestMetrics.RBCRWAJ) : undefined;
    const cet1Ratio = extractCET1(latestMetrics);

    // Build historical data arrays (FDIC returns newest first, we reverse to oldest->newest)
    const nplRatioHistory = financialData.data
      .map((record: any) => {
        const date = record.data.REPDTE;
        const value = extractNPL(record.data);
        return date && value !== undefined ? { date, value } : null;
      })
      .filter((item: any): item is { date: string; value: number } => item !== null)
      .reverse();

    const carHistory = financialData.data
      .map((record: any) => {
        const date = record.data.REPDTE;
        const value = extractCAR(record.data);
        return date && value !== undefined ? { date, value } : null;
      })
      .filter((item: any): item is { date: string; value: number } => item !== null)
      .reverse();

    const cte1History = financialData.data
      .map((record: any) => {
        const date = record.data.REPDTE;
        const value = extractCET1(record.data);
        return date && value !== undefined ? { date, value } : null;
      })
      .filter((item: any): item is { date: string; value: number } => item !== null)
      .reverse();

    return {
      nplRatio: nplRatio !== undefined ? nplRatio : 'N/A',
      tier1CapitalRatio: tier1Ratio !== undefined ? tier1Ratio : 'N/A',
      capitalAdequacyRatio: totalCapitalRatio !== undefined ? totalCapitalRatio : 'N/A',
      commonEquityTier1Ratio: cet1Ratio !== undefined ? cet1Ratio : 'N/A',
      institutionName: institution.data.NAME,
      cert,
      reportDate: latestMetrics.REPDTE,
      nplRatioHistory,
      carHistory,
      cte1History
    };

  } catch (error) {
    console.error('Error fetching FDIC metrics:', error);
    return {
      nplRatio: 'N/A',
      capitalAdequacyRatio: 'N/A',
      tier1CapitalRatio: 'N/A'
    };
  }
}

/**
 * Check if a ticker has FDIC data available
 * @param ticker - Stock ticker symbol
 * @returns true if ticker is mapped to an FDIC institution
 */
export function hasFDICMapping(ticker: string): boolean {
  return ticker.toUpperCase() in BANK_NAME_MAP;
}

/**
 * Get the FDIC institution name for a ticker
 * @param ticker - Stock ticker symbol
 * @returns Institution name or undefined
 */
export function getFDICInstitutionName(ticker: string): string | undefined {
  return BANK_NAME_MAP[ticker.toUpperCase()];
}
