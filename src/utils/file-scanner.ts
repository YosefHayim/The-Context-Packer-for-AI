import { glob } from 'glob';
import * as path from 'path';
import {
  DEFAULT_INCLUDE_PATTERNS,
  DEFAULT_EXCLUDE_PATTERNS,
  SUPPORTED_EXTENSIONS,
} from '../constants';

export async function findFiles(
  rootDir: string,
  includePatterns: string[] = DEFAULT_INCLUDE_PATTERNS,
  excludePatterns: string[] = DEFAULT_EXCLUDE_PATTERNS
): Promise<string[]> {
  const files: Set<string> = new Set();

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

export function findFilesSync(
  rootDir: string,
  includePatterns: string[] = DEFAULT_INCLUDE_PATTERNS,
  excludePatterns: string[] = DEFAULT_EXCLUDE_PATTERNS
): string[] {
  const files: Set<string> = new Set();

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

export function isSupportedFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return SUPPORTED_EXTENSIONS.includes(ext);
}
