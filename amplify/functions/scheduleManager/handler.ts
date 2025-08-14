import type { Handler } from 'aws-lambda';
import { EventBridgeClient, PutRuleCommand, PutTargetsCommand, DeleteRuleCommand, RemoveTargetsCommand } from '@aws-sdk/client-eventbridge';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const eventBridge = new EventBridgeClient({});
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

interface ScheduleEvent {
  action: 'create' | 'update' | 'delete' | 'retry';
  jobId: string;
  schedule?: string;
  enabled?: boolean;
  retryDelayMinutes?: number;
}

interface ScheduleResponse {
  statusCode: number;
  body: string;
}

export const handler: Handler<ScheduleEvent, ScheduleResponse> = async (event) => {
  const { action, jobId, schedule, enabled = true, retryDelayMinutes = 30 } = event;

  console.log(`Schedule Manager: ${action} for job ${jobId}`);

  try {
    const ruleName = `ChillScheduler-Job-${jobId}`;
    const jobsTable = process.env.JOBS_TABLE || 'Job-f19dd7e98f-sandbox'; // Fallback table name
    const executeJobArn = process.env.EXECUTE_JOB_ARN || 'arn:aws:lambda:us-east-1:755956835466:function:executeJob'; // Fallback ARN

    switch (action) {
      case 'create':
      case 'update':
        if (!schedule) {
          throw new Error('Schedule is required for create/update actions');
        }

        console.log(`Creating/updating rule: ${ruleName} with schedule: ${schedule}`);

        // Convert cron expression to EventBridge format
        const eventBridgeSchedule = convertToEventBridgeSchedule(schedule);

        // Create or update EventBridge rule
        await eventBridge.send(new PutRuleCommand({
          Name: ruleName,
          Description: `ChillScheduler job ${jobId}`,
          ScheduleExpression: eventBridgeSchedule,
          State: enabled ? 'ENABLED' : 'DISABLED',
        }));

        console.log(`Rule created: ${ruleName}`);

        // Add Lambda target to the rule
        await eventBridge.send(new PutTargetsCommand({
          Rule: ruleName,
          Targets: [{
            Id: '1',
            Arn: executeJobArn,
            Input: JSON.stringify({
              jobId,
              trigger: 'scheduled'
            }),
          }],
        }));

        console.log(`Target added to rule: ${ruleName}`);

        // Update job with next run time
        const nextRunAt = calculateNextRun(schedule);
        await docClient.send(new UpdateCommand({
          TableName: jobsTable,
          Key: { id: jobId },
          UpdateExpression: 'SET nextRunAt = :nextRun, updatedAt = :now',
          ExpressionAttributeValues: {
            ':nextRun': nextRunAt,
            ':now': new Date().toISOString(),
          },
        }));

        console.log(`Updated job ${jobId} with next run time: ${nextRunAt}`);
        break;

      case 'delete':
        console.log(`Deleting rule: ${ruleName}`);

        // Remove targets first
        try {
          await eventBridge.send(new RemoveTargetsCommand({
            Rule: ruleName,
            Ids: ['1'],
          }));
        } catch (error) {
          console.log(`No targets to remove for rule: ${ruleName}`);
        }

        // Delete the rule
        try {
          await eventBridge.send(new DeleteRuleCommand({
            Name: ruleName,
          }));
        } catch (error) {
          console.log(`Rule not found or already deleted: ${ruleName}`);
        }

        console.log(`Deleted schedule for job ${jobId}`);
        break;

      case 'retry':
        console.log(`Creating retry schedule for job ${jobId} with ${retryDelayMinutes} minute delay`);
        
        // Create a one-time retry schedule
        const retryTime = new Date(Date.now() + retryDelayMinutes * 60 * 1000);
        const retryRuleName = `ChillScheduler-Retry-${jobId}-${Date.now()}`;
        
        // Create EventBridge rule for one-time execution
        await eventBridge.send(new PutRuleCommand({
          Name: retryRuleName,
          Description: `ChillScheduler retry for job ${jobId}`,
          ScheduleExpression: `at(${retryTime.toISOString().slice(0, 19)})`,
          State: 'ENABLED',
        }));

        console.log(`Retry rule created: ${retryRuleName}`);

        // Add Lambda target to the retry rule
        await eventBridge.send(new PutTargetsCommand({
          Rule: retryRuleName,
          Targets: [{
            Id: '1',
            Arn: executeJobArn,
            Input: JSON.stringify({
              jobId,
              trigger: 'retry'
            }),
          }],
        }));

        console.log(`Retry target added to rule: ${retryRuleName}`);

        // Update job with retry scheduled time
        await docClient.send(new UpdateCommand({
          TableName: jobsTable,
          Key: { id: jobId },
          UpdateExpression: 'SET nextRunAt = :retryTime, updatedAt = :now',
          ExpressionAttributeValues: {
            ':retryTime': retryTime.toISOString(),
            ':now': new Date().toISOString(),
          },
        }));

        console.log(`Updated job ${jobId} with retry time: ${retryTime.toISOString()}`);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        action, 
        jobId,
        message: `Successfully ${action}d schedule for job ${jobId}` 
      }),
    };
  } catch (error: any) {
    console.error(`Failed to ${action} schedule for job ${jobId}:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        success: false, 
        error: error.message,
        action,
        jobId 
      }),
    };
  }
};

function convertToEventBridgeSchedule(cronExpression: string): string {
  // EventBridge uses: cron(minute hour day-of-month month day-of-week year)
  // Standard cron: minute hour day-of-month month day-of-week
  
  console.log(`Converting cron: ${cronExpression}`);
  
  if (cronExpression.startsWith('cron(') || cronExpression.startsWith('rate(')) {
    return cronExpression;
  }
  
  const parts = cronExpression.split(' ');
  if (parts.length === 5) {
    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
    
    // EventBridge requires ? for either day-of-month or day-of-week when the other is specified
    let ebDayOfMonth = dayOfMonth;
    let ebDayOfWeek = dayOfWeek;
    
    if (dayOfWeek !== '*' && dayOfMonth !== '*') {
      ebDayOfMonth = '?'; // If day-of-week is specified, day-of-month should be ?
    } else if (dayOfWeek === '*' && dayOfMonth === '*') {
      ebDayOfWeek = '?'; // Default to ? for day-of-week
    }
    
    const result = `cron(${minute} ${hour} ${ebDayOfMonth} ${month} ${ebDayOfWeek} *)`;
    console.log(`Converted to EventBridge format: ${result}`);
    return result;
  }
  
  // Default fallback
  console.log('Using default schedule: every hour');
  return 'rate(1 hour)';
}

function calculateNextRun(schedule: string): string {
  const now = new Date();
  
  // Simple calculation - in production, use a proper cron parser
  if (schedule.includes('*/4')) {
    // Every 4 hours
    now.setHours(now.getHours() + 4, 0, 0, 0);
  } else if (schedule.includes('*/1')) {
    // Every hour
    now.setHours(now.getHours() + 1, 0, 0, 0);
  } else if (schedule.includes('0 9')) {
    // Daily at 9am - set to next 9am
    now.setDate(now.getDate() + 1);
    now.setHours(9, 0, 0, 0);
  } else if (schedule.includes('*/30')) {
    // Every 30 minutes
    now.setMinutes(now.getMinutes() + 30, 0, 0);
  } else {
    // Default: 1 hour from now
    now.setHours(now.getHours() + 1, 0, 0, 0);
  }
  
  return now.toISOString();
}