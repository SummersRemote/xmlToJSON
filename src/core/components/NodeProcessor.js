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
   * @typedef {Object} TransformContext
   * @property {string} direction - Either 'xml-to-json' or 'json-to-xml'
   * @property {string} nodeName - The local name of the node without prefix
   * @property {number} nodeType - The DOM node type (1=Element, 2=Attribute, etc.)
   * @property {string} namespaceURI - The namespace URI of the node if available
   * @property {boolean} [isAttribute] - Whether the node is an attribute
   * @property {Object} [parentContext] - The parent node's context (optional)
   * @property {Object} [metadata] - Additional transform-specific metadata
   */

  /**
   * Creates a standardized transform context object
   * @param {Object} options - Context creation options
   * @param {string} options.direction - Transform direction ('xml-to-json' or 'json-to-xml')
   * @param {string} options.nodeName - Node name
   * @param {number} options.nodeType - Node type from DOM node types
   * @param {string} [options.namespaceURI=''] - Namespace URI
   * @param {boolean} [options.isAttribute=false] - Whether node is an attribute
   * @param {Object} [options.parentContext=null] - Parent context
   * @param {Object} [options.metadata={}] - Additional metadata
   * @returns {TransformContext} The standardized context object
   */
  createContext(options) {
    // Ensure required properties are present
    if (!options.direction) {
      console.warn(
        'Context created without direction, defaulting to "unknown"'
      );
    }

    if (!options.nodeName) {
      console.warn('Context created without nodeName, defaulting to "unknown"');
    }

    if (options.nodeType === undefined) {
      console.warn("Context created without nodeType, defaulting to 0");
    }

    // Set isAttribute automatically if nodeType is ATTRIBUTE_NODE
    const isAttribute =
      options.isAttribute ||
      options.nodeType === this.domEnv.nodeTypes.ATTRIBUTE_NODE;

    // Create standard context with required properties
    return {
      direction: options.direction || "unknown",
      nodeName: options.nodeName || "unknown",
      nodeType: options.nodeType !== undefined ? options.nodeType : 0,
      namespaceURI: options.namespaceURI || "",
      isAttribute: isAttribute,
      parentContext: options.parentContext || null,
      metadata: options.metadata || {},
    };
  }

  /**
   * Apply transform to a value using the transformer pipeline
   * @param {any} value - Value to transform
   * @param {TransformContext|Object} [contextOrOptions={}] - Transform context or options
   * @returns {any} - Transformed value
   */
  applyTransform(value, contextOrOptions = {}) {
    if (value === undefined || value === null) {
      return value;
    }

    // If this is not a full context object, create one with provided options
    const context =
      contextOrOptions.direction && contextOrOptions.nodeName
        ? contextOrOptions // Already a properly formed context
        : this.createContext({
            ...contextOrOptions,
            direction: contextOrOptions.direction || "unknown",
            nodeName: contextOrOptions.nodeName || "unknown",
          });

    // Skip transforming if no transformers are configured
    if (!this.valueTransforms || this.valueTransforms.length === 0) {
      return value;
    }

    let result = value;

    // Apply each transform in sequence
    for (const transform of this.valueTransforms) {
      if (typeof transform.process === "function") {
        result = transform.process(result, context);
      }
    }

    return result;
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
}

export default NodeProcessor;
