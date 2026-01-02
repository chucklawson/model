import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { fetchAuthSession } from 'aws-amplify/auth';

let amplifyClient: ReturnType<typeof generateClient<Schema>> | null = null;

function getAmplifyClient() {
  if (!amplifyClient) {
    amplifyClient = generateClient<Schema>();
  }
  return amplifyClient;
}

export interface FmpApiClientOptions {
  endpoint: string;
  queryParams?: Record<string, string>;
}

export async function callFmpApi<T = unknown>(options: FmpApiClientOptions): Promise<T> {
  const { endpoint, queryParams = {} } = options;

  // IMPORTANT: Check environment variable directly to allow test stubbing
  const FMP_PROXY_URL = import.meta.env.VITE_FMP_PROXY_URL || '';

  if (!FMP_PROXY_URL) {
    throw new Error('FMP Proxy URL not configured');
  }

  const session = await fetchAuthSession();
  const userId = session.tokens?.idToken?.payload.sub as string;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(FMP_PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.tokens?.idToken?.toString()}`
    },
    body: JSON.stringify({
      endpoint,
      queryParams,
      userId
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'API request failed');
  }

  const data = await response.json() as T;
  return data;
}

export async function getUserFmpApiKey() {
  const { data } = await getAmplifyClient().models.FmpApiKey.list();
  return data && data.length > 0 ? data[0] : null;
}

export async function setUserFmpApiKey(apiKey: string) {
  const existing = await getUserFmpApiKey();
  const client = getAmplifyClient();

  if (existing) {
    return await client.models.FmpApiKey.update({
      id: existing.id,
      apiKey,
      isActive: true,
      updatedAt: new Date().toISOString()
    });
  } else {
    return await client.models.FmpApiKey.create({
      apiKey,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
}

export async function deleteUserFmpApiKey() {
  const existing = await getUserFmpApiKey();
  if (existing) {
    return await getAmplifyClient().models.FmpApiKey.delete({ id: existing.id });
  }
}
