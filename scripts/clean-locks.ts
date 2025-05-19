import fs from 'fs';
import path from 'path';

// Path to the lock files
const tmpDir = path.join(process.cwd(), 'tmp');

// Check if the tmp directory exists
if (!fs.existsSync(tmpDir)) {
  console.log('No tmp directory found. Creating one...');
  fs.mkdirSync(tmpDir);
  console.log('Done. No lock files to clean.');
  process.exit(0);
}

// Get all files in the tmp directory
const files = fs.readdirSync(tmpDir);

// Filter for PID files
const lockFiles = files.filter(file => file.endsWith('.pid'));

if (lockFiles.length === 0) {
  console.log('No lock files found.');
  process.exit(0);
}

// Remove each lock file
for (const file of lockFiles) {
  const filePath = path.join(tmpDir, file);
  try {
    fs.unlinkSync(filePath);
    console.log(`Removed lock file: ${file}`);
  } catch (error) {
    console.error(`Failed to remove ${file}:`, error);
  }
}

console.log('Lock files cleaned successfully.');