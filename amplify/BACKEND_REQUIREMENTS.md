# ChillScheduler Backend Requirements - Amplify Gen 2

## 📋 Executive Summary

Backend infrastructure for ChillScheduler, a visual dashboard that enables teams to schedule AI-powered automation tasks. The backend manages job scheduling, execution, and monitoring while integrating with an external Claude API endpoint for AI task processing.

## 🎯 Core Responsibilities

### What the Backend Must Handle
1. **Job Management**: CRUD operations for scheduled AI tasks
2. **Scheduling Engine**: Cron-based job triggering using EventBridge
3. **Execution Orchestration**: Calling Claude API and tracking results
4. **Data Persistence**: Storing jobs, execution history, and metrics
5. **Real-time Updates**: Notifying frontend of job status changes
6. **Error Handling**: Retry logic, timeout management, failure recovery

### What the Backend Does NOT Handle
- AI processing (handled by external Claude API at `http://claude.chinchilla-ai.com:3000/query`)
- MCP tool integrations (handled by Claude API)
- Authentication (using Amplify guest access for MVP)

## 🏗️ Architecture Overview

### Tech Stack
- **Framework**: AWS Amplify Gen 2
- **Database**: DynamoDB (via Amplify Data)
- **Functions**: Lambda (Node.js 20.x)
- **Scheduling**: EventBridge Rules
- **API**: GraphQL (AppSync)
- **Real-time**: GraphQL Subscriptions
- **External API**: HTTP calls to Claude endpoint

### Service Architecture
```
Frontend Dashboard
       ↓
   AppSync API
       ↓
   DynamoDB
       ↓
EventBridge → Lambda → Claude API
       ↓
   DynamoDB
       ↓
   AppSync Subscriptions → Frontend
```

## 📊 Data Models

### Job Model
```typescript
Job {
  id: ID!
  name: String!                    // User-friendly job name
  prompt: String!                  // AI instruction/prompt
  systemPrompt: String             // Optional system context
  schedule: String!                // Cron expression
  enabled: Boolean!                // Job active/paused state
  maxTurns: Int                    // Max AI conversation turns (default: 10)
  timeout: Int                     // Execution timeout in seconds (default: 300)
  retryPolicy: {
    maxRetries: Int                // Max retry attempts (default: 3)
    retryDelay: Int                // Delay between retries in seconds
  }
  tags: [String]                   // Job categorization
  metadata: JSON                   // Flexible additional data
  
  // Execution tracking
  lastRunAt: DateTime
  lastRunStatus: Enum ['success', 'failed', 'timeout', 'running']
  lastRunDuration: Int             // In milliseconds
  lastRunError: String
  nextRunAt: DateTime              // Calculated from cron
  totalRuns: Int
  successCount: Int
  failureCount: Int
  averageDuration: Int
  
  // Relationships
  executions: [JobExecution]       // HasMany relationship
  
  // Audit fields
  createdAt: DateTime!
  updatedAt: DateTime!
  createdBy: String               // User identifier (future)
  updatedBy: String
}
```

### JobExecution Model
```typescript
JobExecution {
  id: ID!
  jobId: ID!                      // Foreign key to Job
  job: Job                        // BelongsTo relationship
  
  // Execution details
  startedAt: DateTime!
  completedAt: DateTime
  status: Enum ['success', 'failed', 'timeout']!
  trigger: Enum ['scheduled', 'manual', 'retry']!
  
  // Request/Response
  requestPayload: JSON {          // What was sent to Claude API
    prompt: String
    systemPrompt: String
    options: {
      maxTurns: Int
    }
  }
  
  response: JSON {                // Claude API response
    result: String                // AI response text
    toolsUsed: [String]           // MCP tools executed
    conversationTurns: Int        // Number of turns used
    metadata: JSON                // Additional response data
  }
  
  // Metrics
  durationMs: Int                 // Total execution time
  apiLatencyMs: Int              // Claude API response time
  toolsExecutedCount: Int
  tokensUsed: Int                // If available from API
  
  // Error tracking
  errorMessage: String
  errorType: String              // 'timeout', 'api_error', 'network', etc.
  errorDetails: JSON
  retryCount: Int
  
  // Audit
  createdAt: DateTime!
}
```

### JobSchedule Model (Optional - for complex scheduling)
```typescript
JobSchedule {
  id: ID!
  jobId: ID!
  
  // Schedule configuration
  cronExpression: String          // Standard cron syntax
  timezone: String                // IANA timezone (default: UTC)
  
  // Schedule window
  startDate: DateTime             // When schedule becomes active
  endDate: DateTime              // When schedule expires
  
  // Blackout periods
  blackoutPeriods: [JSON] {
    start: DateTime
    end: DateTime
    reason: String
  }
  
  // Next run calculation
  nextRunAt: DateTime            // Pre-calculated for efficiency
  lastCalculatedAt: DateTime
}
```

