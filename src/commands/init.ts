import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

interface InitOptions {
  directory?: string;
}

export async function initCommand(projectName: string, options: InitOptions) {
  try {
    const targetDir = options.directory || projectName || 'my-soldexer-project';
    const repoUrl = 'https://github.com/iankressin/pipe-template.git';
    
    console.log(`🚀 Initializing new Soldexer project: ${targetDir}`);
    
    // Check if directory already exists
    if (fs.existsSync(targetDir)) {
      console.error(`Error: Directory '${targetDir}' already exists`);
      process.exit(1);
    }
    
    // Clone the repository
    console.log('📥 Cloning pipe-template repository...');
    try {
      const { stdout, stderr } = await execAsync(`git clone ${repoUrl} ${targetDir}`);
      if (stderr && !stderr.includes('Cloning into')) {
        console.error('Git clone stderr:', stderr);
      }
    } catch (error) {
      console.error('Error cloning repository:', error instanceof Error ? error.message : error);
      console.error('Make sure you have git installed and internet connectivity');
      process.exit(1);
    }
    
    // Remove .git directory to start fresh
    console.log('🧹 Cleaning up git history...');
    const gitDir = path.join(targetDir, '.git');
    if (fs.existsSync(gitDir)) {
      try {
        await execAsync(`rm -rf "${gitDir}"`);
      } catch (error) {
        console.warn('Warning: Could not remove .git directory:', error);
      }
    }
    
    console.log('✅ Project initialized successfully!');
    console.log('\nNext steps:');
    console.log(`  cd ${targetDir}`);
    console.log('  # Edit soldexer.json to configure your pipes');
    console.log('  # Start ClickHouse: docker compose up -d');
    console.log('  # Run your indexer: yarn start');
    console.log('\nFor more information, check the README.md in your project directory.');
    
  } catch (error) {
    console.error('Error initializing project:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
} 
