// In src/core/XMLJSONTransformer.js

import DOMEnvironment from './components/DomEnvironment.js';
import ConfigurationManager from './components/ConfigurationManager.js';
import NodeProcessor from './components/NodeProcessor.js';
import XMLToJSONConverter from './components/XMLToJSONConverter.js';
import JSONToXMLConverter from './components/JSONToXMLConverter.js';
import PathNavigator from './components/PathNavigator.js';
import SchemaGenerator from './components/SchemaGenerator.js';
import { TransformerError } from './errors/TransformerError.js';
import { ErrorCodes } from './errors/ErrorCodes.js';

/**
 * Main XMLJSONTransformer class - Facade for the transformer system
 */
export class XMLJSONTransformer {
  /**
   * Creates a new XMLJSONTransformer with the specified configuration
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    if (config !== null && typeof config !== 'object') {
      console.error(`[${ErrorCodes.CONFIG_ERROR}] Configuration must be an object`);
      throw new TransformerError('Configuration must be an object', ErrorCodes.CONFIG_ERROR);
    }
    
    // Initialize configuration manager
    this.configManager = new ConfigurationManager(config);
    
    // Expose configuration for backward compatibility
    this.config = this.configManager.config;
    
    // Ensure valueTransforms is properly initialized
    this.config.valueTransforms = Array.isArray(config.valueTransforms) ? 
      config.valueTransforms : [];
    
    // Initialize components
    this.nodeProcessor = new NodeProcessor(this.configManager, DOMEnvironment);
    this.xmlToJsonConverter = new XMLToJSONConverter(this.configManager, this.nodeProcessor, DOMEnvironment);
    this.jsonToXmlConverter = new JSONToXMLConverter(this.configManager, this.nodeProcessor, DOMEnvironment);
    this.pathNavigator = new PathNavigator(this.configManager);
    this.schemaGenerator = new SchemaGenerator(this.configManager);
  }
  
  /**
   * Transform an XML string to a JSON object
   * @param {string} xmlString - The XML string to transform
   * @param {boolean} asString - Whether to return the result as a formatted JSON string
   * @returns {Object|string} - The transformed JSON object or string
   */
  xmlToJSON(xmlString, asString = false) {
    if (!xmlString || typeof xmlString !== 'string') {
      console.error(`[${ErrorCodes.XML_INVALID_INPUT}] XML input must be a non-empty string`);
      throw new TransformerError('XML input must be a non-empty string', ErrorCodes.XML_INVALID_INPUT);
    }
    
    try {
      const result = this.xmlToJsonConverter.convert(xmlString);
      
      // Return formatted JSON string if requested
      if (asString) {
        return this.jsonToString(result);
      }
      
      return result;
    } catch (error) {
      // If it's already a TransformerError, just re-throw it
      if (error instanceof TransformerError) {
        throw error;
      }
      
      // Otherwise, wrap it in a TransformerError
      console.error(`[${ErrorCodes.XML_ERROR}] ${error.message}`);
      throw new TransformerError(`XML to JSON conversion failed: ${error.message}`, ErrorCodes.XML_ERROR);
    }
  }
  
  /**
   * Format a JSON object according to the current configuration
   * @param {Object} jsonObj - The JSON object to format
   * @returns {string} - The formatted JSON string
   */
  jsonToString(jsonObj) {
    if (!jsonObj || typeof jsonObj !== 'object') {
      console.error(`[${ErrorCodes.JSON_INVALID_INPUT}] JSON input must be a non-empty object`);
      throw new TransformerError('JSON input must be a non-empty object', ErrorCodes.JSON_INVALID_INPUT);
    }
    
    try {
      if (this.config.outputOptions.prettyPrint) {
        return JSON.stringify(jsonObj, null, this.config.outputOptions.indent);
      }
      return JSON.stringify(jsonObj);
    } catch (error) {
      console.error(`[${ErrorCodes.JSON_ERROR}] Failed to stringify JSON: ${error.message}`);
      throw new TransformerError(`Failed to stringify JSON: ${error.message}`, ErrorCodes.JSON_ERROR);
    }
  }
  
  /**
   * Transform a JSON object to an XML string
   * @param {Object} jsonObj - The JSON object to transform
   * @returns {string} - The transformed XML string
   */
  jsonToXML(jsonObj) {
    if (!jsonObj || typeof jsonObj !== 'object') {
      console.error(`[${ErrorCodes.JSON_INVALID_INPUT}] JSON input must be a non-empty object`);
      throw new TransformerError('JSON input must be a non-empty object', ErrorCodes.JSON_INVALID_INPUT);
    }
    
    try {
      return this.jsonToXmlConverter.convert(jsonObj);
    } catch (error) {
      // If it's already a TransformerError, just re-throw it
      if (error instanceof TransformerError) {
        throw error;
      }
      
      // Otherwise, wrap it in a TransformerError
      console.error(`[${ErrorCodes.JSON_ERROR}] ${error.message}`);
      throw new TransformerError(`JSON to XML conversion failed: ${error.message}`, ErrorCodes.JSON_ERROR);
    }
  }
  
  /**
   * Get a value from a JSON object using a dot-notation path
   * @param {Object} obj - JSON object
   * @param {string} path - Dot-notation path
   * @param {any} fallback - Fallback value if path not found
   * @returns {any} - Value at path or fallback
   */
  getPath(obj, path, fallback) {
    if (!obj || typeof obj !== 'object') {
      console.error(`[${ErrorCodes.PATH_ERROR}] Cannot navigate path on non-object: ${typeof obj}`);
      throw new TransformerError(`Cannot navigate path on non-object: ${typeof obj}`, ErrorCodes.PATH_ERROR);
    }
    
    if (!path || typeof path !== 'string') {
      console.error(`[${ErrorCodes.INVALID_PATH}] Path must be a non-empty string`);
      throw new TransformerError('Path must be a non-empty string', ErrorCodes.INVALID_PATH);
    }
    
    try {
      return this.pathNavigator.getPath(obj, path, fallback);
    } catch (error) {
      console.error(`[${ErrorCodes.PATH_ERROR}] ${error.message}`);
      throw new TransformerError(`Path navigation failed: ${error.message}`, ErrorCodes.PATH_ERROR);
    }
  }
  
  /**
   * Generate a JSON schema for XMLJSONTransformer based on current configuration
   * @returns {Object} - JSON schema
   */
  generateJSONSchema() {
    try {
      return this.schemaGenerator.generateSchema();
    } catch (error) {
      console.error(`[${ErrorCodes.TRANSFORM_ERROR}] Failed to generate schema: ${error.message}`);
      throw new TransformerError(`Failed to generate schema: ${error.message}`, ErrorCodes.TRANSFORM_ERROR);
    }
  }
}

export default XMLJSONTransformer;