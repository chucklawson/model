export interface TreasuryYieldData {
  date: string;
  month1?: number;
  month2?: number;
  month3?: number;
  month6?: number;
  year1?: number;
  year2?: number;
  year3?: number;
  year5?: number;
  year7?: number;
  year10?: number;
  year20?: number;
  year30?: number;
}

export type MaturityOption = '1M' | '3M' | '6M' | '1Y' | '2Y' | '3Y' | '5Y' | '7Y' | '10Y' | '20Y' | '30Y';

export type TimePeriodOption = '1M' | '3M' | '6M' | '1Y' | '2Y' | '5Y' | '10Y' | 'ALL' | 'custom';

export interface UseTreasuryYieldsDataParams {
  startDate: string;
  endDate: string;
  enabled: boolean;
}

export interface UseTreasuryYieldsDataResult {
  data: TreasuryYieldData[];
  loading: boolean;
  error: Error | null;
}
