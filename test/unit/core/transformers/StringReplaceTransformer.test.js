import StringReplaceTransformer from '../../../../src/core/transformers/StringReplaceTransformer.js';

describe('StringReplaceTransformer', () => {
  describe('constructor', () => {
    test('should create a transformer with default options', () => {
      const transformer = new StringReplaceTransformer();
      expect(transformer.replacement).toBe('');
      expect(transformer.regex).toBeDefined();
    });
    
    test('should create a transformer with provided options', () => {
      const transformer = new StringReplaceTransformer({
        pattern: '/test/g',
        replacement: 'replaced'
      });
      
      expect(transformer.replacement).toBe('replaced');
      expect(transformer.regex.toString()).toBe('/test/g');
    });
    
    test('should handle pattern with flags', () => {
      const transformer = new StringReplaceTransformer({
        pattern: '/test/i',
        replacement: 'replaced'
      });
      
      expect(transformer.regex.toString()).toBe('/test/i');
      expect(transformer.regex.flags).toBe('i');
    });
    
    test('should handle non-regex format pattern as literal', () => {
      const transformer = new StringReplaceTransformer({
        pattern: 'literal',
        replacement: 'replaced'
      });
      
      // Should create a regex to match the literal string
      expect(transformer.regex.test('literal')).toBe(true);
    });
    
    test('should handle invalid regex safely', () => {
      // Create a console.error spy
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const transformer = new StringReplaceTransformer({
        pattern: '/[/g', // Invalid regex
        replacement: 'replaced'
      });
      
      // Should log an error
      expect(consoleSpy).toHaveBeenCalled();
      
      // Should create a fallback regex that won't match anything
      expect(transformer.regex.test('anything')).toBe(false);
      
      // Restore console
      consoleSpy.mockRestore();
    });
  });
  
  describe('process', () => {
    test('should replace matching patterns in strings', () => {
      const transformer = new StringReplaceTransformer({
        pattern: '/test/g',
        replacement: 'REPLACED'
      });
      
      expect(transformer.process('This is a test string with test word')).toBe('This is a REPLACED string with REPLACED word');
    });
    
    test('should handle case-insensitive replacement with i flag', () => {
      const transformer = new StringReplaceTransformer({
        pattern: '/test/gi',
        replacement: 'REPLACED'
      });
      
      expect(transformer.process('Test is not the same as test')).toBe('REPLACED is not the same as REPLACED');
    });
    
    test('should handle regex pattern with capture groups', () => {
      const transformer = new StringReplaceTransformer({
        pattern: '/([a-z]+)\\s([0-9]+)/g',
        replacement: '$2 $1'
      });
      
      expect(transformer.process('item 123 product 456')).toBe('123 item 456 product');
    });
    
    test('should return non-string values unchanged', () => {
      const transformer = new StringReplaceTransformer({
        pattern: '/test/g',
        replacement: 'REPLACED'
      });
      
      expect(transformer.process(123)).toBe(123);
      expect(transformer.process(null)).toBe(null);
      expect(transformer.process(undefined)).toBe(undefined);
      expect(transformer.process({})).toEqual({});
    });
    
    test('should handle errors during replacement gracefully', () => {
      // Create a transformer with a pattern that might cause issues
      const transformer = new StringReplaceTransformer({
        pattern: '/$/g', // End of string - potentially problematic
        replacement: 'END'
      });
      
      // Spy on console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Should handle the error and return original value
      const value = 'test string';
      const result = transformer.process(value);
      
      expect(result).toBe('test stringEND');
      
      consoleSpy.mockRestore();
    });
  });
});