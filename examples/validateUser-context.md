# Context Analysis: `validateUser`

**Total References Found:** 3

## Summary

This analysis shows all 3 location(s) where `validateUser` is called across your codebase.
Each reference includes the file path, line number, and relevant code context.

---

## References

### Reference 1

**File:** `auth.ts`
**Line:** 5
**Enclosing Scope:** `handleLogin`
**Context Depth:** logic

```typescript
export async function handleLogin(email: string, password: string) {
  // First validation
  if (!validateUser(email, password)) {
    throw new Error('Invalid credentials');
  }
  
  const hashedPassword = hashPassword(password);
  
  // Simulate API call
  const response = await fetch('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: hashedPassword }),
  });
  
  return response.json();
}
```

---

### Reference 2

**File:** `auth.ts`
**Line:** 22
**Enclosing Scope:** `handleSignup`
**Context Depth:** logic

```typescript
export async function handleSignup(userData: { email: string; password: string; name: string }) {
  // Validate before signup
  if (!validateUser(userData.email, userData.password)) {
    throw new Error('Invalid user data');
  }
  
  const hashedPassword = hashPassword(userData.password);
  
  const response = await fetch('/api/signup', {
    method: 'POST',
    body: JSON.stringify({
      ...userData,
      password: hashedPassword,
    }),
  });
  
  return response.json();
}
```

---

### Reference 3

**File:** `LoginForm.tsx`
**Line:** 12
**Enclosing Scope:** `anonymous`
**Context Depth:** logic

```tsx
  const handleSubmit = async (event: any) => {
    event.preventDefault();
    
    const email = event.target.email.value;
    const password = event.target.password.value;
    
    // Client-side validation
    if (!validateUser(email, password)) {
      alert('Please enter valid credentials');
      return;
    }
    
    try {
      const result = await handleLogin(email, password);
      console.log('Login successful:', result);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
```

---

## Usage Notes

When modifying `validateUser`, ensure that changes are compatible with all 3 call site(s) shown above.
Consider the context and usage patterns to avoid breaking existing functionality.
