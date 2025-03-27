# Remodl AI Auth

A TypeScript-based authentication library for Remodl AI applications. This package wraps Supabase Auth functionality and provides a consistent, easy-to-use interface for authentication, session management, and user operations.

## Features

- 🔐 **Secure Authentication**: Built on top of Supabase Auth with additional security features
- 🔄 **Automatic Token Refreshing**: Keep users logged in without manual intervention
- 📦 **Secure Storage**: Uses localStorage for secure token storage
- 📱 **Cross-Platform**: Works in browsers, React Native, and Node.js environments
- 🧩 **TypeScript Support**: Comprehensive type definitions for better developer experience
- 🛡️ **Role-Based Access Control**: Simple permission checking (coming soon)
- 📲 **Multi-Factor Authentication**: Enhanced security with MFA (coming soon)

## Installation

```bash
npm install remodl-ai-auth-client
```

## Quick Start

```typescript
import { RemodlAuth } from 'remodl-ai-auth-client';

// Initialize the auth client
const auth = new RemodlAuth({
  supabaseUrl: 'https://your-project.supabase.co',
  supabaseKey: 'your-supabase-anon-key',
});

// Sign up a new user
const signUp = async () => {
  const { user, session, error } = await auth.signUp('user@example.com', 'password123');
  
  if (error) {
    console.error('Error signing up:', error.message);
    return;
  }
  
  console.log('User signed up successfully:', user);
};

// Sign in an existing user
const signIn = async () => {
  const { user, session, error } = await auth.signIn('user@example.com', 'password123');
  
  if (error) {
    console.error('Error signing in:', error.message);
    return;
  }
  
  console.log('User signed in successfully:', user);
};

// Check if the user is authenticated
const isAuthenticated = auth.isAuthenticated();
```

## Documentation

For detailed documentation and examples, see the [docs](./docs) directory:

- [Implementation Plan](./docs/implementation_plan.md)
- [Examples](./docs/examples/basic-usage.md)
- [Changelog](./docs/CHANGELOG.md)

## API Reference

### Initialization

```typescript
const auth = new RemodlAuth({
  supabaseUrl: string,
  supabaseKey: string,
  autoRefreshToken?: boolean,
  persistSession?: boolean,
  debug?: boolean
});
```

### Authentication

- `signIn(email: string, password: string): Promise<AuthResponse>`
- `signUp(email: string, password: string, userData?: object): Promise<AuthResponse>`
- `signOut(): Promise<void>`

### Session Management

- `getSession(): Promise<SessionResponse>`
- `refreshSession(): Promise<SessionResponse>`

### User Management

- `getUser(): Promise<UserResponse>`
- `updateUser(attributes: UserAttributes): Promise<UserResponse>`

### Password Management

- `resetPassword(email: string): Promise<ResetPasswordResponse>`
- `updatePassword(password: string): Promise<UpdatePasswordResponse>`

### Utility Methods

- `isAuthenticated(): boolean`
- `hasPermission(permission: string): boolean`
- `getSupabaseClient(): SupabaseClient`

## Framework Integration

### React

```tsx
import { RemodlAuth } from 'remodl-ai-auth-client';
import { useEffect, useState } from 'react';

function App() {
  const [auth] = useState(() => new RemodlAuth({
    supabaseUrl: process.env.REACT_APP_SUPABASE_URL || '',
    supabaseKey: process.env.REACT_APP_SUPABASE_ANON_KEY || '',
  }));
  
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      const { session } = await auth.getSession();
      if (session) {
        setUser(session.user);
      }
    };
    
    checkSession();
    
    // Listen for auth state changes
    const { data: { subscription } } = auth.getSupabaseClient().auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          setUser(session.user);
        } else {
          setUser(null);
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [auth]);
  
  return (
    <div>
      {user ? (
        <div>
          <h1>Welcome, {user.email}</h1>
          <button onClick={() => auth.signOut()}>Sign Out</button>
        </div>
      ) : (
        <button onClick={() => auth.signIn('user@example.com', 'password')}>
          Sign In
        </button>
      )}
    </div>
  );
}
```

For a more complete React integration example, see the [React example](./docs/examples/basic-usage.md#react-integration-example).

## License

See [LICENSE.MD](LICENSE.MD) for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 