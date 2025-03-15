# Basic Usage Examples

This document provides examples of how to use the Remodl AI Auth package in your applications.

## Installation

```bash
npm install remodl-ai-auth-client
```

## Initialization

```typescript
import { RemodlAuth } from 'remodl-ai-auth-client';

// Initialize the auth client
const auth = new RemodlAuth({
  supabaseUrl: 'https://your-project.supabase.co',
  supabaseKey: 'your-supabase-anon-key',
  storage: 'localStorage', // 'localStorage', 'sessionStorage', or 'memory'
  autoRefreshToken: true,
  persistSession: true,
  debug: false
});
```

## Authentication

### Sign Up

```typescript
// Sign up a new user
const signUp = async () => {
  const { user, session, error } = await auth.signUp('user@example.com', 'password123', {
    firstName: 'John',
    lastName: 'Doe'
  });
  
  if (error) {
    console.error('Error signing up:', error.message);
    return;
  }
  
  console.log('User signed up successfully:', user);
  console.log('Session:', session);
};
```

### Sign In

```typescript
// Sign in an existing user
const signIn = async () => {
  const { user, session, error } = await auth.signIn('user@example.com', 'password123');
  
  if (error) {
    console.error('Error signing in:', error.message);
    return;
  }
  
  console.log('User signed in successfully:', user);
  console.log('Session:', session);
};
```

### Sign Out

```typescript
// Sign out the current user
const signOut = async () => {
  await auth.signOut();
  console.log('User signed out successfully');
};
```

## Session Management

### Get Current Session

```typescript
// Get the current session
const getSession = async () => {
  const { session, error } = await auth.getSession();
  
  if (error) {
    console.error('Error getting session:', error.message);
    return;
  }
  
  if (session) {
    console.log('Current session:', session);
  } else {
    console.log('No active session');
  }
};
```

### Refresh Session

```typescript
// Refresh the current session
const refreshSession = async () => {
  const { session, error } = await auth.refreshSession();
  
  if (error) {
    console.error('Error refreshing session:', error.message);
    return;
  }
  
  console.log('Session refreshed:', session);
};
```

## User Management

### Get Current User

```typescript
// Get the current user
const getUser = async () => {
  const { user, error } = await auth.getUser();
  
  if (error) {
    console.error('Error getting user:', error.message);
    return;
  }
  
  if (user) {
    console.log('Current user:', user);
  } else {
    console.log('No authenticated user');
  }
};
```

### Update User

```typescript
// Update the current user
const updateUser = async () => {
  const { user, error } = await auth.updateUser({
    email: 'newemail@example.com',
    userMetadata: {
      firstName: 'Jane',
      lastName: 'Doe'
    }
  });
  
  if (error) {
    console.error('Error updating user:', error.message);
    return;
  }
  
  console.log('User updated successfully:', user);
};
```

## Password Management

### Reset Password

```typescript
// Reset password for a user
const resetPassword = async () => {
  const { success, error } = await auth.resetPassword('user@example.com');
  
  if (error) {
    console.error('Error resetting password:', error.message);
    return;
  }
  
  console.log('Password reset email sent successfully');
};
```

### Update Password

```typescript
// Update password for the current user
const updatePassword = async () => {
  const { success, error } = await auth.updatePassword('newpassword123');
  
  if (error) {
    console.error('Error updating password:', error.message);
    return;
  }
  
  console.log('Password updated successfully');
};
```

## Utility Methods

### Check Authentication Status

```typescript
// Check if the user is authenticated
const isAuthenticated = () => {
  const authenticated = auth.isAuthenticated();
  console.log('Is authenticated:', authenticated);
  return authenticated;
};
```

### Check Permissions (Future Feature)

```typescript
// Check if the user has a specific permission
const hasPermission = (permission: string) => {
  const hasPermission = auth.hasPermission(permission);
  console.log(`Has permission '${permission}':`, hasPermission);
  return hasPermission;
};
```

## React Integration Example

```tsx
import React, { useEffect, useState } from 'react';
import { RemodlAuth } from 'remodl-ai-auth-client';
import { User } from 'remodl-ai-auth-client/types';

// Create a context for authentication
const AuthContext = React.createContext<{
  auth: RemodlAuth;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}>({
  auth: {} as RemodlAuth,
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

// Create an auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Initialize auth
  const auth = new RemodlAuth({
    supabaseUrl: process.env.REACT_APP_SUPABASE_URL || '',
    supabaseKey: process.env.REACT_APP_SUPABASE_ANON_KEY || '',
  });
  
  useEffect(() => {
    // Check for existing session on mount
    const checkSession = async () => {
      const { session } = await auth.getSession();
      if (session) {
        setUser(session.user);
      }
      setLoading(false);
    };
    
    checkSession();
    
    // Listen for auth state changes
    const { data: { subscription } } = auth.getSupabaseClient().auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setUser(auth.mapUser(session.user));
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );
    
    // Clean up subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Sign in function
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { user, error } = await auth.signIn(email, password);
    if (error) {
      console.error('Error signing in:', error);
      setLoading(false);
      throw error;
    }
    setUser(user);
    setLoading(false);
  };
  
  // Sign out function
  const signOut = async () => {
    setLoading(true);
    await auth.signOut();
    setUser(null);
    setLoading(false);
  };
  
  return (
    <AuthContext.Provider value={{ auth, user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth
export const useAuth = () => {
  return React.useContext(AuthContext);
};

// Example usage in a component
const LoginPage: React.FC = () => {
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn(email, password);
      // Redirect or show success message
    } catch (error) {
      // Handle error
      console.error('Login failed:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Loading...' : 'Sign In'}
      </button>
    </form>
  );
};
``` 