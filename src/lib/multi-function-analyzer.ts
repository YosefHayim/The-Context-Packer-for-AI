/**
 * Multi-function analyzer
 * Analyzes multiple functions and aggregates results
 */

import { ContextPacker } from './context-packer';
import { AnalysisResult } from '../types';

export interface MultiAnalysisResult {
  functions: string[];
  results: Map<string, AnalysisResult>;
  totalReferences: number;
  summary: {
    functionCount: number;
    filesScanned: number;
    filesWithMatches: number;
    totalMatches: number;
  };
}

export class MultiFunctionAnalyzer {
  private packer: ContextPacker;

  constructor(packer: ContextPacker) {
    this.packer = packer;
  }

  /**
   * Analyze multiple functions at once
   */
  analyze(functionNames: string[]): MultiAnalysisResult {
    const results = new Map<string, AnalysisResult>();
    let totalReferences = 0;
    const filesWithMatchesSet = new Set<string>();

    for (const functionName of functionNames) {
      const result = this.packer.analyze(functionName);
      results.set(functionName, result);
      totalReferences += result.references.length;

      // Track unique files with matches
      result.references.forEach(ref => filesWithMatchesSet.add(ref.location.filePath));
    }

    // Get total files scanned from the context packer
    const stats = this.packer.getStats();

    return {
      functions: functionNames,
      results,
      totalReferences,
      summary: {
        functionCount: functionNames.length,
        filesScanned: stats.totalFiles,
        filesWithMatches: filesWithMatchesSet.size,
        totalMatches: totalReferences,
      },
    };
  }

  /**
   * Parse comma-separated function names
   */
  static parseFunctionList(input: string): string[] {
    return input
      .split(',')
      .map(name => name.trim())
      .filter(name => name.length > 0);
  }

  /**
   * Check if input contains multiple functions
   */
  static isMultiFunction(input: string): boolean {
    return input.includes(',');
  }
}

/**
 * Format multi-function analysis results
 */
export function formatMultiAnalysis(
  result: MultiAnalysisResult,
  format: 'markdown' | 'text' | 'json' = 'markdown'
): string {
  if (format === 'json') {
    return JSON.stringify({
      functions: result.functions,
      summary: result.summary,
      results: Array.from(result.results.entries()).map(([name, data]) => ({
        function: name,
        references: data.references.length,
        details: data.references.map(ref => ({
          file: ref.location.filePath,
          line: ref.location.line,
          column: ref.location.column,
          context: ref.context,
          depth: ref.depth,
        })),
      })),
    }, null, 2);
  }

  if (format === 'text') {
    let output = '=== MULTI-FUNCTION ANALYSIS ===\n\n';
    output += `Analyzed Functions: ${result.functions.join(', ')}\n`;
    output += `Total References: ${result.totalReferences}\n`;
    output += `Files Scanned: ${result.summary.filesScanned}\n`;
    output += `Files With Matches: ${result.summary.filesWithMatches}\n\n`;

    for (const [functionName, data] of result.results) {
      output += `--- ${functionName} (${data.references.length} references) ---\n`;
      data.references.forEach((ref, idx) => {
        output += `  ${idx + 1}. ${ref.location.filePath}:${ref.location.line}\n`;
      });
      output += '\n';
    }

    return output;
  }

  // Markdown format
  let output = '# Multi-Function Analysis\n\n';
  output += `**Analyzed Functions:** ${result.functions.join(', ')}  \n`;
  output += `**Total References:** ${result.totalReferences}  \n`;
  output += `**Files Scanned:** ${result.summary.filesScanned}  \n`;
  output += `**Files With Matches:** ${result.summary.filesWithMatches}\n\n`;

  for (const [functionName, data] of result.results) {
    output += `## ${functionName}\n\n`;
    output += `**References:** ${data.references.length}\n\n`;

    data.references.forEach((ref, idx) => {
      output += `### Reference ${idx + 1}: \`${ref.location.filePath}:${ref.location.line}\`\n\n`;
      output += '```typescript\n';
      output += ref.context;
      output += '\n```\n\n';
    });
  }

  return output;
}
