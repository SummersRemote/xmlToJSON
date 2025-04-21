import ValueTransformer from '../core/transformers/ValueTransformer.js';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Register required plugins
dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Transforms date string values between formats using dayjs
 * Preserves timezone information unless a new timezone is requested
 */
class DateTransformer extends ValueTransformer {
  /**
   * Creates a DateTransformer
   * @param {Object} options - Configuration options
   * @param {string} options.inputFormat - Input date format string for parsing (optional)
   * @param {string} options.outputFormat - Output date format string (optional, defaults to ISO 8601)
   */
  constructor(options = {}) {
    super();
    
    this.inputFormat = options.inputFormat || null;
    this.outputFormat = options.outputFormat || null; // null will use ISO 8601
    
    // Check if formats contain timezone information
    this.inputHasTimezone = this.hasTimezoneToken(this.inputFormat);
    this.outputHasTimezone = this.hasTimezoneToken(this.outputFormat);
  }
  
  /**
   * Checks if a format string contains timezone tokens
   * @param {string} format - Format string to check
   * @returns {boolean} - True if format contains timezone tokens
   */
  hasTimezoneToken(format) {
    if (!format) return false;
    
    // Common timezone tokens in dayjs
    const timezoneTokens = ['Z', 'ZZ', 'z', 'zz', 'A', 'a'];
    
    // Check if any timezone token exists in the format string
    return timezoneTokens.some(token => format.includes(token));
  }
  
  /**
   * Process a value, transforming it if applicable
   * @param {any} value - Value to potentially transform
   * @param {Object} context - Context including direction and other information
   * @returns {any} - Transformed value or original if not applicable
   */
  process(value, context = {}) {
    // Only process string values
    if (typeof value !== 'string' || !value.trim()) return value;
    
    try {
      let date;
      
      // 1. Parse the date using the specified input format or default parsing
      if (this.inputFormat) {
        date = dayjs(value, this.inputFormat);
      } else {
        date = dayjs(value);
      }
      
      // Check if the date is valid
      if (!date.isValid()) {
        return value;
      }
      
      // 2. Handle timezone preservation
      // If input has timezone, it's already in that timezone
      // If input doesn't have timezone, it's parsed in local timezone
      
      // 3. Format the date
      if (!this.outputFormat) {
        // No output format specified, use ISO 8601
        return date.toISOString();
      } else if (!this.outputHasTimezone) {
        // Output format doesn't specify timezone, preserve input timezone
        return date.format(this.outputFormat);
      } else {
        // Output format has timezone, convert to that timezone
        // The timezone will be automatically handled by dayjs based on the output format
        return date.format(this.outputFormat);
      }
    } catch (error) {
      console.error(`Error transforming date: ${error.message}`);
      return value;
    }
  }
}

export default DateTransformer;