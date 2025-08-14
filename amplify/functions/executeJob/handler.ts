import type { Handler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

interface ExecuteJobEvent {
  jobId: string;
  trigger?: 'scheduled' | 'manual' | 'retry';
}

interface ExecuteJobResponse {
  statusCode: number;
  body: string;
  headers?: Record<string, string>;
}

// Simple Mock AI Response Generator
function generateMockResponse(prompt: string, systemPrompt?: string): any {
  const timestamp = new Date().toISOString();
  const processingTime = Math.floor(Math.random() * 2000) + 1000;
  
  // Default mock response
  return {
    response: JSON.stringify({
      message: 'Task completed successfully',
      prompt: prompt,
      timestamp: timestamp,
      system: systemPrompt || 'Default system',
      mockData: {
        status: 'success',
        confidence: Math.floor(Math.random() * 20) + 80,
        processingTimeMs: processingTime
      }
    }),
    processingTime,
    model: 'mock-ai-v1',
    debug: 'Mock API - No real AI service connected'
  };
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

    // 2. Mock AI Response Generator
    // This simulates an AI response
    const data = generateMockResponse(job.prompt, job.systemPrompt);
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
      await docClient.send(new UpdateCommand({
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
      
      // Note: Retry logic would be handled by a separate process to avoid circular dependencies
      console.log(`Job ${jobId} failed. Manual retry may be needed.`);
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