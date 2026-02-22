# Testing Guide

This guide explains how to run and write tests for Context Packer.

## Running Tests

### Run All Tests
```bash
npm test
```

### Watch Mode (Re-run on Changes)
```bash
npm run test:watch
```

### With UI Interface
```bash
npm run test:ui
```

### With Coverage Report
```bash
npm run test:coverage
```

## Test Structure

```
src/tests/
├── fixtures/           # Test data files
│   ├── sample.ts      # Sample TypeScript code
│   └── utility.ts     # Another test file
└── lib/               # Unit tests for library code
    ├── parser.test.ts
    ├── reference-finder.test.ts
    ├── context-extractor.test.ts
    ├── formatter.test.ts
    ├── context-packer.test.ts
    ├── config-loader.test.ts
    └── multi-function-analyzer.test.ts
```

## Test Coverage

Current test coverage is continuously evolving as new suites are added. Run `npm test` (or `npm run test:coverage`) to see the latest test counts and coverage details.

| Module | Notes |
|--------|-------|
| **parser.test.ts** | File parsing, line extraction |
| **reference-finder.test.ts** | Function call detection |
| **context-extractor.test.ts** | Context extraction at multiple depths |
| **formatter.test.ts** | Output formatting |
| **context-packer.test.ts** | Integration and end-to-end behavior |
| **config-loader.test.ts** | Configuration file loading |
| **multi-function-analyzer.test.ts** | Multi-function analysis |

## Writing Tests

### Test Structure

```typescript
import { describe, it, expect } from 'vitest';
import { yourFunction } from '../../lib/your-module';

describe('yourModule', () => {
  describe('yourFunction', () => {
    it('should do something specific', () => {
      const result = yourFunction(input);
      expect(result).toBe(expected);
    });

    it('should handle edge cases', () => {
      const result = yourFunction(edgeCase);
      expect(result).toBeDefined();
    });
  });
});
```

### Example Test

```typescript
import { describe, it, expect } from 'vitest';
import { parseFile } from '../../lib/parser';
import * as path from 'path';

describe('parser', () => {
  const sampleFile = path.join(__dirname, '../fixtures/sample.ts');

  it('should parse valid TypeScript file', () => {
    const ast = parseFile(sampleFile);
    
    expect(ast).not.toBeNull();
    expect(ast).toHaveProperty('type');
    expect(ast).toHaveProperty('body');
  });

  it('should return null for invalid file', () => {
    const ast = parseFile('/non/existent/file.ts');
    expect(ast).toBeNull();
  });
});
```

## Test Fixtures

### Creating Fixtures

Add test files to `src/tests/fixtures/`:

```typescript
// src/tests/fixtures/my-test.ts
export function myTestFunction() {
  return 'test';
}

export function callsTestFunction() {
  return myTestFunction();
}
```

### Using Fixtures

```typescript
import * as path from 'path';

const fixturesPath = path.join(__dirname, '../fixtures');
const myTestFile = path.join(fixturesPath, 'my-test.ts');
```

## Common Test Patterns

### Testing Parser

```typescript
it('should parse file successfully', () => {
  const ast = parseFile(validFile);
  expect(ast).not.toBeNull();
});

it('should handle parse errors', () => {
  const ast = parseFile(invalidFile);
  expect(ast).toBeNull();
});
```

### Testing Reference Finder

```typescript
it('should find all function references', () => {
  const refs = findReferencesInFile(file, 'myFunc');
  
  expect(refs.length).toBeGreaterThan(0);
  refs.forEach(ref => {
    expect(ref).toHaveProperty('filePath');
    expect(ref).toHaveProperty('line');
    expect(ref).toHaveProperty('column');
  });
});
```

### Testing Context Extractor

```typescript
it('should extract snippet context', () => {
  const context = extractReferenceContext(
    location,
    ContextDepth.SNIPPET
  );
  
  expect(context.depth).toBe(ContextDepth.SNIPPET);
  expect(context.context).toContain('functionName');
});
```

### Testing Formatter

```typescript
it('should format as markdown', () => {
  const output = formatForLLM(result, rootDir);
  
  expect(output).toContain('# Context Analysis');
  expect(output).toContain('```typescript');
  expect(output).toContain('**Line:**');
});
```

## Test Guidelines

### DO's

✅ **Test edge cases**
```typescript
it('should handle empty input', () => {
  const result = myFunction([]);
  expect(result).toEqual([]);
});
```

✅ **Test error conditions**
```typescript
it('should return null for invalid file', () => {
  const result = parseFile('/invalid');
  expect(result).toBeNull();
});
```

✅ **Use descriptive test names**
```typescript
// Good
it('should find all references to testFunction in sample.ts', () => {

// Bad
it('works', () => {
```

✅ **Test multiple scenarios**
```typescript
it('should find references in different contexts', () => {
  // Test direct calls
  // Test method calls
  // Test nested calls
});
```

### DON'Ts

❌ **Don't test implementation details**
```typescript
// Bad - testing internal structure
it('should use Array.map internally', () => {
  // ...
});

// Good - testing behavior
it('should return array of results', () => {
  // ...
});
```

❌ **Don't write flaky tests**
```typescript
// Bad - depends on file system timing
it('should parse file quickly', () => {
  const start = Date.now();
  parseFile(file);
  expect(Date.now() - start).toBeLessThan(100);
});
```

❌ **Don't skip tests without reason**
```typescript
// Bad
it.skip('should handle complex case', () => {
  // TODO: implement
});

// Good - with explanation
it.skip('should handle complex case - waiting for AST parser fix', () => {
  // Will implement after upstream fix
});
```

## Debugging Tests

### Run Single Test File
```bash
npm test src/tests/lib/parser.test.ts
```

### Run Single Test
```typescript
it.only('should test this specific case', () => {
  // This test will run alone
});
```

### View Detailed Output
```bash
npm test -- --reporter=verbose
```

### Debug in VS Code

Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["test"],
  "console": "integratedTerminal"
}
```

## Continuous Integration

Tests run automatically on:
- Every commit
- Every pull request
- Before merging

Ensure all tests pass before submitting PRs.

## Adding New Tests

1. **Create test file** in appropriate directory
2. **Import necessary modules** and fixtures
3. **Write descriptive tests** with clear expectations
4. **Run tests** to verify they pass
5. **Check coverage** to ensure new code is tested

## Test Checklist

Before committing:

- [ ] All tests pass (`npm test`)
- [ ] New features have tests
- [ ] Edge cases are covered
- [ ] No tests skipped without reason
- [ ] Test names are descriptive
- [ ] Coverage doesn't decrease

## See Also

- **package.json** - Test scripts configuration
- **vitest.config.ts** - Vitest configuration
- **src/tests/** - All test files

---

**Happy Testing!** 🧪
