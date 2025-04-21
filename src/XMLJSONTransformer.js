/**
 * XMLJSONTransformer
 * 
 * A utility class for transforming between XML and JSON with support for
 * namespaces, attributes, CDATA, comments, and processing instructions.
 */

// Import dependencies
import DOMEnvironment from './components/DomEnvironment.js';
import ConfigurationManager from './components/ConfigurationManager.js';
import NodeProcessor from './components/NodeProcessor.js';
import XMLToJSONConverter from './components/XMLToJSONConverter.js';
import JSONToXMLConverter from './components/JSONToXMLConverter.js';
import PathNavigator from './components/PathNavigator.js';
import SchemaGenerator from './components/SchemaGenerator.js';

/**
 * Main XMLJSONTransformer class - Facade for the transformer system
 */
export class XMLJSONTransformer {
  /**
   * Creates a new XMLJSONTransformer with the specified configuration
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    // Initialize configuration manager
    this.configManager = new ConfigurationManager(config);
    
    // Expose configuration for backward compatibility
    this.config = this.configManager.config;
    
    // Ensure transformers array exists
    this.config.valueTransforms = Array.isArray(config.valueTransforms) ? config.valueTransforms : [];
    
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
    const result = this.xmlToJsonConverter.convert(xmlString);
    
    // Return formatted JSON string if requested
    if (asString) {
      return this.jsonToString(result);
    }
    
    return result;
  }
  
  /**
   * Format a JSON object according to the current configuration
   * @param {Object} jsonObj - The JSON object to format
   * @returns {string} - The formatted JSON string
   */
  jsonToString(jsonObj) {
    if (this.config.outputOptions.prettyPrint) {
      return JSON.stringify(jsonObj, null, this.config.outputOptions.indent);
    }
    return JSON.stringify(jsonObj);
  }
  
  /**
   * Transform a JSON object to an XML string
   * @param {Object} jsonObj - The JSON object to transform
   * @returns {string} - The transformed XML string
   */
  jsonToXML(jsonObj) {
    return this.jsonToXmlConverter.convert(jsonObj);
  }
  
  /**
   * Get a value from a JSON object using a dot-notation path
   * @param {Object} obj - JSON object
   * @param {string} path - Dot-notation path
   * @param {any} fallback - Fallback value if path not found
   * @returns {any} - Value at path or fallback
   */
  getPath(obj, path, fallback) {
    return this.pathNavigator.getPath(obj, path, fallback);
  }
  
  /**
   * Generate a JSON schema for XMLJSONTransformer based on current configuration
   * @returns {Object} - JSON schema
   */
  generateJSONSchema() {
    return this.schemaGenerator.generateSchema();
  }
}

export default XMLJSONTransformer;