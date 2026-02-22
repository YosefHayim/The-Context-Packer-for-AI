<p align="center">
  <h1 align="center">Context Packer for AI</h1>
  <p align="center">
    <strong>AST-based semantic code analysis that extracts function usage context for LLMs.</strong>
    <br />
    Stop letting AI break your code by missing call sites.
  </p>
</p>

<p align="center">
  <a href="https://github.com/YosefHayim/The-Context-Packer-for-AI/actions"><img src="https://github.com/YosefHayim/The-Context-Packer-for-AI/actions/workflows/pr-tests.yml/badge.svg" alt="CI" /></a>
  <a href="https://github.com/YosefHayim/The-Context-Packer-for-AI/releases"><img src="https://img.shields.io/github/v/release/YosefHayim/The-Context-Packer-for-AI" alt="Release" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License" /></a>
  <a href="https://github.com/YosefHayim/The-Context-Packer-for-AI/issues"><img src="https://img.shields.io/github/issues/YosefHayim/The-Context-Packer-for-AI" alt="Issues" /></a>
</p>

---

## The Problem

When you ask an AI to fix a function, it edits the code in isolation — then breaks your app because it can't see where that function is called. You end up on a manual scavenger hunt through your codebase, copying references one by one.

**Context Packer** automates this. It uses the TypeScript AST parser (not grep) to find every call site, extract the right amount of surrounding context, and format it for LLMs — so the AI sees the full picture before suggesting changes.

## Quick Start

```bash
# Install globally
npm install -g context-packer

# Find all references to a function
context-packer handleSubmit

# Analyze multiple functions at once
context-packer validateUser,hashPassword,processData

# Auto-copy to clipboard and open your AI assistant
context-packer myFunction --copy --open-ai chatgpt
```

## How It Works

Unlike text search, Context Packer **understands** your code:

1. **Parse** — Converts source files into an Abstract Syntax Tree
2. **Analyze** — Identifies actual function calls (not string matches in comments)
3. **Scope** — Finds the enclosing function/class for each call
4. **Extract** — Pulls the right context based on your chosen depth mode
5. **Format** — Outputs LLM-optimized markdown with file paths and syntax highlighting

```
No false positives from comments or strings
Accurate line numbers and scopes
Handles method calls like user.validate()
Works with imports, destructuring, and complex syntax
```

## Context Depth Modes

| Mode | Flag | What You Get | Best For |
|------|------|-------------|----------|
| **Snippet** | `--depth snippet` | Just the call site line | Quick syntax checks |
| **Logic** | `--depth logic` | Enclosing function/scope | Understanding usage (default) |
| **Module** | `--depth module` | Entire file | Complex state / imports |

## CLI Reference

```bash
context-packer <function-name> [options]
context-packer <func1,func2,...> [options]    # multi-function
```

| Option | Description | Default |
|--------|-------------|---------|
| `--dir <path>` | Root directory to search | `.` |
| `--depth <level>` | `snippet` / `logic` / `module` | `logic` |
| `--output <file>` | Write to file instead of stdout | — |
| `--format <type>` | `markdown` / `text` / `json` / `csv` / `txt` / `xml` | `markdown` |
| `--include <glob>` | File patterns to include (repeatable) | `**/*.{ts,tsx,js,jsx}` |
| `--exclude <glob>` | File patterns to exclude (repeatable) | `node_modules`, `dist` |
| `--copy` | Copy output to clipboard | `false` |
| `--open-ai <svc>` | Open AI assistant: `chatgpt` / `claude` / `gemini` | — |
| `--wizard`, `-w` | Interactive setup wizard | — |
| `--help`, `-h` | Show help | — |
| `--version`, `-v` | Show version number | — |
| `--no-cache` | Disable AST caching | `false` |
| `--watch` | Watch mode — re-analyze on file changes | `false` |
| `--interactive`, `-i` | Interactive TUI mode (REPL) | `false` |
| `--diff <snapshot>` | Compare current analysis against a saved snapshot | — |
| `--save-snapshot <file>` | Save current analysis as a snapshot for later diffing | — |

## Configuration

Create `.contextpackerrc.json` in your project root to set defaults:

```json
{
  "defaultDepth": "logic",
  "defaultFormat": "markdown",
  "exclude": ["**/node_modules/**", "**/dist/**", "**/*.test.ts"],
  "autoCopy": false,
  "preferredAI": "chatgpt",
  "customAIServices": {
    "perplexity": "https://www.perplexity.ai"
  }
}
```

CLI flags always override config file settings. See [`.contextpackerrc.example.json`](.contextpackerrc.example.json) for all options.

## Library API

Use Context Packer programmatically in your own tools:

```typescript
import { createContextPacker, ContextDepth, formatForLLM } from 'context-packer';

const packer = createContextPacker('./src', ContextDepth.LOGIC);
const result = packer.analyze('handleSubmit');
const markdown = formatForLLM(result, './src');

console.log(markdown);
// => Formatted markdown with all call sites, scopes, and context
```

### Key Exports

