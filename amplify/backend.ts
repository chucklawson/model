import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { sendNotification } from './functions/send-notification/resource';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  sendNotification,
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
