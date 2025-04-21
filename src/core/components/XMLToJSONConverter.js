/**
 * XMLToJSONConverter
 *
 * Handles converting XML to JSON
 */
class XMLToJSONConverter {
  /**
   * Creates a new XMLToJSONConverter
   * @param {ConfigurationManager} configManager - Configuration manager
   * @param {NodeProcessor} nodeProcessor - Node processor
   * @param {Object} domEnv - DOM environment utilities
   */
  constructor(configManager, nodeProcessor, domEnv) {
    this.configManager = configManager;
    this.nodeProcessor = nodeProcessor;
    this.domEnv = domEnv;
    this.config = configManager.config;
  }

  /**
   * Convert XML string to JSON
   * @param {string} xmlString - XML string to convert
   * @returns {Object} - JSON representation
   */
  convert(xmlString) {
    // Create a DOM parser
    const parser = this.domEnv.createParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");

    // Check for parsing errors
    const parserError = xmlDoc.querySelector("parsererror");
    if (parserError) {
      throw new Error(`XML parsing error: ${parserError.textContent}`);
    }

    // Start with the document element
    const rootNode = xmlDoc.documentElement;
    return this.processNode(rootNode);
  }

  /**
   * Process a DOM node and convert it to JSON format
   * @param {Node} node - DOM node to process
   * @returns {Object} - JSON representation of the node
   */
  processNode(node) {
    // Get the node name (tag name for elements)
    let nodeName = node.nodeName;
    let prefix = null;

    // Extract prefix if present
    if (nodeName.includes(":")) {
      const parts = nodeName.split(":");
      prefix = parts[0];
      nodeName = parts[1]; // Just store the local name without prefix
    }

    // Create the base JSON object
    const result = {};
    const nodeObj = {};

    // Create context with direction (only if transform function exists)
    const context = this.nodeProcessor.createTransformContext(
      node,
      nodeName,
      "xml-to-json"
    );

    // Always add namespace when preserving namespaces is enabled
    if (this.config.preserveNamespaces) {
      nodeObj[this.config.propNames.namespace] = node.namespaceURI || "";

      // Store prefix if present
      if (prefix) {
        nodeObj[this.config.propNames.prefix] = prefix;
      }
    }

    // When using compact mode and node is empty, return an empty object for the element
    if (
      this.config.outputOptions.json.compact &&
      node.nodeType === this.domEnv.nodeTypes.ELEMENT_NODE &&
      !node.hasChildNodes() &&
      !node.hasAttributes()
    ) {
      result[nodeName] = {};
      return result;
    }

    // Check if this node has mixed content (text nodes and element nodes)
    const hasMixedContent = this.nodeProcessor.hasMixedContent(node);

    if (hasMixedContent) {
      // For mixed content, get the serialized inner content as text
      const innerContent =
        node.innerHTML || this.nodeProcessor.getInnerHTML(node);

      // Apply transform function if exists
      nodeObj[this.config.propNames.value] = this.nodeProcessor.applyTransform(
        innerContent,
        context
      );

      // Initialize empty collections
      this.initializeEmptyCollections(nodeObj);
    } else {
      // Handle as regular content
      this.processRegularContent(nodeObj, node, context);
      this.initializeEmptyCollections(nodeObj);
    }

    // Process attributes if this is an element
    if (
      node.nodeType === this.domEnv.nodeTypes.ELEMENT_NODE &&
      node.hasAttributes()
    ) {
      this.processAttributes(nodeObj, node, context);
    }

    // Process child nodes only if not mixed content
    if (!hasMixedContent && node.hasChildNodes()) {
      this.processChildNodes(nodeObj, node, context);
    }

    // Apply compact mode if enabled
    if (this.config.outputOptions.json.compact) {
      this.applyCompactMode(nodeObj);
    }

    result[nodeName] = nodeObj;
    return result;
  }

  /**
   * Initialize empty collections in a node object
   * @param {Object} nodeObj - Node object
   */
  initializeEmptyCollections(nodeObj) {
    nodeObj[this.config.propNames.attributes] = {};
    nodeObj[this.config.propNames.cdata] = [];
    nodeObj[this.config.propNames.comments] = [];
    nodeObj[this.config.propNames.processing] = [];
    nodeObj[this.config.propNames.children] = [];
  }

  /**
   * processRegularContent
   *
   * Process regular (non-mixed) content
   * @param {Object} nodeObj - Node object
   * @param {Node} node - DOM node
   * @param {Object} context - Transform context
   */
  processRegularContent(nodeObj, node, context) {
    // Add value if it exists
    if (node.nodeValue) {
      // Get the raw value
      let value = node.nodeValue;

      // Strip leading and trailing whitespace and newlines
      value = value.trim();

      // Step 1: Apply transform function if exists
      value = this.nodeProcessor.applyTransform(value, context);

      // Step 2: Apply type conversions if configured
      if (this.config.grokBoolean || this.config.grokNumber) {
        value = this.nodeProcessor.processValue(value);
      }

      nodeObj[this.config.propNames.value] = value;
    } else if (
      node.nodeType === this.domEnv.nodeTypes.ELEMENT_NODE &&
      node.childNodes.length === 1 &&
      node.childNodes[0].nodeType === this.domEnv.nodeTypes.TEXT_NODE
    ) {
      // Simple text content case
      let value = node.textContent;

      // Strip leading and trailing whitespace and newlines
      value = value.trim();

      // Step 1: Apply transform function if exists
      value = this.nodeProcessor.applyTransform(value, context);

      // Step 2: Apply type conversions if configured
      if (this.config.grokBoolean || this.config.grokNumber) {
        value = this.nodeProcessor.processValue(value);
      }

      nodeObj[this.config.propNames.value] = value;
    } else {
      nodeObj[this.config.propNames.value] = "";
    }
  }

