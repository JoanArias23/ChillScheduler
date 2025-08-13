import { defineFunction } from '@aws-amplify/backend';

export const scheduleManager = defineFunction({
  name: 'scheduleManager',
  runtime: 20,
  timeoutSeconds: 60,
});