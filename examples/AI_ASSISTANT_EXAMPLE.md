# Example: Using Context Packer with AI Assistants

This example demonstrates a real-world scenario where Context Packer helps you work with AI assistants more effectively.

## The Scenario

You have a `validateUser` function that's used in multiple places. You want to modify it to handle null email addresses, but you don't want to break existing code.

## Step 1: Understand Current Usage

Run Context Packer to find all references:

```bash
context-packer validateUser --dir ./examples/sample-project/src --depth logic --output validateUser-context.md
```

This generates a comprehensive analysis file.

## Step 2: Review the Context

The output file shows you:

- **3 references** to `validateUser`
- Exact file paths and line numbers
- Complete context showing how each call works

### Reference 1: `auth.ts` - Login Handler
```typescript
export async function handleLogin(email: string, password: string) {
  if (!validateUser(email, password)) {
    throw new Error('Invalid credentials');
  }
  // ... rest of login logic
}
```

### Reference 2: `auth.ts` - Signup Handler
```typescript
export async function handleSignup(userData: { email: string; password: string; name: string }) {
  if (!validateUser(userData.email, userData.password)) {
    throw new Error('Invalid user data');
  }
  // ... rest of signup logic
}
```

### Reference 3: `LoginForm.tsx` - Client-side Validation
```typescript
const handleSubmit = async (event: any) => {
  event.preventDefault();
  const email = event.target.email.value;
  const password = event.target.password.value;
  
  if (!validateUser(email, password)) {
    alert('Please enter valid credentials');
    return;
  }
  // ... rest of form handling
}
```

## Step 3: Craft Your AI Prompt

Now you can paste this into ChatGPT, Claude, or any AI assistant:

```
I need to modify the validateUser function to handle null/undefined emails gracefully.

Current implementation:
```typescript
export function validateUser(email: string, password: string): boolean {
  if (!email || !password) {
    return false;
  }
  
  if (!email.includes('@')) {
    return false;
  }
  
  if (password.length < 8) {
    return false;
  }
  
  return true;
}
```

Here's where this function is currently used in my codebase:

[Paste the content from validateUser-context.md]

Requirements:
1. Handle null/undefined email gracefully
2. Maintain backward compatibility with all 3 call sites
3. Keep the same function signature
4. Add better error messages

Please suggest:
- Updated function implementation
- Any changes needed at call sites
- Test cases to verify it works
```

## Step 4: AI Response

The AI, now having full context, can provide:

✅ **A backward-compatible solution:**
```typescript
export function validateUser(
  email: string | null | undefined, 
  password: string | null | undefined
): boolean {
  // Handle null/undefined
  if (!email || !password) {
    return false;
  }
  
  // Email validation
  if (typeof email !== 'string' || !email.includes('@')) {
    return false;
  }
  
  // Password validation
  if (typeof password !== 'string' || password.length < 8) {
    return false;
  }
  
  return true;
}
```

✅ **Confirmation that all call sites will work:**
- All 3 locations check the boolean return value
- No changes needed at call sites
- Existing error handling remains intact

✅ **Suggested improvements:**
```typescript
// Even better: return error details
export type ValidationResult = 
  | { valid: true }
  | { valid: false; reason: string };

export function validateUser(
  email: string | null | undefined,
  password: string | null | undefined
): ValidationResult {
  if (!email) {
    return { valid: false, reason: 'Email is required' };
  }
  
  if (!password) {
    return { valid: false, reason: 'Password is required' };
  }
  
  if (!email.includes('@')) {
    return { valid: false, reason: 'Invalid email format' };
  }
  
  if (password.length < 8) {
    return { valid: false, reason: 'Password must be at least 8 characters' };
  }
  
  return { valid: true };
}
```

But notes this would require updating all 3 call sites.

## The Result

### Without Context Packer

❌ **What typically happens:**

```
You: "Fix validateUser to handle null emails"
AI: "Sure! Just add a null check"
You: *pastes code*
Result: Breaks in production because one call site passes undefined
Time wasted: 2 hours debugging
```

### With Context Packer

✅ **What happens:**

```
You: "Fix validateUser to handle null emails" + [context]
AI: "I see it's used in 3 places. Here's a backward-compatible fix..."
You: *pastes code*
Result: Works perfectly on first try
Time saved: 2 hours
```

## Key Takeaways

1. **Context = Better AI Responses**
   - AI can see how code is actually used
   - Suggests solutions that won't break existing code
   - Identifies edge cases you might miss

2. **One Command vs Manual Work**
   - Instead of: Open files → Find references → Copy → Paste → Repeat
   - Just run: `context-packer validateUser --output context.md`

3. **Works with Any AI**
   - ChatGPT
   - Claude
   - GitHub Copilot Chat
   - Any LLM

4. **Saves Time**
   - No manual context gathering
   - Fewer bugs from blind refactoring
   - Faster iterations

## Try It Yourself

1. Navigate to the examples directory:
   ```bash
   cd examples/sample-project/src
   ```

2. Run the analysis:
   ```bash
   context-packer validateUser --depth logic
   ```

3. Copy the output and paste into your favorite AI assistant

4. Ask it to suggest improvements while maintaining compatibility

---

**That's the power of Context Packer!** 🚀

Turn "blind coding" into "informed refactoring" with a single command.
