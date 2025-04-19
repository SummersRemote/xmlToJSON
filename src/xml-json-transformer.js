/**
 * XMLJSONTransformer
 * A utility class for transforming between XML and JSON with support for
 * namespaces, attributes, CDATA, comments, and processing instructions.
 */

// Environment detection and setup
let DOMParser, XMLSerializer, Node, Document, implementation;

if (typeof window === "undefined") {
  // Node.js environment - use JSDOM
  const { JSDOM } = require("jsdom");
  const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
    contentType: "text/xml",
  });

  DOMParser = dom.window.DOMParser;
  XMLSerializer = dom.window.XMLSerializer;
  Node = dom.window.Node;
  Document = dom.window.Document;
  implementation = dom.window.document.implementation;
} else {
  // Browser environment
  DOMParser = window.DOMParser;
  XMLSerializer = window.XMLSerializer;
  Node = window.Node;
  Document = window.Document;
  implementation = document.implementation;
}
export class XMLJSONTransformer {
  /**
   * Creates a new XMLJSONTransformer with the specified configuration
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    // Default configuration
    this.config = {
      // Features to preserve during transformation
      preserveNamespaces: true, // When false, namespace URIs are not included in the JSON
      preserveComments: true,
      preserveProcessingInstr: true,
      preserveCDATA: true,
      preserveTextNodes: true,
      preserveWhitespace: false,
      transformFunction: config.transformFunction || null,

      // Element name handling
      stripPrefixes: true, // When false, namespace prefixes are prefixed to the element names

      // Output options
      outputOptions: {
        prettyPrint: true, // Pretty print both XML and JSON output
        indent: 3, // Number of spaces for indentation (used for both XML and JSON)

        // JSON-specific options
        json: {
          compact: true, // When true, empty arrays and objects are omitted
          removeEmptyStrings: true, // When true, properties with empty string values are omitted
        },

        // XML-specific options
        xml: {
          // Reserved for future XML-specific options
        },
      },

      // Property names in the JSON representation
      propNames: {
        namespace: "@ns",
        value: "@val",
        attributes: "@attrs",
        cdata: "@cdata",
        comments: "@comments",
        processing: "@processing",
        children: "@children",
      },

      // Override defaults with provided config
      ...config,
    };

    // Flag for fast path when no transform function is provided
    this._hasTransform = typeof this.config.transformFunction === "function";

    // Ensure backward compatibility for jsonOutput and xmlOutput config
    if (config.jsonOutput || config.xmlOutput) {
      this._migrateOldConfig(config);
    }

    // Convert numeric indent to string for XML formatting
    this.xmlIndent =
      typeof this.config.outputOptions.indent === "number"
        ? " ".repeat(this.config.outputOptions.indent)
        : "  ";

    // Create a reverse mapping for property names (for JSON to XML conversion)
    this.propNamesReverse = {};
    for (const [key, value] of Object.entries(this.config.propNames)) {
      this.propNamesReverse[value] = key;
    }
  }

  /**
   * Migrate from old config format to new consolidated format
   * @param {Object} config - Old configuration object
   * @private
   */
  _migrateOldConfig(config) {
    // Handle jsonOutput configuration
    if (config.jsonOutput) {
      this.config.outputOptions.json = {
        ...this.config.outputOptions.json,
        ...config.jsonOutput,
      };

      // Copy prettyPrint and indent if they exist
      if (config.jsonOutput.prettyPrint !== undefined) {
        this.config.outputOptions.prettyPrint = config.jsonOutput.prettyPrint;
      }
      if (config.jsonOutput.indent !== undefined) {
        this.config.outputOptions.indent = config.jsonOutput.indent;
      }
    }

    // Handle xmlOutput configuration
    if (config.xmlOutput) {
      this.config.outputOptions.xml = {
        ...this.config.outputOptions.xml,
        ...config.xmlOutput,
      };

      // Copy prettyPrint and indent if they exist and not already set by jsonOutput
      if (
        config.xmlOutput.prettyPrint !== undefined &&
        !config.jsonOutput?.prettyPrint
      ) {
        this.config.outputOptions.prettyPrint = config.xmlOutput.prettyPrint;
      }
      if (config.xmlOutput.indent !== undefined && !config.jsonOutput?.indent) {
        this.config.outputOptions.indent = config.xmlOutput.indent;
      }
    }
  }

