import { TokenStorage } from '../TokenStorage';

describe('TokenStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('localStorage', () => {
    it('should store and retrieve items', () => {
      const storage = new TokenStorage('localStorage');
      storage.setItem('test', 'value');
      expect(storage.getItem('test')).toBe('value');
    });

    it('should remove items', () => {
      const storage = new TokenStorage('localStorage');
      storage.setItem('test', 'value');
      storage.removeItem('test');
      expect(storage.getItem('test')).toBeNull();
    });

    it('should clear all items with prefix', () => {
      const storage = new TokenStorage('localStorage');
      storage.setItem('test1', 'value1');
      storage.setItem('test2', 'value2');
      localStorage.setItem('other', 'value3'); // Not managed by TokenStorage
      
      storage.clear();
      
      expect(storage.getItem('test1')).toBeNull();
      expect(storage.getItem('test2')).toBeNull();
      expect(localStorage.getItem('other')).toBe('value3');
    });

    it('should handle expiry times', () => {
      const storage = new TokenStorage('localStorage');
      const pastTime = Date.now() - 1000; // 1 second in the past
      
      storage.setItem('expired', 'value', pastTime);
      expect(storage.getItem('expired')).toBeNull();
      
      const futureTime = Date.now() + 10000; // 10 seconds in the future
      storage.setItem('valid', 'value', futureTime);
      expect(storage.getItem('valid')).toBe('value');
    });
  });

  describe('sessionStorage', () => {
    it('should store and retrieve items', () => {
      const storage = new TokenStorage('sessionStorage');
      storage.setItem('test', 'value');
      expect(storage.getItem('test')).toBe('value');
    });
  });

  describe('memory storage', () => {
    it('should store and retrieve items', () => {
      const storage = new TokenStorage('memory');
      storage.setItem('test', 'value');
      expect(storage.getItem('test')).toBe('value');
    });

    it('should remove items', () => {
      const storage = new TokenStorage('memory');
      storage.setItem('test', 'value');
      storage.removeItem('test');
      expect(storage.getItem('test')).toBeNull();
    });

    it('should clear all items with prefix', () => {
      const storage = new TokenStorage('memory');
      storage.setItem('test1', 'value1');
      storage.setItem('test2', 'value2');
      
      storage.clear();
      
      expect(storage.getItem('test1')).toBeNull();
      expect(storage.getItem('test2')).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle storage errors gracefully', () => {
      const storage = new TokenStorage('localStorage');
      
      // Mock localStorage to throw an error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn().mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      // This should not throw
      storage.setItem('test', 'value');
      
      // Restore original
      localStorage.setItem = originalSetItem;
    });
  });
}); 