import { CloudWatchLogsClient, FilterLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';

const client = new CloudWatchLogsClient({ region: 'us-east-2' });

async function getLogs() {
  const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);

  const command = new FilterLogEventsCommand({
    logGroupName: '/aws/lambda/amplify-model-Chuck-sandbox-fmpproxylambdaEFF83337-TePlmCFkDDIl',
    startTime: fiveMinutesAgo,
    limit: 50
  });

  const response = await client.send(command);

  if (response.events && response.events.length > 0) {
    console.log('\n=== Lambda Logs (last 5 minutes) ===\n');
    response.events.forEach(event => {
      console.log(event.message);
    });
  } else {
    console.log('No log events found in the last 5 minutes');
  }
}

getLogs().catch(console.error);
