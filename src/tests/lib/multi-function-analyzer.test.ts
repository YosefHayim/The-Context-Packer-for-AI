import { describe, it, expect, beforeEach } from 'vitest';
import { MultiFunctionAnalyzer, formatMultiAnalysis } from '../../lib/multi-function-analyzer';
import { createContextPacker } from '../../lib/context-packer';
import { ContextDepth } from '../../types';

describe('MultiFunctionAnalyzer', () => {
  const testDir = './examples/sample-project/src';

  describe('parseFunctionList', () => {
    it('should parse comma-separated function names', () => {
      const input = 'funcA,funcB,funcC';
      const result = MultiFunctionAnalyzer.parseFunctionList(input);
      expect(result).toEqual(['funcA', 'funcB', 'funcC']);
    });

    it('should trim whitespace', () => {
      const input = ' funcA , funcB  , funcC ';
      const result = MultiFunctionAnalyzer.parseFunctionList(input);
      expect(result).toEqual(['funcA', 'funcB', 'funcC']);
    });

    it('should filter empty names', () => {
      const input = 'funcA,,funcB,  ,funcC';
      const result = MultiFunctionAnalyzer.parseFunctionList(input);
      expect(result).toEqual(['funcA', 'funcB', 'funcC']);
    });

    it('should handle single function', () => {
      const input = 'funcA';
      const result = MultiFunctionAnalyzer.parseFunctionList(input);
      expect(result).toEqual(['funcA']);
    });

    it('should handle empty string', () => {
      const input = '';
      const result = MultiFunctionAnalyzer.parseFunctionList(input);
      expect(result).toEqual([]);
    });
  });

  describe('isMultiFunction', () => {
    it('should detect multiple functions', () => {
      expect(MultiFunctionAnalyzer.isMultiFunction('funcA,funcB')).toBe(true);
    });

    it('should detect single function', () => {
      expect(MultiFunctionAnalyzer.isMultiFunction('funcA')).toBe(false);
    });
  });

  describe('analyze', () => {
    let analyzer: MultiFunctionAnalyzer;

    beforeEach(() => {
      const packer = createContextPacker(testDir, ContextDepth.SNIPPET);
      analyzer = new MultiFunctionAnalyzer(packer);
    });

    it('should analyze multiple functions', () => {
      const result = analyzer.analyze(['validateUser', 'hashPassword']);
      
      expect(result.functions).toEqual(['validateUser', 'hashPassword']);
      expect(result.results.size).toBe(2);
      expect(result.summary.functionCount).toBe(2);
    });

    it('should aggregate total references', () => {
      const result = analyzer.analyze(['validateUser', 'hashPassword']);
      
      const validateUserRefs = result.results.get('validateUser')?.references.length || 0;
      const hashPasswordRefs = result.results.get('hashPassword')?.references.length || 0;
      
      expect(result.totalReferences).toBe(validateUserRefs + hashPasswordRefs);
    });

    it('should track unique files scanned', () => {
      const result = analyzer.analyze(['validateUser']);
      expect(result.summary.filesScanned).toBeGreaterThan(0);
    });

    it('should handle empty function list', () => {
      const result = analyzer.analyze([]);
      expect(result.functions).toEqual([]);
      expect(result.results.size).toBe(0);
      expect(result.totalReferences).toBe(0);
    });

    it('should handle non-existent functions', () => {
      const result = analyzer.analyze(['nonExistentFunction123']);
      expect(result.results.size).toBe(1);
      expect(result.results.get('nonExistentFunction123')?.references.length).toBe(0);
    });

    it('should return individual results for each function', () => {
      const result = analyzer.analyze(['validateUser', 'hashPassword']);
      
      expect(result.results.has('validateUser')).toBe(true);
      expect(result.results.has('hashPassword')).toBe(true);
    });
  });

  describe('formatMultiAnalysis', () => {
    let analyzer: MultiFunctionAnalyzer;

    beforeEach(() => {
      const packer = createContextPacker(testDir, ContextDepth.SNIPPET);
      analyzer = new MultiFunctionAnalyzer(packer);
    });

    it('should format as JSON', () => {
      const result = analyzer.analyze(['validateUser']);
      const output = formatMultiAnalysis(result, 'json');
      
      const parsed = JSON.parse(output);
      expect(parsed.functions).toEqual(['validateUser']);
      expect(parsed.summary).toBeDefined();
      expect(parsed.results).toBeInstanceOf(Array);
    });

    it('should format as text', () => {
      const result = analyzer.analyze(['validateUser']);
      const output = formatMultiAnalysis(result, 'text');
      
      expect(output).toContain('MULTI-FUNCTION ANALYSIS');
      expect(output).toContain('validateUser');
      expect(output).toContain('Total References:');
    });

    it('should format as markdown (default)', () => {
      const result = analyzer.analyze(['validateUser']);
      const output = formatMultiAnalysis(result);
      
      expect(output).toContain('# Multi-Function Analysis');
      expect(output).toContain('## validateUser');
      expect(output).toContain('**References:**');
    });

    it('should include summary information', () => {
      const result = analyzer.analyze(['validateUser', 'hashPassword']);
      const output = formatMultiAnalysis(result, 'text');
      
      expect(output).toContain('validateUser, hashPassword');
      expect(output).toMatch(/Files Scanned:\s*\d+/);
    });

    it('should show each function separately', () => {
      const result = analyzer.analyze(['validateUser', 'hashPassword']);
      const output = formatMultiAnalysis(result, 'markdown');
      
      expect(output).toContain('## validateUser');
      expect(output).toContain('## hashPassword');
    });
  });

  describe('Integration', () => {
    it('should work end-to-end with real functions', () => {
      const packer = createContextPacker(testDir, ContextDepth.LOGIC);
      const analyzer = new MultiFunctionAnalyzer(packer);
      
      const functionList = MultiFunctionAnalyzer.parseFunctionList('validateUser,hashPassword');
      const result = analyzer.analyze(functionList);
      const formatted = formatMultiAnalysis(result, 'json');
      
      const parsed = JSON.parse(formatted);
      expect(parsed.functions.length).toBe(2);
      expect(parsed.summary.functionCount).toBe(2);
    });
  });
});
