# Contributing to Context Packer

Thank you for your interest in contributing! This project is in early stages and we welcome all contributions.

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/YosefHayim/The-Context-Packer-for-AI.git
   cd The-Context-Packer-for-AI
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Test locally:
   ```bash
   node dist/cli/index.js --help
   ```

## Project Structure

```
src/
├── types/          # TypeScript type definitions
├── lib/            # Core library code
│   ├── parser.ts           # AST parsing
│   ├── reference-finder.ts # Semantic analysis
│   ├── context-extractor.ts # Context extraction
│   ├── formatter.ts        # Output formatting
│   └── context-packer.ts   # Main orchestrator
├── utils/          # Utility functions
│   └── file-scanner.ts     # File discovery
├── cli/            # CLI interface
│   └── index.ts
└── index.ts        # Library entry point
```

## How to Contribute

### Reporting Bugs

Open an issue with:
- Description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Your environment (OS, Node version, etc.)

### Suggesting Features

We'd love to hear your ideas! Open an issue with:
- Use case description
- Proposed solution
- Any alternative approaches you've considered

### Submitting Code

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Build and test: `npm run build`
5. Commit with clear message: `git commit -m "feat: add your feature"`
6. Push and create a PR

## Coding Standards

- Use TypeScript strict mode
- Follow existing code style
- Add JSDoc comments for public APIs
- Keep functions focused and single-purpose
- Update types in `src/types/index.ts` when needed

## Testing

Currently, the project uses manual testing with examples. Contributions to add automated tests are very welcome!

To test your changes:

```bash
# Build
npm run build

# Test on examples
node dist/cli/index.js validateUser --dir ./examples/sample-project/src

# Test different depths
node dist/cli/index.js validateUser --dir ./examples/sample-project/src --depth snippet
node dist/cli/index.js validateUser --dir ./examples/sample-project/src --depth logic
node dist/cli/index.js validateUser --dir ./examples/sample-project/src --depth module
```

## Areas for Contribution

### High Priority

- [ ] Automated test suite (unit tests, integration tests)
- [ ] Support for Python, Java, C#, Go, etc.
- [ ] Performance optimization for large codebases
- [ ] Better error messages and edge case handling

### Medium Priority

- [ ] Interactive TUI mode
- [ ] VS Code extension
- [ ] Configuration file support (.contextpackerrc)
- [ ] Better handling of edge cases (destructured imports, etc.)

### Nice to Have

- [ ] Diff mode (show changes between versions)
- [ ] Integration with popular AI tools
- [ ] Custom output templates
- [ ] Cache for faster repeat analysis

## Adding Language Support

To add support for a new language:

1. Add parser in `src/lib/parser.ts`
2. Update reference finder in `src/lib/reference-finder.ts`
3. Update formatter language map in `src/lib/formatter.ts`
4. Add file extensions in `src/utils/file-scanner.ts`
5. Add tests with example files

## Documentation

When adding features:

- Update README.md if it's user-facing
- Update USAGE.md with examples
- Add JSDoc comments to functions
- Consider adding an example in `examples/`

## Questions?

Feel free to open an issue for any questions about contributing!

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
