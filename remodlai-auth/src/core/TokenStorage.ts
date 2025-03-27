/**
 * Token Storage for Remodl AI Auth
 * 
 * This class handles the storage of authentication tokens and session data.
 * It uses localStorage for secure token storage.
 * 
 * CURRENT IMPLEMENTATION:
 * - Basic token storage and retrieval
 * - Secure localStorage implementation
 * 
 * FUTURE ENHANCEMENTS:
 * - Encryption of stored tokens
 * - More secure storage options
 * - Automatic token rotation
 * 
 * @see /docs/implementation_plan.md
 */

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
  private storage: Storage;
  private prefix: string = 'remodl_auth_';

  /**
   * Constructor
   */
  constructor() {
    // Initialize localStorage
    if (typeof window !== 'undefined') {
      this.storage = window.localStorage;
    } else {
      throw new Error('localStorage is not available in this environment');
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
    
    try {
      const item: StorageItem = { key: prefixedKey, value, expiresAt };
      this.storage.setItem(prefixedKey, JSON.stringify(item));
    } catch (error) {
      console.error('Error storing item in storage:', error);
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
    
    try {
      const itemStr = this.storage.getItem(prefixedKey);
      
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

  /**
   * Remove an item from storage
   * 
   * @param key - The key to remove
   */
  removeItem(key: string): void {
    const prefixedKey = this.prefix + key;
    
    try {
      this.storage.removeItem(prefixedKey);
    } catch (error) {
      console.error('Error removing item from storage:', error);
    }
  }

  /**
   * Clear all items from storage that match the prefix
   */
  clear(): void {
    try {
      const keysToRemove: string[] = [];
      
      // Identify keys that match our prefix
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }
      
      // Remove the identified keys
      keysToRemove.forEach(key => this.storage.removeItem(key));
    } catch (error) {
      console.error('Error clearing items from storage:', error);
    }
  }
} 