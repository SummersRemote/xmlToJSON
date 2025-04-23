import { jest } from '@jest/globals';
import ValueTransformer from '../../../../src/core/transformers/ValueTransformer.js';

describe('ValueTransformer', () => {
  let transformer;
  
  beforeEach(() => {
    transformer = new ValueTransformer();
    // Simple mock for console.warn
    console.warn = jest.fn();
  });
  
  afterEach(() => {
    // Restore console.warn
    jest.restoreAllMocks();
  });
  
  describe('process', () => {
    test('should return the original value by default', () => {
      const value = 'test value';
      const result = transformer.process(value);
      
      expect(result).toBe(value);
    });
    
    test('should warn when context is missing direction', () => {
      const value = 'test value';
      transformer.process(value, { nodeName: 'test' });
      
      expect(console.warn).toHaveBeenCalled();
    });
    
    test('should warn when context is missing nodeName', () => {
      const value = 'test value';
      transformer.process(value, { direction: 'xml-to-json' });
      
      expect(console.warn).toHaveBeenCalled();
    });
    
    test('should return the same value for different input types', () => {
      expect(transformer.process('string value')).toBe('string value');
      expect(transformer.process(123)).toBe(123);
      expect(transformer.process(true)).toBe(true);
      expect(transformer.process(null)).toBe(null);
    });
    
    test('should be extendable by child classes', () => {
      // Create a simple extension that adds a prefix to string values
      class TestTransformer extends ValueTransformer {
        process(value) {
          if (typeof value === 'string') {
            return 'PREFIX_' + value;
          }
          return value;
        }
      }
      
      const prefixTransformer = new TestTransformer();
      
      // Should add prefix to strings
      expect(prefixTransformer.process('test')).toBe('PREFIX_test');
      
      // Should not modify non-strings
      expect(prefixTransformer.process(123)).toBe(123);
    });
  });
});