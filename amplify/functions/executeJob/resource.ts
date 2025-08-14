import { defineFunction } from '@aws-amplify/backend';

export const executeJob = defineFunction({
  name: 'executeJob',
  entry: './handler.ts',
  timeoutSeconds: 360, // 6 minutes for Claude API timeout
  runtime: 20,
  resourceGroupName: 'data',
  environment: {
    CLAUDE_API_URL: 'http://claude.chinchilla-ai.com:3000/query',
  }
});