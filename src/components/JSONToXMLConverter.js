/**
 * JSONToXMLConverter
 * 
 * Handles converting JSON to XML
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
    
      // Process namespace prefixes if needed
      const nsMap = this.manageNamespacePrefixes(jsonObj);
    
      // Process the root element
      const rootElName = Object.keys(jsonObj).find((key) => !key.startsWith("@"));
      if (!rootElName) {
        throw new Error("Invalid JSON: No root element found");
      }
    
      const rootJSON = jsonObj[rootElName];
      const rootEl = this.createElementFromJSON(
        doc,
        rootElName,
        rootJSON,
        nsMap
      );
      doc.appendChild(rootEl);
    
      // Serialize the XML document
      const serializer = this.domEnv.createSerializer();
      let xmlString = serializer.serializeToString(doc);
    
      // Add XML declaration if configured
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
     * Manage namespace prefixes when converting JSON to XML
     * @param {Object} jsonObj - JSON object
     * @returns {Map} - Map of namespace URIs to prefixes
     */
    manageNamespacePrefixes(jsonObj) {
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
     * Create a DOM element from a JSON object
     * @param {Document} doc - DOM document
     * @param {string} elName - Element name
     * @param {Object} jsonObj - JSON object
     * @param {Map} nsMap - Namespace URI to prefix map
     * @returns {Element} - DOM element
     */
    createElementFromJSON(doc, elName, jsonObj, nsMap = null) {
      const propNames = this.config.propNames;
      const nsKey = propNames.namespace;
      const valKey = propNames.value;
      const attrsKey = propNames.attributes;
      const cdataKey = propNames.cdata;
      const commentsKey = propNames.comments;
      const processingKey = propNames.processing;
      const childrenKey = propNames.children;
  
      // Create the element (with namespace if provided and preserving namespaces)
      let element;
      const nsURI = jsonObj[nsKey] || "";
  
      // Create context with direction (only if transform function exists)
      const context = this.nodeProcessor.createTransformContext(
        { nodeType: this.domEnv.nodeTypes.ELEMENT_NODE, namespaceURI: nsURI },
        elName,
        "json-to-xml"
      );
  
      // Handle element creation with namespaces
      element = this.createNamespacedElement(doc, elName, nsURI, nsMap);
  
      // Add attributes
      if (jsonObj[attrsKey]) {
        this.addAttributesToElement(element, jsonObj[attrsKey], context, nsMap);
      }
  
      // Handle content
      this.addContentToElement(element, jsonObj, valKey, context);
  
      // Only add special nodes and children if not already handling mixed content
      const contentValue = jsonObj[valKey];
      if (!contentValue || !this.nodeProcessor.containsHtmlMarkup(String(contentValue))) {
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
                const childElement = this.createElementFromJSON(
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
     * Create a namespaced element
     * @param {Document} doc - DOM document
     * @param {string} elName - Element name
     * @param {string} nsURI - Namespace URI
     * @param {Map} nsMap - Namespace URI to prefix map
     * @returns {Element} - DOM element
     */
    createNamespacedElement(doc, elName, nsURI, nsMap) {
      let element;
      
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
            console.warn(`Error creating element with namespace: ${error.message}`);
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
            console.warn(`Error creating element with namespace: ${error.message}`);
            element = doc.createElement(elName);
          }
        }
      } else {
        // No namespace or not preserving namespaces
        element = doc.createElement(elName);
      }
      
      return element;
    }
    
    /**
     * Add attributes to an element
     * @param {Element} element - DOM element
     * @param {Object} attributes - Attributes object
     * @param {Object} context - Transform context
     * @param {Map} nsMap - Namespace URI to prefix map
     */
    addAttributesToElement(element, attributes, context, nsMap) {
      for (const [attrName, attrObj] of Object.entries(attributes)) {
        // Apply transform to attribute value if needed
        const originalAttrValue = attrObj[this.config.propNames.value];
        const attrValue = this.nodeProcessor.applyTransform(
          originalAttrValue, 
          {
            ...context,
            nodeName: attrName,
            nodeType: this.domEnv.nodeTypes.ATTRIBUTE_NODE,
            isAttribute: true,
          }
        ) ?? "";
  
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
    
    /**
     * Add content to an element
     * @param {Element} element - DOM element
     * @param {Object} jsonObj - JSON object
     * @param {string} valKey - Value property key
     * @param {Object} context - Transform context
     */
    addContentToElement(element, jsonObj, valKey, context) {
      // Check if content is mixed (contains HTML markup)
      const originalValue = jsonObj[valKey];
  
      // Apply transform if needed
      const value = this.nodeProcessor.applyTransform(originalValue, context);
  
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
          this.nodeProcessor.containsHtmlMarkup(contentValue)
        ) {
          // For mixed content, set innerHTML
          if (typeof element.innerHTML !== "undefined") {
            element.innerHTML = contentValue;
          } else {
            // Fallback for environments without innerHTML
            element.textContent = contentValue;
          }
        } else if (contentValue !== undefined) {
          // For simple text content
          element.textContent = String(contentValue);
        }
      }
    }
    
    /**
     * Pretty print an XML string
     * @param {string} xmlString - XML string to format
     * @returns {string} - Formatted XML string
     */
    prettyPrintXML(xmlString) {
      const PADDING = this.configManager.xmlIndent;
      
      // Handle XML declaration separately if present
      let declaration = "";
      if (xmlString.startsWith('<?xml')) {
        const endIndex = xmlString.indexOf('?>') + 2;
        declaration = xmlString.substring(0, endIndex) + '\n';
        xmlString = xmlString.substring(endIndex);
      }
    
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
    
      // Prepend the XML declaration if it was present
      return declaration + result.join("\n");
    }
  }
  
  export default JSONToXMLConverter;