/**
 * JSONToXMLConverter
 *
 * Handles converting JSON to XML with prefix-based namespace handling
 */
class JSONToXMLConverter {
  /**
   * Creates a new JSONToXMLConverter
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
   * Convert JSON to XML string
   * @param {Object} jsonObj - JSON object to convert
   * @returns {string} - XML string representation
   */
  convert(jsonObj) {
    // Create a new XML document
    const doc = this.domEnv.createDocument(null, null, null);

    // Get the root element name
    const rootElName = Object.keys(jsonObj).find((key) => !key.startsWith("@"));
    if (!rootElName) {
      throw new Error("Invalid JSON: No root element found");
    }

    const rootJSON = jsonObj[rootElName];

    // Track the namespaces we've already declared
    const declaredNamespaces = new Map();

    // Create the root element
    const rootEl = this.createElement(doc, rootElName, rootJSON);

    // Declare namespaces on the root element if preserving them
    if (this.config.preserveNamespaces) {
      this.collectAndDeclareNamespaces(rootEl, jsonObj, declaredNamespaces);
    }

    // Process the root element
    this.processElement(doc, rootEl, rootJSON, declaredNamespaces);

    // Add root to document
    doc.appendChild(rootEl);

    // Serialize to XML
    const serializer = this.domEnv.createSerializer();
    let xmlString = serializer.serializeToString(doc);

    // Add XML declaration
    if (this.config.outputOptions.xml.declaration) {
      xmlString = '<?xml version="1.0" encoding="UTF-8"?>\n' + xmlString;
    }

    // Pretty print if configured
    if (this.config.outputOptions.prettyPrint) {
      xmlString = this.prettyPrintXML(xmlString);
    }

    return xmlString;
  }

  /**
   * Collect and declare all namespaces on the root element
   * @param {Element} rootEl - Root element
   * @param {Object} jsonObj - JSON object
   * @param {Map} declaredNamespaces - Map of declared namespaces
   */
  collectAndDeclareNamespaces(rootEl, jsonObj, declaredNamespaces) {
    const nsKey = this.config.propNames.namespace;
    const prefixKey = this.config.propNames.prefix;
    const childrenKey = this.config.propNames.children;
    const attrsKey = this.config.propNames.attributes;

    // Function to collect namespaces
    const collectNS = (name, nodeObj) => {
      // Get namespace and prefix
      const uri = nodeObj[nsKey];
      const prefix = nodeObj[prefixKey];

      if (uri && prefix && !declaredNamespaces.has(uri)) {
        // Skip if this is an attempt to redefine the xmlns namespace
        if (uri === "http://www.w3.org/2000/xmlns/" && prefix === "xmlns") {
          return; // Skip this namespace declaration
        }

        // Add namespace declaration to root
        rootEl.setAttributeNS(
          "http://www.w3.org/2000/xmlns/",
          `xmlns:${prefix}`,
          uri
        );
        declaredNamespaces.set(uri, prefix);
      }

      // Process attributes
      if (nodeObj[attrsKey]) {
        for (const [_, attrObj] of Object.entries(nodeObj[attrsKey])) {
          const attrNs = attrObj[nsKey];
          const attrPrefix = attrObj[prefixKey];

          if (attrNs && attrPrefix && !declaredNamespaces.has(attrNs)) {
            // Skip if this is an attempt to redefine the xmlns namespace
            if (
              attrNs === "http://www.w3.org/2000/xmlns/" &&
              attrPrefix === "xmlns"
            ) {
              continue; // Skip this namespace declaration
            }

            // Add namespace declaration to root
            rootEl.setAttributeNS(
              "http://www.w3.org/2000/xmlns/",
              `xmlns:${attrPrefix}`,
              attrNs
            );
            declaredNamespaces.set(attrNs, attrPrefix);
          }
        }
      }

      // Process children
      if (Array.isArray(nodeObj[childrenKey])) {
        for (const childObj of nodeObj[childrenKey]) {
          for (const [childName, childData] of Object.entries(childObj)) {
            if (!childName.startsWith("@")) {
              collectNS(childName, childData);
            }
          }
        }
      }
    };

    // Start collection from root
    const rootName = Object.keys(jsonObj)[0];
    collectNS(rootName, jsonObj[rootName]);
  }

