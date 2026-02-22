# Quick Start Guide

Get up and running with Context Packer in 5 minutes.

## 1. Install

```bash
npm install -g context-packer
```

Or add to your project:

```bash
npm install context-packer
```

## 2. Your First Analysis

Navigate to your project and run:

```bash
context-packer yourFunctionName
```

That's it! You'll see all references to your function with their context.

## 3. Common Use Cases

### A. Save Output for AI

```bash
context-packer myFunction --output context.md
```

Then paste `context.md` into ChatGPT, Claude, or any AI assistant.

### B. Search Specific Directory

```bash
context-packer validateEmail --dir ./src
```

### C. Change Context Depth

```bash
# Quick view - just the line
context-packer myFunc --depth snippet

# Default - enclosing function
context-packer myFunc --depth logic

# Full view - entire file
context-packer myFunc --depth module
```

## 4. Real-World Example

**Problem:** You need to modify `processPayment` but it's used in 15 places.

**Solution:**

```bash
# 1. Analyze the function
context-packer processPayment --output payment-context.md

# 2. Open payment-context.md and review all usages

# 3. Paste into your AI assistant:
# "I need to add error handling to processPayment. 
#  Here's where it's used: [paste file contents]
#  How should I modify it without breaking these call sites?"
```

**Result:** The AI sees all 15 usages and suggests a backward-compatible solution.


## New in v0.2.0

Version 0.2.0 adds several powerful features:

```bash
# Interactive REPL mode
context-packer --interactive

# Watch mode — re-analyzes on file changes
context-packer handleSubmit --watch

# Save a snapshot and diff later
context-packer handleSubmit --save-snapshot before.json
# ... make changes ...
context-packer handleSubmit --diff before.json

# Analyze Python files
context-packer my_function --dir ./python_project --include "**/*.py"

# Start the MCP server (for AI coding tools)
npx context-packer-mcp
```

See [USAGE.md](USAGE.md#new-in-v020) for full details on each feature.

## 5. Next Steps

- Read the full [README.md](README.md) for all features
- Check [USAGE.md](USAGE.md) for detailed examples
- See [examples/AI_ASSISTANT_EXAMPLE.md](examples/AI_ASSISTANT_EXAMPLE.md) for a complete workflow

## Quick Reference

| Command | Description |
|---------|-------------|
| `context-packer func` | Analyze function in current directory |
| `context-packer func --dir ./src` | Search specific directory |
| `context-packer func --depth snippet` | Show only call lines |
| `context-packer func --depth logic` | Show enclosing functions (default) |
| `context-packer func --depth module` | Show entire files |
| `context-packer func --output file.md` | Save to file |
| `context-packer --interactive` | Interactive REPL mode |
| `context-packer func --watch` | Watch mode with live reload |
| `context-packer func --diff snap.json` | Compare against a snapshot |
| `context-packer --version` | Show version |
| `context-packer --help` | Show all options |

---

**Happy context packing!** 🚀

Need help? Check the [full documentation](README.md) or [usage guide](USAGE.md).
