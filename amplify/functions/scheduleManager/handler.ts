import { EventBridgeClient, PutRuleCommand, PutTargetsCommand, DeleteRuleCommand, RemoveTargetsCommand } from '@aws-sdk/client-eventbridge';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const eventBridge = new EventBridgeClient({});
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const JOBS_TABLE = process.env.JOBS_TABLE!;
const JOB_EXECUTOR_ARN = process.env.JOB_EXECUTOR_ARN!;

interface ScheduleEvent {
  action: 'create' | 'update' | 'delete';
  jobId: string;
  schedule?: string;
  enabled?: boolean;
}

export const handler = async (event: ScheduleEvent) => {
  const { action, jobId, schedule, enabled = true } = event;

  try {
    const ruleName = `ChillScheduler-Job-${jobId}`;

    switch (action) {
      case 'create':
      case 'update':
        if (!schedule) {
          throw new Error('Schedule is required for create/update actions');
        }

        // Create or update EventBridge rule
        await eventBridge.send(new PutRuleCommand({
          Name: ruleName,
          Description: `Schedule for ChillScheduler job ${jobId}`,
          ScheduleExpression: convertToCronExpression(schedule),
          State: enabled ? 'ENABLED' : 'DISABLED',
        }));

        // Add Lambda target
        await eventBridge.send(new PutTargetsCommand({
          Rule: ruleName,
          Targets: [{
            Id: '1',
            Arn: JOB_EXECUTOR_ARN,
            Input: JSON.stringify({
              detail: {
                jobId,
                trigger: 'scheduled'
              }
            }),
          }],
        }));

        // Update job with next run time
        const nextRunAt = calculateNextRun(schedule);
        await docClient.send(new UpdateCommand({
          TableName: JOBS_TABLE,
          Key: { id: jobId },
          UpdateExpression: 'SET nextRunAt = :nextRun, updatedAt = :now',
          ExpressionAttributeValues: {
            ':nextRun': nextRunAt,
            ':now': new Date().toISOString(),
          },
        }));

        console.log(`Successfully ${action}d schedule for job ${jobId}`);
        break;

      case 'delete':
        // Remove targets first
        await eventBridge.send(new RemoveTargetsCommand({
          Rule: ruleName,
          Ids: ['1'],
        })).catch(() => {}); // Ignore if already deleted

        // Delete the rule
        await eventBridge.send(new DeleteRuleCommand({
          Name: ruleName,
        })).catch(() => {}); // Ignore if already deleted

        console.log(`Successfully deleted schedule for job ${jobId}`);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, action, jobId }),
    };
  } catch (error: any) {
    console.error(`Failed to ${action} schedule for job ${jobId}:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};

function convertToCronExpression(schedule: string): string {
  // If already in cron format (e.g., "0 */4 * * *"), convert to EventBridge format
  // EventBridge uses: cron(minute hour day-of-month month day-of-week year)
  
  const parts = schedule.split(' ');
  if (parts.length === 5) {
    // Standard cron format, convert to EventBridge
    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
    // EventBridge requires 6 fields (includes year), and uses ? for day-of-month or day-of-week
    const ebDayOfMonth = dayOfMonth === '*' ? '?' : dayOfMonth;
    const ebDayOfWeek = dayOfWeek === '*' ? '?' : dayOfWeek;
    return `cron(${minute} ${hour} ${ebDayOfMonth} ${month} ${ebDayOfWeek} *)`;
  }
  
  // If it's already in EventBridge format
  if (schedule.startsWith('cron(') || schedule.startsWith('rate(')) {
    return schedule;
  }
  
  // Default: every hour
  return 'rate(1 hour)';
}

function calculateNextRun(schedule: string): string {
  // Simple implementation - in production use cron-parser
  // For now, calculate based on common patterns
  
  const now = new Date();
  
  if (schedule.includes('*/4')) {
    // Every 4 hours
    now.setHours(now.getHours() + 4);
  } else if (schedule.includes('*/30')) {
    // Every 30 minutes
    now.setMinutes(now.getMinutes() + 30);
  } else if (schedule.includes('0 9')) {
    // Daily at 9am
    now.setDate(now.getDate() + 1);
    now.setHours(9, 0, 0, 0);
  } else {
    // Default: 1 hour from now
    now.setHours(now.getHours() + 1);
  }
  
  return now.toISOString();
}