## 🔧 Lambda Functions

### 1. Job Manager Function
**Purpose**: Handles job CRUD operations and schedule management

**Triggers**:
- GraphQL resolvers (create, update, delete, pause, resume)
- Direct invocation for batch operations

**Responsibilities**:
- Validate cron expressions
- Calculate next run times
- Create/update EventBridge rules
- Update job statistics after executions

**Environment Variables**:
- `EVENTBRIDGE_RULE_PREFIX`: Prefix for EventBridge rules
- `JOBS_TABLE_NAME`: DynamoDB table name

### 2. Job Executor Function
**Purpose**: Executes scheduled jobs by calling Claude API

**Triggers**:
- EventBridge rules (scheduled)
- Direct invocation (manual run)
- SQS queue (retry queue)

**Responsibilities**:
- Fetch job details from DynamoDB
- Call Claude API with prompt
- Handle timeouts and retries
- Store execution results
- Update job statistics
- Trigger real-time updates

**Environment Variables**:
- `CLAUDE_API_URL`: http://claude.chinchilla-ai.com:3000/query
- `CLAUDE_API_TIMEOUT`: 300000 (5 minutes)
- `EXECUTIONS_TABLE_NAME`: DynamoDB table name
- `RETRY_QUEUE_URL`: SQS queue for retries

**Error Handling**:
- Network failures: Retry with exponential backoff
- Timeout: Mark as timeout, optionally retry
- API errors: Log detailed error, no retry
- Rate limiting: Queue for delayed retry

### 3. Schedule Processor Function
**Purpose**: Batch process to update next run times and manage schedules

**Triggers**:
- EventBridge rule (every 5 minutes)
- Manual invocation for maintenance

**Responsibilities**:
- Scan all enabled jobs
- Recalculate next run times
- Update EventBridge rules if changed
- Clean up expired schedules
- Alert on scheduling conflicts

### 4. Metrics Aggregator Function
**Purpose**: Calculate and update job performance metrics

**Triggers**:
- EventBridge rule (every hour)
- After each job execution (async)

**Responsibilities**:
- Calculate success rates
- Update average durations
- Identify problematic jobs (high failure rate)
- Generate daily/weekly summaries
- Clean up old execution records (after 30 days)

### 5. Webhook Handler Function (Future)
**Purpose**: Trigger jobs via external webhooks

**Triggers**:
- API Gateway endpoint

**Responsibilities**:
- Validate webhook signatures
- Map webhook to job
- Trigger job execution
- Return execution status

## 🔄 Business Logic & Workflows

### Job Creation Flow
1. Validate input (name, prompt, cron expression)
2. Parse and validate cron expression
3. Calculate first run time
4. Create DynamoDB record
5. Create EventBridge rule with Lambda target
6. Return job details with confirmation

### Job Execution Flow
1. EventBridge triggers Lambda at scheduled time
2. Lambda fetches job details from DynamoDB
3. Update job status to 'running'
4. Build request payload for Claude API
5. Call Claude API with timeout handling
6. Process response and extract metrics
7. Store execution record in DynamoDB
8. Update job statistics and last run info
9. Trigger GraphQL subscription for real-time update
10. Handle any retry logic if failed

### Manual Job Trigger Flow
1. Receive manual trigger request via GraphQL
2. Validate job exists and is enabled
3. Check for existing running execution
4. Invoke Job Executor Lambda directly
5. Return execution ID for tracking

### Job Update Flow
1. Validate updated fields
2. If schedule changed:
   - Delete old EventBridge rule
   - Create new EventBridge rule
   - Recalculate next run time
3. Update DynamoDB record
4. Trigger subscription update

### Job Deletion Flow
1. Soft delete: Set enabled=false, keep history
2. Hard delete: 
   - Delete EventBridge rule
   - Archive executions to S3 (optional)
   - Delete DynamoDB records

## 🔐 Security & Permissions

### IAM Roles Required

#### Job Manager Lambda Role
- DynamoDB: Read/Write on Jobs table
- EventBridge: Create/Update/Delete rules
- Lambda: Invoke Job Executor function
- CloudWatch Logs: Write

#### Job Executor Lambda Role
- DynamoDB: Read Jobs table, Write Executions table
- Secrets Manager: Read API keys (if needed)
- CloudWatch Logs: Write
- AppSync: Trigger subscriptions
- SQS: Send messages (retry queue)

#### Schedule Processor Lambda Role
- DynamoDB: Read/Write Jobs table
- EventBridge: List/Update rules
- CloudWatch Logs: Write

### API Security
- GraphQL authorization: Guest access for MVP
- Future: Cognito user pools with per-user job isolation
- Rate limiting on manual triggers
- Input validation and sanitization

## 📈 Monitoring & Observability

### CloudWatch Metrics
- Job execution count by status
- Average execution duration
- API call latency
- Error rates by type
- Active jobs count
- Queue depth (retry queue)

