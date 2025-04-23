/**
 * Custom error class for XMLJSONTransformer
 * Extends the standard Error with a code property
 */
export class TransformerError extends Error {
    /**
     * Creates a new TransformerError
     * @param {string} message - Error message
     * @param {string} code - Error code from ErrorCodes
     */
    constructor(message, code = 'ERROR') {
      super(message);
      this.name = 'TransformerError';
      this.code = code;
    }
  }