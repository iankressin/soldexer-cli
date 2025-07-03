import axios from 'axios';
import { SingleBar, Presets } from 'cli-progress';
import fs from 'fs';
import path from 'path';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface RunOptions {
  server: string;
}

export async function runCommand(packageSpec: string, options: RunOptions) {
  try {
    const [packageName, version] = packageSpec.split(':');
    
    if (!packageName || !version) {
      console.error('Error: Package specification must be in format <name>:<version>');
      process.exit(1);
    }

    console.log(`Querying server for ${packageName}:${version}`);

    const spinner = new SingleBar({
      format: 'Searching |{bar}| {percentage}% || {value}/{total} seconds',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    }, Presets.shades_classic);

    spinner.start(100, 0);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      if (progress <= 100) {
        spinner.update(progress);
      }
    }, 100);

    const response = await axios.get(`${options.server}/pipes/${packageName}/download/${version}`, {
      timeout: 30000,
      responseType: 'stream',
      validateStatus: function (status) {
        return status < 500;
      }
    });

    clearInterval(interval);
    spinner.stop();

    if (response.status === 200) {
      console.log(`✓ Package found: ${packageName}:${version}`);
      
      // Check if .env file exists, if not create it from envSchema
      const envPath = path.join(process.cwd(), '.env');
      if (!fs.existsSync(envPath)) {
        console.log('No .env file found, fetching environment schema...');
        
        try {
          console.log('Fetching environment schema...', `${options.server}/versions/${packageName}/env-schema/${version}`);
          const envSchemaResponse = await axios.get(`${options.server}/versions/${packageName}/env-schema/${version}`, {
            timeout: 10000
          });

          if (envSchemaResponse.status === 200 && envSchemaResponse.data.data) {
            console.log('✓ Environment schema retrieved');
            
            const envSchema = envSchemaResponse.data.data;
            const envContent = Object.keys(envSchema).map(key => {
              const config = envSchema[key];
              const value = config.default || '';
              return `${key}=${value}`;
            }).join('\n');
            
            fs.writeFileSync(envPath, envContent);
            console.log(`✓ Created .env file with ${Object.keys(envSchema).length} environment variables`);
          } else {
            console.log('⚠ No environment schema found for this package');
          }
        } catch (envError) {
          console.log('⚠ Could not fetch environment schema, proceeding without .env file');
          console.log('Error:', envError instanceof Error ? envError.message : envError);
        }
      } else {
        console.log('✓ Found existing .env file');
      }
      
      const tarFileName = `${packageName}_${version}.tar`;
      const tarPath = path.join(process.cwd(), tarFileName);
      
      console.log(`Downloading to ${tarFileName}...`);
      
      const writer = fs.createWriteStream(tarPath);
      response.data.pipe(writer);
      
      await new Promise<void>((resolve, reject) => {
        writer.on('finish', () => resolve());
        writer.on('error', reject);
      });
      
      console.log(`✓ Downloaded ${tarFileName}`);
      
      console.log('Loading Docker image...');
      try {
        const { stdout, stderr } = await execAsync(`docker load < "${tarPath}"`);
        console.log('✓ Docker image loaded successfully');
        if (stdout) console.log(stdout);
        if (stderr) console.log(stderr);
        
        // Clean up the tar file after loading
        fs.unlinkSync(tarPath);
        console.log(`✓ Deleted ${tarFileName}`);
        
        // Extract image name from docker load output
        const imageMatch = stdout.match(/Loaded image: (.+)/);
        if (imageMatch) {
          const imageName = imageMatch[1];
          console.log(`Running Docker container: ${imageName}`);
          
          try {
            await new Promise<void>((resolve, reject) => {
              const dockerProcess = spawn('docker', ['run', '--rm', '--env-file', '.env', imageName], {
                stdio: ['pipe', 'pipe', 'pipe']
              });

              // Stream stdout to console
              dockerProcess.stdout.on('data', (data) => {
                process.stdout.write(data);
              });

              // Stream stderr to console
              dockerProcess.stderr.on('data', (data) => {
                process.stderr.write(data);
              });

              dockerProcess.on('close', (code) => {
                if (code === 0) {
                  console.log('\n✓ Docker container executed successfully');
                  resolve();
                } else {
                  reject(new Error(`Docker container exited with code ${code}`));
                }
              });

              dockerProcess.on('error', (error) => {
                reject(error);
              });
            });
          } catch (runError) {
            console.error('Error running Docker container:', runError);
            process.exit(1);
          }
        } else {
          console.log('Could not extract image name from docker load output');
        }
      } catch (dockerError) {
        console.error('Error loading Docker image:', dockerError);
        process.exit(1);
      }
    } else if (response.status === 404) {
      console.log(`✗ Package not found: ${packageName}:${version}`);
      process.exit(1);
    } else {
      console.error(`Error: Server responded with status ${response.status}`);
      if (response.data && response.data.error) {
        console.error(`Server error: ${response.data.error}`);
      }
      process.exit(1);
    }

  } catch (error) {
    console.error('Error querying package:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
