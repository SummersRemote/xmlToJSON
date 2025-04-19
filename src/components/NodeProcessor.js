/**
 * NodeProcessor
 *
 * Handles processing of different node types
 */
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
   * Apply transform function to a value
   * @param {any} value - Value to transform
   * @param {Object} context - Transform context
   * @returns {any} - Transformed value
   */
  applyTransform(value, context) {
    if (!this.hasTransform) return value;

    const result = this.config.transformFunction(value, context);
    return result !== undefined ? result : value;
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
   * @returns {any} - Processed value
   */
  processValue(value) {
    if (value === undefined || value === null) return value;
    
    // Simply return the value without type conversions for simplicity
    return value;
  }
}

export default NodeProcessor;