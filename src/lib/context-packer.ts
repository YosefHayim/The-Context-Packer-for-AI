import { findFilesSync } from '../utils/file-scanner';
import { DEFAULT_INCLUDE_PATTERNS, DEFAULT_EXCLUDE_PATTERNS, SUPPORTED_EXTENSIONS } from '../constants';
import { findReferencesInFile } from './reference-finder';
import { extractMultipleContexts } from './context-extractor';
import type {
  ContextPackerOptions,
  AnalysisResult,
  CodeLocation,
  FunctionReference,
} from '../types';
import { ContextDepth } from '../types';

/**
 * Main ContextPacker class for analyzing function references
 */
export class ContextPacker {
  private options: Required<ContextPackerOptions>;

  constructor(options: ContextPackerOptions) {
    this.options = {
      rootDir: options.rootDir,
      include: options.include || [...DEFAULT_INCLUDE_PATTERNS],
      exclude: options.exclude || [...DEFAULT_EXCLUDE_PATTERNS],
      depth: options.depth,
      maxContextLines: options.maxContextLines || 100,
    };
  }

  /**
   * Analyze a function and find all its references
   */
  public analyze(functionName: string): AnalysisResult {
    // Find all relevant files
    const files = findFilesSync(
      this.options.rootDir,
      this.options.include,
      this.options.exclude
    );

    // Find all references across all files
    const allLocations: CodeLocation[] = [];
    for (const file of files) {
      const locations = findReferencesInFile(file, functionName);
      allLocations.push(...locations);
    }

    // Extract context for each reference
    const references: FunctionReference[] = extractMultipleContexts(
      allLocations,
      this.options.depth,
      this.options.maxContextLines
    );

    return {
      functionName,
      references,
      count: references.length,
    };
  }

  /**
   * Analyze a function in a specific file only
   */
  public analyzeFile(functionName: string, filePath: string): AnalysisResult {
    const locations = findReferencesInFile(filePath, functionName);
    const references = extractMultipleContexts(
      locations,
      this.options.depth,
      this.options.maxContextLines
    );

    return {
      functionName,
      references,
      count: references.length,
    };
  }

  /**
   * Get statistics about the codebase
   */
  public getStats(): { totalFiles: number; supportedFiles: number } {
    const files = findFilesSync(
      this.options.rootDir,
      this.options.include,
      this.options.exclude
    );

    // Count only supported files (TypeScript/JavaScript files)
    const supportedFiles = files.filter(file => 
      file.endsWith('.ts') || 
      file.endsWith('.tsx') || 
      file.endsWith('.js') || 
      file.endsWith('.jsx')
    );

    return {
      totalFiles: files.length,
      supportedFiles: supportedFiles.length,
    };
  }
}

/**
 * Helper function to create a ContextPacker instance with default options
 */
export function createContextPacker(
  rootDir: string,
  depth: ContextDepth = ContextDepth.LOGIC
): ContextPacker {
  return new ContextPacker({
    rootDir,
    depth,
  });
}
