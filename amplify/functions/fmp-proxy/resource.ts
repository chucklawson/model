import { defineFunction } from '@aws-amplify/backend';
import { Runtime } from 'aws-cdk-lib/aws-lambda';

export const fmpProxy = defineFunction({
  name: 'fmp-proxy',
  entry: './handler.ts',
  runtime: Runtime.NODEJS_22_X,
  timeoutSeconds: 30,
});
