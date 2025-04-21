import ValueTransformer from './ValueTransformer.js';

/**
 * Transforms string values by applying regex replacements
 */
class StringReplaceTransformer extends ValueTransformer {
  /**
   * Creates a StringReplaceTransformer
   * @param {Object} options - Configuration options
   * @param {string} options.pattern - Regex pattern in string form "/pattern/flags"
   * @param {string} options.replacement - Replacement string
   */
  constructor(options = {}) {
    super();
    
    this.replacement = options.replacement || '';
    
    // Parse and compile the regex from string representation
    try {
      // Extract pattern and flags from the string format "/pattern/flags"
      const patternStr = options.pattern || '';
      const matches = patternStr.match(/^\/(.*?)\/([gimyus]*)$/);
      
      if (matches) {
        const [, pattern, flags] = matches;
        this.regex = new RegExp(pattern, flags);
      } else {
        // If not in /pattern/flags format, treat the whole string as a literal pattern
        this.regex = new RegExp(patternStr);
      }
    } catch (error) {
      console.error(`Invalid regex pattern: ${error.message}`);
      // Create a safe fallback regex that won't match anything
      this.regex = /(?!)/;
    }
  }
  
  /**
   * Process a value, transforming it if applicable
   * @param {any} value - Value to potentially transform
   * @param {Object} context - Context including direction and other information
   * @returns {any} - Transformed value or original if not applicable
   */
  process(value, context = {}) {
    // Only process string values
    if (typeof value !== 'string') return value;
    
    try {
      // Apply the regex replacement
      return value.replace(this.regex, this.replacement);
    } catch (error) {
      console.error(`Error applying string replacement: ${error.message}`);
      return value;
    }
  }
}

export default StringReplaceTransformer;