import { defineFunction } from '@aws-amplify/backend';

export const scheduleManager = defineFunction({
  name: 'scheduleManager',
  entry: './handler.ts',
  timeoutSeconds: 60,
  runtime: 20,
  resourceGroupName: 'data',
});