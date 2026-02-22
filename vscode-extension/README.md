# Context Packer for VS Code

AST-based function reference analysis for AI-assisted development, integrated directly into your editor.

## Features

- **Analyze Function** — Right-click any function name or use the command palette to find all references with surrounding context
- **CodeLens** — See "Analyze references" links above every function definition
- **Copy to Clipboard** — One-click copy of formatted analysis results, ready to paste into your AI assistant
- **Webview Panel** — View results in a side panel with syntax-highlighted code and file navigation

## Usage

1. Open a TypeScript or JavaScript file
2. Place your cursor on a function name
3. Right-click and select **Context Packer: Analyze Function**, or use the CodeLens link above the function
4. Results appear in a side panel showing all references with their surrounding context
5. Click **Copy to Clipboard** to copy the formatted output for your AI assistant

### Commands

| Command | Description |
|---------|-------------|
| `Context Packer: Analyze Function` | Analyze references for the function under cursor |
| `Context Packer: Analyze Function & Copy to Clipboard` | Analyze and copy results to clipboard |

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `contextPacker.defaultDepth` | `logic` | Context depth: `snippet`, `logic`, or `module` |
| `contextPacker.exclude` | `["**/node_modules/**", "**/dist/**"]` | Glob patterns to exclude |

### Context Depth Modes

| Mode | What You Get |
|------|-------------|
| `snippet` | Just the call site line |
| `logic` | Enclosing function/scope (default) |
| `module` | Entire file |

## Development

```bash
npm install
npm run build
```

Press F5 in VS Code to launch the Extension Development Host for testing.

## License

MIT
