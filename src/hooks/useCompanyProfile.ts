import { useState, useEffect } from 'react';
import { callFmpApi } from '../utils/fmpApiClient';

interface CompanyProfile {
  symbol: string;
  price: number;
  companyName: string;
  description: string;
  ceo: string;
  sector: string;
  industry: string;
  website: string;
  image: string;
  country: string;
  fullTimeEmployees: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

interface UseCompanyProfileResult {
  profile: CompanyProfile | null;
  loading: boolean;
  error: Error | null;
}

export function useCompanyProfile(symbol: string): UseCompanyProfileResult {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!symbol || symbol.trim() === '') {
      setProfile(null);
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await callFmpApi({
          endpoint: `/api/v3/profile/${symbol}`
        });

        if (data && data.length > 0) {
          setProfile(data[0]);
        } else {
          setProfile(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [symbol]);

  return { profile, loading, error };
}