| Function | Purpose |
|----------|---------|
| `createContextPacker(dir, depth)` | Create analyzer instance |
| `packer.analyze(name)` | Find all references to a function |
| `packer.analyzeFile(name, file)` | Analyze a single file |
| `formatForLLM(result, dir)` | Format as LLM-optimized markdown |
| `formatAsText(result, dir)` | Format as plain text |
| `exportAs(format, result, dir)` | Export as JSON, CSV, XML, TXT |

## MCP Server

Context Packer includes a [Model Context Protocol](https://modelcontextprotocol.io/) server, enabling AI coding tools to query function context directly.

```bash
# Start the MCP server
npx context-packer-mcp
```

**Available tools:**

| Tool | Description |
|------|-------------|
| `analyze_function` | Find all references to a function in a codebase |
| `list_functions` | List all exported functions in a directory |

**MCP client configuration (e.g. for Claude Desktop):**

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

## Use Cases

**Bug Fixes** — "Fix this function but don't break the 8 places it's called"

**Refactoring** — "I want to change this API — show me everywhere I'll need to update"

**Code Review** — "What does this function do? Let me see how it's actually used"

**AI-Assisted Dev** — "I need to add a parameter — here's every call site to update"

**Legacy Code** — "Nobody knows what this does anymore — let's see the context"

## Why Context Matters

```
Without Context Packer:
  You: "Fix this login function"
  AI: "Sure! Use async/await instead of .then()"
  Result: Breaks 12 components expecting the old API

With Context Packer:
  You: "Fix this login function. Here's where it's used: [context]"
  AI: "I see it's called with .then() in 12 places. Let me maintain backward compatibility..."
  Result: Working code, no surprises
```

## Supported Languages

- TypeScript (`.ts`, `.tsx`)
- JavaScript (`.js`, `.jsx`)
- Python (`.py`) — regex-based parser (function definitions, class methods, decorators)

> Java, C#, and Go support is on the [roadmap](#roadmap).

## Architecture

```
src/
├── cli/index.ts                     # CLI entry point + argument parsing
├── lib/
│   ├── parser.ts                    # AST parsing via @typescript-eslint
│   ├── python-parser.ts             # Regex-based Python parser
│   ├── reference-finder.ts          # Semantic call site detection
│   ├── context-extractor.ts         # Depth-aware context extraction
│   ├── context-packer.ts            # Main orchestrator class
│   ├── formatter.ts                 # Markdown + text output formatters
│   ├── exporter.ts                  # JSON, CSV, XML, TXT export
│   ├── config-loader.ts             # .contextpackerrc.json loader
│   ├── multi-function-analyzer.ts   # Batch multi-function analysis
│   ├── cache.ts                     # AST cache with mtime invalidation + LRU
│   ├── diff.ts                      # Snapshot save/load/compare
│   ├── watcher.ts                   # Watch mode with debounce
│   └── tui.ts                       # Interactive TUI (REPL)
├── mcp/server.ts                    # MCP server (Model Context Protocol)
├── constants.ts                     # Shared constants
├── types/index.ts                   # TypeScript type definitions
├── utils/file-scanner.ts            # Glob-based file discovery
└── tests/                           # 218+ unit tests (Vitest)
```

## Development

```bash
# Install dependencies
npm install --ignore-scripts

# Build
npm run build

# Run tests
npm test

# Test with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Requirements

- Node.js `^18.18.0 || ^20.9.0 || >=21.1.0`
- npm or compatible package manager

## Roadmap

- [x] Python language support (regex-based parser)
- [x] Interactive TUI mode (`--interactive`)
- [x] VS Code extension scaffold (`vscode-extension/`)
- [ ] Configurable output templates
- [x] Diff mode with `--diff` and `--save-snapshot` flags
- [x] In-memory AST caching with mtime invalidation (`--no-cache` to disable)
- [x] Watch mode for continuous analysis (`--watch`)
- [x] MCP server integration (`context-packer-mcp`)
- [ ] Java, C#, Go language support
- [ ] Tree-sitter based Python parser (upgrade from regex)

## Contributing

Contributions welcome! This is an early-stage project and we'd love your help.

1. Fork the repository
2. Create your feature branch (`git checkout -b feat/amazing-feature`)
3. Run tests (`npm test`)
4. Commit your changes (`git commit -m 'feat: add amazing feature'`)
5. Push to the branch (`git push origin feat/amazing-feature`)
6. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## Documentation

| Document | Description |
|----------|-------------|
| [QUICKSTART.md](QUICKSTART.md) | Get started in 5 minutes |
| [USAGE.md](USAGE.md) | Comprehensive usage guide |
| [BEST_PRACTICES.md](BEST_PRACTICES.md) | Best practices and tips |
| [docs/EXPORT_FORMATS.md](docs/EXPORT_FORMATS.md) | Export format specifications |
| [docs/TESTING.md](docs/TESTING.md) | Testing guide |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guidelines |

## License

[MIT](LICENSE)

---

<p align="center">
  <strong>Made for developers who are tired of manual context gathering.</strong>
  <br />
  <a href="https://github.com/YosefHayim/The-Context-Packer-for-AI/issues">Report Bug</a> · <a href="https://github.com/YosefHayim/The-Context-Packer-for-AI/issues">Request Feature</a>
</p>
