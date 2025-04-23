import NumberTransformer from '../../../../src/core/transformers/NumberTransformer.js';

describe('NumberTransformer', () => {
  describe('constructor', () => {
    test('should create a transformer with default options', () => {
      const transformer = new NumberTransformer();
      
      expect(transformer.options).toEqual({});
      expect(transformer.integerPattern).toBeDefined();
      expect(transformer.floatPattern).toBeDefined();
      expect(transformer.thousandsSeparatorPattern).toBeDefined();
    });
    
    test('should create a transformer with provided options', () => {
      const options = { customOption: 'value' };
      const transformer = new NumberTransformer(options);
      
      expect(transformer.options).toEqual(options);
    });
  });
  
  describe('process', () => {
    let transformer;
    
    beforeEach(() => {
      transformer = new NumberTransformer();
    });
    
    test('should transform integer strings to number values when direction is xml-to-json', () => {
      expect(transformer.process('123', { direction: 'xml-to-json' })).toBe(123);
      expect(transformer.process('0', { direction: 'xml-to-json' })).toBe(0);
      expect(transformer.process('-456', { direction: 'xml-to-json' })).toBe(-456);
      expect(transformer.process('+789', { direction: 'xml-to-json' })).toBe(789);
    });
    
    test('should transform float strings to number values when direction is xml-to-json', () => {
      expect(transformer.process('123.45', { direction: 'xml-to-json' })).toBe(123.45);
      expect(transformer.process('0.1', { direction: 'xml-to-json' })).toBe(0.1);
      expect(transformer.process('-456.78', { direction: 'xml-to-json' })).toBe(-456.78);
      expect(transformer.process('.5', { direction: 'xml-to-json' })).toBe(0.5);
    });
    
    test('should handle thousands separators in strings', () => {
      expect(transformer.process('1,000', { direction: 'xml-to-json' })).toBe(1000);
      expect(transformer.process('1,234,567', { direction: 'xml-to-json' })).toBe(1234567);
      expect(transformer.process('1,234.56', { direction: 'xml-to-json' })).toBe(1234.56);
    });
    
    test('should return original value if not a recognized number string', () => {
      expect(transformer.process('hello', { direction: 'xml-to-json' })).toBe('hello');
      expect(transformer.process('123abc', { direction: 'xml-to-json' })).toBe('123abc');
      expect(transformer.process('', { direction: 'xml-to-json' })).toBe('');
      expect(transformer.process('NaN', { direction: 'xml-to-json' })).toBe('NaN');
      expect(transformer.process('Infinity', { direction: 'xml-to-json' })).toBe('Infinity');
    });
    
    test('should return non-string values unchanged when direction is xml-to-json', () => {
      expect(transformer.process(123, { direction: 'xml-to-json' })).toBe(123);
      expect(transformer.process(null, { direction: 'xml-to-json' })).toBe(null);
      expect(transformer.process(undefined, { direction: 'xml-to-json' })).toBe(undefined);
      expect(transformer.process({}, { direction: 'xml-to-json' })).toEqual({});
      expect(transformer.process([], { direction: 'xml-to-json' })).toEqual([]);
    });
    
    test('should convert number to string when direction is json-to-xml', () => {
      expect(transformer.process(123, { direction: 'json-to-xml' })).toBe('123');
      expect(transformer.process(0, { direction: 'json-to-xml' })).toBe('0');
      expect(transformer.process(-456, { direction: 'json-to-xml' })).toBe('-456');
      expect(transformer.process(123.45, { direction: 'json-to-xml' })).toBe('123.45');
    });
    
    test('should return non-number values unchanged when direction is json-to-xml', () => {
      expect(transformer.process('hello', { direction: 'json-to-xml' })).toBe('hello');
      expect(transformer.process(null, { direction: 'json-to-xml' })).toBe(null);
      expect(transformer.process(undefined, { direction: 'json-to-xml' })).toBe(undefined);
      expect(transformer.process({}, { direction: 'json-to-xml' })).toEqual({});
    });
    
    test('should default to original value when no direction is specified', () => {
      expect(transformer.process('123')).toBe('123');
      expect(transformer.process(123)).toBe(123);
    });
    
    test('should handle mixed number formats correctly', () => {
      // These should be transformed
      expect(transformer.process('42', { direction: 'xml-to-json' })).toBe(42);
      expect(transformer.process('3.14', { direction: 'xml-to-json' })).toBe(3.14);
      
      // These should not be transformed
      expect(transformer.process('1.2.3', { direction: 'xml-to-json' })).toBe('1.2.3');
      expect(transformer.process('1,2,3', { direction: 'xml-to-json' })).toBe('1,2,3');
      expect(transformer.process('1-2', { direction: 'xml-to-json' })).toBe('1-2');
    });
  });
});