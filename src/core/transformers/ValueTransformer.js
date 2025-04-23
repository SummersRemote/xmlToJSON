/**
 * Abstract base class for value transformers
 */
class ValueTransformer {
  /**
   * Process a value, transforming it if applicable
   * @param {any} value - Value to potentially transform
   * @param {TransformContext} context - Context including direction and other information
   * @returns {any} - Transformed value or original if not applicable
   */
  process(value, context = {}) {
    // Validate context (optional but helpful for debugging)
    if (!context.direction) {
      console.warn("ValueTransformer received context without direction");
    }

    if (!context.nodeName) {
      console.warn("ValueTransformer received context without nodeName");
    }

    // Base implementation returns original value
    return value;
  }
}

export default ValueTransformer;
