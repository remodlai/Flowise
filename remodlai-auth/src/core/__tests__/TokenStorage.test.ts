import { TokenStorage } from '../TokenStorage';

describe('TokenStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('localStorage', () => {
    it('should store and retrieve items', () => {
      const storage = new TokenStorage();
      storage.setItem('test', 'value');
      expect(storage.getItem('test')).toBe('value');
    });

    it('should remove items', () => {
      const storage = new TokenStorage();
      storage.setItem('test', 'value');
      storage.removeItem('test');
      expect(storage.getItem('test')).toBeNull();
    });

    it('should clear all items with prefix', () => {
      const storage = new TokenStorage();
      storage.setItem('test1', 'value1');
      storage.setItem('test2', 'value2');
      localStorage.setItem('other', 'value3'); // Not managed by TokenStorage
      
      storage.clear();
      
      expect(storage.getItem('test1')).toBeNull();
      expect(storage.getItem('test2')).toBeNull();
      expect(localStorage.getItem('other')).toBe('value3');
    });

    it('should handle expiry times', () => {
      const storage = new TokenStorage();
      const pastTime = Date.now() - 1000; // 1 second in the past
      
      storage.setItem('expired', 'value', pastTime);
      expect(storage.getItem('expired')).toBeNull();
      
      const futureTime = Date.now() + 10000; // 10 seconds in the future
      storage.setItem('valid', 'value', futureTime);
      expect(storage.getItem('valid')).toBe('value');
    });
  });

  describe('error handling', () => {
    it('should handle storage errors gracefully', () => {
      const storage = new TokenStorage();
      
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

    it('should handle non-browser environments', () => {
      // Save the original window
      const originalWindow = global.window;
      
      // Mock window as undefined
      // @ts-ignore
      delete global.window;
      
      // Expect constructor to throw error
      expect(() => new TokenStorage()).toThrow('localStorage is not available');
      
      // Restore window
      global.window = originalWindow;
    });
  });
}); 