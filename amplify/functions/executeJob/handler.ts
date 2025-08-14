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

// Mock AI Response Generator
function generateMockResponse(prompt: string, systemPrompt?: string): any {
  const promptLower = prompt.toLowerCase();
  const timestamp = new Date().toISOString();
  
  // Simulate processing delay
  const processingTime = Math.floor(Math.random() * 2000) + 1000; // 1-3 seconds
  
  // Generate contextual responses based on keywords
  if (promptLower.includes('bitcoin') || promptLower.includes('crypto')) {
    return {
      response: `📊 **Crypto Market Analysis** (${timestamp})

**Bitcoin (BTC)**: $${(45000 + Math.random() * 5000).toFixed(2)}
- 24h Change: ${(Math.random() * 10 - 5).toFixed(2)}%
- Volume: $${(20 + Math.random() * 10).toFixed(1)}B
- Market Sentiment: ${Math.random() > 0.5 ? 'Bullish 🟢' : 'Bearish 🔴'}

**Top 3 Opportunities:**
1. **DeFi Yield Farming**: APY rates reaching ${(8 + Math.random() * 4).toFixed(1)}% on stablecoins
2. **Layer 2 Solutions**: Ethereum L2s showing ${(30 + Math.random() * 20).toFixed(0)}% growth
3. **NFT Gaming**: Play-to-earn sector recovering with ${(15 + Math.random() * 10).toFixed(0)}% weekly gains

**Risk Alert**: Volatility index at ${(20 + Math.random() * 30).toFixed(0)}/100`,
      processingTime,
      model: 'mock-ai-v1',
      tokensUsed: Math.floor(Math.random() * 500) + 100
    };
  }
  
  if (promptLower.includes('weather')) {
    const cities = ['New York', 'London', 'Tokyo', 'Sydney', 'Paris'];
    const city = cities[Math.floor(Math.random() * cities.length)];
    return {
      response: `🌤️ **Weather Report** for ${city}

**Current Conditions**:
- Temperature: ${(15 + Math.random() * 20).toFixed(0)}°C
- Feels Like: ${(14 + Math.random() * 20).toFixed(0)}°C
- Humidity: ${(40 + Math.random() * 40).toFixed(0)}%
- Wind: ${(5 + Math.random() * 20).toFixed(0)} km/h

**Today's Forecast**:
Morning: ${['Sunny', 'Partly Cloudy', 'Cloudy'][Math.floor(Math.random() * 3)]}
Afternoon: ${['Clear', 'Scattered Clouds', 'Light Rain'][Math.floor(Math.random() * 3)]}
Evening: ${['Clear', 'Partly Cloudy', 'Overcast'][Math.floor(Math.random() * 3)]}

**Next 3 Days**: ${Math.random() > 0.5 ? 'Stable conditions expected' : 'Variable weather patterns incoming'}`,
      processingTime,
      model: 'mock-ai-v1'
    };
  }
  
  if (promptLower.includes('news') || promptLower.includes('summary')) {
    return {
      response: `📰 **Daily News Summary** (${timestamp})

**Top Stories**:

1. **Technology**: Major AI breakthrough announced - New model achieves ${(90 + Math.random() * 9).toFixed(1)}% accuracy in complex reasoning tasks

2. **Business**: Stock markets ${Math.random() > 0.5 ? 'rally' : 'consolidate'} as earnings season approaches. S&P 500 ${Math.random() > 0.5 ? 'up' : 'down'} ${(Math.random() * 2).toFixed(2)}%

3. **Science**: Researchers discover new method for ${['carbon capture', 'renewable energy storage', 'quantum computing'][Math.floor(Math.random() * 3)]}

4. **World**: Global climate summit reaches agreement on ${(2030 + Math.floor(Math.random() * 20))} targets

**Trending Topics**: #AI #Sustainability #Innovation`,
      processingTime,
      model: 'mock-ai-v1'
    };
  }
  
  if (promptLower.includes('analyze') || promptLower.includes('data')) {
    return {
      response: `📈 **Data Analysis Complete**

**Key Findings**:
- Pattern Recognition: ${(3 + Math.floor(Math.random() * 5))} significant patterns identified
- Trend Analysis: ${Math.random() > 0.5 ? 'Upward' : 'Stable'} trajectory detected
- Confidence Level: ${(75 + Math.random() * 20).toFixed(1)}%
- Anomalies Detected: ${Math.floor(Math.random() * 3)}

**Recommendations**:
1. Continue monitoring current trends
2. Implement suggested optimizations
3. Review in ${(7 + Math.floor(Math.random() * 14))} days

**Performance Metrics**:
- Efficiency Score: ${(80 + Math.random() * 15).toFixed(1)}/100
- Accuracy Rate: ${(85 + Math.random() * 10).toFixed(1)}%`,
      processingTime,
      model: 'mock-ai-v1'
    };
  }
  
  if (promptLower.includes('email') || promptLower.includes('report')) {
    return {
      response: `📧 **Automated Report Generated**

Subject: ${systemPrompt || 'Daily Update'} - ${new Date().toLocaleDateString()}

**Executive Summary**:
All systems operating within normal parameters. ${Math.floor(Math.random() * 10) + 5} tasks completed successfully.

**Key Metrics**:
- Completion Rate: ${(92 + Math.random() * 7).toFixed(1)}%
- Response Time: ${(100 + Math.random() * 50).toFixed(0)}ms avg
- User Satisfaction: ${(4.2 + Math.random() * 0.7).toFixed(1)}/5.0

**Action Items**:
✅ All scheduled tasks completed
✅ No critical issues detected
📋 Next review scheduled for tomorrow

Best regards,
ChillScheduler AI Assistant`,
      processingTime,
      model: 'mock-ai-v1'
    };
  }
  
  // Default response for generic prompts
  return {
    response: `✨ **Task Completed Successfully**

**Request**: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"

**Result**:
The requested task has been processed and completed. 

**Summary**:
- Processing Time: ${processingTime}ms
- Status: Success
- Confidence: ${(85 + Math.random() * 10).toFixed(1)}%
- Timestamp: ${timestamp}

**Additional Notes**:
${systemPrompt ? `System context applied: "${systemPrompt}"` : 'Standard processing parameters used.'}

This is a mock response for demonstration purposes. Connect a real AI API for actual results.`,
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
    // This simulates an AI response based on keywords in the prompt
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