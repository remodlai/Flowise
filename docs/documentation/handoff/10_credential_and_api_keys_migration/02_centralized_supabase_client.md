# Centralized Supabase Client Architecture

## Overview

We've implemented a centralized Supabase client architecture to improve connection management, error handling, and overall reliability of our Supabase integration. This document explains the architecture, its benefits, and how to use it in the codebase.

## Key Components

### 1. App Class Supabase Client

The `App` class in `packages/server/src/index.ts` now includes a Supabase client property:

```typescript
export class App {
    // ... other properties ...
    Supabase: SupabaseClient | null = null

    // ... other methods ...

    async initSupabase() {
        try {
            logger.info('[server]: Initializing Supabase client')
            
            const supabaseUrl = process.env.SUPABASE_URL
            const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
            
            if (!supabaseUrl || !supabaseServiceKey) {
                logger.warn('[server]: Supabase URL or service key not provided, Supabase integration will not be available')
                return
            }
            
            this.Supabase = createClient(supabaseUrl, supabaseServiceKey, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false
                }
            })
            
            // Test the connection
            const { error } = await this.Supabase.from('secrets').select('id').limit(1)
            
            if (error) {
                logger.error(`[server]: Failed to connect to Supabase: ${error.message}`)
                this.Supabase = null
            } else {
                logger.info('[server]: Supabase client initialized successfully')
            }
        } catch (error) {
            logger.error(`[server]: Error initializing Supabase client: ${error}`)
            this.Supabase = null
        }
    }
    
    // Getter method for backward compatibility
    getSupabaseClient(): SupabaseClient {
        if (!this.Supabase) {
            throw new Error('Supabase client not initialized')
        }
        return this.Supabase
    }
}
```

The `initSupabase()` method is called during the application startup process in the `config()` method, ensuring that the Supabase client is initialized before other services that might depend on it.

The Supabase client is exposed as `app.Supabase`, following the same pattern as other elements like `app.AppDataSource`.

### 2. Supabase Utility Module

The `supabase.ts` utility module in `packages/server/src/utils/supabase.ts` has been updated to use the centralized client from the App class:

```typescript
import { createClient } from '@supabase/supabase-js'
import { getInstance } from '../index'
import logger from './logger'

// For backward compatibility, we still export a supabase client
// But we try to get it from the App instance first
let _supabase: any;

// This function gets the Supabase client from the App instance if available,
// or falls back to the direct client if not
const getSupabaseClient = () => {
  try {
    const app = getInstance();
    if (app && app.Supabase) {
      return app.Supabase;
    }
  } catch (error) {
    logger.warn('[supabase]: Could not get Supabase client from App instance, falling back to direct client');
  }
  
  // Fallback to direct client if App instance is not available
  if (!_supabase) {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
    _supabase = createClient(supabaseUrl, supabaseServiceKey);
  }
  return _supabase;
};

// Export a proxy that will always use the latest client
export const supabase = new Proxy({} as any, {
  get: (target, prop) => {
    const client = getSupabaseClient();
    return client[prop];
  }
});
```

This implementation uses a proxy pattern to ensure that the latest client is always used, with a fallback to direct initialization if the App instance is not available.

### 3. Service Modules

Service modules that interact with Supabase have been updated to use the centralized client. For example, the `secrets` service in `packages/server/src/services/secrets/index.ts`:

```typescript
import { getInstance } from '../../index'

/**
 * Get the Supabase client from the App instance
 * This ensures we're using a single, properly initialized client
 */
const getSupabaseClient = () => {
    const app = getInstance()
    if (!app) {
        throw new Error('App instance not available')
    }
    if (!app.Supabase) {
        throw new Error('Supabase client not initialized')
    }
    return app.Supabase
}

export const getSecret = async (id: string, applicationId?: string): Promise<any> => {
    try {
        // ... existing code ...
        
        // Get from Supabase using service key
        const supabase = getSupabaseClient()
        let query = supabase
            .from('secrets')
            .select('value, metadata')
            .eq('id', id);
        
        // ... rest of the function ...
    } catch (error) {
        // ... error handling ...
    }
}
```

## Benefits

1. **Centralized Management**: All Supabase operations use the same client instance, improving connection pooling and error handling.

2. **Lifecycle Management**: The Supabase client is properly initialized during application startup and cleaned up during shutdown.

3. **Error Handling**: Centralized error handling for Supabase operations makes it easier to diagnose and fix issues.

4. **Testing**: Dependency injection through the App class makes it easier to mock Supabase for testing.

5. **Connection Pooling**: Using a single client instance improves connection pooling and reduces the number of connections to Supabase.

6. **Consistency**: The Supabase client is exposed as `app.Supabase`, following the same pattern as other elements like `app.AppDataSource`.

## Usage Guidelines

1. **Accessing the Supabase Client**:
   - In service modules, access the Supabase client directly from the App instance:
     ```typescript
     const app = getInstance()
     const supabase = app.Supabase
     ```
   - In utility modules, use the exported `supabase` proxy from `supabase.ts`.

2. **Error Handling**:
   - Always handle errors from Supabase operations and log them appropriately.
   - Use the `logger` module to log errors with sufficient context.

3. **Testing**:
   - When testing, mock the App instance and its `Supabase` property to return a mock Supabase client.

4. **Environment Variables**:
   - Ensure that the `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` environment variables are set correctly.

## Future Improvements

1. **Connection Pooling**: Implement more sophisticated connection pooling for Supabase operations.

2. **Retry Mechanism**: Add a retry mechanism for failed Supabase operations.

3. **Circuit Breaker**: Implement a circuit breaker pattern to prevent cascading failures.

4. **Monitoring**: Add monitoring for Supabase operations to track performance and errors.

5. **Caching**: Implement caching for frequently accessed Supabase data to reduce the number of requests.

## Conclusion

The centralized Supabase client architecture improves the reliability and maintainability of our Supabase integration. By using a single client instance and proper lifecycle management, we reduce the risk of connection issues and improve error handling. The proxy pattern ensures that the latest client is always used, even in edge cases where the App instance might not be available. 