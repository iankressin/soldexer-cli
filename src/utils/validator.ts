import fs from 'fs';
import path from 'path';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class FileValidator {
  static validateFileExists(filePath: string): void {
    const absolutePath = path.resolve(filePath);
    
    if (!fs.existsSync(absolutePath)) {
      throw new ValidationError(`File not found: ${absolutePath}`);
    }
  }

  static validateFileSize(filePath: string, maxSizeBytes: number = 500 * 1024 * 1024): void {
    const stats = fs.statSync(filePath);
    
    if (stats.size > maxSizeBytes) {
      const maxSizeMB = Math.round(maxSizeBytes / 1024 / 1024);
      const actualSizeMB = Math.round(stats.size / 1024 / 1024);
      throw new ValidationError(`File size (${actualSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`);
    }
  }

  static validateFileType(filePath: string, allowedExtensions: string[] = ['.tar']): void {
    const extension = path.extname(filePath).toLowerCase();
    
    if (!allowedExtensions.includes(extension)) {
      throw new ValidationError(`Invalid file type: ${extension}. Allowed types: ${allowedExtensions.join(', ')}`);
    }
  }
}

export class ServerValidator {
  static validateServerUrl(serverUrl: string): void {
    try {
      const url = new URL(serverUrl);
      
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new ValidationError('Server URL must use HTTP or HTTPS protocol');
      }
      
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError('Invalid server URL format');
    }
  }
}
