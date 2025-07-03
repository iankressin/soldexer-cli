import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';
import { SoldexerConfig, PublishResult } from '../types/soldexer';
import { ProgressBarManager } from './progress-bar';

export class Uploader {
  private serverUrl: string;
  private config: SoldexerConfig;
  private filePath: string;

  constructor(serverUrl: string, config: SoldexerConfig, filePath: string) {
    this.serverUrl = serverUrl;
    this.config = config;
    this.filePath = filePath;
  }

  async upload(): Promise<PublishResult> {
    try {
      const stats = fs.statSync(this.filePath);
      const fileName = `${this.config.name}-${this.config.version}.tar`;
      
      console.log(`Publishing ${this.config.name} v${this.config.version} (${this.formatBytes(stats.size)}) to ${this.serverUrl}`);
      console.log(`Description: ${this.config.description}`);

      const progressBar = new ProgressBarManager(stats.size);
      progressBar.start();

      const formData = new FormData();
      const fileStream = fs.createReadStream(this.filePath);
      
      formData.append('name', this.config.name);
      formData.append('version', this.config.version);
      formData.append('description', this.config.description);
      console.log('this.config.envSchema', this.config.envSchema)
      formData.append('envSchema', JSON.stringify(this.config.envSchema));
      formData.append('file', fileStream, {
        filename: fileName,
        contentType: 'application/x-tar',
      });

      let uploadedBytes = 0;
      fileStream.on('data', (chunk) => {
        uploadedBytes += chunk.length;
        progressBar.update(uploadedBytes);
      });

      const response = await axios.post(`${this.serverUrl}/pipes`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 600000,
      });

      progressBar.stop();

      if (response.status === 201) {
        console.log(`✓ Successfully published ${this.config.name}:${this.config.version}`);
        return {
          success: true,
          packageName: this.config.name,
          version: this.config.version
        };
      } else {
        console.log('Something went wrong while publishing the package');
        return {
          success: false,
          error: `Server responded with status ${response.status}`
        };
      }

    } catch (error) {
      console.error(error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
