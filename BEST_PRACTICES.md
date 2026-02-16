# Best Practices for Context Packer

This guide outlines best practices for using, contributing to, and maintaining the Context Packer project.

## Table of Contents

1. [Using Context Packer Effectively](#using-context-packer-effectively)
2. [Development Best Practices](#development-best-practices)
3. [Code Quality Standards](#code-quality-standards)
4. [Documentation Standards](#documentation-standards)
5. [Security Practices](#security-practices)
6. [Performance Guidelines](#performance-guidelines)

---

## Using Context Packer Effectively

### ✅ DO: Start with the Right Context Depth

Choose the appropriate depth for your use case:

```bash
# For quick reference checks - use snippet
context-packer myFunction --depth snippet

# For understanding usage patterns (RECOMMENDED) - use logic
context-packer myFunction --depth logic

# For complex debugging - use module
context-packer myFunction --depth module
```

### ✅ DO: Scope Your Search

Always specify the directory to avoid scanning unnecessary files:

```bash
# Good - focused search
context-packer validateInput --dir ./src/validators

# Bad - scans everything including node_modules if not excluded
context-packer validateInput
```

### ✅ DO: Use Exclude Patterns

Exclude test files and build artifacts:

```bash
context-packer myFunc \
  --exclude "**/*.test.ts" \
  --exclude "**/dist/**" \
  --exclude "**/node_modules/**"
```

### ✅ DO: Save Output for Complex Analysis

For functions with many references, save to file:

```bash
context-packer popularFunction --output analysis.md
```

### ❌ DON'T: Use for Non-Semantic Searches

Context Packer is for finding function calls, not:
- ❌ Variable declarations
- ❌ String literals
- ❌ Comments
- ❌ Type definitions

Use grep/ripgrep for those cases.

### ❌ DON'T: Ignore the Output Format

The markdown format is optimized for LLMs. When pasting into AI:
- ✅ Include file paths and line numbers
- ✅ Keep the context structure
- ❌ Don't strip out metadata

---

## Development Best Practices

### Code Organization

**✅ Follow the Module Structure:**
```
src/
├── lib/        # Core logic (pure functions, no side effects)
├── cli/        # CLI interface (handles I/O)
├── utils/      # Helper utilities
└── types/      # TypeScript type definitions
```

**✅ Separation of Concerns:**
- **Parser**: Only handles AST parsing
- **Reference Finder**: Only finds function calls
- **Context Extractor**: Only extracts context
- **Formatter**: Only formats output
- **CLI**: Only handles user interaction

### Adding New Features

**✅ DO: Add Types First**
```typescript
// 1. Define types in src/types/index.ts
export interface NewFeature {
  // ...
}

// 2. Implement in src/lib/
export function newFeature(): NewFeature {
  // ...
}

// 3. Export from src/index.ts
export { newFeature } from './lib/new-feature';
```

**✅ DO: Keep Functions Pure**
```typescript
// Good - pure function
export function extractContext(location: CodeLocation, depth: ContextDepth): string {
  const content = getFileContent(location.filePath);
  return processContent(content, depth);
}

// Bad - side effects
export function extractContext(location: CodeLocation, depth: ContextDepth): string {
  console.log('Extracting...'); // Side effect!
  saveToCache(location);         // Side effect!
  return getFileContent(location.filePath);
}
```

### Testing Best Practices

**✅ DO: Test on Real Code**
```bash
# Create test fixtures in examples/
mkdir -p examples/test-case-name/src
# Add real TypeScript files
# Run context-packer on them
```

**✅ DO: Verify AST Parsing**
```typescript
// Test that parser handles edge cases
const ast = parseFile('examples/edge-case.ts');
assert(ast !== null);
```

### Git Practices

**✅ DO: Use Semantic Commits**
```bash
feat(cli): add interactive wizard
fix(parser): handle arrow functions correctly
docs: update best practices guide
refactor(formatter): simplify markdown generation
```

**✅ DO: Keep Commits Focused**
- One logical change per commit
- Clear commit messages
- Reference issues when applicable

---

## Code Quality Standards

### TypeScript Best Practices

**✅ DO: Use Strict Mode**
```typescript
// tsconfig.json already has strict: true
// Always maintain type safety
```

**✅ DO: Prefer Interfaces Over Types for Objects**
```typescript
// Good
export interface AnalysisResult {
  functionName: string;
  references: FunctionReference[];
}

// Avoid (unless needed for unions)
export type AnalysisResult = {
  functionName: string;
  references: FunctionReference[];
}
```

**✅ DO: Document Public APIs**
```typescript
/**
 * Extract context for a reference based on the desired depth
 * 
 * @param location - The code location to extract from
 * @param depth - The context depth level
 * @param maxContextLines - Maximum lines to include (default: 100)
 * @returns The extracted function reference with context
 */
export function extractReferenceContext(
  location: CodeLocation,
  depth: ContextDepth,
  maxContextLines: number = 100
): FunctionReference {
  // ...
}
```

**✅ DO: Handle Errors Gracefully**
```typescript
// Good
try {
  const ast = parse(content);
  return ast;
} catch (error) {
  console.warn(`Failed to parse ${filePath}:`, error);
  return null;
}

// Bad
const ast = parse(content); // Might crash!
```

### Code Style

**✅ DO: Use Consistent Naming**
- `camelCase` for variables and functions
- `PascalCase` for classes and interfaces
- `UPPER_SNAKE_CASE` for constants
- Descriptive names over short names

**✅ DO: Keep Functions Small**
- One responsibility per function
- Maximum ~50 lines
- Extract helpers when needed

**✅ DO: Avoid Magic Numbers**
```typescript
// Bad
if (lineCount > 100) { ... }

// Good
const MAX_CONTEXT_LINES = 100;
if (lineCount > MAX_CONTEXT_LINES) { ... }
```

---

## Documentation Standards

### What to Document

**✅ DO: Document All Public APIs**
- Exported functions
- Classes
- Interfaces
- CLI commands

**✅ DO: Include Examples**
```typescript
/**
 * Find all references to a function in a file
 * 
 * @example
 * const refs = findReferencesInFile('./src/app.ts', 'handleSubmit');
 * console.log(`Found ${refs.length} references`);
 */
```

**✅ DO: Keep Docs Up to Date**
- Update docs when changing APIs
- Add migration guides for breaking changes
- Document deprecations clearly

### Documentation Structure

**README.md**: Overview, quick start, key features
**USAGE.md**: Detailed usage guide with examples
**QUICKSTART.md**: 5-minute getting started
**CONTRIBUTING.md**: How to contribute
**BEST_PRACTICES.md**: This file
**docs/**: Additional technical documentation

---

## Security Practices

### Input Validation

**✅ DO: Validate File Paths**
```typescript
// Good
const absolutePath = path.resolve(userInput);
if (!absolutePath.startsWith(rootDir)) {
  throw new Error('Path outside root directory');
}
```

**✅ DO: Sanitize User Input**
```typescript
// Good - validate depth parameter
if (!['snippet', 'logic', 'module'].includes(depth)) {
  throw new Error(`Invalid depth: ${depth}`);
}
```

### Dependencies

**✅ DO: Use Trusted Dependencies**
- Only use well-maintained packages
- Check npm audit regularly
- Keep dependencies updated

**✅ DO: Minimize Dependencies**
- Current dependencies are minimal and necessary
- Avoid adding new dependencies without justification

### Code Execution

**❌ DON'T: Execute User Code**
- Never use `eval()` or `Function()`
- Only parse code, never execute it
- AST parsing is safe

---

## Performance Guidelines

### File Scanning

**✅ DO: Use Appropriate Patterns**
```bash
# Good - specific patterns
context-packer myFunc --include "**/*.ts"

# Bad - too broad
context-packer myFunc --include "**/*"
```

**✅ DO: Exclude Build Artifacts**
```bash
--exclude "**/node_modules/**" \
--exclude "**/dist/**" \
--exclude "**/.git/**"
```

### Context Extraction

**✅ DO: Set Reasonable Limits**
```typescript
// Already implemented - maxContextLines parameter
const MAX_CONTEXT_LINES = 100; // Prevents huge outputs
```

**✅ DO: Cache Parsed Files (Future)**
- Consider caching ASTs for repeat analysis
- Clear cache when files change

### Memory Management

**✅ DO: Process Files One at a Time**
```typescript
// Good - process sequentially
for (const file of files) {
  const references = findReferencesInFile(file, functionName);
  allReferences.push(...references);
}

// Avoid - loading all files at once
const allContents = files.map(f => readFileSync(f));
```

---

## Common Pitfalls to Avoid

### ❌ Using Wrong Context Depth

**Problem**: Using `module` depth for every query
**Solution**: Start with `logic` depth, only use `module` when needed

### ❌ Not Excluding Test Files

**Problem**: Finding references in test files when not needed
**Solution**: `--exclude "**/*.test.ts"`

### ❌ Scanning Too Many Files

**Problem**: Running on entire project when only need one module
**Solution**: `--dir ./src/specific-module`

### ❌ Ignoring File Patterns

**Problem**: Getting results from irrelevant files
**Solution**: Use `--include` and `--exclude` appropriately

### ❌ Not Saving Complex Results

**Problem**: Trying to read 50 references in terminal
**Solution**: `--output results.md` and open in editor

---

## Advanced Usage Patterns

### Pattern 1: Pre-Refactoring Analysis

```bash
# Before changing a function signature
context-packer oldFunction --depth logic --output before.md

# After making changes
context-packer newFunction --depth logic --output after.md

# Compare to ensure all call sites updated
diff before.md after.md
```

### Pattern 2: Finding All API Calls

```bash
# Find all API calls in a specific directory
context-packer fetch --dir ./src/api --depth snippet
context-packer axios --dir ./src/api --depth snippet
```

### Pattern 3: Understanding Legacy Code

```bash
# Start with snippet to see where it's used
context-packer mysteryFunction --depth snippet

# Then get logic context for key usages
context-packer mysteryFunction --depth logic --output context.md
```

### Pattern 4: Code Review Preparation

```bash
# Before reviewing a PR that changes a function
context-packer changedFunction --depth logic > review-context.md

# Share with team: "This function is used in these ways..."
```

---

## Contribution Workflow

### 1. Before You Start

- ✅ Check existing issues and PRs
- ✅ Discuss large changes first (create issue)
- ✅ Read CONTRIBUTING.md

### 2. During Development

- ✅ Follow code style (see Code Quality Standards)
- ✅ Write descriptive commit messages
- ✅ Test your changes manually
- ✅ Update documentation if needed

### 3. Before Submitting PR

- ✅ Run `npm run build` - ensure no TypeScript errors
- ✅ Test CLI manually with various inputs
- ✅ Update CHANGELOG.md (if exists)
- ✅ Ensure git history is clean

### 4. PR Description

Include:
- What problem does this solve?
- What changes were made?
- How to test the changes?
- Any breaking changes?

---

## Troubleshooting Common Issues

### "No references found"

**Possible causes:**
1. Function name mismatch (case-sensitive)
2. Wrong directory specified
3. Files excluded by patterns
4. Function is method call only (try searching method name)

**Solution:**
```bash
# Verify files are being scanned
context-packer myFunc --dir ./src --include "**/*.ts"

# Check if it's a method
context-packer methodName --dir ./src
```

### "Too many/wrong references"

**Cause:** Name collision with other functions

**Solution:**
```bash
# Narrow search scope
context-packer commonName --dir ./src/specific-module

# Exclude irrelevant paths
context-packer commonName --exclude "**/vendor/**"
```

### "Output is too large"

**Cause:** Using `module` depth or very large functions

**Solution:**
```bash
# Use snippet depth instead
context-packer myFunc --depth snippet

# Or use logic with specific directory
context-packer myFunc --dir ./src/auth --depth logic
```

---

## Resources

- **README.md** - Project overview
- **USAGE.md** - Comprehensive usage guide
- **QUICKSTART.md** - Quick start guide
- **CONTRIBUTING.md** - Contribution guidelines
- **GitHub Issues** - Bug reports and feature requests

---

## Getting Help

- 📖 Read the documentation (start with QUICKSTART.md)
- 🐛 Check GitHub Issues for similar problems
- 💬 Open an issue for bugs or feature requests
- 🤝 Join discussions in GitHub Discussions (if enabled)

---

**Remember**: Context Packer is a tool to help you provide better context to AI assistants. Use it to transform "blind coding" into "informed refactoring"! 🚀
