import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { executeJob } from './functions/executeJob/resource';
import { scheduleManager } from './functions/scheduleManager/resource';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  executeJob,
  scheduleManager,
});

// Commenting out all permissions and environment variables for now
// to isolate deployment issues

// // Grant the Lambda function permissions to access DynamoDB tables
// const jobsTableArn = backend.data.resources.tables['Job'].tableArn;
// const executionsTableArn = backend.data.resources.tables['JobExecution'].tableArn;

// // Add permissions for executeJob
// backend.executeJob.resources.lambda.addToRolePolicy(
//   new PolicyStatement({
//     actions: [
//       'dynamodb:GetItem',
//       'dynamodb:PutItem',
//       'dynamodb:UpdateItem',
//       'dynamodb:Query'
//     ],
//     resources: [jobsTableArn, executionsTableArn],
//   })
// );

// // Add permissions for scheduleManager
// backend.scheduleManager.resources.lambda.addToRolePolicy(
//   new PolicyStatement({
//     actions: [
//       'events:PutRule',
//       'events:PutTargets',
//       'events:DeleteRule',
//       'events:RemoveTargets',
//       'events:DescribeRule',
//       'lambda:AddPermission',
//       'lambda:RemovePermission'
//     ],
//     resources: ['*'],
//   })
// );

// backend.scheduleManager.resources.lambda.addToRolePolicy(
//   new PolicyStatement({
//     actions: [
//       'dynamodb:UpdateItem',
//       'dynamodb:GetItem'
//     ],
//     resources: [jobsTableArn],
//   })
// );

// // Add environment variables for scheduleManager
// backend.scheduleManager.addEnvironment('EXECUTE_JOB_ARN', backend.executeJob.resources.lambda.functionArn);
// backend.scheduleManager.addEnvironment('JOBS_TABLE', backend.data.resources.tables['Job'].tableName);

// // Add environment variables for executeJob
// backend.executeJob.addEnvironment('JOBS_TABLE', backend.data.resources.tables['Job'].tableName);
// backend.executeJob.addEnvironment('EXECUTIONS_TABLE', backend.data.resources.tables['JobExecution'].tableName);
// backend.executeJob.addEnvironment('CLAUDE_API_URL', 'http://claude.chinchilla-ai.com:3000/query');

// // Allow EventBridge to invoke executeJob Lambda
// backend.executeJob.resources.lambda.grantInvoke(new ServicePrincipal('events.amazonaws.com'));