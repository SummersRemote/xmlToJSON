/**
 * Transforms values between string and number types
 */
class NumberTransformer {
    /**
     * Check if transformer should be applied
     * @param {any} value - Value to check
     * @param {string} direction - Conversion direction ('xml-to-json' or 'json-to-xml')
     * @returns {boolean} - Whether to apply transformation
     */
    shouldApply(value, direction = 'xml-to-json') {
      if (direction === 'xml-to-json') {
        if (typeof value !== 'string' || value === '') return false;
        
        // Clean value (remove thousands separators)
        const cleanValue = value.replace(/,(?=\d{3})/g, '');
        
        // Check if it matches number patterns
        return /^[-+]?[\d]+$/.test(cleanValue) || 
               /^[-+]?[\d]*\.[\d]+$/.test(cleanValue) || 
               /^[-+]?[\d]*\.?[\d]*[eE][-+]?[\d]+$/.test(cleanValue);
      } else {
        return typeof value === 'number';
      }
    }
    
    /**
     * Transform value based on direction
     * @param {any} value - Value to transform
     * @param {string} direction - Conversion direction ('xml-to-json' or 'json-to-xml')
     * @returns {number|string} - Transformed value
     */
    transform(value, direction = 'xml-to-json') {
      if (!this.shouldApply(value, direction)) return value;
      
      if (direction === 'xml-to-json') {
        try {
          // Convert string to number
          const cleanValue = value.replace(/,(?=\d{3})/g, '');
          return parseFloat(cleanValue);
        } catch (e) {
          return value;
        }
      } else {
        // Convert number to string
        return String(value);
      }
    }
  }

  export default NumberTransformer;
