import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { executeJob } from './functions/executeJob/resource';
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  executeJob,
});

// Grant the Lambda function permissions to access DynamoDB tables
const jobsTableArn = backend.data.resources.tables['Job'].tableArn;
const executionsTableArn = backend.data.resources.tables['JobExecution'].tableArn;

// Environment variables will be hardcoded in the Lambda for now

// Add permissions
backend.executeJob.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      'dynamodb:GetItem',
      'dynamodb:PutItem',
      'dynamodb:UpdateItem',
      'dynamodb:Query'
    ],
    resources: [jobsTableArn, executionsTableArn],
  })
);