  /**
   * Process attributes of a node
   * @param {Object} nodeObj - Node object
   * @param {Node} node - DOM node
   * @param {Object} context - Transform context
   */
  processAttributes(nodeObj, node, context) {
    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i];

      // Skip namespace declarations if not preserving namespaces
      if (
        !this.config.preserveNamespaces &&
        (attr.name === "xmlns" || attr.name.startsWith("xmlns:"))
      ) {
        continue;
      }

      // Process attribute name (strip prefix if configured)
      let attrName = attr.name;
      let prefix = null;

      if (attrName.includes(":")) {
        const parts = attrName.split(":");
        prefix = parts[0];
        attrName = parts[1]; // Just store local name
      }

      const attrObj = {};

      // Apply transform to attribute value if needed
      let attrValue = this.nodeProcessor.applyTransform(attr.value, {
        ...context,
        nodeName: attrName,
        nodeType: this.domEnv.nodeTypes.ATTRIBUTE_NODE,
        isAttribute: true,
      });

      // Only add value property if not empty or if we're not removing empty strings
      if (
        attrValue !== "" ||
        !this.config.outputOptions.json.removeEmptyStrings
      ) {
        attrObj[this.config.propNames.value] = attrValue;
      }

      // Add namespace if preserving namespaces
      if (this.config.preserveNamespaces) {
        attrObj[this.config.propNames.namespace] = attr.namespaceURI || "";

        // Store prefix if present
        if (prefix) {
          attrObj[this.config.propNames.prefix] = prefix;
        }
      }

      nodeObj[this.config.propNames.attributes][attrName] = attrObj;
    }
  }

  /**
   * Process child nodes of a node
   * @param {Object} nodeObj - Node object
   * @param {Node} node - DOM node
   * @param {Object} context - Transform context
   */
  processChildNodes(nodeObj, node, context) {
    const childNodes = [];
    let textContent = "";

    for (let i = 0; i < node.childNodes.length; i++) {
      const childNode = node.childNodes[i];

      switch (childNode.nodeType) {
        case this.domEnv.nodeTypes.ELEMENT_NODE:
          // Process child element
          childNodes.push(this.processNode(childNode));
          break;

        case this.domEnv.nodeTypes.TEXT_NODE:
          // Handle text nodes if configured to preserve them
          if (this.config.preserveTextNodes) {
            // Skip pure whitespace nodes if not preserving whitespace
            if (
              !this.config.preserveWhitespace &&
              childNode.textContent.trim() === ""
            ) {
              continue;
            }

            // For text nodes, only append non-empty content
            const nodeText = childNode.textContent;
            if (nodeText.trim() !== "" || this.config.preserveWhitespace) {
              textContent += nodeText;
            }
          }
          break;

        case this.domEnv.nodeTypes.CDATA_SECTION_NODE:
          // Handle CDATA sections if configured to preserve them
          if (this.config.preserveCDATA) {
            nodeObj[this.config.propNames.cdata].push(childNode.textContent);
          }
          break;

        case this.domEnv.nodeTypes.COMMENT_NODE:
          // Handle comments if configured to preserve them
          if (this.config.preserveComments) {
            nodeObj[this.config.propNames.comments].push(childNode.textContent);
          }
          break;

        case this.domEnv.nodeTypes.PROCESSING_INSTRUCTION_NODE:
          // Handle processing instructions if configured to preserve them
          if (this.config.preserveProcessingInstr) {
            nodeObj[this.config.propNames.processing].push(
              `${childNode.target} ${childNode.data}`
            );
          }
          break;
      }
    }

    // Add text content as a value property if present and not already set
    if (
      textContent &&
      this.config.preserveTextNodes &&
      !nodeObj[this.config.propNames.value]
    ) {
      // Trim the accumulated text content if not preserving whitespace
      if (!this.config.preserveWhitespace) {
        textContent = textContent.trim();
      }

      // Apply transform if needed
      textContent = this.nodeProcessor.applyTransform(textContent, context);

      nodeObj[this.config.propNames.value] = textContent;
    }

    // Add child nodes if present
    if (childNodes.length > 0) {
      nodeObj[this.config.propNames.children] = childNodes;
    }
  }

  /**
   * Apply compact mode to a node object
   * @param {Object} nodeObj - Node object
   */
  applyCompactMode(nodeObj) {
    const propNames = this.config.propNames;

    // Remove empty collections
    if (Object.keys(nodeObj[propNames.attributes]).length === 0) {
      delete nodeObj[propNames.attributes];
    }

    if (nodeObj[propNames.cdata].length === 0) {
      delete nodeObj[propNames.cdata];
    }

    if (nodeObj[propNames.comments].length === 0) {
      delete nodeObj[propNames.comments];
    }

    if (nodeObj[propNames.processing].length === 0) {
      delete nodeObj[propNames.processing];
    }

    if (nodeObj[propNames.children].length === 0) {
      delete nodeObj[propNames.children];
    }

    // Remove empty value strings if configured
    if (
      this.config.outputOptions.json.removeEmptyStrings &&
      nodeObj[propNames.value] === ""
    ) {
      delete nodeObj[propNames.value];
    }
  }
}

export default XMLToJSONConverter;
