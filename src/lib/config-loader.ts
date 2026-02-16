/**
 * Configuration file loader for Context Packer
 * Supports .contextpackerrc.json and .contextpacker.config.js
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface ContextPackerConfig {
  // Analysis options
  defaultDepth?: 'snippet' | 'logic' | 'module';
  defaultFormat?: 'markdown' | 'text' | 'json' | 'csv' | 'txt' | 'xml';
  
  // File patterns
  include?: string[];
  exclude?: string[];
  
  // AI integration
  preferredAI?: 'chatgpt' | 'claude' | 'gemini' | string;
  autoCopy?: boolean;
  customAIServices?: Record<string, string>;
  
  // Performance
  cache?: boolean;
  cacheDir?: string;
  
  // Output
  outputDir?: string;
}

export const DEFAULT_CONFIG: ContextPackerConfig = {
  defaultDepth: 'logic',
  defaultFormat: 'markdown',
  exclude: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
  include: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
  autoCopy: false,
  cache: false,
  cacheDir: '.context-packer-cache',
};

/**
 * Load configuration from file
 */
export function loadConfig(dir: string = process.cwd()): ContextPackerConfig {
  const configPaths = [
    join(dir, '.contextpackerrc.json'),
    join(dir, '.contextpacker.config.json'),
    join(dir, 'contextpacker.config.json'),
  ];

  for (const configPath of configPaths) {
    if (existsSync(configPath)) {
      try {
        const content = readFileSync(configPath, 'utf-8');
        const userConfig = JSON.parse(content);
        return mergeConfig(DEFAULT_CONFIG, userConfig);
      } catch (error) {
        console.error(`Error loading config from ${configPath}:`, error);
      }
    }
  }

  return DEFAULT_CONFIG;
}

/**
 * Merge user config with defaults
 */
export function mergeConfig(
  defaults: ContextPackerConfig,
  user: Partial<ContextPackerConfig>
): ContextPackerConfig {
  return {
    ...defaults,
    ...user,
    // Arrays should be replaced, not merged
    include: user.include || defaults.include,
    exclude: user.exclude || defaults.exclude,
    customAIServices: {
      ...defaults.customAIServices,
      ...user.customAIServices,
    },
  };
}

/**
 * Validate configuration
 */
export function validateConfig(config: ContextPackerConfig): string[] {
  const errors: string[] = [];

  if (config.defaultDepth && !['snippet', 'logic', 'module'].includes(config.defaultDepth)) {
    errors.push(`Invalid defaultDepth: ${config.defaultDepth}. Must be snippet, logic, or module.`);
  }

  if (config.defaultFormat && !['markdown', 'text', 'json', 'csv', 'txt', 'xml'].includes(config.defaultFormat)) {
    errors.push(`Invalid defaultFormat: ${config.defaultFormat}`);
  }

  return errors;
}