  /**
   * Create an element with namespace if needed
   * @param {Document} doc - DOM document
   * @param {string} name - Element name
   * @param {Object} nodeObj - Element JSON object
   * @returns {Element} - Created element
   */
  createElement(doc, name, nodeObj) {
    const nsKey = this.config.propNames.namespace;
    const prefixKey = this.config.propNames.prefix;

    // Skip namespace handling if not preserving or no namespace
    if (!this.config.preserveNamespaces || !nodeObj[nsKey]) {
      return doc.createElement(name);
    }

    const nsUri = nodeObj[nsKey];
    const prefix = nodeObj[prefixKey];

    // Create element with namespace
    if (prefix) {
      try {
        return doc.createElementNS(nsUri, `${prefix}:${name}`);
      } catch (e) {
        console.warn(`Error creating element with namespace: ${e.message}`);
        return doc.createElement(name);
      }
    }

    // No prefix - create simple element with namespace
    try {
      return doc.createElementNS(nsUri, name);
    } catch (e) {
      console.warn(`Error creating element with namespace: ${e.message}`);
      return doc.createElement(name);
    }
  }

  /**
   * Process an element (attributes, content, children)
   * @param {Document} doc - DOM document
   * @param {Element} element - Element to process
   * @param {Object} nodeObj - Element JSON object
   * @param {Map} declaredNamespaces - Map of declared namespaces
   */
  processElement(doc, element, nodeObj, declaredNamespaces) {
    const nsKey = this.config.propNames.namespace;
    const prefixKey = this.config.propNames.prefix;
    const valKey = this.config.propNames.value;
    const attrsKey = this.config.propNames.attributes;
    const cdataKey = this.config.propNames.cdata;
    const commentsKey = this.config.propNames.comments;
    const processingKey = this.config.propNames.processing;
    const childrenKey = this.config.propNames.children;

    // Create transform context
    const context = {
      nodeName: element.nodeName,
      nodeType: this.domEnv.nodeTypes.ELEMENT_NODE,
      namespaceURI: nodeObj[nsKey] || "",
      direction: "json-to-xml",
    };

    // Add attributes
    if (nodeObj[attrsKey]) {
      for (const [attrName, attrObj] of Object.entries(nodeObj[attrsKey])) {
        // Skip xmlns attributes - already handled
        if (attrName === "xmlns" || attrName.startsWith("xmlns:")) {
          continue;
        }

        // Skip attributes with the xmlns namespace
        if (
          attrObj[nsKey] === "http://www.w3.org/2000/xmlns/" &&
          (attrObj[prefixKey] === "xmlns" || attrName === "xmlns")
        ) {
          continue;
        }

        // Get attribute value
        const attrVal = attrObj[valKey];
        if (attrVal === undefined) {
          continue;
        }

        // Convert to string if needed
        const strVal =
          typeof attrVal === "boolean" || typeof attrVal === "number"
            ? String(attrVal)
            : attrVal;

        // Create attribute context
        const attrContext = {
          nodeName: attrName,
          nodeType: this.domEnv.nodeTypes.ATTRIBUTE_NODE,
          isAttribute: true,
          namespaceURI: attrObj[nsKey] || "",
          direction: "json-to-xml",
        };

        // Apply transform if configured
        const transformedVal = this.nodeProcessor.transformValue(
          strVal,
          attrContext
        );

        // Handle namespaced attribute
        if (this.config.preserveNamespaces && attrObj[nsKey]) {
          const attrNs = attrObj[nsKey];
          const attrPrefix = attrObj[prefixKey];

          // Skip if this is an attempt to redefine the xmlns namespace
          if (attrNs === "http://www.w3.org/2000/xmlns/") {
            continue;
          }

          if (attrPrefix) {
            try {
              element.setAttributeNS(
                attrNs,
                `${attrPrefix}:${attrName}`,
                transformedVal
              );
            } catch (e) {
              element.setAttribute(attrName, transformedVal);
            }
          } else {
            element.setAttribute(attrName, transformedVal);
          }
        } else {
          element.setAttribute(attrName, transformedVal);
        }
      }
    }

    // Add content
    const content = nodeObj[valKey];
    if (content !== undefined && content !== null) {
      // Format content
      const strContent =
        typeof content === "boolean" || typeof content === "number"
          ? String(content)
          : content;

      // Apply transform if configured
      const transformedContent = this.nodeProcessor.transformValue(
        strContent,
        context
      );

      // Add content to element
      if (typeof transformedContent === "string") {
        if (this.nodeProcessor.containsHtmlMarkup(transformedContent)) {
          // Mixed content - preserve exactly as is
          if (typeof element.innerHTML !== "undefined") {
            element.innerHTML = transformedContent;
          } else {
            element.textContent = transformedContent;
          }
        } else {
          // Simple text - trim if whitespace preservation is disabled
          let finalContent = transformedContent;
          if (!this.config.preserveWhitespace) {
            finalContent = String(transformedContent).trim();
          }
          element.textContent = finalContent;
        }
      }
    }

    // Skip child processing if this is mixed content
    if (content && this.nodeProcessor.containsHtmlMarkup(String(content))) {
      return;
    }

    // Add CDATA sections if preserving them
    if (this.config.preserveCDATA && Array.isArray(nodeObj[cdataKey])) {
      for (const cdataText of nodeObj[cdataKey]) {
        const cdataSection = doc.createCDATASection(cdataText);
        element.appendChild(cdataSection);
      }
    }

    // Add comments if preserving them
    if (this.config.preserveComments && Array.isArray(nodeObj[commentsKey])) {
      for (const commentText of nodeObj[commentsKey]) {
        const comment = doc.createComment(commentText);
        element.appendChild(comment);
      }
    }

    // Add processing instructions if preserving them
    if (
      this.config.preserveProcessingInstr &&
      Array.isArray(nodeObj[processingKey])
    ) {
      for (const piText of nodeObj[processingKey]) {
        const [target, data] = piText.split(" ", 2);
        const pi = doc.createProcessingInstruction(target, data || "");
        element.appendChild(pi);
      }
    }

    // Process children
    if (Array.isArray(nodeObj[childrenKey])) {
      for (const childObj of nodeObj[childrenKey]) {
        for (const [childName, childData] of Object.entries(childObj)) {
          if (!childName.startsWith("@")) {
            // Create child element
            const childEl = this.createElement(doc, childName, childData);

            // Process child element
            this.processElement(doc, childEl, childData, declaredNamespaces);

            // Add to parent
            element.appendChild(childEl);
          }
        }
      }
    }
  }

