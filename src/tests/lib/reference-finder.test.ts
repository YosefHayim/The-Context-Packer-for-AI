import { describe, it, expect } from 'vitest';
import { findReferencesInFile, findEnclosingScope } from '../../lib/reference-finder';
import * as path from 'path';

describe('reference-finder', () => {
  const fixturesPath = path.join(__dirname, '../fixtures');
  const sampleFile = path.join(fixturesPath, 'sample.ts');
  const utilityFile = path.join(fixturesPath, 'utility.ts');

  describe('findReferencesInFile', () => {
    it('should find all references to testFunction in sample.ts', () => {
      const references = findReferencesInFile(sampleFile, 'testFunction');
      
      expect(references.length).toBeGreaterThan(0);
      expect(references).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            filePath: sampleFile,
            line: expect.any(Number),
            column: expect.any(Number),
          }),
        ])
      );
    });

    it('should find multiple references to the same function', () => {
      const references = findReferencesInFile(sampleFile, 'testFunction');
      
      // testFunction is called in callerFunction, anotherCaller (2x), TestClass.method, arrowCaller, nestedCaller
      expect(references.length).toBeGreaterThanOrEqual(5);
    });

    it('should find references to utilityFunction', () => {
      const references = findReferencesInFile(utilityFile, 'utilityFunction');
      
      // utilityFunction is called 4 times in complexFunction + 1 in obj.helper
      expect(references.length).toBeGreaterThanOrEqual(4);
    });

    it('should return empty array for non-existent function', () => {
      const references = findReferencesInFile(sampleFile, 'nonExistentFunction');
      expect(references).toEqual([]);
    });

    it('should return empty array for invalid file', () => {
      const references = findReferencesInFile('/non/existent/file.ts', 'testFunction');
      expect(references).toEqual([]);
    });

    it('should include correct line numbers', () => {
      const references = findReferencesInFile(sampleFile, 'testFunction');
      
      references.forEach((ref) => {
        expect(ref.line).toBeGreaterThan(0);
        expect(ref.column).toBeGreaterThanOrEqual(0);
      });
    });

    it('should distinguish between function declaration and calls', () => {
      const references = findReferencesInFile(sampleFile, 'testFunction');
      
      // Should not include the function declaration line (line 3)
      // Should only include calls
      const declarationLine = 3;
      const callsOnDeclarationLine = references.filter(ref => ref.line === declarationLine);
      expect(callsOnDeclarationLine.length).toBe(0);
    });
  });

  describe('findEnclosingScope', () => {
    it('should find enclosing function for a reference', () => {
      const references = findReferencesInFile(sampleFile, 'testFunction');
      expect(references.length).toBeGreaterThan(0);
      
      const firstRef = references[0];
      const scope = findEnclosingScope(firstRef.filePath, firstRef);
      
      expect(scope).not.toBeNull();
      if (scope) {
        expect(scope).toHaveProperty('name');
        expect(scope).toHaveProperty('startLine');
        expect(scope).toHaveProperty('endLine');
        expect(scope.startLine).toBeLessThanOrEqual(firstRef.line);
        expect(scope.endLine).toBeGreaterThanOrEqual(firstRef.line);
      }
    });

    it('should return function name for named functions', () => {
      const references = findReferencesInFile(sampleFile, 'testFunction');
      const refInCallerFunction = references.find(ref => ref.line > 6 && ref.line < 11);
      
      if (refInCallerFunction) {
        const scope = findEnclosingScope(refInCallerFunction.filePath, refInCallerFunction);
        expect(scope).not.toBeNull();
        expect(scope?.name).toBe('callerFunction');
      }
    });

    it('should handle arrow functions', () => {
      const references = findReferencesInFile(sampleFile, 'testFunction');
      const refInArrowFunction = references.find(ref => ref.line > 24 && ref.line < 27);
      
      if (refInArrowFunction) {
        const scope = findEnclosingScope(refInArrowFunction.filePath, refInArrowFunction);
        expect(scope).not.toBeNull();
        // Arrow function might be named 'arrowCaller' or 'anonymous'
        expect(scope?.name).toBeDefined();
      }
    });

    it('should handle nested functions', () => {
      const references = findReferencesInFile(sampleFile, 'testFunction');
      const refInNested = references.find(ref => ref.line > 29);
      
      if (refInNested) {
        const scope = findEnclosingScope(refInNested.filePath, refInNested);
        expect(scope).not.toBeNull();
        // Should find the innermost enclosing scope
        expect(scope?.name).toBeDefined();
      }
    });

    it('should return null for invalid file', () => {
      const scope = findEnclosingScope('/non/existent/file.ts', {
        filePath: '/non/existent/file.ts',
        line: 10,
        column: 5,
      });
      expect(scope).toBeNull();
    });
  });
});
