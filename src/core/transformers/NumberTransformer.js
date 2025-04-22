import ValueTransformer from './ValueTransformer.js';

/**
 * Transforms string values to number types
 */
class NumberTransformer extends ValueTransformer {
  /**
   * Creates a NumberTransformer
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    super();
    this.options = options;
    
    // Precompile regular expressions for better performance
    this.integerPattern = /^[-+]?[\d]+$/;
    this.floatPattern = /^[-+]?[\d]*\.[\d]+$/;
    this.thousandsSeparatorPattern = /,(?=\d{3})/g;
  }
  
  /**
   * Process a value, transforming it if applicable
   * @param {any} value - Value to potentially transform
   * @param {Object} context - Context including direction and other information
   * @returns {any} - Transformed value or original if not applicable
   */
  process(value, context = {}) {
    const direction = context.direction || 'xml-to-json';
    
    if (direction === 'xml-to-json') {
      // Only process strings in XML-to-JSON direction
      if (typeof value !== 'string' || value === '') return value;
      
      // Clean value (remove thousands separators)
      const cleanValue = value.replace(this.thousandsSeparatorPattern, '');
      
      try {
        // Check if it's an integer or floating point number
        if (this.integerPattern.test(cleanValue)) {
          return parseInt(cleanValue, 10);
        } else if (this.floatPattern.test(cleanValue)) {
          return parseFloat(cleanValue);
        }
      } catch (e) {
        // If parsing fails, return the original value
        return value;
      }
    } 
    else if (direction === 'json-to-xml') {
      // Only process numbers in JSON-to-XML direction
      if (typeof value !== 'number') return value;
      
      // Convert to string
      return String(value);
    }
    
    // If no transformation applies, return original value
    return value;
  }
}

export default NumberTransformer;