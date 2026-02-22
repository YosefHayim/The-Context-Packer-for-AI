import { getLine, getLines, getFileContent } from './parser';
import { findEnclosingScope } from './reference-finder';
import type { CodeLocation, ContextDepth, FunctionReference } from '../types';
import { ContextDepth as Depth } from '../types';

/**
 * Extract context for a reference based on the desired depth
 */
export function extractReferenceContext(
  location: CodeLocation,
  depth: ContextDepth,
  maxContextLines: number = 100
): FunctionReference {
  let context: string;
  let enclosingScope: string | undefined;

  switch (depth) {
    case Depth.SNIPPET:
      // Just the line where the function is called
      context = getLine(location.filePath, location.line);
      break;

    case Depth.LOGIC:
      // The enclosing function/scope
      const scope = findEnclosingScope(location.filePath, location);
      if (scope) {
        enclosingScope = scope.name;
        // Limit context lines to avoid huge outputs
        const lineCount = scope.endLine - scope.startLine + 1;
        if (lineCount > maxContextLines) {
          // If too large, just show a snippet around the call
          const contextRadius = Math.floor(maxContextLines / 2);
          const startLine = Math.max(scope.startLine, location.line - contextRadius);
          const endLine = Math.min(scope.endLine, location.line + contextRadius);
          context = getLines(location.filePath, startLine, endLine);
          context = `// ... (function truncated, showing lines ${startLine}-${endLine})\n${context}\n// ...`;
        } else {
          context = getLines(location.filePath, scope.startLine, scope.endLine);
        }
      } else {
        // Fallback to snippet if no scope found
        context = getLine(location.filePath, location.line);
      }
      break;

    case Depth.MODULE:
      // The entire file
      context = getFileContent(location.filePath);
      break;

    default:
      context = getLine(location.filePath, location.line);
  }

  return {
    location,
    context,
    depth,
    enclosingScope,
  };
}

/**
 * Extract contexts for multiple references
 */
export function extractMultipleContexts(
  locations: CodeLocation[],
  depth: ContextDepth,
  maxContextLines?: number
): FunctionReference[] {
  return locations.map((location) =>
    extractReferenceContext(location, depth, maxContextLines ?? 100)
  );
}
