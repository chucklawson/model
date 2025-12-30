import { defineFunction } from '@aws-amplify/backend';

export const fmpProxy = defineFunction({
  name: 'fmp-proxy',
  entry: './handler.ts',
  runtime: 22,
  timeoutSeconds: 30,
});
