import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { EventBridgeEvent } from 'aws-lambda';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const CLAUDE_API_URL = process.env.CLAUDE_API_URL || 'http://claude.chinchilla-ai.com:3000/query';
const JOBS_TABLE = process.env.JOBS_TABLE!;
const EXECUTIONS_TABLE = process.env.EXECUTIONS_TABLE!;

interface JobExecutionEvent {
  jobId: string;
  trigger: 'scheduled' | 'manual';
}

export const handler = async (event: EventBridgeEvent<'ScheduledJob', JobExecutionEvent>) => {
  const { jobId, trigger = 'scheduled' } = event.detail || {};
  
  if (!jobId) {
    console.error('No jobId provided');
    return { statusCode: 400, body: 'Missing jobId' };
  }

  const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startedAt = new Date().toISOString();

  try {
    // 1. Fetch job details
    const jobResult = await docClient.send(new GetCommand({
      TableName: JOBS_TABLE,
      Key: { id: jobId }
    }));

    const job = jobResult.Item;
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (!job.enabled && trigger === 'scheduled') {
      console.log(`Job ${jobId} is disabled, skipping scheduled execution`);
      return { statusCode: 200, body: 'Job disabled' };
    }

    // 2. Update job status to running
    await docClient.send(new UpdateCommand({
      TableName: JOBS_TABLE,
      Key: { id: jobId },
      UpdateExpression: 'SET lastRunStatus = :status, lastRunAt = :time',
      ExpressionAttributeValues: {
        ':status': 'running',
        ':time': startedAt
      }
    }));

    // 3. Call Claude API
    const requestPayload = {
      prompt: job.prompt,
      systemPrompt: job.systemPrompt,
      options: {
        maxTurns: job.maxTurns || 10
      }
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 300000); // 5 minute timeout

    let response;
    let apiStartTime = Date.now();
    
    try {
      const apiResponse = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
        signal: controller.signal
      });

      clearTimeout(timeout);
      
      if (!apiResponse.ok) {
        throw new Error(`API returned ${apiResponse.status}: ${apiResponse.statusText}`);
      }

      response = await apiResponse.json();
    } catch (error: any) {
      clearTimeout(timeout);
      
      if (error.name === 'AbortError') {
        throw new Error('Claude API timeout after 5 minutes');
      }
      throw error;
    }

    const apiLatency = Date.now() - apiStartTime;
    const completedAt = new Date().toISOString();
    const durationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();

    // 4. Store successful execution
    await docClient.send(new PutCommand({
      TableName: EXECUTIONS_TABLE,
      Item: {
        id: executionId,
        jobId,
        startedAt,
        completedAt,
        status: 'success',
        trigger,
        response,
        durationMs,
        apiLatencyMs: apiLatency,
        toolsExecuted: response.toolsUsed?.length || 0,
        createdAt: completedAt,
        updatedAt: completedAt
      }
    }));

    // 5. Update job with success status and calculate next run
    const nextRunAt = calculateNextRun(job.schedule);
    
    await docClient.send(new UpdateCommand({
      TableName: JOBS_TABLE,
      Key: { id: jobId },
      UpdateExpression: `
        SET lastRunStatus = :status,
            lastRunAt = :lastRun,
            nextRunAt = :nextRun,
            lastRunDuration = :duration,
            totalRuns = if_not_exists(totalRuns, :zero) + :one,
            successCount = if_not_exists(successCount, :zero) + :one,
            updatedAt = :now
      `,
      ExpressionAttributeValues: {
        ':status': 'success',
        ':lastRun': completedAt,
        ':nextRun': nextRunAt,
        ':duration': durationMs,
        ':zero': 0,
        ':one': 1,
        ':now': completedAt
      }
    }));

    console.log(`Job ${jobId} executed successfully in ${durationMs}ms`);
    return {
      statusCode: 200,
      body: JSON.stringify({ executionId, status: 'success', durationMs })
    };

  } catch (error: any) {
    console.error(`Job ${jobId} execution failed:`, error);
    
    const completedAt = new Date().toISOString();
    const durationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();

    // Store failed execution
    await docClient.send(new PutCommand({
      TableName: EXECUTIONS_TABLE,
      Item: {
        id: executionId,
        jobId,
        startedAt,
        completedAt,
        status: 'failed',
        trigger,
        errorMessage: error.message,
        errorType: error.name,
        durationMs,
        createdAt: completedAt,
        updatedAt: completedAt
      }
    }));

    // Update job with failure status
    await docClient.send(new UpdateCommand({
      TableName: JOBS_TABLE,
      Key: { id: jobId },
      UpdateExpression: `
        SET lastRunStatus = :status,
            lastRunAt = :lastRun,
            lastRunError = :error,
            lastRunDuration = :duration,
            totalRuns = if_not_exists(totalRuns, :zero) + :one,
            failureCount = if_not_exists(failureCount, :zero) + :one,
            updatedAt = :now
      `,
      ExpressionAttributeValues: {
        ':status': 'failed',
        ':lastRun': completedAt,
        ':error': error.message,
        ':duration': durationMs,
        ':zero': 0,
        ':one': 1,
        ':now': completedAt
      }
    }));

    return {
      statusCode: 500,
      body: JSON.stringify({ executionId, status: 'failed', error: error.message })
    };
  }
};

function calculateNextRun(cronExpression: string): string {
  // Simple implementation - in production, use cron-parser library
  // For now, just add 1 hour as placeholder
  const next = new Date();
  next.setHours(next.getHours() + 1);
  return next.toISOString();
}