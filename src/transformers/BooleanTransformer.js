/**
 * Transforms values between string and boolean types
 */
class BooleanTransformer {
    /**
     * Check if transformer should be applied
     * @param {any} value - Value to check
     * @param {string} direction - Conversion direction ('xml-to-json' or 'json-to-xml')
     * @returns {boolean} - Whether to apply transformation
     */
    shouldApply(value, direction = 'xml-to-json') {
      if (direction === 'xml-to-json') {
        return typeof value === 'string' && 
               (value.toLowerCase() === 'true' || value.toLowerCase() === 'false');
      } else {
        return typeof value === 'boolean';
      }
    }
    
    /**
     * Transform value based on direction
     * @param {any} value - Value to transform
     * @param {string} direction - Conversion direction ('xml-to-json' or 'json-to-xml')
     * @returns {boolean|string} - Transformed value
     */
    transform(value, direction = 'xml-to-json') {
      if (!this.shouldApply(value, direction)) return value;
      
      if (direction === 'xml-to-json') {
        // Convert string to boolean
        return value.toLowerCase() === 'true';
      } else {
        // Convert boolean to string
        return String(value);
      }
    }
  }

  export default BooleanTransformer;
