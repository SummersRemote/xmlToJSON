// Mocking dayjs and its plugins
jest.mock('dayjs', () => {
    const mockDayjs = jest.fn().mockImplementation((date, format) => {
      return {
        isValid: jest.fn().mockReturnValue(true),
        format: jest.fn().mockImplementation((outputFormat) => {
          if (!date) return '';
          
          // Simple format simulation
          if (outputFormat) {
            if (outputFormat === 'YYYY-MM-DD') {
              return '2023-04-22';
            } else if (outputFormat === 'MM/DD/YYYY') {
              return '04/22/2023';
            } else if (outputFormat.includes('HH:mm')) {
              return '2023-04-22 14:30:00';
            }
          }
          
          // Default ISO format
          return '2023-04-22T14:30:00.000Z';
        }),
        toISOString: jest.fn().mockReturnValue('2023-04-22T14:30:00.000Z')
      };
    });
    
    // Mock the extend method
    mockDayjs.extend = jest.fn();
    
    return mockDayjs;
  });
  
  jest.mock('dayjs/plugin/customParseFormat', () => 'customParseFormat');
  jest.mock('dayjs/plugin/utc', () => 'utc');
  jest.mock('dayjs/plugin/timezone', () => 'timezone');
  
  import DateTransformer from '../../../../src/plugins/DateTransformer.js';
  import dayjs from 'dayjs';
  
  describe('DateTransformer', () => {
    let transformer;
    let consoleSpy;
    
    beforeEach(() => {
      transformer = new DateTransformer();
      consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    });
    
    afterEach(() => {
      consoleSpy.mockRestore();
      jest.clearAllMocks();
    });
    
    describe('constructor', () => {
      test('should create a transformer with default options', () => {
        expect(transformer.inputFormat).toBeNull();
        expect(transformer.outputFormat).toBeNull();
        expect(transformer.inputHasTimezone).toBe(false);
        expect(transformer.outputHasTimezone).toBe(false);
      });
      
      test('should create a transformer with provided formats', () => {
        const customTransformer = new DateTransformer({
          inputFormat: 'YYYY-MM-DD',
          outputFormat: 'MM/DD/YYYY'
        });
        
        expect(customTransformer.inputFormat).toBe('YYYY-MM-DD');
        expect(customTransformer.outputFormat).toBe('MM/DD/YYYY');
        expect(customTransformer.inputHasTimezone).toBe(false);
        expect(customTransformer.outputHasTimezone).toBe(false);
      });
      
      test('should detect timezone tokens in format strings', () => {
        const timezoneTransformer = new DateTransformer({
          inputFormat: 'YYYY-MM-DD HH:mm:ss Z',
          outputFormat: 'YYYY-MM-DD HH:mm:ss z'
        });
        
        expect(timezoneTransformer.inputHasTimezone).toBe(true);
        expect(timezoneTransformer.outputHasTimezone).toBe(true);
      });
      
      test('should register required dayjs plugins', () => {
        // Just verify that the plugins were extended
        expect(dayjs.extend).toHaveBeenCalledWith('customParseFormat');
        expect(dayjs.extend).toHaveBeenCalledWith('utc');
        expect(dayjs.extend).toHaveBeenCalledWith('timezone');
      });
    });
    
    describe('hasTimezoneToken', () => {
      test('should return false for null or undefined format', () => {
        expect(transformer.hasTimezoneToken(null)).toBe(false);
        expect(transformer.hasTimezoneToken(undefined)).toBe(false);
      });
      
      test('should return false for formats without timezone tokens', () => {
        expect(transformer.hasTimezoneToken('YYYY-MM-DD')).toBe(false);
        expect(transformer.hasTimezoneToken('HH:mm:ss')).toBe(false);
        expect(transformer.hasTimezoneToken('MM/DD/YYYY')).toBe(false);
      });
      
      test('should return true for formats with timezone tokens', () => {
        expect(transformer.hasTimezoneToken('YYYY-MM-DD Z')).toBe(true);
        expect(transformer.hasTimezoneToken('YYYY-MM-DD ZZ')).toBe(true);
        expect(transformer.hasTimezoneToken('YYYY-MM-DD z')).toBe(true);
        expect(transformer.hasTimezoneToken('YYYY-MM-DD zz')).toBe(true);
        expect(transformer.hasTimezoneToken('YYYY-MM-DD A')).toBe(true);
        expect(transformer.hasTimezoneToken('YYYY-MM-DD a')).toBe(true);
      });
    });
    
    describe('process', () => {
      test('should return non-string values unchanged', () => {
        expect(transformer.process(123)).toBe(123);
        expect(transformer.process(null)).toBe(null);
        expect(transformer.process(undefined)).toBe(undefined);
        expect(transformer.process({})).toEqual({});
        expect(transformer.process([])).toEqual([]);
      });
      
      test('should return empty string values unchanged', () => {
        expect(transformer.process('')).toBe('');
        expect(transformer.process('  ')).toBe('  ');
      });
      
      test('should convert to ISO format when no output format specified', () => {
        const result = transformer.process('2023-04-22');
        
        expect(dayjs).toHaveBeenCalledWith('2023-04-22');
        expect(result).toBe('2023-04-22T14:30:00.000Z');
      });
      
      test('should use inputFormat for parsing when specified', () => {
        const customTransformer = new DateTransformer({
          inputFormat: 'YYYY-MM-DD'
        });
        
        customTransformer.process('2023-04-22');
        
        expect(dayjs).toHaveBeenCalledWith('2023-04-22', 'YYYY-MM-DD');
      });
      
      test('should use outputFormat for formatting when specified', () => {
        const customTransformer = new DateTransformer({
          outputFormat: 'MM/DD/YYYY'
        });
        
        const result = customTransformer.process('2023-04-22');
        
        expect(result).toBe('04/22/2023');
      });
      
      test('should handle invalid date strings by returning original value', () => {
        // Mock isValid to return false for this test
        dayjs.mockImplementationOnce(() => ({
          isValid: jest.fn().mockReturnValue(false)
        }));
        
        const invalidDate = 'not-a-date';
        const result = transformer.process(invalidDate);
        
        expect(result).toBe(invalidDate);
      });
      
      test('should handle errors gracefully', () => {
        // Mock dayjs to throw an error
        dayjs.mockImplementationOnce(() => {
          throw new Error('Test error');
        });
        
        const value = '2023-04-22';
        const result = transformer.process(value);
        
        expect(consoleSpy).toHaveBeenCalled();
        expect(result).toBe(value);
      });
      
      test('should use format with timezone preservation logic', () => {
        const timezoneTransformer = new DateTransformer({
          inputFormat: 'YYYY-MM-DD HH:mm:ss Z',
          outputFormat: 'YYYY-MM-DD HH:mm:ss'
        });
        
        const result = timezoneTransformer.process('2023-04-22 14:30:00 +0000');
        
        // Without output timezone, should preserve input timezone
        expect(result).toBe('2023-04-22 14:30:00');
      });
    });
  });