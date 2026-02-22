# Export Formats Guide

Context Packer supports multiple export formats to suit different use cases. This guide explains when and how to use each format.

## Available Formats

| Format | Extension | Use Case | Best For |
|--------|-----------|----------|----------|
| **markdown** | `.md` | AI assistants | Pasting into ChatGPT, Claude |
| **text** | `.txt` | Human reading | Simple text output with formatting |
| **json** | `.json` | Programmatic use | Tools, APIs, automation |
| **csv** | `.csv` | Spreadsheets | Excel, Google Sheets analysis |
| **txt** | `.txt` | Plain text | Simple parsers, basic tools |
| **xml** | `.xml` | Structured data | Legacy systems, XML parsers |

---

## 1. Markdown Format (Default)

**Purpose:** Optimized for Large Language Models (LLMs)

### When to Use
- ✅ Pasting into ChatGPT, Claude, or other AI assistants
- ✅ Creating documentation with code examples
- ✅ GitHub issues or pull requests

### Features
- Syntax highlighting code blocks
- File paths and line numbers
- Enclosing scope information
- Usage notes for AI context

### Example
```bash
context-packer myFunction --format markdown --output context.md
```

### Output Sample
````markdown
# Context Analysis: `myFunction`

**Total References Found:** 2

## References

### Reference 1

**File:** `src/app.ts`
**Line:** 10
**Enclosing Scope:** `handleSubmit`
**Context Depth:** logic

```typescript
function handleSubmit() {
  const result = myFunction();
  return result;
}
```
````

---

## 2. Text Format

**Purpose:** Formatted plain text for human reading

### When to Use
- ✅ Reading in terminal
- ✅ Simple documentation
- ✅ Email or plain text communication

### Features
- Clean text formatting
- Separators and indentation
- No markdown syntax

### Example
```bash
context-packer myFunction --format text
```

### Output Sample
```
Context Analysis: myFunction
==================================================

Total References Found: 2

Reference 1:
  File: src/app.ts
  Line: 10
  Scope: handleSubmit
  Depth: logic

  function handleSubmit() {
    const result = myFunction();
    return result;
  }
```

---

## 3. JSON Format

**Purpose:** Structured data for programmatic consumption

### When to Use
- ✅ API integrations
- ✅ Custom tooling
- ✅ Data analysis scripts
- ✅ Automated workflows

### Features
- Parseable JSON structure
- Complete metadata
- Programmatic access to all fields

### Example
```bash
context-packer myFunction --format json --output data.json
```

### Output Sample
```json
{
  "functionName": "myFunction",
  "totalReferences": 2,
  "references": [
    {
      "file": "src/app.ts",
      "line": 10,
      "column": 5,
      "depth": "logic",
      "enclosingScope": "handleSubmit",
      "context": "function handleSubmit() {\n  const result = myFunction();\n  return result;\n}"
    }
  ]
}
```

### Programmatic Usage
```typescript
import { createContextPacker, exportAs } from 'context-packer';

const packer = createContextPacker('./src');
const result = packer.analyze('myFunction');
const json = exportAs('json', result, './src');

// Parse and use
const data = JSON.parse(json);
console.log(`Found ${data.totalReferences} references`);
```

---

## 4. CSV Format

**Purpose:** Tabular data for spreadsheet analysis

### When to Use
- ✅ Excel or Google Sheets analysis
- ✅ Bulk data review
- ✅ Sorting and filtering references
- ✅ Creating reports

### Features
- Standard CSV format
- Headers for columns
- Escaped commas and quotes
- Compatible with all spreadsheet tools

### Example
```bash
context-packer myFunction --format csv --output report.csv
```

### Output Sample
```csv
File,Line,Column,Depth,Scope,Context
"src/app.ts",10,5,"logic","handleSubmit","function handleSubmit() { const result = myFunction(); return result; }"
"src/utils.ts",25,12,"snippet","helper","const value = myFunction();"
```

