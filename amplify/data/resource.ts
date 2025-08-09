import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

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
      status: a.enum(['success', 'failed', 'timeout']).required(),
      response: a.json(),
      errorMessage: a.string(),
      durationMs: a.integer(),
      toolsExecuted: a.integer(),
    })
    .authorization((allow) => [allow.guest()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'identityPool',
  },
});