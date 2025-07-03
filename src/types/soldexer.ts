export interface SoldexerConfig {
  name: string;
  description: string;
  version: string;
  envSchema: Record<string, {
    description: string;
    required: boolean;
    default: string;
  }>;
}

export interface PublishOptions {
  server: string;
}

export interface PublishResult {
  success: boolean;
  packageName?: string;
  version?: string;
  error?: string;
}