import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { sendNotification } from './functions/send-notification/resource';
import { fmpProxy } from './functions/fmp-proxy/resource';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { FunctionUrlAuthType, HttpMethod } from 'aws-cdk-lib/aws-lambda';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  sendNotification,
  fmpProxy,
});

// Grant SNS permissions to the Lambda function
backend.sendNotification.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['sns:Publish'],
    resources: ['*'], // Or restrict to specific topic ARN
  })
);

// Add environment variables to Lambda
backend.sendNotification.addEnvironment('SNS_TOPIC_ARN', process.env.SNS_TOPIC_ARN || '');

// Grant DynamoDB read permissions to FMP proxy Lambda
backend.fmpProxy.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      'dynamodb:Query',
      'dynamodb:GetItem',
      'dynamodb:Scan'
    ],
    resources: [
      `${backend.data.resources.tables['FmpApiKey'].tableArn}`,
      `${backend.data.resources.tables['FmpApiKey'].tableArn}/index/*`
    ],
  })
);

// Add environment variables to FMP proxy Lambda
backend.fmpProxy.addEnvironment(
  'FMPAPIKEY_TABLE_NAME',
  backend.data.resources.tables['FmpApiKey'].tableName
);
backend.fmpProxy.addEnvironment(
  'FMP_FALLBACK_API_KEY',
  process.env.FMP_API_KEY || ''
);

// Enable Function URL for direct HTTPS access
const fmpProxyUrl = backend.fmpProxy.resources.lambda.addFunctionUrl({
  authType: FunctionUrlAuthType.NONE,
  cors: {
    allowedOrigins: ['*'],
    allowedMethods: [HttpMethod.POST],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
});
