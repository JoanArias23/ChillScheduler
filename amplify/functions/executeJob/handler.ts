import type { Handler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const lambdaClient = new LambdaClient({});

interface ExecuteJobEvent {
  jobId: string;
  trigger?: 'scheduled' | 'manual' | 'retry';
}

interface ExecuteJobResponse {
  statusCode: number;
  body: string;
  headers?: Record<string, string>;
}

// Handler for scheduled and manual job execution
export const handler: Handler<ExecuteJobEvent, ExecuteJobResponse> = async (event) => {
  const { jobId, trigger = 'manual' } = event;
  const startTime = Date.now();
  
  console.log(`Executing job ${jobId} (trigger: ${trigger})`);
  
  try {
    // 1. Fetch job from DynamoDB
    // Use fallback table names since environment variables have issues
    const jobsTable = process.env.JOBS_TABLE || 'Job-f19dd7e98f-sandbox';
    const executionsTable = process.env.EXECUTIONS_TABLE || 'JobExecution-f19dd7e98f-sandbox';
    
    const jobResult = await docClient.send(new GetCommand({
      TableName: jobsTable,
      Key: { id: jobId }
    }));

    const job = jobResult.Item;
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    // 2. Call Claude API
    const response = await fetch(process.env.CLAUDE_API_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: job.prompt,
        systemPrompt: job.systemPrompt || "You are a helpful assistant"
      })
    });
    
    if (!response.ok) {
      throw new Error(`Claude API returned ${response.status}`);
    }
    
    const data = await response.json();
    const executionId = `exec_${Date.now()}`;
    const endTime = Date.now();
    const startedAt = new Date(startTime).toISOString();
    const completedAt = new Date(endTime).toISOString();
    const durationMs = endTime - startTime;
    
    // 3. Store execution result
    await docClient.send(new PutCommand({
      TableName: executionsTable,
      Item: {
        id: executionId,
        jobId,
        startedAt,
        completedAt,
        status: 'success',
        trigger,
        response: data,
        durationMs,
        createdAt: completedAt,
        updatedAt: completedAt
      }
    }));

    // 4. Update job status and reset retry count on success
    await docClient.send(new UpdateCommand({
      TableName: jobsTable,
      Key: { id: jobId },
      UpdateExpression: 'SET lastRunStatus = :status, lastRunAt = :time, retryCount = :zero, successCount = if_not_exists(successCount, :zero) + :one, updatedAt = :now REMOVE lastRunError',
      ExpressionAttributeValues: {
        ':status': 'success',
        ':time': completedAt,
        ':zero': 0,
        ':one': 1,
        ':now': completedAt
      }
    }));
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        executionId,
        response: data,
        message: `Job ${jobId} executed successfully`
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  } catch (error: any) {
    console.error(`Failed to execute job ${jobId}:`, error);
    
    // Try to record the failed execution
    try {
      const executionsTable = process.env.EXECUTIONS_TABLE || 'JobExecution-f19dd7e98f-sandbox';
      const jobsTable = process.env.JOBS_TABLE || 'Job-f19dd7e98f-sandbox';
      const executionId = `exec_${Date.now()}`;
      const endTime = Date.now();
      const startedAt = new Date(startTime).toISOString();
      const failedAt = new Date(endTime).toISOString();
      const durationMs = endTime - startTime;
      
      // Record failed execution
      await docClient.send(new PutCommand({
        TableName: executionsTable,
        Item: {
          id: executionId,
          jobId,
          startedAt,
          completedAt: failedAt,
          status: 'failed',
          trigger,
          errorMessage: error.message || 'Execution failed',
          errorType: error.name || 'UnknownError',
          durationMs,
          createdAt: failedAt,
          updatedAt: failedAt
        }
      }));

      // Update job status to failed and increment failure count
      const jobUpdateResult = await docClient.send(new UpdateCommand({
        TableName: jobsTable,
        Key: { id: jobId },
        UpdateExpression: 'SET lastRunStatus = :status, lastRunAt = :time, lastRunError = :error, failureCount = if_not_exists(failureCount, :zero) + :one, updatedAt = :now',
        ExpressionAttributeValues: {
          ':status': 'failed',
          ':time': failedAt,
          ':error': error.message || 'Execution failed',
          ':zero': 0,
          ':one': 1,
          ':now': failedAt
        }
      }));

      // Try to trigger retry if auto-retry is enabled
      try {
        const jobResult = await docClient.send(new GetCommand({
          TableName: jobsTable,
          Key: { id: jobId }
        }));

        const job = jobResult.Item;
        if (job && job.autoRetry && (job.retryCount || 0) < (job.maxRetries || 3)) {
          console.log(`Triggering retry for job ${jobId} (attempt ${(job.retryCount || 0) + 1}/${job.maxRetries || 3})`);
          
          // Increment retry count
          await docClient.send(new UpdateCommand({
            TableName: jobsTable,
            Key: { id: jobId },
            UpdateExpression: 'SET retryCount = if_not_exists(retryCount, :zero) + :one',
            ExpressionAttributeValues: {
              ':zero': 0,
              ':one': 1
            }
          }));

          // Invoke scheduleManager to create retry schedule
          const scheduleManagerArn = process.env.SCHEDULE_MANAGER_ARN;
          if (scheduleManagerArn) {
            await lambdaClient.send(new InvokeCommand({
              FunctionName: scheduleManagerArn,
              InvocationType: 'Event', // Async invocation
              Payload: JSON.stringify({
                action: 'retry',
                jobId,
                retryDelayMinutes: Math.min(30 * Math.pow(2, job.retryCount || 0), 240) // Exponential backoff: 30min, 1h, 2h, 4h max
              })
            }));
            console.log(`Retry scheduled for job ${jobId}`);
          } else {
            console.warn('SCHEDULE_MANAGER_ARN not found, cannot schedule retry');
          }
        } else {
          console.log(`No retry scheduled for job ${jobId}: autoRetry=${job?.autoRetry}, retryCount=${job?.retryCount}, maxRetries=${job?.maxRetries}`);
        }
      } catch (retryError) {
        console.error('Failed to trigger retry:', retryError);
      }
    } catch (recordError) {
      console.error('Failed to record execution failure:', recordError);
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        executionId: null,
        response: null,
        message: error.message || 'Execution failed'
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }
};