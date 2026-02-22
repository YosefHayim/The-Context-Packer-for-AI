import { describe, it, expect } from 'vitest';
import {
  formatAsJSON,
  formatAsCSV,
  formatAsPlainText,
  formatAsXML,
  exportAs,
} from '../../lib/exporter';
import { ContextDepth } from '../../types';
import type { AnalysisResult } from '../../types';

const rootDir = '/root';

const mockResult: AnalysisResult = {
  functionName: 'testFunc',
  references: [
    {
      location: { filePath: '/root/src/file.ts', line: 10, column: 5 },
      context: 'testFunc(arg1, arg2)',
      depth: ContextDepth.SNIPPET,
      enclosingScope: 'handleClick',
    },
  ],
  count: 1,
};

const multiRefResult: AnalysisResult = {
  functionName: 'multiFunc',
  references: [
    {
      location: { filePath: '/root/src/a.ts', line: 5, column: 0 },
      context: 'multiFunc()',
      depth: ContextDepth.SNIPPET,
      enclosingScope: 'init',
    },
    {
      location: { filePath: '/root/src/b.ts', line: 20, column: 3 },
      context: 'multiFunc(x)',
      depth: ContextDepth.LOGIC,
      enclosingScope: 'run',
    },
  ],
  count: 2,
};

const emptyResult: AnalysisResult = {
  functionName: 'unusedFunc',
  references: [],
  count: 0,
};

describe('exporter', () => {
  describe('formatAsJSON', () => {
    it('should return valid JSON', () => {
      const output = formatAsJSON(mockResult, rootDir);
      expect(() => JSON.parse(output)).not.toThrow();
    });

    it('should include functionName and totalReferences', () => {
      const output = formatAsJSON(mockResult, rootDir);
      const parsed = JSON.parse(output);
      expect(parsed.functionName).toBe('testFunc');
      expect(parsed.totalReferences).toBe(1);
    });

    it('should include references array with relative paths', () => {
      const output = formatAsJSON(mockResult, rootDir);
      const parsed = JSON.parse(output);
      expect(parsed.references).toHaveLength(1);
      expect(parsed.references[0].file).toBe('src/file.ts');
      expect(parsed.references[0].line).toBe(10);
      expect(parsed.references[0].column).toBe(5);
      expect(parsed.references[0].depth).toBe(ContextDepth.SNIPPET);
      expect(parsed.references[0].enclosingScope).toBe('handleClick');
    });

    it('should include context in each reference', () => {
      const output = formatAsJSON(mockResult, rootDir);
      const parsed = JSON.parse(output);
      expect(parsed.references[0].context).toBe('testFunc(arg1, arg2)');
    });
  });

  describe('formatAsCSV', () => {
    it('should have correct header row', () => {
      const output = formatAsCSV(mockResult, rootDir);
      const lines = output.split('\n');
      expect(lines[0]).toBe('File,Line,Column,Depth,Scope,Context');
    });

    it('should have correct number of data rows', () => {
      const output = formatAsCSV(multiRefResult, rootDir);
      const lines = output.split('\n');
      expect(lines).toHaveLength(3);
    });

    it('should properly escape quotes in context', () => {
      const resultWithQuotes: AnalysisResult = {
        functionName: 'testFunc',
        references: [
          {
            location: { filePath: '/root/src/file.ts', line: 1, column: 0 },
            context: 'console.log("hello")',
            depth: ContextDepth.SNIPPET,
            enclosingScope: 'main',
          },
        ],
        count: 1,
      };
      const output = formatAsCSV(resultWithQuotes, rootDir);
      expect(output).toContain('""hello""');
    });

    it('should handle empty references', () => {
      const output = formatAsCSV(emptyResult, rootDir);
      const lines = output.split('\n');
      expect(lines).toHaveLength(1);
      expect(lines[0]).toBe('File,Line,Column,Depth,Scope,Context');
    });
  });

  describe('formatAsPlainText', () => {
    it('should include function name and total references', () => {
      const output = formatAsPlainText(mockResult, rootDir);
      expect(output).toContain('Function: testFunc');
      expect(output).toContain('Total References: 1');
    });

    it('should include "No references found" for 0 refs', () => {
      const output = formatAsPlainText(emptyResult, rootDir);
      expect(output).toContain("No references found for function 'unusedFunc'.");
    });

    it('should include line numbers and file paths', () => {
      const output = formatAsPlainText(mockResult, rootDir);
      expect(output).toContain('src/file.ts:10');
    });

    it('should include scope and depth information', () => {
      const output = formatAsPlainText(mockResult, rootDir);
      expect(output).toContain('Scope: handleClick');
      expect(output).toContain('Depth: snippet');
    });
  });

  describe('formatAsXML', () => {
    it('should include XML declaration', () => {
      const output = formatAsXML(mockResult, rootDir);
      expect(output).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    });

    it('should properly escape XML special characters', () => {
      const resultWithSpecialChars: AnalysisResult = {
        functionName: 'test<Func>&',
        references: [],
        count: 0,
      };
      const output = formatAsXML(resultWithSpecialChars, rootDir);
      expect(output).toContain('test&lt;Func&gt;&amp;');
      expect(output).not.toContain('<Func>');
    });

    it('should wrap context in CDATA', () => {
      const output = formatAsXML(mockResult, rootDir);
      expect(output).toContain('<![CDATA[testFunc(arg1, arg2)]]>');
    });

    it('should handle ]]> in context safely', () => {
      const resultWithCDATA: AnalysisResult = {
        functionName: 'testFunc',
        references: [
          {
            location: { filePath: '/root/src/file.ts', line: 1, column: 0 },
            context: 'const x = "]]>";',
            depth: ContextDepth.SNIPPET,
          },
        ],
        count: 1,
      };
      const output = formatAsXML(resultWithCDATA, rootDir);
      // ]]> is split into ]]]]><![CDATA[> to prevent premature CDATA close
      expect(output).toContain(']]]]><![CDATA[>');
    });
  });

  describe('exportAs', () => {
    it('should delegate to formatAsJSON for json format', () => {
      const output = exportAs('json', mockResult, rootDir);
      const parsed = JSON.parse(output);
      expect(parsed.functionName).toBe('testFunc');
      expect(parsed.totalReferences).toBe(1);
    });

    it('should delegate to formatAsCSV for csv format', () => {
      const output = exportAs('csv', mockResult, rootDir);
      expect(output).toContain('File,Line,Column,Depth,Scope,Context');
    });

    it('should delegate to formatAsPlainText for txt format', () => {
      const output = exportAs('txt', mockResult, rootDir);
      expect(output).toContain('Function: testFunc');
    });

    it('should delegate to formatAsXML for xml format', () => {
      const output = exportAs('xml', mockResult, rootDir);
      expect(output).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    });

    it('should delegate to formatForLLM for markdown format', () => {
      const output = exportAs('markdown', mockResult, rootDir);
      expect(output).toContain('# Context Analysis');
    });

    it('should delegate to formatAsText for text format', () => {
      const output = exportAs('text', mockResult, rootDir);
      expect(output).toContain('Context Analysis: testFunc');
    });

    it('should throw for unsupported format', () => {
      // Use Function type to bypass compile-time union check for runtime error testing
      const callExport: Function = exportAs;
      expect(() => callExport('yaml', mockResult, rootDir)).toThrow(
        'Unsupported export format: yaml'
      );
    });
  });
});
