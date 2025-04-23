import BooleanTransformer from '../../../../src/core/transformers/BooleanTransformer.js';

describe('BooleanTransformer', () => {
  describe('constructor', () => {
    test('should create a transformer with default options', () => {
      const transformer = new BooleanTransformer();
      
      expect(transformer.trueValues).toEqual(['true']);
      expect(transformer.falseValues).toEqual(['false']);
      expect(transformer.trueValuesLower).toEqual(['true']);
      expect(transformer.falseValuesLower).toEqual(['false']);
    });
    
    test('should create a transformer with provided options', () => {
      const transformer = new BooleanTransformer({
        trueValues: ['true', 'yes', '1'],
        falseValues: ['false', 'no', '0']
      });
      
      expect(transformer.trueValues).toEqual(['true', 'yes', '1']);
      expect(transformer.falseValues).toEqual(['false', 'no', '0']);
      expect(transformer.trueValuesLower).toEqual(['true', 'yes', '1']);
      expect(transformer.falseValuesLower).toEqual(['false', 'no', '0']);
    });
    
    test('should convert non-string values to strings for comparison', () => {
      const transformer = new BooleanTransformer({
        trueValues: ['true', 1, true],
        falseValues: ['false', 0, false]
      });
      
      // Should convert numbers and booleans to strings
      expect(transformer.trueValuesLower).toEqual(['true', '1', 'true']);
      expect(transformer.falseValuesLower).toEqual(['false', '0', 'false']);
    });
  });
  
  describe('process', () => {
    test('should transform string "true" to boolean true', () => {
      const transformer = new BooleanTransformer();
      const result = transformer.process('true', { direction: 'xml-to-json' });
      
      expect(result).toBe(true);
    });
    
    test('should transform string "false" to boolean false', () => {
      const transformer = new BooleanTransformer();
      const result = transformer.process('false', { direction: 'xml-to-json' });
      
      expect(result).toBe(false);
    });
    
    test('should be case-insensitive when comparing values', () => {
      const transformer = new BooleanTransformer();
      
      expect(transformer.process('TRUE', { direction: 'xml-to-json' })).toBe(true);
      expect(transformer.process('True', { direction: 'xml-to-json' })).toBe(true);
      expect(transformer.process('FALSE', { direction: 'xml-to-json' })).toBe(false);
      expect(transformer.process('False', { direction: 'xml-to-json' })).toBe(false);
    });
    
    test('should handle custom true/false values', () => {
      const transformer = new BooleanTransformer({
        trueValues: ['true', 'yes', '1', 'on'],
        falseValues: ['false', 'no', '0', 'off']
      });
      
      // Test true values
      expect(transformer.process('yes', { direction: 'xml-to-json' })).toBe(true);
      expect(transformer.process('1', { direction: 'xml-to-json' })).toBe(true);
      expect(transformer.process('on', { direction: 'xml-to-json' })).toBe(true);
      expect(transformer.process('YES', { direction: 'xml-to-json' })).toBe(true);
      
      // Test false values
      expect(transformer.process('no', { direction: 'xml-to-json' })).toBe(false);
      expect(transformer.process('0', { direction: 'xml-to-json' })).toBe(false);
      expect(transformer.process('off', { direction: 'xml-to-json' })).toBe(false);
      expect(transformer.process('NO', { direction: 'xml-to-json' })).toBe(false);
    });
    
    test('should return original value if not a recognized boolean string', () => {
      const transformer = new BooleanTransformer();
      
      expect(transformer.process('hello', { direction: 'xml-to-json' })).toBe('hello');
      expect(transformer.process('123', { direction: 'xml-to-json' })).toBe('123');
      expect(transformer.process('', { direction: 'xml-to-json' })).toBe('');
    });
    
    test('should return non-string values unchanged when direction is xml-to-json', () => {
      const transformer = new BooleanTransformer();
      
      expect(transformer.process(123, { direction: 'xml-to-json' })).toBe(123);
      expect(transformer.process(null, { direction: 'xml-to-json' })).toBe(null);
      expect(transformer.process(undefined, { direction: 'xml-to-json' })).toBe(undefined);
      expect(transformer.process({}, { direction: 'xml-to-json' })).toEqual({});
      expect(transformer.process([], { direction: 'xml-to-json' })).toEqual([]);
    });
    
    test('should convert boolean to string when direction is json-to-xml', () => {
      const transformer = new BooleanTransformer();
      
      expect(transformer.process(true, { direction: 'json-to-xml' })).toBe('true');
      expect(transformer.process(false, { direction: 'json-to-xml' })).toBe('false');
    });
    
    test('should return non-boolean values unchanged when direction is json-to-xml', () => {
      const transformer = new BooleanTransformer();
      
      expect(transformer.process('hello', { direction: 'json-to-xml' })).toBe('hello');
      expect(transformer.process(123, { direction: 'json-to-xml' })).toBe(123);
      expect(transformer.process(null, { direction: 'json-to-xml' })).toBe(null);
      expect(transformer.process(undefined, { direction: 'json-to-xml' })).toBe(undefined);
      expect(transformer.process({}, { direction: 'json-to-xml' })).toEqual({});
    });
    
    test('should default to original value when no direction is specified', () => {
      const transformer = new BooleanTransformer();
      
      expect(transformer.process('true')).toBe('true');
      expect(transformer.process(true)).toBe(true);
    });
  });
});