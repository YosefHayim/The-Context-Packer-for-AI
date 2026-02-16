import { validateUser, hashPassword } from './utils';

export async function handleLogin(email: string, password: string) {
  // First validation
  if (!validateUser(email, password)) {
    throw new Error('Invalid credentials');
  }
  
  const hashedPassword = hashPassword(password);
  
  // Simulate API call
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password: hashedPassword }),
  });
  
  if (!response.ok) {
    throw new Error(`Login failed: ${response.statusText}`);
  }
  
  return response.json();
}

export async function handleSignup(userData: { email: string; password: string; name: string }) {
  // Validate before signup
  if (!validateUser(userData.email, userData.password)) {
    throw new Error('Invalid user data');
  }
  
  const hashedPassword = hashPassword(userData.password);
  
  const response = await fetch('/api/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...userData,
      password: hashedPassword,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Signup failed: ${response.statusText}`);
  }
  
  return response.json();
}
