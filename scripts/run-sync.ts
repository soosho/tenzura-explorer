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

// Add this variable to track last successful sync
let lastSuccessfulSync = Date.now();
let syncInProgress = false;

// Function to clean locks and retry command
function cleanLocksAndRetry(command: string) {
  console.log('DETECTED STALE LOCK! CLEANING LOCKS...');
  
  // Run the clean-locks script
  exec('npx tsx scripts/clean-locks.ts', (cleanError, cleanStdout) => {
    if (cleanError) {
      console.error(`Error cleaning locks: ${cleanError.message}`);
      return;
    }
    
    console.log(`Lock cleaning result: ${cleanStdout.trim()}`);
    
    // Wait a moment for locks to be fully released
    setTimeout(() => {
      // Retry the original command
      console.log('RETRYING COMMAND...');
      exec(command, (retryError, retryStdout) => {
        if (retryError) {
          console.error(`Error on retry: ${retryError.message}`);
          return;
        }
        console.log(`Retry output: ${retryStdout}`);
      });
    }, 500);
  });
}

// Modify the blockchain sync function
setInterval(() => {
  // Skip if a sync is still in progress
  if (syncInProgress) {
    console.log(`[${new Date().toISOString()}] Previous sync still running, skipping...`);
    
    // Only clean locks if the sync has been running for too long (5 minutes)
    const minutesSinceLastSync = (Date.now() - lastSuccessfulSync) / 60000;
    if (minutesSinceLastSync > 5) {
      console.log(`Sync has been running for ${minutesSinceLastSync.toFixed(1)} minutes, clearing stale lock...`);
      cleanLocksAndRetry('npx tsx scripts/sync.ts index update');
      syncInProgress = false;
      lastSuccessfulSync = Date.now();
    }
    return;
  }
  
  console.log(`[${new Date().toISOString()}] Running scheduled blockchain sync...`);
  syncInProgress = true;
  
  exec('npx tsx scripts/sync.ts index update', (error, stdout) => {
    if (error) {
      console.error(`Error executing blockchain sync: ${error.message}`);
      syncInProgress = false;
      return;
    }
    
    if (stdout && stdout.includes('Script already running..')) {
      cleanLocksAndRetry('npx tsx scripts/sync.ts index update');
    } else {
      console.log(`Sync output: ${stdout}`);
      // Mark sync as successful
      lastSuccessfulSync = Date.now();
    }
    
    syncInProgress = false;
  });
}, 60000); // Increase to 60 seconds to give more time for completion

// Schedule market data update (same pattern)
cron.schedule('*/5 * * * *', () => {
  console.log(`[${new Date().toISOString()}] Running scheduled market sync...`);
  
  exec('npx tsx scripts/sync.ts market', (error, stdout) => {
    if (error) {
      console.error(`Error executing market sync: ${error.message}`);
      return;
    }
    
    // CHECK HERE TOO - If it reports already running, clean locks immediately
    if (stdout && stdout.includes('Script already running..')) {
      cleanLocksAndRetry('npx tsx scripts/sync.ts market');
    } else {
      console.log(`Market sync output: ${stdout}`);
    }
  });
});

console.log('Sync daemon running. Press Ctrl+C to stop.');