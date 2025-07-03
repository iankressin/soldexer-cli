import { PublishOptions } from '../types/soldexer';
import { readSoldexerConfig, FileNotFoundError, InvalidConfigError } from '../utils/file-reader';
import { ServerValidator, ValidationError } from '../utils/validator';
import { Uploader } from '../utils/uploader';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);

export async function publishCommand(options: PublishOptions) {
  let tarFilePath: string | null = null;
  
  try {
    await validateInputs(options.server);
    
    const config = readSoldexerConfig();
    const imageName = `${config.name}:${config.version}`;
    tarFilePath = `${config.name}-${config.version}.tar`;
    
    console.log(`🏗️  Building Docker image: ${imageName}`);
    
    // Build Docker image
    try {
      const { stdout, stderr } = await execAsync(`docker build -t ${imageName} .`, {
        timeout: 300000 // 5 minutes timeout
      });
      
      if (stderr) {
        console.log('Docker build output:', stderr);
      }
      
      console.log('✅ Docker image built successfully');
    } catch (buildError) {
      console.error('Error building Docker image:', buildError instanceof Error ? buildError.message : buildError);
      console.error('Make sure you have a Dockerfile in the current directory and Docker is running');
      process.exit(1);
    }
    
    console.log(`📦 Saving Docker image to ${tarFilePath}`);
    
    // Save Docker image to tar file
    try {
      const { stdout, stderr } = await execAsync(`docker save -o ${tarFilePath} ${imageName}`, {
        timeout: 180000 // 3 minutes timeout
      });
      
      if (stderr) {
        console.log('Docker save output:', stderr);
      }
      
      console.log('✅ Docker image saved successfully');
    } catch (saveError) {
      console.error('Error saving Docker image:', saveError instanceof Error ? saveError.message : saveError);
      process.exit(1);
    }
    
    console.log(`🚀 Uploading ${tarFilePath} to server...`);
    
    const uploader = new Uploader(options.server, config, tarFilePath);
    const result = await uploader.upload();

    if (!result.success) {
      console.error(`Error: ${result.error}`);
      process.exit(1);
    }
    
    console.log('✅ Package published successfully!');

  } catch (error) {
    handleError(error);
  } finally {
    // Clean up the generated tar file
    if (tarFilePath && fs.existsSync(tarFilePath)) {
      try {
        fs.unlinkSync(tarFilePath);
        console.log(`🧹 Cleaned up ${tarFilePath}`);
      } catch (cleanupError) {
        console.warn(`Warning: Could not clean up ${tarFilePath}:`, cleanupError);
      }
    }
  }
}

async function validateInputs(serverUrl: string): Promise<void> {
  ServerValidator.validateServerUrl(serverUrl);
}

function handleError(error: unknown): void {
  if (error instanceof FileNotFoundError) {
    console.error(`Error: ${error.message}`);
    console.error('Make sure soldexer.json exists in the current directory');
  } else if (error instanceof InvalidConfigError) {
    console.error(`Error: ${error.message}`);
    console.error('Please check your soldexer.json file format');
  } else if (error instanceof ValidationError) {
    console.error(`Error: ${error.message}`);
  } else {
    console.error('Error publishing package:', error instanceof Error ? error.message : error);
  }
  process.exit(1);
}
