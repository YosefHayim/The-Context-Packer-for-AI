/**
 * Configuration file loader for Context Packer
 * Supports .contextpackerrc.json files
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import {
  DEFAULT_INCLUDE_PATTERNS,
  DEFAULT_EXCLUDE_PATTERNS,
  VALID_DEPTHS,
  VALID_FORMATS,
} from '../constants';

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
  exclude: [...DEFAULT_EXCLUDE_PATTERNS],
  include: [...DEFAULT_INCLUDE_PATTERNS],
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
        
        // Validate before merging
        const errors = validateConfig(userConfig);
        if (errors.length > 0) {
          console.error(`Warning: Invalid config in ${configPath}:`);
          errors.forEach(err => console.error(`  - ${err}`));
          console.error('Using default values for invalid fields.');
          // Strip invalid fields before merging
          const cleanConfig = { ...userConfig };
          if (errors.some(e => e.includes('defaultDepth'))) delete cleanConfig.defaultDepth;
          if (errors.some(e => e.includes('defaultFormat'))) delete cleanConfig.defaultFormat;
          return mergeConfig(DEFAULT_CONFIG, cleanConfig);
        }
        
        return mergeConfig(DEFAULT_CONFIG, userConfig);
      } catch (error) {
        if (error instanceof SyntaxError) {
          console.error(`Error: Invalid JSON in ${configPath}: ${error.message}`);
          console.error('Using default configuration.');
        } else {
          console.error(`Error loading config from ${configPath}:`, error instanceof Error ? error.message : error);
        }
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
      ...(defaults.customAIServices || {}),
      ...(user.customAIServices || {}),
    },
  };
}

/**
 * Validate configuration
 */
export function validateConfig(config: Partial<ContextPackerConfig>): string[] {
  const errors: string[] = [];

  if (config.defaultDepth && !(VALID_DEPTHS as readonly string[]).includes(config.defaultDepth)) {
    errors.push(`Invalid defaultDepth: "${config.defaultDepth}". Must be one of: ${VALID_DEPTHS.join(', ')}.`);
  }

  if (config.defaultFormat && !(VALID_FORMATS as readonly string[]).includes(config.defaultFormat)) {
    errors.push(`Invalid defaultFormat: "${config.defaultFormat}". Must be one of: ${VALID_FORMATS.join(', ')}.`);
  }

  if (config.include && !Array.isArray(config.include)) {
    errors.push('Invalid include: must be an array of glob patterns.');
  }

  if (config.exclude && !Array.isArray(config.exclude)) {
    errors.push('Invalid exclude: must be an array of glob patterns.');
  }

  return errors;
}
