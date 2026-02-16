import { describe, it, expect } from 'vitest';
import { formatForLLM, formatAsText } from '../../lib/formatter';
import { ContextDepth } from '../../types';
import type { AnalysisResult } from '../../types';

describe('formatter', () => {
  const mockResult: AnalysisResult = {
    functionName: 'testFunction',
    count: 2,
    references: [
      {
        location: {
          filePath: '/project/src/app.ts',
          line: 10,
          column: 5,
        },
        context: 'const result = testFunction();',
        depth: ContextDepth.SNIPPET,
        enclosingScope: 'mainFunction',
      },
      {
        location: {
          filePath: '/project/src/utils.ts',
          line: 25,
          column: 10,
        },
        context: 'return testFunction(param);',
        depth: ContextDepth.SNIPPET,
        enclosingScope: 'helperFunction',
      },
    ],
  };

  describe('formatForLLM', () => {
    it('should format analysis result as markdown', () => {
      const output = formatForLLM(mockResult, '/project');

      expect(output).toContain('# Context Analysis');
      expect(output).toContain('testFunction');
      expect(output).toContain('**Total References Found:** 2');
    });

    it('should include file paths', () => {
      const output = formatForLLM(mockResult, '/project');

      expect(output).toContain('src/app.ts');
      expect(output).toContain('src/utils.ts');
    });

    it('should include line numbers', () => {
      const output = formatForLLM(mockResult, '/project');

      expect(output).toContain('**Line:** 10');
      expect(output).toContain('**Line:** 25');
    });

    it('should include enclosing scopes', () => {
      const output = formatForLLM(mockResult, '/project');

      expect(output).toContain('mainFunction');
      expect(output).toContain('helperFunction');
    });

    it('should include context code', () => {
      const output = formatForLLM(mockResult, '/project');

      expect(output).toContain('const result = testFunction();');
      expect(output).toContain('return testFunction(param);');
    });

    it('should use code blocks with syntax highlighting', () => {
      const output = formatForLLM(mockResult, '/project');

      expect(output).toContain('```typescript');
      expect(output).toContain('```');
    });

    it('should handle empty results', () => {
      const emptyResult: AnalysisResult = {
        functionName: 'nonExistent',
        count: 0,
        references: [],
      };

      const output = formatForLLM(emptyResult, '/project');

      expect(output).toContain('No references found');
      expect(output).toContain('nonExistent');
    });

    it('should include usage notes', () => {
      const output = formatForLLM(mockResult, '/project');

      expect(output).toContain('Usage Notes');
      expect(output).toContain('compatible');
    });

    it('should use relative paths', () => {
      const output = formatForLLM(mockResult, '/project');

      expect(output).not.toContain('/project/src');
      expect(output).toContain('src/app.ts');
    });
  });

  describe('formatAsText', () => {
    it('should format analysis result as plain text', () => {
      const output = formatAsText(mockResult, '/project');

      expect(output).toContain('Context Analysis: testFunction');
      expect(output).toContain('Total References Found: 2');
    });

    it('should use text separators', () => {
      const output = formatAsText(mockResult, '/project');

      expect(output).toContain('='.repeat(50));
      expect(output).toContain('-'.repeat(50));
    });

    it('should include file paths and line numbers', () => {
      const output = formatAsText(mockResult, '/project');

      expect(output).toContain('src/app.ts');
      expect(output).toContain('Line: 10');
      expect(output).toContain('src/utils.ts');
      expect(output).toContain('Line: 25');
    });

    it('should indent context code', () => {
      const output = formatAsText(mockResult, '/project');

      // Context should be indented
      const lines = output.split('\n');
      const contextLines = lines.filter(line => line.includes('testFunction()'));
      expect(contextLines.some(line => line.startsWith('  '))).toBe(true);
    });

    it('should handle empty results', () => {
      const emptyResult: AnalysisResult = {
        functionName: 'nonExistent',
        count: 0,
        references: [],
      };

      const output = formatAsText(emptyResult, '/project');

      expect(output).toContain('No references found');
      expect(output).toContain('nonExistent');
    });

    it('should show scope information', () => {
      const output = formatAsText(mockResult, '/project');

      expect(output).toContain('Scope: mainFunction');
      expect(output).toContain('Scope: helperFunction');
    });
  });

  describe('language detection', () => {
    it('should detect TypeScript for .ts files', () => {
      const tsResult: AnalysisResult = {
        functionName: 'test',
        count: 1,
        references: [
          {
            location: { filePath: '/project/src/file.ts', line: 1, column: 0 },
            context: 'test();',
            depth: ContextDepth.SNIPPET,
          },
        ],
      };

      const output = formatForLLM(tsResult, '/project');
      expect(output).toContain('```typescript');
    });

    it('should detect JavaScript for .js files', () => {
      const jsResult: AnalysisResult = {
        functionName: 'test',
        count: 1,
        references: [
          {
            location: { filePath: '/project/src/file.js', line: 1, column: 0 },
            context: 'test();',
            depth: ContextDepth.SNIPPET,
          },
        ],
      };

      const output = formatForLLM(jsResult, '/project');
      expect(output).toContain('```javascript');
    });

    it('should detect TSX for .tsx files', () => {
      const tsxResult: AnalysisResult = {
        functionName: 'test',
        count: 1,
        references: [
          {
            location: { filePath: '/project/src/Component.tsx', line: 1, column: 0 },
            context: 'test();',
            depth: ContextDepth.SNIPPET,
          },
        ],
      };

      const output = formatForLLM(tsxResult, '/project');
      expect(output).toContain('```tsx');
    });
  });
});
