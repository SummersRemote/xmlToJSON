/**
 * NodeProcessor
 *
 * Handles processing of different node types
 */

import BooleanTransformer from '../transformers/BooleanTransformer.js';
import NumberTransformer from '../transformers/NumberTransformer.js';

class NodeProcessor {
  /**
   * Creates a new NodeProcessor
   * @param {ConfigurationManager} configManager - Configuration manager
   * @param {Object} domEnv - DOM environment utilities
   */
  constructor(configManager, domEnv) {
    this.configManager = configManager;
    this.domEnv = domEnv;
    this.config = configManager.config;
    this.hasTransform = typeof this.config.transformFunction === "function";
    
    // Create transformers
    this.booleanTransformer = new BooleanTransformer();
    this.numberTransformer = new NumberTransformer();
  }
  
  /**
   * Check if a node has mixed content (both text and element nodes)
   * @param {Node} node - The DOM node to check
   * @returns {boolean} - Whether the node has mixed content
   */
  hasMixedContent(node) {
    if (
      node.nodeType !== this.domEnv.nodeTypes.ELEMENT_NODE ||
      !node.hasChildNodes()
    ) {
      return false;
    }

    let hasTextNode = false;
    let hasElementNode = false;

    for (let i = 0; i < node.childNodes.length; i++) {
      const childNode = node.childNodes[i];

      if (childNode.nodeType === this.domEnv.nodeTypes.TEXT_NODE) {
        // Skip pure whitespace nodes when checking for text content
        if (childNode.textContent.trim() !== "") {
          hasTextNode = true;
        }
      } else if (childNode.nodeType === this.domEnv.nodeTypes.ELEMENT_NODE) {
        hasElementNode = true;
      }

      if (hasTextNode && hasElementNode) return true;
    }

    return hasTextNode && hasElementNode;
  }

  /**
   * Get the innerHTML of a node (with fallback for environments without innerHTML)
   * @param {Node} node - The DOM node
   * @returns {string} - The innerHTML of the node
   */
  getInnerHTML(node) {
    if (node.innerHTML !== undefined) {
      return node.innerHTML;
    }

    // Fallback implementation
    const serializer = this.domEnv.createSerializer();
    let result = "";

    for (let i = 0; i < node.childNodes.length; i++) {
      result += serializer.serializeToString(node.childNodes[i]);
    }

    return result;
  }

  /**
   * Create a context object for transform operations
   * @param {Node} node - DOM node
   * @param {string} nodeName - Node name
   * @param {string} direction - Transform direction
   * @returns {Object|null} - Context object or null if no transform
   */
  createTransformContext(node, nodeName, direction) {
    if (!this.hasTransform) return null;

    return {
      nodeName: nodeName,
      nodeType: node.nodeType || 0,
      namespaceURI: node.namespaceURI || "",
      attributes: node.attributes || null,
      direction: direction,
    };
  }
  
  /**
   * Transform a value using applicable transformers
   * @param {any} value - Value to transform
   * @param {Object} context - Transform context
   * @returns {any} - Transformed value
   */
  transformValue(value, context = {}) {
    if (value === undefined || value === null) {
      return value;
    }
    
    let result = value;
    
    // Get direction (default to xml-to-json if not specified)
    const direction = context && context.direction ? context.direction : 'xml-to-json';
    
    // 1. Apply boolean transformer if enabled and applicable
    if (this.config.grokBoolean && this.booleanTransformer.shouldApply(result, direction)) {
      result = this.booleanTransformer.transform(result, direction);
    }
    
    // 2. Apply number transformer if enabled and applicable
    if (this.config.grokNumber && this.numberTransformer.shouldApply(result, direction)) {
      result = this.numberTransformer.transform(result, direction);
    }
    
    // 3. Apply custom transformer function if configured
    if (typeof this.config.transformFunction === 'function') {
      const transformed = this.config.transformFunction(result, context);
      if (transformed !== undefined) {
        result = transformed;
      }
    }
    
    return result;
  }

  /**
   * Apply transform function to a value
   * @param {any} value - Value to transform
   * @param {Object} context - Transform context
   * @returns {any} - Transformed value
   */
  applyTransform(value, context) {
    return this.transformValue(value, context);
  }

  /**
   * Check if a string contains HTML markup
   * @param {string} str - String to check
   * @returns {boolean} - Whether string contains HTML markup
   */
  containsHtmlMarkup(str) {
    if (typeof str !== "string") return false;
    const hasMarkup = /<[a-z][\s\S]*>/i.test(str);
    return hasMarkup;
  }

  /**
   * Process a value based on configuration settings
   * @param {string} value - Original value to process
   * @param {Object} context - Transform context
   * @returns {any} - Processed value
   */
  processValue(value, context = {}) {
    return this.transformValue(value, context);
  }
}

export default NodeProcessor;