# Usage Guide: Context Packer for AI

This guide shows you how to use Context Packer effectively in different scenarios.

## Table of Contents

1. [Basic Usage](#basic-usage)
2. [Context Depth Selection](#context-depth-selection)
3. [Common Workflows](#common-workflows)
4. [Advanced Usage](#advanced-usage)
5. [Library API](#library-api)

---

## Basic Usage

### Analyze a Function

The simplest use case - find all references to a function:

```bash
context-packer functionName
```

This will:
- Search the current directory
- Use "logic" depth (shows enclosing functions)
- Output markdown to stdout

### Specify a Directory

Search in a specific directory:

```bash
context-packer functionName --dir ./src
```

### Save to a File

Save the output instead of printing it:

```bash
context-packer functionName --output context.md
```

Now you can paste `context.md` directly into ChatGPT, Claude, or any LLM.

---

## Context Depth Selection

Choose the right depth based on what you need:

### 1. Snippet (`--depth snippet`)

**When to use:** Quick checks, simple syntax questions

```bash
context-packer calculateTotal --depth snippet
```

**Output:** Just the line with the function call

```typescript
const total = calculateTotal(items, tax);
```

**Best for:**
- "Where is this function called?"
- "How many times is this used?"
- Quick refactoring impact analysis

### 2. Logic (`--depth logic`) - **Default**

**When to use:** Understanding how the function is used

```bash
context-packer calculateTotal --depth logic
```

**Output:** The entire enclosing function

```typescript
export async function processOrder(items: Item[], tax: number) {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const total = calculateTotal(items, tax);
  
  await saveOrder({ items, subtotal, total });
  return total;
}
```

**Best for:**
- Bug fixes
- Understanding function usage patterns
- Ensuring API changes won't break callers
- Most AI assistance tasks

### 3. Module (`--depth module`)

**When to use:** Complex state, imports, or architectural questions

```bash
context-packer calculateTotal --depth module
```

**Output:** The entire file

**Best for:**
- Understanding complex state management
- Import/export issues
- Class-based code with instance methods
- When you need full context

---

## Common Workflows

### Workflow 1: Fix a Bug Without Breaking Anything

**Scenario:** You need to fix a bug in `validateEmail` but it's used in 10 places.

```bash
# Step 1: Analyze the function
context-packer validateEmail --output email-context.md

# Step 2: Paste into ChatGPT/Claude
# "I need to fix validateEmail to handle plus signs in emails. 
#  Here's where it's currently used: [paste email-context.md]
#  Suggest a fix that won't break existing code."
```

**Result:** The AI sees all call sites and suggests a backward-compatible fix.

### Workflow 2: Refactor a Function

**Scenario:** You want to add a parameter to `fetchUserData`.

```bash
# Find all call sites
context-packer fetchUserData --depth logic --output refactor.md

# Review the output
cat refactor.md

# Now you know exactly which files need updating
```

**Result:** Complete list of everywhere you need to update.

### Workflow 3: Understand Legacy Code

**Scenario:** You inherited a codebase and don't know what `processPayment` does.

```bash
# See how it's actually used
context-packer processPayment --depth logic
```

**Result:** Real-world usage examples show you what the function does better than any documentation.

### Workflow 4: Code Review

**Scenario:** Reviewing a PR that changes `authenticateUser`.

```bash
# See current usage
context-packer authenticateUser --depth logic > current-usage.md

# After PR merge, compare
# "How will this change affect the 5 places using authenticateUser?"
```

---

## Advanced Usage

### Custom File Patterns

Only search specific file types:

```bash
context-packer myFunc \
  --include "**/*.ts" \
  --include "**/*.tsx"
```

Exclude test files:

```bash
context-packer myFunc \
  --exclude "**/*.test.ts" \
  --exclude "**/__tests__/**"
```

### Multiple Patterns

Search with complex patterns:

```bash
context-packer apiCall \
  --dir ./src \
  --include "**/*.ts" \
  --exclude "**/node_modules/**" \
  --exclude "**/dist/**" \
  --exclude "**/*.test.ts"
```

### Different Output Formats

Markdown (default):

```bash
context-packer myFunc --format markdown
```

Plain text:

```bash
context-packer myFunc --format text
```

### Combine Options

Real-world example:

```bash
context-packer fetchData \
  --dir ./src/api \
  --depth logic \
  --format markdown \
  --output api-context.md \
  --include "**/*.ts" \
  --exclude "**/*.test.ts"
```

---

## Library API

Use Context Packer programmatically in your own tools.

### Basic Usage

```typescript
import { createContextPacker, ContextDepth, formatForLLM } from 'context-packer';

// Create a packer
const packer = createContextPacker('./src', ContextDepth.LOGIC);

// Analyze a function
const result = packer.analyze('handleSubmit');

console.log(`Found ${result.count} references`);

// Format for LLM
const markdown = formatForLLM(result, './src');
console.log(markdown);
```

### Advanced Usage

```typescript
import { ContextPacker, ContextDepth, formatAsText } from 'context-packer';

// Create with custom options
const packer = new ContextPacker({
  rootDir: './src',
  depth: ContextDepth.LOGIC,
  include: ['**/*.ts', '**/*.tsx'],
  exclude: ['**/*.test.ts', '**/node_modules/**'],
  maxContextLines: 50, // Limit context size
});

// Analyze
const result = packer.analyze('myFunction');

// Format as text instead of markdown
const text = formatAsText(result, './src');

// Use the data
result.references.forEach((ref) => {
  console.log(`${ref.location.filePath}:${ref.location.line}`);
  console.log(ref.context);
});
```

### Analyze Specific File

```typescript
const packer = createContextPacker('./src');

// Only search in one file
const result = packer.analyzeFile('myFunction', './src/utils/helpers.ts');
```

### Get Statistics

```typescript
const packer = createContextPacker('./src');

const stats = packer.getStats();
console.log(`Scanning ${stats.totalFiles} files`);
```

### Custom Processing

```typescript
import { findReferencesInFile, extractReferenceContext } from 'context-packer';
import { ContextDepth } from 'context-packer';

// Find references manually
const locations = findReferencesInFile('./src/app.ts', 'myFunction');

// Extract context for each
const contexts = locations.map((loc) => 
  extractReferenceContext(loc, ContextDepth.SNIPPET)
);

// Process as needed
contexts.forEach((ctx) => {
  console.log(ctx.context);
});
```

---


## New in v0.2.0

### Interactive Mode

Launch an interactive REPL to explore your codebase without re-running commands:

```bash
context-packer --interactive
# or
context-packer -i
```

Inside the REPL you can type function names, change depth, switch directories, and more — all without restarting.

### Watch Mode

Continuously re-analyze whenever source files change:

```bash
context-packer handleSubmit --watch
```

Great for keeping context up to date during active development. Uses debounced `fs.watch` under the hood.

### Diff Mode (Snapshots)

Save a baseline snapshot and compare later:

```bash
# Save current state
context-packer handleSubmit --save-snapshot baseline.json

# … make code changes …

# Compare against baseline
context-packer handleSubmit --diff baseline.json
```

Output highlights added, removed, and changed references — perfect for code review.

### AST Caching

Context Packer caches parsed ASTs in memory with mtime-based invalidation and LRU eviction. This is on by default and significantly speeds up repeated analyses.

```bash
# Disable caching if needed
context-packer handleSubmit --no-cache
```

### Python Support

Python files (`.py`) are now analyzed using a regex-based parser that detects function definitions, class methods, and decorators:

```bash
context-packer my_function --dir ./python_project --include "**/*.py"
```

> **Note:** The Python parser uses regex pattern matching rather than a full AST. It covers common patterns (top-level functions, class methods, decorated functions) but may miss complex metaprogramming. A Tree-sitter upgrade is on the roadmap.

### MCP Server

The MCP (Model Context Protocol) server lets AI coding tools query function context directly:

```bash
npx context-packer-mcp
```

Configure in your MCP client (e.g. Claude Desktop):

```json
{
  "mcpServers": {
    "context-packer": {
      "command": "npx",
      "args": ["context-packer-mcp"]
    }
  }
}
```

Available tools: `analyze_function` and `list_functions`.

---

## Tips and Best Practices

### 1. Start with Logic Depth

The default "logic" depth is usually the sweet spot:
- Shows enough context to understand usage
- Not overwhelming like "module"
- More useful than "snippet"

### 2. Use Specific Directories

Narrow your search to relevant directories:

```bash
# Good - focused search
context-packer validateInput --dir ./src/validators

# Bad - searches everything including node_modules
context-packer validateInput
```

### 3. Save Output for Complex Cases

For functions with many references, save to file:

```bash
context-packer popularFunction --output analysis.md
```

Then review the file before sending to an AI.

### 4. Exclude Test Files

Unless you're specifically looking at tests:

```bash
context-packer myFunc --exclude "**/*.test.ts"
```

### 5. Use with AI Workflows

**Pattern:**
```
1. Run context-packer
2. Save output
3. Paste into AI with specific question
4. Get informed answer
```

**Example prompt:**
> I need to add null-checking to `validateUser`. Here's every place it's used: [paste context]
> 
> Please suggest:
> 1. Updated function signature
> 2. Changes needed at each call site
> 3. Any breaking changes I should be aware of

---

## Troubleshooting

### No References Found

If you get 0 references:

1. **Check the function name** - Must match exactly
2. **Check the directory** - Use `--dir` to specify correct location
3. **Check file patterns** - Make sure you're including the right files
4. **Check if it's a method call** - Tool finds both `func()` and `obj.func()`

### Too Many/Wrong References

The tool uses semantic analysis, but if you get unexpected results:

1. **Use specific directory** - `--dir ./src/specific-module`
2. **Exclude irrelevant files** - `--exclude "**/vendor/**"`
3. **Check for name conflicts** - Multiple functions with same name

### Large Output

If the output is too large:

1. **Use snippet depth** - `--depth snippet` for minimal output
2. **Search specific directory** - `--dir ./src/auth`
3. **Filter by pattern** - `--include "src/auth/**/*.ts"`

---

## Examples from Real Projects

### React Component Refactoring

```bash
# Find all uses of useAuth hook
context-packer useAuth --dir ./src/components --depth logic
```

### API Route Changes

```bash
# See where an API is called before changing it
context-packer fetchUserProfile --dir ./src --output api-impact.md
```

### Utility Function Updates

```bash
# Find all formatDate calls
context-packer formatDate --depth snippet
```

### Database Query Changes

```bash
# See where query is used
context-packer getUserById --depth module --output db-context.md
```

---

## Next Steps

- See [README.md](README.md) for installation and overview
- Check [examples/](examples/) for working samples
- Run `context-packer --help` for quick reference

Happy context packing! 🚀
