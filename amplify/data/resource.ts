import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { scheduleManager } from '../functions/scheduleManager/resource';

const schema = a.schema({
  Job: a
    .model({
      name: a.string().required(),
      prompt: a.string().required(),
      systemPrompt: a.string(),
      schedule: a.string().required(), // cron expression
      enabled: a.boolean().default(true),
      maxTurns: a.integer().default(10),
      lastRunAt: a.datetime(),
      nextRunAt: a.datetime(),
      lastRunStatus: a.enum(['success', 'failed', 'running']),
      lastRunError: a.string(),
      lastRunDuration: a.integer(),
      totalRuns: a.integer().default(0),
      successCount: a.integer().default(0),
      failureCount: a.integer().default(0),
      maxRetries: a.integer().default(3),
      retryCount: a.integer().default(0),
      autoRetry: a.boolean().default(true),
      createdBy: a.string(),
      executions: a.hasMany('JobExecution', 'jobId'),
    })
    .authorization((allow) => [allow.guest()]),
  
  JobExecution: a
    .model({
      jobId: a.id().required(),
      job: a.belongsTo('Job', 'jobId'),
      startedAt: a.datetime().required(),
      completedAt: a.datetime(),
      status: a.enum(['success', 'failed', 'timeout']),
      trigger: a.enum(['scheduled', 'manual', 'retry']),
      response: a.json(),
      errorMessage: a.string(),
      errorType: a.string(),
      durationMs: a.integer(),
      apiLatencyMs: a.integer(),
      toolsExecuted: a.integer(),
    })
    .authorization((allow) => [allow.guest()]),

  manageSchedule: a
    .mutation()
    .arguments({
      action: a.string().required(),
      jobId: a.string().required(),
      schedule: a.string(),
      enabled: a.boolean(),
    })
    .returns(a.json())
    .authorization((allow) => [allow.guest()])
    .handler(a.handler.function(scheduleManager)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'identityPool',
  },
});