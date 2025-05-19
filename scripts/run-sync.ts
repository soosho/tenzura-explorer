import 'dotenv/config';
import { exec } from 'child_process';
import cron from 'node-cron';
import path from 'path';
import fs from 'fs';

// Ensure tmp directory exists for lock files
const tmpDir = path.join(process.cwd(), 'tmp');
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir);
}

console.log('Starting Tenzura Explorer sync daemon...');

// Schedule blockchain index update every minute
cron.schedule('* * * * *', () => {
  console.log(`[${new Date().toISOString()}] Running scheduled blockchain sync...`);
  
  exec('npx tsx scripts/sync.ts index update', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing blockchain sync: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Stderr from blockchain sync: ${stderr}`);
    }
    if (stdout) {
      console.log(`Sync output: ${stdout}`);
    }
  });
});

// Schedule market data update every 5 minutes
cron.schedule('*/5 * * * *', () => {
  console.log(`[${new Date().toISOString()}] Running scheduled market sync...`);
  
  exec('npx tsx scripts/sync.ts market', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing market sync: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Stderr from market sync: ${stderr}`);
    }
    if (stdout) {
      console.log(`Market sync output: ${stdout}`);
    }
  });
});

// Keep the process running
console.log('Sync daemon running. Press Ctrl+C to stop.');