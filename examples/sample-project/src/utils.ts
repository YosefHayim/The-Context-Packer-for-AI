// User validation utility
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

export function hashPassword(password: string): string {
  // Simplified for example
  return `hashed_${password}`;
}
