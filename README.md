# Context Packer for AI

> Transform your codebase into AI-ready context. Never paste blind code again.

## The Problem

When you ask an AI to fix a function, it optimizes the code in isolation—but breaks your app because it can't see where that function is used. You end up doing a manual "scavenger hunt" through your codebase, copying references one by one.

**Context Packer** automates this entire workflow.

## What It Does

Context Packer uses **semantic code analysis** (not text search) to:

1. ✅ Find every location where a function is called
2. ✅ Extract the right amount of context (snippet, function, or file)
3. ✅ Format it perfectly for LLMs with file paths, line numbers, and syntax highlighting

## Installation

```bash
npm install -g context-packer
```

Or use locally in your project:

```bash
npm install context-packer
```

## Quick Start

### CLI Usage

```bash
# Find all references to a function
context-packer handleSubmit

# Search in a specific directory
context-packer handleSubmit --dir ./src

# Choose context depth
context-packer processData --depth module

# Save to file
context-packer myFunction --output context.md
```

### Library Usage

```typescript
import { createContextPacker, ContextDepth, formatForLLM } from 'context-packer';

// Create analyzer
const packer = createContextPacker('./src', ContextDepth.LOGIC);

// Analyze a function
const result = packer.analyze('handleSubmit');

// Get LLM-ready markdown
const markdown = formatForLLM(result, './src');
console.log(markdown);
```

## Context Depth Modes

### 1. Snippet View (`--depth snippet`)
**Use for**: Quick syntax checks, simple refactors

Shows just the line where the function is called:

```typescript
// Reference 1
**File:** `src/components/Form.tsx`
**Line:** 42

```typescript
onSubmit={handleSubmit}
```

### 2. Logic View (`--depth logic`) ⭐ **Default**
**Use for**: Understanding how the function is used

Shows the entire enclosing function/scope:

```typescript
// Reference 1
**File:** `src/components/Form.tsx`
**Line:** 42
**Enclosing Scope:** `FormComponent`

```typescript
export function FormComponent() {
  const [data, setData] = useState({});
  
  const onSubmit = async (e) => {
    e.preventDefault();
    await handleSubmit(data);
  };
  
  return <form onSubmit={onSubmit}>...</form>;
}
```

### 3. Module View (`--depth module`)
**Use for**: Complex state management, import issues

Shows the entire file where the function is used.

## CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `--dir <path>` | Root directory to search | Current directory |
| `--depth <level>` | Context depth: `snippet`/`logic`/`module` | `logic` |
| `--output <file>` | Write to file instead of stdout | - |
| `--format <type>` | Output format: `markdown`/`text` | `markdown` |
| `--include <pattern>` | File patterns to include (can repeat) | `**/*.{ts,tsx,js,jsx}` |
| `--exclude <pattern>` | File patterns to exclude (can repeat) | `node_modules`, `dist`, etc. |
| `--help` | Show help message | - |

## Examples

### Fix a Function Without Breaking Anything

**Before (Manual Process):**
1. Open your IDE
2. "Find All References" → 15 locations found
3. Open each file, scroll to the line, copy context
4. Paste into ChatGPT one by one
5. Hope you didn't miss anything

**After (With Context Packer):**
```bash
context-packer validateUser --output context.md
```

Then paste `context.md` into your AI assistant with:
> "Fix `validateUser` to handle null emails. Here's where it's used: [paste context]"

The AI now sees **all 15 call sites** and won't break your app.

### Understand Legacy Code

```bash
# See how a mysterious function is actually used
context-packer processPayment --depth logic

# Find all usages across a specific module
context-packer fetchData --dir ./src/api --depth module
```

### Custom File Patterns

```bash
# Only search TypeScript files
context-packer myFunc --include "**/*.ts" --include "**/*.tsx"

# Exclude test files
context-packer myFunc --exclude "**/*.test.ts" --exclude "**/__tests__/**"
```

## Supported Languages

Currently supports:
- ✅ TypeScript (`.ts`, `.tsx`)
- ✅ JavaScript (`.js`, `.jsx`)

## How It Works

Unlike grep or text search, Context Packer uses the TypeScript AST parser to **understand** your code:

1. **Parse Files**: Converts code into an Abstract Syntax Tree
2. **Semantic Analysis**: Identifies actual function calls (not just string matches)
3. **Scope Detection**: Finds the enclosing function/class for each call
4. **Smart Extraction**: Pulls the right context based on depth mode
5. **LLM Formatting**: Outputs markdown with file paths and syntax highlighting

This means:
- ❌ No false positives from comments or strings
- ✅ Accurate line numbers and scopes
- ✅ Handles method calls like `user.validate()`
- ✅ Works with imports, destructuring, and complex syntax

## Library API

### `createContextPacker(rootDir, depth?)`

Create a context packer instance.

```typescript
const packer = createContextPacker('./src', ContextDepth.LOGIC);
```

### `packer.analyze(functionName)`

Analyze all references to a function.

```typescript
const result = packer.analyze('handleSubmit');
// {
//   functionName: 'handleSubmit',
//   count: 5,
//   references: [...]
// }
```

### `packer.analyzeFile(functionName, filePath)`

Analyze references in a specific file.

```typescript
const result = packer.analyzeFile('handleSubmit', './src/Form.tsx');
```

### `formatForLLM(result, rootDir)`

Format analysis result as LLM-optimized markdown.

```typescript
const markdown = formatForLLM(result, './src');
```

### `formatAsText(result, rootDir)`

Format analysis result as plain text.

```typescript
const text = formatAsText(result, './src');
```

## Use Cases

### 🐛 Bug Fixes
*"Fix this function but don't break the 8 places it's called"*

### ♻️ Refactoring
*"I want to change this API—show me everywhere I'll need to update"*

### 📚 Code Review
*"What does this function do? Let me see how it's actually used"*

### 🤖 AI-Assisted Development
*"I need to add a parameter—here's every call site to update"*

### 🔍 Legacy Code Understanding
*"Nobody knows what this does anymore—let's see the context"*

## Why Context Matters

LLMs are powerful but **blind**. They can only see what you show them.

**Without Context Packer:**
```
You: "Fix this login function"
AI: "Sure! Use async/await instead of .then()"
Result: ❌ Breaks 12 components expecting the old API
```

**With Context Packer:**
```
You: "Fix this login function. Here's where it's used: [context]"
AI: "I see it's called with .then() in 12 places. Let me maintain backward compatibility..."
Result: ✅ Working code, no surprises
```

## Roadmap

- [ ] Support for Python, Java, C#, Go
- [ ] Interactive mode with TUI
- [ ] Integration with VS Code extension
- [ ] Configurable output templates
- [ ] Diff mode for showing changes

## Contributing

Contributions welcome! This is an early-stage project and we'd love your help.

## License

MIT

---

**Made for developers who are tired of manual context gathering** 🚀
