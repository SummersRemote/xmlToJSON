import ValueTransformer from './ValueTransformer.js';

/**
 * Transforms string values to boolean types
 */
class BooleanTransformer extends ValueTransformer {
  /**
   * Creates a new BooleanTransformer
   * @param {Object} options - Transformer options
   * @param {string[]} options.trueValues - Values to consider as true
   * @param {string[]} options.falseValues - Values to consider as false
   */
  constructor(options = {}) {
    super();
    
    // Set default values if not provided
    this.trueValues = options.trueValues || ['true'];
    this.falseValues = options.falseValues || ['false'];
    
    // Precompute lowercase versions for case-insensitive comparison
    this.trueValuesLower = this.trueValues.map(v => String(v).toLowerCase());
    this.falseValuesLower = this.falseValues.map(v => String(v).toLowerCase());
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
      if (typeof value !== 'string') return value;
      
      // Convert to lowercase for case-insensitive comparison
      const valueLower = value.toLowerCase();
      
      // Check against true values
      if (this.trueValuesLower.includes(valueLower)) {
        return true;
      }
      
      // Check against false values
      if (this.falseValuesLower.includes(valueLower)) {
        return false;
      }
    } 
    else if (direction === 'json-to-xml') {
      // Only process booleans in JSON-to-XML direction
      if (typeof value !== 'boolean') return value;
      
      // Convert to string representation
      return String(value);
    }
    
    // If no transformation applies, return original value
    return value;
  }
}

export default BooleanTransformer;