import type { Handler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

interface ExecuteJobEvent {
  jobId: string;
}

interface ExecuteJobResponse {
  statusCode: number;
  body: string;
  headers?: Record<string, string>;
}

// Handler for manual job execution
export const handler: Handler<ExecuteJobEvent, ExecuteJobResponse> = async (event) => {
  const { jobId } = event;
  
  console.log(`Executing job ${jobId}`);
  
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
    const startedAt = new Date().toISOString();
    const completedAt = new Date().toISOString();
    
    // 3. Store execution result
    await docClient.send(new PutCommand({
      TableName: executionsTable,
      Item: {
        id: executionId,
        jobId,
        startedAt,
        completedAt,
        status: 'success',
        trigger: 'manual',
        response: data,
        durationMs: 1000, // placeholder
        createdAt: completedAt,
        updatedAt: completedAt
      }
    }));

    // 4. Update job status
    await docClient.send(new UpdateCommand({
      TableName: jobsTable,
      Key: { id: jobId },
      UpdateExpression: 'SET lastRunStatus = :status, lastRunAt = :time, updatedAt = :now',
      ExpressionAttributeValues: {
        ':status': 'success',
        ':time': completedAt,
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