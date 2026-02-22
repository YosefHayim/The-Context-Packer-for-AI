// Test the library API
import { createContextPacker, ContextDepth, formatForLLM } from '../dist/index.js';

// Create a packer
const packer = createContextPacker('./examples/sample-project/src', ContextDepth.LOGIC);

// Analyze validateUser function
const result = packer.analyze('validateUser');

console.log(`\nAnalysis Results:`);
console.log(`=================`);
console.log(`Function: ${result.functionName}`);
console.log(`Total References: ${result.count}`);
console.log();

// Show each reference
result.references.forEach((ref, index) => {
  console.log(`Reference ${index + 1}:`);
  console.log(`  File: ${ref.location.filePath}`);
  console.log(`  Line: ${ref.location.line}`);
  console.log(`  Scope: ${ref.enclosingScope || 'N/A'}`);
  console.log();
});

// Get formatted output
const markdown = formatForLLM(result, './examples/sample-project/src');
console.log('\nFormatted for LLM:');
console.log('==================');
console.log(markdown.substring(0, 500) + '...\n');

console.log('✅ Library API test completed successfully!');
