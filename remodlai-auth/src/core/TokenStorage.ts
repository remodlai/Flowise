/**
 * Token Storage for Remodl AI Auth
 * 
 * This class handles the storage of authentication tokens and session data.
 * It supports different storage mechanisms: localStorage, sessionStorage, and memory.
 * 
 * CURRENT IMPLEMENTATION:
 * - Support for different storage mechanisms
 * - Basic token storage and retrieval
 * 
 * FUTURE ENHANCEMENTS:
 * - Encryption of stored tokens
 * - More secure storage options
 * - Automatic token rotation
 * 
 * @see /docs/implementation_plan.md
 */

/**
 * Storage mechanism type
 */
export type StorageType = 'localStorage' | 'sessionStorage' | 'memory';

/**
 * Storage item interface
 */
export interface StorageItem {
  key: string;
  value: string;
  expiresAt?: number;
}

/**
 * Token Storage class
 */
export class TokenStorage {
  private storage: Storage | Map<string, string>;
  private storageType: StorageType;
  private prefix: string = 'remodl_auth_';

  /**
   * Constructor
   * 
   * @param storageType - The type of storage to use
   */
  constructor(storageType: StorageType = 'localStorage') {
    this.storageType = storageType;
    
    // Initialize the appropriate storage mechanism
    if (typeof window !== 'undefined') {
      if (storageType === 'localStorage') {
        this.storage = window.localStorage;
      } else if (storageType === 'sessionStorage') {
        this.storage = window.sessionStorage;
      } else {
        this.storage = new Map<string, string>();
      }
    } else {
      // In non-browser environments, always use memory storage
      this.storage = new Map<string, string>();
      this.storageType = 'memory';
    }
  }

  /**
   * Set an item in storage
   * 
   * @param key - The key to store the value under
   * @param value - The value to store
   * @param expiresAt - Optional expiry time in milliseconds since epoch
   */
  setItem(key: string, value: string, expiresAt?: number): void {
    const prefixedKey = this.prefix + key;
    
    if (this.storageType === 'memory') {
      (this.storage as Map<string, string>).set(prefixedKey, value);
    } else {
      try {
        const item: StorageItem = { key: prefixedKey, value, expiresAt };
        (this.storage as Storage).setItem(prefixedKey, JSON.stringify(item));
      } catch (error) {
        console.error('Error storing item in storage:', error);
      }
    }
  }

  /**
   * Get an item from storage
   * 
   * @param key - The key to retrieve the value for
   * @returns The stored value, or null if not found or expired
   */
  getItem(key: string): string | null {
    const prefixedKey = this.prefix + key;
    
    if (this.storageType === 'memory') {
      return (this.storage as Map<string, string>).get(prefixedKey) || null;
    } else {
      try {
        const itemStr = (this.storage as Storage).getItem(prefixedKey);
        
        if (!itemStr) {
          return null;
        }
        
        const item: StorageItem = JSON.parse(itemStr);
        
        // Check if the item has expired
        if (item.expiresAt && item.expiresAt < Date.now()) {
          this.removeItem(key);
          return null;
        }
        
        return item.value;
      } catch (error) {
        console.error('Error retrieving item from storage:', error);
        return null;
      }
    }
  }

  /**
   * Remove an item from storage
   * 
   * @param key - The key to remove
   */
  removeItem(key: string): void {
    const prefixedKey = this.prefix + key;
    
    if (this.storageType === 'memory') {
      (this.storage as Map<string, string>).delete(prefixedKey);
    } else {
      try {
        (this.storage as Storage).removeItem(prefixedKey);
      } catch (error) {
        console.error('Error removing item from storage:', error);
      }
    }
  }

  /**
   * Clear all items from storage that match the prefix
   */
  clear(): void {
    if (this.storageType === 'memory') {
      const memoryStorage = this.storage as Map<string, string>;
      
      // Delete only keys that match our prefix
      for (const key of memoryStorage.keys()) {
        if (key.startsWith(this.prefix)) {
          memoryStorage.delete(key);
        }
      }
    } else {
      try {
        const storage = this.storage as Storage;
        const keysToRemove: string[] = [];
        
        // Identify keys that match our prefix
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (key && key.startsWith(this.prefix)) {
            keysToRemove.push(key);
          }
        }
        
        // Remove the identified keys
        keysToRemove.forEach(key => storage.removeItem(key));
      } catch (error) {
        console.error('Error clearing items from storage:', error);
      }
    }
  }
} 