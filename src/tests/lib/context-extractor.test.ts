import { describe, it, expect } from 'vitest';
import { extractReferenceContext, extractMultipleContexts } from '../../lib/context-extractor';
import { findReferencesInFile } from '../../lib/reference-finder';
import { ContextDepth } from '../../types';
import * as path from 'path';

describe('context-extractor', () => {
  const fixturesPath = path.join(__dirname, '../fixtures');
  const sampleFile = path.join(fixturesPath, 'sample.ts');

  describe('extractReferenceContext', () => {
    it('should extract snippet context', () => {
      const references = findReferencesInFile(sampleFile, 'testFunction');
      expect(references.length).toBeGreaterThan(0);

      const context = extractReferenceContext(
        references[0],
        ContextDepth.SNIPPET
      );

      expect(context).toHaveProperty('location');
      expect(context).toHaveProperty('context');
      expect(context).toHaveProperty('depth');
      expect(context.depth).toBe(ContextDepth.SNIPPET);
      expect(context.context).toContain('testFunction');
      expect(context.context.split('\n').length).toBe(1);
    });

    it('should extract logic context', () => {
      const references = findReferencesInFile(sampleFile, 'testFunction');
      expect(references.length).toBeGreaterThan(0);

      const context = extractReferenceContext(
        references[0],
        ContextDepth.LOGIC
      );

      expect(context.depth).toBe(ContextDepth.LOGIC);
      expect(context.context).toContain('testFunction');
      expect(context.context.split('\n').length).toBeGreaterThan(1);
      expect(context.enclosingScope).toBeDefined();
    });

    it('should extract module context', () => {
      const references = findReferencesInFile(sampleFile, 'testFunction');
      expect(references.length).toBeGreaterThan(0);

      const context = extractReferenceContext(
        references[0],
        ContextDepth.MODULE
      );

      expect(context.depth).toBe(ContextDepth.MODULE);
      expect(context.context).toContain('testFunction');
      // Module should contain entire file
      expect(context.context.split('\n').length).toBeGreaterThan(10);
    });

    it('should include enclosing scope name for logic depth', () => {
      const references = findReferencesInFile(sampleFile, 'testFunction');
      const refInFunction = references.find(ref => ref.line > 6 && ref.line < 11);
      
      expect(refInFunction).toBeDefined();
      
      if (refInFunction) {
        const context = extractReferenceContext(
          refInFunction,
          ContextDepth.LOGIC
        );

        expect(context.enclosingScope).toBeDefined();
        expect(context.enclosingScope).toBe('callerFunction');
      }
    });

    it('should handle maxContextLines limit', () => {
      const references = findReferencesInFile(sampleFile, 'testFunction');
      expect(references.length).toBeGreaterThan(0);

      const context = extractReferenceContext(
        references[0],
        ContextDepth.LOGIC,
        5 // Very small limit
      );

      expect(context.context).toBeDefined();
      // Should truncate if function is larger than limit
    });
  });

  describe('extractMultipleContexts', () => {
    it('should extract contexts for multiple references', () => {
      const references = findReferencesInFile(sampleFile, 'testFunction');
      expect(references.length).toBeGreaterThan(0);

      const contexts = extractMultipleContexts(
        references,
        ContextDepth.SNIPPET
      );

      expect(contexts.length).toBe(references.length);
      contexts.forEach((context) => {
        expect(context.depth).toBe(ContextDepth.SNIPPET);
        expect(context.context).toContain('testFunction');
      });
    });

    it('should handle empty references array', () => {
      const contexts = extractMultipleContexts([], ContextDepth.LOGIC);
      expect(contexts).toEqual([]);
    });

    it('should preserve location information', () => {
      const references = findReferencesInFile(sampleFile, 'testFunction');
      const contexts = extractMultipleContexts(references, ContextDepth.LOGIC);

      contexts.forEach((context, index) => {
        expect(context.location).toEqual(references[index]);
      });
    });

    it('should apply same depth to all contexts', () => {
      const references = findReferencesInFile(sampleFile, 'testFunction');
      const snippetContexts = extractMultipleContexts(references, ContextDepth.SNIPPET);
      const logicContexts = extractMultipleContexts(references, ContextDepth.LOGIC);

      snippetContexts.forEach((context) => {
        expect(context.depth).toBe(ContextDepth.SNIPPET);
      });

      logicContexts.forEach((context) => {
        expect(context.depth).toBe(ContextDepth.LOGIC);
      });
    });
  });
});