### Excel/Sheets Usage
1. Export: `context-packer myFunc --format csv --output data.csv`
2. Open in Excel or Google Sheets
3. Sort by file, line, or scope
4. Filter by depth or scope
5. Create pivot tables for analysis

---

## 5. Plain TXT Format

**Purpose:** Simplest plain text format

### When to Use
- ✅ Simple text parsers
- ✅ Basic tools without markdown support
- ✅ Minimal formatting needed

### Features
- One reference per section
- Indented context
- No special formatting

### Example
```bash
context-packer myFunction --format txt
```

### Output Sample
```
Function: myFunction
Total References: 2

[1] src/app.ts:10
    Scope: handleSubmit
    Depth: logic

    function handleSubmit() {
      const result = myFunction();
      return result;
    }

[2] src/utils.ts:25
    Scope: helper
    Depth: snippet

    const value = myFunction();
```

---

## 6. XML Format

**Purpose:** Hierarchical structured format

### When to Use
- ✅ Legacy systems requiring XML
- ✅ XML-based tools and pipelines
- ✅ XSLT transformations
- ✅ XML parsers

### Features
- Valid XML structure
- CDATA sections for code
- Escaped special characters
- Hierarchical organization

### Example
```bash
context-packer myFunction --format xml --output data.xml
```

### Output Sample
```xml
<?xml version="1.0" encoding="UTF-8"?>
<analysis>
  <function>myFunction</function>
  <totalReferences>2</totalReferences>
  <references>
    <reference>
      <file>src/app.ts</file>
      <line>10</line>
      <column>5</column>
      <depth>logic</depth>
      <scope>handleSubmit</scope>
      <context><![CDATA[function handleSubmit() {
  const result = myFunction();
  return result;
}]]></context>
    </reference>
  </references>
</analysis>
```

---

## Format Comparison

### File Size
From smallest to largest:
1. CSV (most compact)
2. TXT
3. JSON
4. Text
5. XML
6. Markdown (most verbose)

### Readability
From most to least readable:
1. Markdown (best for humans and AI)
2. Text
3. TXT
4. CSV
5. JSON
6. XML

### Parsability
From easiest to hardest to parse:
1. JSON (standard parsers everywhere)
2. CSV (simple delimited format)
3. XML (standard but verbose)
4. TXT (custom parsing needed)
5. Text (custom parsing needed)
6. Markdown (requires markdown parser)

---

## Best Practices

### For AI Assistants
✅ **Use Markdown** (default)
```bash
context-packer myFunc --output context.md
```

### For Automation
✅ **Use JSON**
```bash
context-packer myFunc --format json --output data.json
```

### For Data Analysis
✅ **Use CSV**
```bash
context-packer myFunc --format csv --output report.csv
```

### For Simple Tools
✅ **Use TXT**
```bash
context-packer myFunc --format txt
```

### For Legacy Systems
✅ **Use XML**
```bash
context-packer myFunc --format xml --output data.xml
```

---

## Combining Formats

You can generate multiple formats in one workflow:

```bash
# Generate all formats
FUNC="myFunction"
DIR="./src"

context-packer $FUNC --dir $DIR --format markdown --output "${FUNC}.md"
context-packer $FUNC --dir $DIR --format json --output "${FUNC}.json"
context-packer $FUNC --dir $DIR --format csv --output "${FUNC}.csv"
context-packer $FUNC --dir $DIR --format xml --output "${FUNC}.xml"

echo "Generated 4 formats for $FUNC"
```

---

## File Extension Recommendations

| Format | Recommended Extension |
|--------|----------------------|
| markdown | `.md` |
| text | `.txt` |
| json | `.json` |
| csv | `.csv` |
| txt | `.txt` |
| xml | `.xml` |

The tool doesn't enforce extensions - use what makes sense for your workflow.

---

## See Also

- **USAGE.md** - General usage guide
- **QUICKSTART.md** - Getting started
- **README.md** - Project overview
- **BEST_PRACTICES.md** - Best practices

---

**Choose the format that best fits your needs!** 🚀
