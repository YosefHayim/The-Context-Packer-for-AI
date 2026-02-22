# Auto-Copy and Open AI Assistant Feature

## Overview

The Context Packer now includes automatic clipboard copy and AI assistant opening features, making it even easier to get context into your AI assistant workflow.

## Quick Start

### Basic Usage

```bash
# Analyze, copy to clipboard, and open ChatGPT
context-packer myFunction --copy --open-ai chatgpt
```

**What happens:**
1. ✅ Analysis completes
2. ✅ Output is copied to clipboard
3. ✅ ChatGPT opens in your browser
4. ✅ You paste (Ctrl+V) the context immediately!

### Supported AI Assistants

```bash
# ChatGPT
context-packer myFunction --copy --open-ai chatgpt

# Claude
context-packer myFunction --copy --open-ai claude

# Gemini
context-packer myFunction --copy --open-ai gemini
```

## Use Cases

### 1. Instant AI Assistance

**Before:**
```bash
# Old workflow (4 steps)
context-packer myFunction --output context.md  # 1. Generate
cat context.md                                   # 2. View
# Manually open browser                         # 3. Open browser
# Manually copy/paste                           # 4. Copy/paste
```

**After:**
```bash
# New workflow (1 step!)
context-packer myFunction --copy --open-ai chatgpt
# Just press Ctrl+V in the opened ChatGPT!
```

### 2. Quick Bug Fixing

```bash
# Find bug context, copy to clipboard, and open Claude
context-packer buggyFunction --dir ./src --depth logic --copy --open-ai claude

# Claude opens, you paste, and ask:
# "This function has a bug. Here's where it's used. How should I fix it?"
```

### 3. Refactoring Assistance

```bash
# Get full context and open Gemini
context-packer legacyFunction --depth module --copy --open-ai gemini

# Gemini opens, you paste, and ask:
# "How can I refactor this to use modern patterns?"
```

### 4. Just Copy to Clipboard

If you prefer to handle the browser yourself:

```bash
# Copy to clipboard only (no browser opening)
context-packer myFunction --copy

# Output is in your clipboard, open any AI assistant manually
```

## CLI Options

| Option | Description | Example |
|--------|-------------|---------|
| `--copy` | Copy output to clipboard | `--copy` |
| `--open-ai chatgpt` | Open ChatGPT | `--open-ai chatgpt` |
| `--open-ai claude` | Open Claude | `--open-ai claude` |
| `--open-ai gemini` | Open Gemini | `--open-ai gemini` |

## Examples

### Example 1: Complete Workflow

```bash
# Analyze validateUser, copy to clipboard, open ChatGPT
context-packer validateUser --dir ./src --copy --open-ai chatgpt
```

**Output:**
```
Analyzing function: validateUser
Search directory: /path/to/src
Context depth: logic

Found 3 reference(s)

✅ Output copied to clipboard!
🚀 Opening Chatgpt...
✅ Chatgpt opened in browser
💡 Tip: The context is already in your clipboard - just paste it!
```

### Example 2: Claude for Code Review

```bash
# Get logic context, copy, and open Claude
context-packer processPayment --depth logic --copy --open-ai claude
```

Then in Claude, paste and ask:
> "Please review this payment processing function. Are there any security issues or edge cases I should handle?"

### Example 3: Gemini for Explanation

```bash
# Get full module context
context-packer complexAlgorithm --depth module --copy --open-ai gemini
```

Then in Gemini, paste and ask:
> "Can you explain how this algorithm works and suggest optimizations?"

## Combining with Other Options

### With Custom Directory

```bash
context-packer myFunc --dir ./src/components --copy --open-ai chatgpt
```

### With Specific Depth

```bash
context-packer myFunc --depth snippet --copy --open-ai claude
```

### With File Patterns

```bash
context-packer myFunc --include "**/*.ts" --exclude "**/*.test.ts" --copy --open-ai gemini
```

### With Export to File (and clipboard)

```bash
# Save to file AND copy to clipboard
context-packer myFunc --output analysis.md --copy --open-ai chatgpt
```

## Tips & Tricks

### 1. Create Aliases

Add to your shell config (`~/.bashrc`, `~/.zshrc`):

```bash
# Quick shortcuts
alias cp-gpt='context-packer --copy --open-ai chatgpt'
alias cp-claude='context-packer --copy --open-ai claude'
alias cp-gemini='context-packer --copy --open-ai gemini'
```

Usage:
```bash
cp-gpt myFunction
cp-claude buggyFunction --dir ./src
```

### 2. Workflow Integration

```bash
# In your development workflow
npm run test  # Tests fail
cp-gpt failingTest --depth logic  # Get context
# Paste in ChatGPT: "Why is this test failing?"
```

### 3. Combine with Git

```bash
# Before committing changes
git diff myFile.ts
cp-claude changedFunction --depth logic
# Ask Claude: "Are there any issues with these changes?"
```

## Troubleshooting

### Clipboard Not Working

**Issue:** "Failed to copy to clipboard"

**Solutions:**
- On Linux: Install `xsel` or `xclip`
  ```bash
  sudo apt-get install xsel
  # or
  sudo apt-get install xclip
  ```
- On macOS: Should work out of the box
- On Windows: Should work out of the box

### Browser Not Opening

**Issue:** "Failed to open browser"

**Solution:**
- The URL will be printed - you can copy and open manually
- Check your default browser settings
- Try running without `--open-ai` and open manually

### Multiple Browsers

The tool opens the URL in your **default browser**. To use a specific browser:
1. Set it as your default browser, or
2. Use `--copy` only and open manually in your preferred browser

## See Also

- [README.md](../README.md) - Main documentation
- [USAGE.md](../USAGE.md) - Comprehensive usage guide
- [QUICKSTART.md](../QUICKSTART.md) - Quick start guide

---

**Enjoy the seamless AI integration!** 🚀
