import { validateUser } from './utils';
import { handleLogin } from './auth';

export function LoginForm() {
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
  
  return (
    <form onSubmit={handleSubmit}>
      <input type="email" name="email" placeholder="Email" required />
      <input type="password" name="password" placeholder="Password" required />
      <button type="submit">Login</button>
    </form>
  );
}