  /**
   * Pretty print an XML string
   * @param {string} xmlString - XML string to format
   * @returns {string} - Formatted XML string
   */
  prettyPrintXML(xmlString) {
    const INDENT =
      typeof this.config.outputOptions.indent === "number"
        ? " ".repeat(this.config.outputOptions.indent)
        : "  ";
    let formatted = "";
    let indent = 0;

    // Remove newlines and extra whitespace between tags
    xmlString = xmlString.replace(/>\s+</g, "><").trim();

    // Split into tags and text
    const tokens = xmlString
      .split(/(<[^>]+>)/)
      .filter((token) => token.trim() !== "");

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (token.startsWith("<?") || token.startsWith("<!")) {
        // Declaration or DOCTYPE
        formatted += INDENT.repeat(indent) + token + "\n";
      } else if (token.startsWith("</")) {
        // Closing tag — decrease indent first
        indent--;
        formatted += INDENT.repeat(indent) + token + "\n";
      } else if (token.match(/^<[^/?!][^>]*\/>$/)) {
        // Self-closing tag
        formatted += INDENT.repeat(indent) + token + "\n";
      } else if (token.startsWith("<")) {
        // Opening tag
        // If next token is text and the one after that is a closing tag for this tag, keep inline
        const next = tokens[i + 1];
        const nextNext = tokens[i + 2];

        if (
          next &&
          !next.startsWith("<") &&
          nextNext === `</${token.slice(1)}`
        ) {
          formatted += INDENT.repeat(indent) + token + next + nextNext + "\n";
          i += 2; // skip the next two tokens
        } else {
          formatted += INDENT.repeat(indent) + token + "\n";
          indent++;
        }
      } else {
        // Text value not part of inline case (rare)
        formatted += INDENT.repeat(indent) + token + "\n";
      }
    }

    return formatted.trim();
  }
}

export default JSONToXMLConverter;
