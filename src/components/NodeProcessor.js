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
    return typeof str === "string" && /<[a-z][\s\S]*>/i.test(str);
  }

  /**
   * Attempt to convert a string value to a boolean
   * @param {string} value - String value to convert
   * @returns {boolean|string} - Boolean value if conversion successful, original string otherwise
   */
  grokBooleanValue(value) {
    if (typeof value !== "string") return value;

    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;

    return value;
  }

  /**
   * Attempt to convert a string value to a number
   * @param {string} value - String value to convert
   * @returns {number|string} - Number value if conversion successful, original string otherwise
   */
  grokNumberValue(value) {
    if (typeof value !== "string") return value;

    // Remove thousands separators and normalize decimal points
    const normalized = value.trim().replace(/,/g, "");

    // Check if it's a valid number (integer, float, or scientific notation)
    if (/^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$/.test(normalized)) {
      const number = parseFloat(normalized);

      // Only return the number if it's not NaN or Infinity
      if (!isNaN(number) && isFinite(number)) {
        // Return an integer if there's no decimal part
        return Number.isInteger(number) ? number : number;
      }
    }

    return value;
  }

  /**
   * Process a value based on configuration settings
   * @param {string} value - Original value to process
   * @returns {any} - Processed value (possibly converted to boolean or number)
   */
  processValue(value) {
    if (value === undefined || value === null) return value;

    let processed = value;

    // Apply type conversions if configured
    if (this.config.grokBoolean) {
      processed = this.grokBooleanValue(processed);
    }

    if (this.config.grokNumber && typeof processed === "string") {
      processed = this.grokNumberValue(processed);
    }

    return processed;
  }
}

export default NodeProcessor;
