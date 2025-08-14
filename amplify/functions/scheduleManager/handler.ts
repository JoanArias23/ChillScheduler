import type { Handler } from 'aws-lambda';

export const handler: Handler = async (event) => {
  console.log('Schedule manager event:', JSON.stringify(event));
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      message: 'Schedule operation successful',
      action: event.action,
      jobId: event.jobId
    })
  };
};