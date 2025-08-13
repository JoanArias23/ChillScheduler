import { defineFunction } from '@aws-amplify/backend';

export const jobExecutor = defineFunction({
  name: 'jobExecutor',
  runtime: 20,
  timeoutSeconds: 360, // 6 minutes to account for 5 minute Claude API timeout
  environment: {
    CLAUDE_API_URL: 'http://claude.chinchilla-ai.com:3000/query',
  },
});