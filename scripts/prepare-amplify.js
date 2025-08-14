#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read amplify_outputs.json if it exists
const outputsPath = path.join(process.cwd(), 'amplify_outputs.json');
const publicOutputsPath = path.join(process.cwd(), 'public', 'amplify_outputs.json');

if (fs.existsSync(outputsPath)) {
  // Copy to public folder
  fs.copyFileSync(outputsPath, publicOutputsPath);
  console.log('✅ Copied amplify_outputs.json to public folder');
  
  // Also create an environment variable with the config
  const config = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  const envPath = path.join(process.cwd(), '.env.local');
  const envContent = `NEXT_PUBLIC_AMPLIFY_CONFIG='${JSON.stringify(config)}'`;
  
  // Append to .env.local if it exists, otherwise create it
  if (fs.existsSync(envPath)) {
    const currentEnv = fs.readFileSync(envPath, 'utf8');
    if (!currentEnv.includes('NEXT_PUBLIC_AMPLIFY_CONFIG')) {
      fs.appendFileSync(envPath, '\n' + envContent);
    }
  } else {
    fs.writeFileSync(envPath, envContent);
  }
  
  console.log('✅ Set NEXT_PUBLIC_AMPLIFY_CONFIG environment variable');
} else {
  console.log('⚠️  amplify_outputs.json not found - app will run in disconnected mode');
}