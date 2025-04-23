/**
 * NodeProcessor
 *
 * Handles processing of different node types
 */

import ValueTransformer from "../transformers/ValueTransformer.js";

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

    // Get valueTransforms from config or use empty array
    this.valueTransforms = this.config.valueTransforms || [];
  }

  /**
   * Check if a node is a structural node (contains only element children and whitespace text)
   * @param {Node} node - The DOM node to check
   * @returns {boolean} - Whether the node is a structural node
   */
  isStructuralNode(node) {
    if (
      node.nodeType !== this.domEnv.nodeTypes.ELEMENT_NODE ||
      !node.hasChildNodes()
    ) {
      return false;
    }

    let hasNonEmptyText = false;

    for (let i = 0; i < node.childNodes.length; i++) {
      const childNode = node.childNodes[i];

      if (childNode.nodeType === this.domEnv.nodeTypes.TEXT_NODE) {
        if (childNode.textContent.trim() !== "") {
          hasNonEmptyText = true;
          break;
        }
      }
    }

    // It's a structural node if it has no non-empty text nodes
    return !hasNonEmptyText;
  }

  /**
   * Check if a node has mixed content (both text and element nodes)
   * @param {Node} node - The DOM node to check
   * @returns {boolean} - Whether the node has mixed content
   */
  hasMixedContent(node) {
    if (
      node.nodeType !== this.domEnv.nodeTypes.ELEMENT_NODE ||
      !node.hasChildNodes() ||
      !this.config.preserveTextNodes // Don't treat as mixed content if not preserving text
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
   * @returns {Object|null} - Context object or null if no valueTransforms
   */
  createTransformContext(node, nodeName, direction) {
    if (!this.valueTransforms || this.valueTransforms.length === 0) return null;

    return {
      nodeName: nodeName,
      nodeType: node.nodeType || 0,
      namespaceURI: node.namespaceURI || "",
      attributes: node.attributes || null,
      direction: direction,
    };
  }

  /**
   * Transform a value using the transformer pipeline
   * @param {any} value - Value to transform
   * @param {Object} context - Transform context
   * @returns {any} - Transformed value
   */
  transformValue(value, context = {}) {
    if (value === undefined || value === null) {
      return value;
    }

    let result = value;

    // Apply each transform in sequence
    for (const transform of this.valueTransforms) {
      result = transform.process(result, context);
    }

    return result;
  }

  /**
   * Apply transform to a value (alias for transformValue)
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
   * Process a value (alias for transformValue)
   * @param {string} value - Original value to process
   * @param {Object} context - Transform context
   * @returns {any} - Processed value
   */
  processValue(value, context = {}) {
    return this.transformValue(value, context);
  }
}

export default NodeProcessor;
