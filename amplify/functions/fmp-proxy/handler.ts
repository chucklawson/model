import type { Handler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

interface FmpProxyEvent {
  endpoint: string;
  queryParams?: Record<string, string>;
  userId: string;
}

export const handler: Handler = async (event) => {
  try {
    const { endpoint, queryParams = {}, userId } = JSON.parse(event.body || '{}');

    if (!endpoint) {
      return errorResponse(400, 'Endpoint is required');
    }

    // Fetch user's API key
    let apiKey = process.env.FMP_FALLBACK_API_KEY || '';

    try {
      const tableName = process.env.FMPAPIKEY_TABLE_NAME;
      const ownerField = `${userId}::${userId}`;

      const result = await dynamoClient.send(new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: 'owner = :owner',
        ExpressionAttributeValues: {
          ':owner': ownerField
        },
        Limit: 1
      }));

      if (result.Items && result.Items.length > 0 && result.Items[0].isActive) {
        apiKey = result.Items[0].apiKey;
      }
    } catch (dbError) {
      console.error('Error fetching user API key, using fallback:', dbError);
    }

    if (!apiKey) {
      return errorResponse(403, 'No API key configured. Please add your FMP API key in settings.');
    }

    // Proxy request to FMP
    const params = new URLSearchParams({ ...queryParams, apikey: apiKey });
    const fmpUrl = `https://financialmodelingprep.com${endpoint}?${params.toString()}`;

    const response = await fetch(fmpUrl);
    const data = await response.json();

    return {
      statusCode: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('FMP Proxy error:', error);
    return errorResponse(500, 'Failed to proxy FMP API request');
  }
};

function errorResponse(statusCode: number, message: string) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ error: message })
  };
}
