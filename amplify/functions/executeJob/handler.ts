import type { Handler } from 'aws-lambda';

export const handler: Handler = async (event) => {
  console.log('Execute job event:', JSON.stringify(event));
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      message: 'Mock execution successful',
      timestamp: new Date().toISOString()
    }),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  };
};