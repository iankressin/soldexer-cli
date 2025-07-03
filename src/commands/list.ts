import axios from 'axios';

interface ListOptions {
  server: string;
}

interface Version {
  id: number;
  pipeId: number;
  versionNumber: string;
  assetUrl: string;
  createdAt: string;
  updatedAt: string;
  envSchema: Record<string, any>;
}

interface Pipe {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  versions: Version[];
}

interface ApiResponse {
  success: boolean;
  data: {
    pipes: Pipe[];
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function listCommand(options: ListOptions) {
  try {
    console.log('Fetching available pipes...');

    const response = await axios.get<ApiResponse>(`${options.server}/pipes?includeVersions=true`, {
      timeout: 30000,
      validateStatus: function (status) {
        return status < 500;
      }
    });

    if (response.status === 200 && response.data.success) {
      const { pipes, totalCount } = response.data.data;

      if (totalCount === 0) {
        console.log('No pipes found.');
        return;
      }

      console.log(`\nFound ${totalCount} pipe${totalCount === 1 ? '' : 's'}:\n`);

      pipes.forEach((pipe, index) => {
        // Pipe name
        console.log(`${pipe.name}`);
        
        // Pipe description
        if (pipe.description) {
          console.log(`${pipe.description}`);
        }
        
        // Versions
        if (pipe.versions && pipe.versions.length > 0) {
          console.log('versions:');
          // Sort versions by creation date (newest first)
          const sortedVersions = pipe.versions.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          
          sortedVersions.forEach(version => {
            console.log(`- ${version.versionNumber}`);
          });
        } else {
          console.log('versions: (none)');
        }

        // Add spacing between pipes (except for the last one)
        if (index < pipes.length - 1) {
          console.log();
        }
      });

    } else if (response.status === 404) {
      console.log('No pipes found or server endpoint not available.');
    } else {
      console.error(`Error: Server responded with status ${response.status}`);
      if (response.data && typeof response.data === 'object' && 'error' in response.data) {
        console.error(`Server error: ${response.data.error}`);
      }
      process.exit(1);
    }

  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED') {
        console.error(`Error: Could not connect to server at ${options.server}`);
        console.error('Make sure the server is running and accessible.');
      } else if (error.code === 'ECONNABORTED') {
        console.error('Error: Request timed out. Server may be slow to respond.');
      } else {
        console.error(`Error: ${error.message}`);
      }
    } else {
      console.error('Error fetching pipes:', error instanceof Error ? error.message : error);
    }
    process.exit(1);
  }
} 
