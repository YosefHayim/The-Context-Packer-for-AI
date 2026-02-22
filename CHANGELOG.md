# Changelog

All notable changes to Context Packer for AI are documented here.

This project follows [Semantic Versioning](https://semver.org/).

---

## [0.2.0] - 2026-02-22

### Added

- **Python language support** — Regex-based parser for `.py` files covering function definitions, class methods, and decorators ([#13](https://github.com/YosefHayim/The-Context-Packer-for-AI/issues/13))
- **Interactive TUI mode** — REPL interface via `--interactive` / `-i` for exploring your codebase without re-running commands ([#19](https://github.com/YosefHayim/The-Context-Packer-for-AI/issues/19))
- **Watch mode** — Continuous re-analysis on file changes via `--watch` with debounced `fs.watch` ([#15](https://github.com/YosefHayim/The-Context-Packer-for-AI/issues/15))
- **Diff mode** — Save snapshots with `--save-snapshot` and compare with `--diff` to see added, removed, and changed references ([#17](https://github.com/YosefHayim/The-Context-Packer-for-AI/issues/17))
- **AST caching** — In-memory cache with mtime-based invalidation and LRU eviction; disable with `--no-cache` ([#16](https://github.com/YosefHayim/The-Context-Packer-for-AI/issues/16))
- **MCP server** — Model Context Protocol server (`context-packer-mcp`) with `analyze_function` and `list_functions` tools for AI coding assistants ([#12](https://github.com/YosefHayim/The-Context-Packer-for-AI/issues/12))
- **VS Code extension scaffold** — Extension project under `vscode-extension/` ready for development ([#14](https://github.com/YosefHayim/The-Context-Packer-for-AI/issues/14))
- **`--version` / `-v` flag** — Print current version and exit ([#18](https://github.com/YosefHayim/The-Context-Packer-for-AI/issues/18))
- **Python wiring** — `.py` files now route through the Python parser in the main `ContextPacker.analyze()` flow ([#20](https://github.com/YosefHayim/The-Context-Packer-for-AI/issues/20))
- **Exporter and Python integration tests** — 36 new tests covering export formats and Python analysis ([#23](https://github.com/YosefHayim/The-Context-Packer-for-AI/issues/23))
- **Shared constants module** — `src/constants.ts` eliminates duplicated magic strings ([#11](https://github.com/YosefHayim/The-Context-Packer-for-AI/issues/11))

### Fixed

- **CLI argument bounds check** — Prevents crash when a flag is the last argument without a value ([#5](https://github.com/YosefHayim/The-Context-Packer-for-AI/issues/5))
- **Parser crash on unreadable files** — `getFileContent()` wrapped in try-catch ([#6](https://github.com/YosefHayim/The-Context-Packer-for-AI/issues/6))
- **Config validation** — `validateConfig()` with proper JSON error handling ([#7](https://github.com/YosefHayim/The-Context-Packer-for-AI/issues/7))
- **Type safety** — Removed `as any` casts, introduced `ParsedArgs` interface ([#8](https://github.com/YosefHayim/The-Context-Packer-for-AI/issues/8))
- **ES module imports** — Replaced `require('path')` with proper `import * as path` ([#9](https://github.com/YosefHayim/The-Context-Packer-for-AI/issues/9))
- **Output error handling** — Try-catch with `mkdirSync({recursive: true})` for output paths ([#10](https://github.com/YosefHayim/The-Context-Packer-for-AI/issues/10))
- **CLI help text** — Updated `printUsage()` with all new v0.2.0 flags ([#21](https://github.com/YosefHayim/The-Context-Packer-for-AI/issues/21))

### Changed

- License changed from MIT to Apache-2.0
- Test suite expanded from 97 to 218+ tests across 16 test files
- Updated documentation (README, USAGE, QUICKSTART) for all new features ([#22](https://github.com/YosefHayim/The-Context-Packer-for-AI/issues/22))

---

## [0.1.5] - 2026-02-22

### Changed

- Merged PR #3 (`copilot/fix-cubic-comments`) — full Context Packer implementation with cubic review fixes
- Release packaging update

---

## [0.1.4] - 2026-02-22

### Changed

- Merged dependabot dependency update (glob minor/patch bump)
- Updated `package-lock.json` for removed dependency and Node engine version

---

## [0.1.3] - 2026-02-22

### Fixed

- Node engine version constraint
- Removed unused dependency
- CLI argument validation
- Config defaults
- Exporter format issues (XML CDATA, context lines)
- Reference finder and multi-function metrics
- Documentation test counts and examples

### Added

- `rootDir` parameter for relative paths in multi-function analyzer
- Format validation for multi-function analysis

---

## [0.1.0] - 2026-02-22

### Added

- **Core AST analysis engine** — TypeScript AST parser via `@typescript-eslint/typescript-estree`
- **Semantic reference finder** — Detects actual function calls, not string matches
- **Context depth modes** — Snippet, Logic, and Module extraction levels
- **CLI tool** — `context-packer <function-name>` with full flag support
- **Export formats** — Markdown, text, JSON, CSV, XML, TXT
- **Multi-function analysis** — Analyze multiple functions in a single run
- **Configuration file** — `.contextpackerrc.json` for project defaults
- **Interactive wizard** — `--wizard` for guided setup
- **Clipboard support** — `--copy` to copy output directly
- **AI assistant integration** — `--open-ai chatgpt|claude|gemini` to open results in browser
- **Library API** — Programmatic access via `createContextPacker()`, `formatForLLM()`, etc.
- **97 unit tests** with Vitest
- **Full documentation** — README, USAGE, QUICKSTART, BEST_PRACTICES, CONTRIBUTING

---

[0.2.0]: https://github.com/YosefHayim/The-Context-Packer-for-AI/compare/v0.1.5...HEAD
[0.1.5]: https://github.com/YosefHayim/The-Context-Packer-for-AI/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/YosefHayim/The-Context-Packer-for-AI/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/YosefHayim/The-Context-Packer-for-AI/compare/v0.1.0...v0.1.3
[0.1.0]: https://github.com/YosefHayim/The-Context-Packer-for-AI/releases/tag/v0.1.0
