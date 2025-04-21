class ValueTransformer {
    /**
     * Process a value, transforming it if applicable
     * @param {any} value - Value to potentially transform
     * @param {Object} context - Context including direction and other information
     * @returns {any} - Transformed value or original if not applicable
     */
    process(value, context = {}) {
      // Base implementation returns original value
      return value;
    }
  }