### CloudWatch Alarms
- High failure rate (> 25% in 1 hour)
- Execution timeout rate
- Lambda throttling
- DynamoDB throttling
- Claude API unreachable

### Logging Strategy
- Structured JSON logs
- Correlation IDs for request tracing
- Log levels: ERROR, WARN, INFO, DEBUG
- Sensitive data masking
- 30-day retention

## 🚀 Deployment & Scaling

### Deployment Strategy
- Infrastructure as Code via CDK (Amplify Gen 2)
- Separate environments: dev, staging, prod
- Blue-green deployments for Lambda
- Database migrations via Lambda

### Scaling Considerations
- DynamoDB: On-demand billing mode
- Lambda: Concurrent execution limit (100 default)
- EventBridge: 300 rules per region (plan for sharding)
- API Gateway: 10,000 requests per second
- Consider SQS for job queue if > 1000 jobs

### Performance Targets
- Job creation: < 500ms
- Job list query: < 1s for 1000 jobs
- Manual trigger: < 1s to start execution
- Subscription updates: < 100ms
- Schedule calculation: < 100ms

## 🔄 Integration Points

### Claude API Integration
**Endpoint**: `POST http://claude.chinchilla-ai.com:3000/query`

**Request Format**:
```json
{
  "prompt": "string",
  "systemPrompt": "string (optional)",
  "options": {
    "maxTurns": 10
  }
}
```

**Response Format**:
```json
{
  "result": "string",
  "toolsUsed": ["slack", "jira"],
  "metadata": {},
  "error": null
}
```

**Error Handling**:
- 200: Success
- 400: Invalid request
- 429: Rate limited
- 500: Server error
- Timeout: After 5 minutes

### GraphQL API Schema
```graphql
type Job {
  id: ID!
  name: String!
  prompt: String!
  schedule: String!
  enabled: Boolean!
  lastRunAt: DateTime
  lastRunStatus: String
  nextRunAt: DateTime
  executions(limit: Int): [JobExecution]
}

type JobExecution {
  id: ID!
  jobId: ID!
  startedAt: DateTime!
  completedAt: DateTime
  status: String!
  response: JSON
  errorMessage: String
  durationMs: Int
}

type Mutation {
  createJob(input: CreateJobInput!): Job!
  updateJob(id: ID!, input: UpdateJobInput!): Job!
  deleteJob(id: ID!): Boolean!
  pauseJob(id: ID!): Job!
  resumeJob(id: ID!): Job!
  triggerJob(id: ID!): JobExecution!
}

type Query {
  getJob(id: ID!): Job
  listJobs(filter: JobFilter, limit: Int): [Job]!
  getExecution(id: ID!): JobExecution
  listExecutions(jobId: ID!, limit: Int): [JobExecution]!
}

type Subscription {
  onJobStatusChange(id: ID): Job
  onJobExecutionComplete(jobId: ID): JobExecution
}
```

## 📝 Implementation Priorities

### Phase 1 (MVP)
1. Basic data models (Job, JobExecution)
2. Job CRUD operations
3. Simple cron scheduling with EventBridge
4. Job Executor Lambda with Claude API integration
5. Basic error handling and retries
6. GraphQL API with subscriptions

### Phase 2 (Enhanced)
1. Advanced scheduling (timezones, blackout periods)
2. Retry queue with SQS
3. Metrics aggregation
4. Performance optimization
5. Batch operations
6. Export/import jobs

### Phase 3 (Scale)
1. User authentication and isolation
2. Team workspaces
3. Webhook triggers
4. Job dependencies and chaining
5. Cost tracking and limits
6. Advanced monitoring and alerting

## 🐛 Error Scenarios & Handling

### Common Error Cases
1. **Invalid Cron Expression**: Validate before save, show helpful error
2. **Claude API Timeout**: Mark as timeout, optional retry
3. **Rate Limiting**: Queue for later, exponential backoff
4. **Network Failure**: Automatic retry with backoff
5. **Lambda Timeout**: Increase timeout or break into smaller tasks
6. **DynamoDB Throttling**: Implement exponential backoff
7. **EventBridge Rule Limit**: Implement rule sharding strategy
8. **Concurrent Execution**: Skip if already running

### Recovery Strategies
- Dead letter queues for failed executions
- Manual retry capability from UI
- Automatic cleanup of stuck 'running' states
- Health checks and auto-recovery
- Circuit breaker for Claude API

## 📚 Dependencies

### NPM Packages Needed
```json
{
  "dependencies": {
    "aws-sdk": "^3.x",
    "node-fetch": "^3.x",
    "cron-parser": "^4.x",
    "uuid": "^9.x",
    "date-fns": "^2.x",
    "zod": "^3.x"
  }
}
```

### AWS Services Used
- DynamoDB
- Lambda
- EventBridge
- AppSync
- CloudWatch
- IAM
- Secrets Manager (future)
- SQS (future)
- S3 (future, for archival)