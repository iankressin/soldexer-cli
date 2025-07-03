import fs from 'fs';
import path from 'path';
import { SoldexerConfig } from '../types/soldexer';

export class FileNotFoundError extends Error {
  constructor(filePath: string) {
    super(`File not found: ${filePath}`);
    this.name = 'FileNotFoundError';
  }
}

export class InvalidConfigError extends Error {
  constructor(message: string) {
    super(`Invalid soldexer.json: ${message}`);
    this.name = 'InvalidConfigError';
  }
}

export function readSoldexerConfig(workingDirectory: string = process.cwd()): SoldexerConfig {
  const configPath = path.join(workingDirectory, 'soldexer.json');
  
  if (!fs.existsSync(configPath)) {
    throw new FileNotFoundError(configPath);
  }

  try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configContent);
    
    validateSoldexerConfig(config);
    
    return config as SoldexerConfig;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new InvalidConfigError('Invalid JSON format');
    }
    throw error;
  }
}

function validateSoldexerConfig(config: unknown): void {
  if (!config || typeof config !== 'object') {
    throw new InvalidConfigError('Configuration must be an object');
  }

  const typedConfig = config as Record<string, unknown>;

  if (!typedConfig.name || typeof typedConfig.name !== 'string') {
    throw new InvalidConfigError('Missing or invalid "name" field');
  }

  if (!typedConfig.description || typeof typedConfig.description !== 'string') {
    throw new InvalidConfigError('Missing or invalid "description" field');
  }

  if (!typedConfig.version || typeof typedConfig.version !== 'string') {
    throw new InvalidConfigError('Missing or invalid "version" field');
  }

  if (!/^\d+\.\d+\.\d+(-[a-zA-Z0-9-]+)?$/.test(typedConfig.version)) {
    throw new InvalidConfigError('Version must follow semantic versioning format (e.g., 1.0.0)');
  }
}