  /**
   * Transform an XML string to a JSON object
   * @param {string} xmlString - The XML string to transform
   * @param {boolean} asString - Whether to return the result as a formatted JSON string
   * @returns {Object|string} - The transformed JSON object or string
   */
  xmlToJSON(xmlString, asString = false) {
    // Create a DOM parser
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");

    // Check for parsing errors
    const parserError = xmlDoc.querySelector("parsererror");
    if (parserError) {
      throw new Error(`XML parsing error: ${parserError.textContent}`);
    }

    // Start with the document element
    const rootNode = xmlDoc.documentElement;
    const result = this._processNode(rootNode);

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
   * Process a DOM node and convert it to our JSON format
   * @param {Node} node - The DOM node to process
   * @returns {Object} - The JSON representation of the node
   * @private
   */
  _processNode(node) {
    // Get the node name (tag name for elements)
    let nodeName = node.nodeName;

    // Strip namespace prefix if configured
    if (this.config.stripPrefixes && nodeName.includes(":")) {
      nodeName = nodeName.split(":").pop();
    }

    // Create the base JSON object
    const result = {};
    const nodeObj = {};

    // Create context with direction (only if transform function exists)
    const context = this._hasTransform
      ? this._createTransformContext(node, nodeName, "xml-to-json")
      : null;

    // Always add namespace when preserving namespaces is enabled
    if (this.config.preserveNamespaces) {
      nodeObj[this.config.propNames.namespace] = node.namespaceURI || "";
    }

    // When using compact mode and node is empty, return an empty object for the element
    if (
      this.config.outputOptions.json.compact &&
      node.nodeType === Node.ELEMENT_NODE &&
      !node.hasChildNodes() &&
      !node.hasAttributes()
    ) {
      result[nodeName] = {};
      return result;
    }

    // Check if this node has mixed content (text nodes and element nodes)
    const hasMixedContent = this._hasMixedContent(node);

    if (hasMixedContent) {
      // For mixed content, get the serialized inner content as text
      const innerContent = node.innerHTML || this._getInnerHTML(node);

      // Apply transform function if exists
      nodeObj[this.config.propNames.value] = this._hasTransform
        ? this._applyTransform(innerContent, context)
        : innerContent;

      // Don't process child elements for mixed content
      nodeObj[this.config.propNames.attributes] = {};
      nodeObj[this.config.propNames.cdata] = [];
      nodeObj[this.config.propNames.comments] = [];
      nodeObj[this.config.propNames.processing] = [];
      nodeObj[this.config.propNames.children] = [];
    } else {
      // Handle as regular content
      // Add value if it exists
      if (node.nodeValue) {
        const value = this._hasTransform
          ? this._applyTransform(node.nodeValue, context)
          : node.nodeValue;
        nodeObj[this.config.propNames.value] = value;
      } else if (
        node.nodeType === Node.ELEMENT_NODE &&
        node.childNodes.length === 1 &&
        node.childNodes[0].nodeType === Node.TEXT_NODE
      ) {
        // Simple text content case
        const value = this._hasTransform
          ? this._applyTransform(node.textContent, context)
          : node.textContent;
        nodeObj[this.config.propNames.value] = value;
      } else {
        nodeObj[this.config.propNames.value] = "";
      }

      // Always initialize empty collections (for consistency with the schema)
      nodeObj[this.config.propNames.attributes] = {};
      nodeObj[this.config.propNames.cdata] = [];
      nodeObj[this.config.propNames.comments] = [];
      nodeObj[this.config.propNames.processing] = [];
      nodeObj[this.config.propNames.children] = [];
    }

    // Process attributes if this is an element
    if (node.nodeType === Node.ELEMENT_NODE && node.hasAttributes()) {
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
        if (this.config.stripPrefixes && attrName.includes(":")) {
          attrName = attrName.split(":").pop();
        }

        const attrObj = {};

        // Apply transform to attribute value if needed
        const attrValue = this._hasTransform
          ? this._applyTransform(attr.value, {
              ...context,
              nodeName: attrName,
              nodeType: Node.ATTRIBUTE_NODE,
              isAttribute: true,
            })
          : attr.value;

        // Only add value property if not empty or if we're not removing empty strings
        if (
          attrValue !== "" ||
          !this.config.outputOptions.json.removeEmptyStrings
        ) {
          attrObj[this.config.propNames.value] = attrValue;
        }

        // Always add namespace if preserving namespaces
        if (this.config.preserveNamespaces) {
          attrObj[this.config.propNames.namespace] = attr.namespaceURI || "";
        }

        nodeObj[this.config.propNames.attributes][attrName] = attrObj;
      }
    }

    // Process child nodes only if not mixed content
    if (!hasMixedContent && node.hasChildNodes()) {
      const childNodes = [];
      let textContent = "";

      for (let i = 0; i < node.childNodes.length; i++) {
        const childNode = node.childNodes[i];

        switch (childNode.nodeType) {
          case Node.ELEMENT_NODE:
            // Process child element
            childNodes.push(this._processNode(childNode));
            break;

          case Node.TEXT_NODE:
            // Handle text nodes if configured to preserve them
            if (this.config.preserveTextNodes) {
              // Skip pure whitespace nodes if not preserving whitespace
              if (
                !this.config.preserveWhitespace &&
                childNode.textContent.trim() === ""
              ) {
                continue;
              }
              textContent += childNode.textContent;
            }
            break;

          case Node.CDATA_SECTION_NODE:
            // Handle CDATA sections if configured to preserve them
            if (this.config.preserveCDATA) {
              nodeObj[this.config.propNames.cdata].push(childNode.textContent);
            }
            break;

          case Node.COMMENT_NODE:
            // Handle comments if configured to preserve them
            if (this.config.preserveComments) {
              nodeObj[this.config.propNames.comments].push(
                childNode.textContent
              );
            }
            break;

          case Node.PROCESSING_INSTRUCTION_NODE:
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
        // Apply transform if needed
        nodeObj[this.config.propNames.value] = this._hasTransform
          ? this._applyTransform(textContent, context)
          : textContent;
      }

      // Add child nodes if present
      if (childNodes.length > 0) {
        nodeObj[this.config.propNames.children] = childNodes;
      }
    }

    // If compact mode is enabled, remove empty collections
    if (this.config.outputOptions.json.compact) {
      if (Object.keys(nodeObj[this.config.propNames.attributes]).length === 0) {
        delete nodeObj[this.config.propNames.attributes];
      }

      if (nodeObj[this.config.propNames.cdata].length === 0) {
        delete nodeObj[this.config.propNames.cdata];
      }

      if (nodeObj[this.config.propNames.comments].length === 0) {
        delete nodeObj[this.config.propNames.comments];
      }

      if (nodeObj[this.config.propNames.processing].length === 0) {
        delete nodeObj[this.config.propNames.processing];
      }

      if (nodeObj[this.config.propNames.children].length === 0) {
        delete nodeObj[this.config.propNames.children];
      }

      // Remove empty value strings if configured
      if (
        this.config.outputOptions.json.removeEmptyStrings &&
        nodeObj[this.config.propNames.value] === ""
      ) {
        delete nodeObj[this.config.propNames.value];
      }
    }

    result[nodeName] = nodeObj;
    return result;
  }

  /**
   * Check if a node has mixed content (both text and element nodes)
   * @param {Node} node - The DOM node to check
   * @returns {boolean} - Whether the node has mixed content
   * @private
   */
  _hasMixedContent(node) {
    if (node.nodeType !== Node.ELEMENT_NODE || !node.hasChildNodes()) {
      return false;
    }

    let hasTextNode = false;
    let hasElementNode = false;

    for (let i = 0; i < node.childNodes.length; i++) {
      const childNode = node.childNodes[i];

      if (childNode.nodeType === Node.TEXT_NODE) {
        // Skip pure whitespace nodes when checking for text content
        if (childNode.textContent.trim() !== "") {
          hasTextNode = true;
        }
      } else if (childNode.nodeType === Node.ELEMENT_NODE) {
        hasElementNode = true;
      }

      // Once we've found both types, we can return early
      if (hasTextNode && hasElementNode) {
        return true;
      }
    }

    return hasTextNode && hasElementNode;
  }

  /**
   * Get the innerHTML of a node (for browsers that don't support it)
   * @param {Node} node - The DOM node
   * @returns {string} - The innerHTML of the node
   * @private
   */
  _getInnerHTML(node) {
    if (node.innerHTML !== undefined) {
      return node.innerHTML;
    }

    // Fallback implementation for environments without innerHTML
    const serializer = new XMLSerializer();
    let result = "";

    for (let i = 0; i < node.childNodes.length; i++) {
      result += serializer.serializeToString(node.childNodes[i]);
    }

    return result;
  }

  /**
   * Helper method to manage namespace prefixes when converting from JSON to XML
   * @param {Object} jsonObj - The JSON object being transformed
   * @returns {Map} - Map of namespace URIs to generated prefixes
   * @private
   */
  _manageNamespacePrefixes(jsonObj) {
    // Only process when preserving namespaces but stripping prefixes
    if (!this.config.stripPrefixes || !this.config.preserveNamespaces) {
      return null;
    }

    const nsKey = this.config.propNames.namespace;
    const childrenKey = this.config.propNames.children;
    const attrsKey = this.config.propNames.attributes;

    // Map to store namespace URI to prefix mappings
    const nsMap = new Map();
    // Counter for generating unique prefixes
    let prefixCounter = 0;

    // Simplified function to collect all unique namespaces
    const collectNamespaces = (node) => {
      // Check if this node has a namespace
      if (node[nsKey] && node[nsKey] !== "") {
        const nsURI = node[nsKey];

        // Generate a prefix if we haven't seen this namespace
        if (!nsMap.has(nsURI)) {
          const prefix = `ns${++prefixCounter}`;
          nsMap.set(nsURI, prefix);
        }
      }

      // Process attributes
      if (node[attrsKey]) {
        for (const attrObj of Object.values(node[attrsKey])) {
          if (attrObj[nsKey] && attrObj[nsKey] !== "") {
            const nsURI = attrObj[nsKey];

            if (!nsMap.has(nsURI)) {
              const prefix = `ns${++prefixCounter}`;
              nsMap.set(nsURI, prefix);
            }
          }
        }
      }

      // Process children recursively
      if (Array.isArray(node[childrenKey])) {
        for (const childObj of node[childrenKey]) {
          for (const childData of Object.values(childObj)) {
            if (typeof childData === "object" && childData !== null) {
              collectNamespaces(childData);
            }
          }
        }
      }
    };

    // Start collection from the root node
    const rootName = Object.keys(jsonObj)[0];
    collectNamespaces(jsonObj[rootName]);

    return nsMap;
  }

  /**
   * Transform a JSON object to an XML string
   * @param {Object} jsonObj - The JSON object to transform
   * @returns {string} - The transformed XML string
   */
  jsonToXML(jsonObj) {
    // Create a new XML document
    const doc = document.implementation.createDocument(null, null, null);

    // Process namespace prefixes if needed
    const nsMap = this._manageNamespacePrefixes(jsonObj);

    // Process the root element
    const rootElName = Object.keys(jsonObj).find((key) => !key.startsWith("@"));
    if (!rootElName) {
      throw new Error("Invalid JSON: No root element found");
    }

    const rootJSON = jsonObj[rootElName];
    const rootEl = this._createElementFromJSON(
      doc,
      rootElName,
      rootJSON,
      nsMap
    );
    doc.appendChild(rootEl);

    // Serialize the XML document
    const serializer = new XMLSerializer();
    let xmlString = serializer.serializeToString(doc);

    // Pretty print if configured
    if (this.config.outputOptions.prettyPrint) {
      xmlString = this._prettyPrintXML(xmlString);
    }

    return xmlString;
  }

  /**
   * Create a DOM element from a JSON object
   * @param {Document} doc - The DOM document
   * @param {string} elName - The element name
   * @param {Object} jsonObj - The JSON object
   * @param {Map} nsMap - Namespace URI to prefix map
   * @returns {Element} - The created DOM element
   * @private
   */
  _createElementFromJSON(doc, elName, jsonObj, nsMap = null) {
    const nsKey = this.config.propNames.namespace;
    const valKey = this.config.propNames.value;
    const attrsKey = this.config.propNames.attributes;
    const cdataKey = this.config.propNames.cdata;
    const commentsKey = this.config.propNames.comments;
    const processingKey = this.config.propNames.processing;
    const childrenKey = this.config.propNames.children;

    // Create the element (with namespace if provided and preserving namespaces)
    let element;
    const nsURI = jsonObj[nsKey] || "";

    // Create context with direction (only if transform function exists)
    const context = this._hasTransform
      ? this._createTransformContext(
          { nodeType: Node.ELEMENT_NODE, namespaceURI: nsURI },
          elName,
          "json-to-xml"
        )
      : null;

    // Only use namespace prefixing when needed
    if (this.config.preserveNamespaces && nsURI) {
      if (this.config.stripPrefixes && nsMap && nsMap.has(nsURI)) {
        // Use the generated prefix for this namespace
        const prefix = nsMap.get(nsURI);
        const qualifiedName = `${prefix}:${elName}`;

        try {
          element = doc.createElementNS(nsURI, qualifiedName);

          // Always declare the namespace on the element using this prefix
          element.setAttributeNS(
            "http://www.w3.org/2000/xmlns/",
            `xmlns:${prefix}`,
            nsURI
          );
        } catch (error) {
          console.warn(
            `Error creating element with namespace: ${error.message}`
          );
          element = doc.createElement(elName);
        }
      } else {
        // Standard namespace handling when not stripping prefixes
        try {
          element = doc.createElementNS(nsURI, elName);

          // Add default namespace declaration if needed
          if (!elName.includes(":") && nsURI) {
            element.setAttribute("xmlns", nsURI);
          }
        } catch (error) {
          console.warn(
            `Error creating element with namespace: ${error.message}`
          );
          element = doc.createElement(elName);
        }
      }
    } else {
      // No namespace or not preserving namespaces
      element = doc.createElement(elName);
    }

    // Add attributes
    if (jsonObj[attrsKey]) {
      for (const [attrName, attrObj] of Object.entries(jsonObj[attrsKey])) {
        // Apply transform to attribute value if needed
        const originalAttrValue = attrObj[this.config.propNames.value];
        const attrValue = this._hasTransform
          ? this._applyTransform(originalAttrValue, {
              ...context,
              nodeName: attrName,
              nodeType: Node.ATTRIBUTE_NODE,
              isAttribute: true,
            })
          : originalAttrValue !== undefined
          ? originalAttrValue
          : "";

        const attrNs = attrObj[this.config.propNames.namespace];

        if (
          attrNs &&
          this.config.preserveNamespaces &&
          this.config.stripPrefixes &&
          nsMap &&
          nsMap.has(attrNs)
        ) {
          const prefix = nsMap.get(attrNs);
          const qualifiedName = `${prefix}:${attrName}`;

          try {
            element.setAttributeNS(attrNs, qualifiedName, attrValue);

            // Add namespace declaration if not already present
            if (
              !element.hasAttributeNS(
                "http://www.w3.org/2000/xmlns/",
                `xmlns:${prefix}`
              )
            ) {
              element.setAttributeNS(
                "http://www.w3.org/2000/xmlns/",
                `xmlns:${prefix}`,
                attrNs
              );
            }
          } catch (error) {
            element.setAttribute(attrName, attrValue);
          }
        } else if (attrNs && this.config.preserveNamespaces) {
          // Standard namespace attribute handling
          try {
            element.setAttributeNS(attrNs, attrName, attrValue);
          } catch (error) {
            element.setAttribute(attrName, attrValue);
          }
        } else {
          element.setAttribute(attrName, attrValue);
        }
      }
    }

    // Check if content is mixed (contains HTML markup)
    const originalValue = jsonObj[valKey];

    // Apply transform if needed
    const value = this._hasTransform
      ? this._applyTransform(originalValue, context)
      : originalValue;

    // Handle special cases from transform function
    if (context && context.isNull) {
      // Add xsi:nil="true" attribute for null values
      element.setAttributeNS(
        "http://www.w3.org/2000/xmlns/",
        "xmlns:xsi",
        "http://www.w3.org/2001/XMLSchema-instance"
      );
      element.setAttributeNS(
        "http://www.w3.org/2001/XMLSchema-instance",
        "xsi:nil",
        "true"
      );
    }

    // Use the transformed value if available, otherwise use original
    const contentValue = value !== undefined ? value : originalValue;

    if (contentValue !== undefined) {
      if (
        typeof contentValue === "string" &&
        this._containsHtmlMarkup(contentValue)
      ) {
        // For mixed content, set innerHTML
        if (typeof element.innerHTML !== "undefined") {
          element.innerHTML = contentValue;
        } else {
          // Fallback for environments without innerHTML
          // This is a simplified approach and may not handle all cases
          element.textContent = contentValue;
        }
      } else if (contentValue !== undefined) {
        // For simple text content
        element.textContent = String(contentValue);
      }
    }

    // Only add special nodes and children if not already handling mixed content
    if (!contentValue || !this._containsHtmlMarkup(String(contentValue))) {
      // Add CDATA sections
      if (this.config.preserveCDATA && Array.isArray(jsonObj[cdataKey])) {
        for (const cdataText of jsonObj[cdataKey]) {
          const cdataSection = doc.createCDATASection(cdataText);
          element.appendChild(cdataSection);
        }
      }

      // Add comments
      if (this.config.preserveComments && Array.isArray(jsonObj[commentsKey])) {
        for (const commentText of jsonObj[commentsKey]) {
          const comment = doc.createComment(commentText);
          element.appendChild(comment);
        }
      }

      // Add processing instructions
      if (
        this.config.preserveProcessingInstr &&
        Array.isArray(jsonObj[processingKey])
      ) {
        for (const piText of jsonObj[processingKey]) {
          const [target, data] = piText.split(" ", 2);
          const pi = doc.createProcessingInstruction(target, data || "");
          element.appendChild(pi);
        }
      }

      // Process children recursively
      if (Array.isArray(jsonObj[childrenKey])) {
        for (const childObj of jsonObj[childrenKey]) {
          for (const [childName, childData] of Object.entries(childObj)) {
            if (!childName.startsWith("@")) {
              const childElement = this._createElementFromJSON(
                doc,
                childName,
                childData,
                nsMap
              );
              element.appendChild(childElement);
            }
          }
        }
      }
    }

    return element;
  }

  /**
   * Check if a string contains HTML markup
   * @param {string} str - The string to check
   * @returns {boolean} - Whether the string contains HTML markup
   * @private
   */
  _containsHtmlMarkup(str) {
    return typeof str === "string" && /<[a-z][\s\S]*>/i.test(str);
  }

  /**
   * Pretty print an XML string
   * @param {string} xmlString - The XML string to pretty print
   * @returns {string} - The pretty printed XML string
   * @private
   */
  _prettyPrintXML(xmlString) {
    const PADDING = this.xmlIndent;

    // Normalize spacing between tags and content
    const tokens = xmlString
      .replace(/>\s*</g, "><") // collapse inter-tag whitespace
      .replace(/</g, "\n<") // newline before each tag
      .replace(/>/g, ">\n") // newline after each tag
      .split("\n") // split into lines
      .map((line) => line.trim())
      .filter((line) => line.length > 0); // remove empty lines

    let indentLevel = 0;
    const result = [];

    for (let i = 0; i < tokens.length; i++) {
      const line = tokens[i];

      const isClosingTag = /^<\/[^>]+>/.test(line);
      const isOpeningTag = /^<[^!?\/][^>]*[^\/]>$/.test(line);
      const isSelfClosingTag = /^<[^>]+\/>$/.test(line);
      const isComment = /^<!--.*-->$/.test(line);
      const isCDATA = /^<!\[CDATA\[.*\]\]>$/.test(line);
      const isProcessingInstruction = /^<\?.*\?>$/.test(line);
      const isTextNode = !line.startsWith("<") && !line.endsWith(">");

      if (isClosingTag) {
        indentLevel = Math.max(indentLevel - 1, 0);
      }

      const indent = PADDING.repeat(indentLevel);
      result.push(indent + line);

      if (isOpeningTag) {
        indentLevel++;
      }
      // other types (self-closing, comments, etc.) do not affect indent level
    }

    return result.join("\n");
  }

  _applyTransform(value, context) {
    // Fast path - if no transform function, return original value
    if (!this._hasTransform) return value;
    
    // Apply the transform function
    const result = this.config.transformFunction(value, context);
    
    // If the function returns undefined, keep the original value
    return result !== undefined ? result : value;
  }

  _createTransformContext(node, nodeName, direction) {
    // Only create context if transform function exists
    if (!this._hasTransform) return null;
    
    return {
      nodeName: nodeName,
      nodeType: node.nodeType || 0,
      namespaceURI: node.namespaceURI || "",
      attributes: node.attributes || null,
      direction: direction
    };
  }

  // helper function for traversing the node children in a json object.
  // provides dot/bracket like notation which automatically flattens the
  // last step if applicable and provides fallback values.
  // if you don't want a flattened result, back uo one node
  // if you need more expressive searching or filtering, use jsonpath
  // Fix for the getPath method
  // Improved getPath method with better error handling
  // Improved getPath method with better error handling
  // Simplified getPath method that always returns empty arrays as-is
  getPath(obj, path, fallback = undefined) {
    if (!obj || !path) return fallback;

    const parts = path.split(".");
    const childrenKey = this.config.propNames.children;

    // Store 'this' reference for use in the inner function
    const self = this;

    function traverse(node, keys) {
      if (keys.length === 0) return node;

      const [key, ...rest] = keys;

      // Validate key syntax - ensure it's a valid property name with optional array index
      const match = key.match(/^([a-zA-Z0-9_@]+)(?:\[(\d+)\])?$/);
      if (!match) return fallback; // Return fallback for invalid syntax

      const [, baseKey, index] = match;

      const val = node?.[baseKey];
      if (val !== undefined) {
        if (Array.isArray(val)) {
          if (index !== undefined) {
            const indexValue = val[Number(index)];
            return indexValue !== undefined
              ? traverse(indexValue, rest)
              : fallback;
          } else {
            return val.map((child) => traverse(child, rest));
          }
        } else {
          return traverse(val, rest);
        }
      }

      // Try searching children if key not directly present
      if (node && Array.isArray(node[childrenKey])) {
        const matches = node[childrenKey]
          .map((child) => child?.[baseKey])
          .filter((v) => v !== undefined);

        if (index !== undefined) {
          const item = matches[Number(index)];
          return item ? traverse(item, rest) : fallback;
        }

        if (matches.length === 0) {
          // If we're at the end of our path, return an empty array for consistency
          if (rest.length === 0) return [];
          // Otherwise return fallback
          return fallback;
        }

        return matches.map((child) => traverse(child, rest));
      }

      return fallback;
    }

    const result = traverse(obj, parts);

    // Deep flatten helper
    const deepFlatten = (arr) =>
      Array.isArray(arr) ? arr.flatMap((el) => deepFlatten(el)) : [arr];

    if (Array.isArray(result)) {
      // Always return the flattened array, even if empty
      return deepFlatten(result).filter((v) => v !== undefined);
    }

    return result;
  }

  /**
   * Generates a JSON Schema for the XMLJSONTransformer based on the current configuration
   * This method can be added to the XMLJSONTransformer class to generate a schema
   * that matches the current configuration and validation rules
   */
  generateJSONSchema() {
    const propNames = this.config.propNames;
    const compact = this.config.outputOptions?.json?.compact || false;
    const removeEmptyStrings =
      this.config.outputOptions?.json?.removeEmptyStrings || false;
    const preserveNamespaces = this.config.preserveNamespaces;

    // Determine which properties are required based on the configuration
    // This should match the logic in validateJSON
    const requiredProps = [];

    if (!compact) {
      requiredProps.push(
        propNames.attributes,
        propNames.cdata,
        propNames.comments,
        propNames.processing,
        propNames.children
      );

      if (!removeEmptyStrings) {
        requiredProps.push(propNames.value);

        if (preserveNamespaces) {
          requiredProps.push(propNames.namespace);
        }
      }
    }

    // Create schema for element properties
    const elementProperties = {};

    // Add namespace property if preserving namespaces
    if (preserveNamespaces) {
      elementProperties[propNames.namespace] = {
        description: "Namespace URI of the element",
        type: "string",
      };
    }

    // Add value property
    elementProperties[propNames.value] = {
      description:
        "Text content of the element or raw content for mixed content elements",
      type: "string",
    };

    // Add attributes property
    elementProperties[propNames.attributes] = {
      description: "Element attributes",
      type: "object",
      patternProperties: {
        "^.*$": {
          type: "object",
          properties: {},
        },
      },
    };

    // Add attribute properties based on configuration
    const attrProperties =
      elementProperties[propNames.attributes].patternProperties["^.*$"]
        .properties;

    attrProperties[propNames.value] = {
      description: "Attribute value",
      type: "string",
    };

    if (preserveNamespaces) {
      attrProperties[propNames.namespace] = {
        description: "Namespace URI of the attribute",
        type: "string",
      };
    }

    // Set required properties for attributes
    const requiredAttrProps = [propNames.value];
    if (preserveNamespaces) {
      requiredAttrProps.push(propNames.namespace);
    }

    elementProperties[propNames.attributes].patternProperties["^.*$"].required =
      requiredAttrProps;

    // Add CDATA property
    elementProperties[propNames.cdata] = {
      description: "CDATA sections within the element",
      type: "array",
      items: {
        type: "string",
      },
    };

    // Add comments property
    elementProperties[propNames.comments] = {
      description: "Comments within the element",
      type: "array",
      items: {
        type: "string",
      },
    };

    // Add processing instructions property
    elementProperties[propNames.processing] = {
      description: "Processing instructions within the element",
      type: "array",
      items: {
        type: "string",
      },
    };

    // Create the recursive child elements schema
    const childElementSchema = {
      type: "object",
      properties: {}, // Will be filled in by the self-reference below
      required: [],
    };

    // Add children property
    elementProperties[propNames.children] = {
      description: "Child elements",
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        patternProperties: {
          "^[^@].*$": childElementSchema,
        },
      },
    };

    // Create the final schema object
    const schema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      title: "XMLJSONTransformer Schema",
      description: "JSON Schema for XML representation in XMLJSONTransformer",
      type: "object",
      additionalProperties: false,
      patternProperties: {
        "^[^@].*$": {
          description: "XML element name as property key",
          type: "object",
          properties: elementProperties,
          required: requiredProps,
        },
      },
      allOf: [
        {
          description: "Schema requires exactly one XML element as the root",
          minProperties: 1,
          maxProperties: 1,
        },
      ],
    };

    // Generate a basic example
    const example = this._generateSchemaExample();

    schema.examples = [example];

    return schema;
  }
}
