import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { ContextPacker } from '../../lib/context-packer';
import { formatForLLM } from '../../lib/formatter';
import {
  MultiFunctionAnalyzer,
  formatMultiAnalysis,
} from '../../lib/multi-function-analyzer';
import { ContextDepth } from '../../types';

const fixturesPath = path.join(__dirname, '../fixtures');

describe('MCP server analysis logic', () => {
  describe('analyze_function tool logic', () => {
    it('should analyze a known function and return references', () => {
      const packer = new ContextPacker({
        rootDir: fixturesPath,
        depth: ContextDepth.LOGIC,
      });
      const result = packer.analyze('testFunction');

      expect(result.functionName).toBe('testFunction');
      expect(result.count).toBeGreaterThan(0);
      expect(result.references.length).toBe(result.count);
    });

    it('should format analysis result as markdown for LLM', () => {
      const packer = new ContextPacker({
        rootDir: fixturesPath,
        depth: ContextDepth.SNIPPET,
      });
      const result = packer.analyze('testFunction');
      const markdown = formatForLLM(result, fixturesPath);

      expect(markdown).toContain('# Context Analysis: `testFunction`');
      expect(markdown).toContain('**Total References Found:**');
      expect(markdown).toContain('Reference');
    });

    it('should return 0 references for a non-existent function', () => {
      const packer = new ContextPacker({
        rootDir: fixturesPath,
        depth: ContextDepth.LOGIC,
      });
      const result = packer.analyze('nonExistentFunction_xyz');

      expect(result.functionName).toBe('nonExistentFunction_xyz');
      expect(result.count).toBe(0);
      expect(result.references).toEqual([]);
    });

    it('should respect depth parameter', () => {
      const snippetPacker = new ContextPacker({
        rootDir: fixturesPath,
        depth: ContextDepth.SNIPPET,
      });
      const modulePacker = new ContextPacker({
        rootDir: fixturesPath,
        depth: ContextDepth.MODULE,
      });

      const snippetResult = snippetPacker.analyze('testFunction');
      const moduleResult = modulePacker.analyze('testFunction');

      expect(snippetResult.count).toBe(moduleResult.count);

      if (snippetResult.count > 0) {
        const snippetContextLength = snippetResult.references[0].context.length;
        const moduleContextLength = moduleResult.references[0].context.length;
        expect(moduleContextLength).toBeGreaterThanOrEqual(snippetContextLength);
      }
    });
  });

  describe('analyze_multi_function tool logic', () => {
    it('should analyze multiple functions at once', () => {
      const packer = new ContextPacker({
        rootDir: fixturesPath,
        depth: ContextDepth.LOGIC,
      });
      const analyzer = new MultiFunctionAnalyzer(packer);
      const names = MultiFunctionAnalyzer.parseFunctionList(
        'testFunction,utilityFunction',
      );
      const result = analyzer.analyze(names);

      expect(result.functions).toEqual(['testFunction', 'utilityFunction']);
      expect(result.totalReferences).toBeGreaterThan(0);
      expect(result.results.size).toBe(2);
      expect(result.results.has('testFunction')).toBe(true);
      expect(result.results.has('utilityFunction')).toBe(true);
    });

    it('should format multi-analysis result as markdown', () => {
      const packer = new ContextPacker({
        rootDir: fixturesPath,
        depth: ContextDepth.SNIPPET,
      });
      const analyzer = new MultiFunctionAnalyzer(packer);
      const result = analyzer.analyze(['testFunction', 'utilityFunction']);
      const markdown = formatMultiAnalysis(result, 'markdown', fixturesPath);

      expect(markdown).toContain('# Multi-Function Analysis');
      expect(markdown).toContain('testFunction');
      expect(markdown).toContain('utilityFunction');
      expect(markdown).toContain('**Total References:**');
    });

    it('should parse comma-separated function names correctly', () => {
      const names = MultiFunctionAnalyzer.parseFunctionList(
        'foo, bar , baz',
      );
      expect(names).toEqual(['foo', 'bar', 'baz']);
    });

    it('should handle empty function list from parseFunctionList', () => {
      const names = MultiFunctionAnalyzer.parseFunctionList('  ,  , ');
      expect(names).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should return 0 references for a non-existent directory', () => {
      const packer = new ContextPacker({
        rootDir: '/tmp/non_existent_dir_xyz_12345',
        depth: ContextDepth.LOGIC,
      });
      const result = packer.analyze('someFunction');

      expect(result.count).toBe(0);
      expect(result.references).toEqual([]);
    });
  });
});
