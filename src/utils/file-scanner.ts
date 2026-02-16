import { glob } from 'glob';
import * as path from 'path';

/**
 * Default file patterns to include
 */
const DEFAULT_INCLUDE_PATTERNS = [
  '**/*.ts',
  '**/*.tsx',
  '**/*.js',
  '**/*.jsx',
];

/**
 * Default file patterns to exclude
 */
const DEFAULT_EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.git/**',
  '**/coverage/**',
  '**/*.test.ts',
  '**/*.test.tsx',
  '**/*.test.js',
  '**/*.test.jsx',
  '**/*.spec.ts',
  '**/*.spec.tsx',
  '**/*.spec.js',
  '**/*.spec.jsx',
];

/**
 * Find all files matching the given patterns
 */
export async function findFiles(
  rootDir: string,
  includePatterns: string[] = DEFAULT_INCLUDE_PATTERNS,
  excludePatterns: string[] = DEFAULT_EXCLUDE_PATTERNS
): Promise<string[]> {
  const files: Set<string> = new Set();

  // Find files matching include patterns
  for (const pattern of includePatterns) {
    const matches = await glob(pattern, {
      cwd: rootDir,
      absolute: true,
      ignore: excludePatterns,
      nodir: true,
    });
    matches.forEach((file) => files.add(file));
  }

  return Array.from(files);
}

/**
 * Synchronous version of findFiles
 */
export function findFilesSync(
  rootDir: string,
  includePatterns: string[] = DEFAULT_INCLUDE_PATTERNS,
  excludePatterns: string[] = DEFAULT_EXCLUDE_PATTERNS
): string[] {
  const files: Set<string> = new Set();

  // Find files matching include patterns
  for (const pattern of includePatterns) {
    const matches = glob.sync(pattern, {
      cwd: rootDir,
      absolute: true,
      ignore: excludePatterns,
      nodir: true,
    });
    matches.forEach((file) => files.add(file));
  }

  return Array.from(files);
}

/**
 * Check if a file should be analyzed based on its extension
 */
export function isSupportedFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  const supportedExtensions = ['.ts', '.tsx', '.js', '.jsx'];
  return supportedExtensions.includes(ext);
}
