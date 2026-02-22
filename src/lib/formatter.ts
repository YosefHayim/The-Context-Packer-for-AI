import * as path from 'path';
import type { AnalysisResult, FunctionReference } from '../types';

/**
 * Get the language identifier for syntax highlighting based on file extension
 */
function getLanguageFromPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const languageMap: Record<string, string> = {
    '.ts': 'typescript',
    '.tsx': 'tsx',
    '.js': 'javascript',
    '.jsx': 'jsx',
    '.py': 'python',
    '.java': 'java',
    '.cpp': 'cpp',
    '.c': 'c',
    '.go': 'go',
    '.rs': 'rust',
    '.rb': 'ruby',
    '.php': 'php',
    '.swift': 'swift',
    '.kt': 'kotlin',
  };
  return languageMap[ext] || 'text';
}

/**
 * Format a single reference for LLM consumption
 */
function formatReference(ref: FunctionReference, index: number, rootDir: string): string {
  const relativePath = path.relative(rootDir, ref.location.filePath);
  const language = getLanguageFromPath(ref.location.filePath);
  
  let output = `### Reference ${index + 1}\n\n`;
  output += `**File:** \`${relativePath}\`\n`;
  output += `**Line:** ${ref.location.line}\n`;
  
  if (ref.enclosingScope) {
    output += `**Enclosing Scope:** \`${ref.enclosingScope}\`\n`;
  }
  
  output += `**Context Depth:** ${ref.depth}\n\n`;
  output += '```' + language + '\n';
  output += ref.context;
  output += '\n```\n';
  
  return output;
}

/**
 * Format the complete analysis result as markdown optimized for LLMs
 */
export function formatForLLM(result: AnalysisResult, rootDir: string): string {
  let output = `# Context Analysis: \`${result.functionName}\`\n\n`;
  output += `**Total References Found:** ${result.count}\n\n`;
  
  if (result.count === 0) {
    output += `No references found for function \`${result.functionName}\`.\n`;
    return output;
  }
  
  output += `## Summary\n\n`;
  output += `This analysis shows all ${result.count} location(s) where \`${result.functionName}\` is called across your codebase.\n`;
  output += `Each reference includes the file path, line number, and relevant code context.\n\n`;
  
  output += `---\n\n`;
  output += `## References\n\n`;
  
  result.references.forEach((ref, index) => {
    output += formatReference(ref, index, rootDir);
    if (index < result.references.length - 1) {
      output += '\n---\n\n';
    }
  });
  
  output += `\n---\n\n`;
  output += `## Usage Notes\n\n`;
  output += `When modifying \`${result.functionName}\`, ensure that changes are compatible with all ${result.count} call site(s) shown above.\n`;
  output += `Consider the context and usage patterns to avoid breaking existing functionality.\n`;
  
  return output;
}

/**
 * Format for simple text output (non-markdown)
 */
export function formatAsText(result: AnalysisResult, rootDir: string): string {
  let output = `Context Analysis: ${result.functionName}\n`;
  output += `${'='.repeat(50)}\n\n`;
  output += `Total References Found: ${result.count}\n\n`;
  
  if (result.count === 0) {
    output += `No references found for function '${result.functionName}'.\n`;
    return output;
  }
  
  result.references.forEach((ref, index) => {
    const relativePath = path.relative(rootDir, ref.location.filePath);
    output += `\nReference ${index + 1}:\n`;
    output += `  File: ${relativePath}\n`;
    output += `  Line: ${ref.location.line}\n`;
    if (ref.enclosingScope) {
      output += `  Scope: ${ref.enclosingScope}\n`;
    }
    output += `  Depth: ${ref.depth}\n\n`;
    output += ref.context.split('\n').map(line => `  ${line}`).join('\n');
    output += '\n';
    if (index < result.references.length - 1) {
      output += `${'-'.repeat(50)}\n`;
    }
  });
  
  return output;
}
