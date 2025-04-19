/**
 * JSONToXMLConverter
 *
 * Handles converting JSON to XML with clean namespace handling
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
    const rootElName = Object.keys(jsonObj).find(key => !key.startsWith("@"));
    if (!rootElName) {
      throw new Error("Invalid JSON: No root element found");
    }

    const rootJSON = jsonObj[rootElName];

    // Only process namespaces if preserving them
    if (this.config.preserveNamespaces) {
      // Pre-scan to identify namespaces and assign prefixes
      const nsMap = this.scanNamespaces(jsonObj);
      
      // Create root element with proper namespace
      const rootEl = this.createElement(doc, rootElName, rootJSON, nsMap);
      
      // Declare all namespaces on the root element
      this.declareNamespaces(rootEl, nsMap);
      
      // Process root element (add attributes, content, and children)
      this.processElement(doc, rootEl, rootJSON, nsMap, true);
      
      // Add root to document
      doc.appendChild(rootEl);
    } else {
      // Simple processing without preserving namespaces
      const rootEl = this.createSimpleElement(doc, rootElName, rootJSON);
      this.processSimpleElement(doc, rootEl, rootJSON);
      doc.appendChild(rootEl);
    }

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
   * Scan the JSON object to collect all namespaces and assign prefixes
   * @param {Object} jsonObj - JSON object to scan
   * @returns {Object} - Namespace mapping information
   */
  scanNamespaces(jsonObj) {
    const nsKey = this.config.propNames.namespace;
    const childrenKey = this.config.propNames.children;
    const attrsKey = this.config.propNames.attributes;
    
    // Initialize namespace mapping
    const nsMap = {
      // URI to prefix mapping
      uriToPrefix: new Map(),
      // Prefix to URI mapping
      prefixToUri: new Map(),
      // Original prefixes from element and attribute names
      originalPrefixes: new Map(),
      // Track namespace URIs that should be reserved for their original prefixes
      reservedPrefixes: new Set(),
      // Next auto-generated prefix number
      nextPrefixNum: 1
    };
    
    // Helper to extract prefix from name
    const extractPrefix = (name) => {
      if (name.includes(':')) {
        return name.split(':')[0];
      }
      return null;
    };
    
    // Initial pass to collect all original prefixes
    const collectOriginalPrefixes = (name, nodeObj) => {
      // Check element namespace and prefix
      const ns = nodeObj[nsKey];
      if (ns) {
        const prefix = extractPrefix(name);
        if (prefix) {
          // Remember original prefix for this namespace
          if (!nsMap.originalPrefixes.has(ns)) {
            nsMap.originalPrefixes.set(ns, prefix);
            nsMap.reservedPrefixes.add(prefix);
          }
        }
      }
      
      // Check attribute namespaces and prefixes
      if (nodeObj[attrsKey]) {
        for (const [attrName, attrObj] of Object.entries(nodeObj[attrsKey])) {
          // Skip xmlns attributes
          if (attrName === 'xmlns' || attrName.startsWith('xmlns:')) {
            continue;
          }
          
          const attrNs = attrObj[nsKey];
          if (attrNs) {
            const prefix = extractPrefix(attrName);
            if (prefix) {
              // Remember original prefix for this namespace
              if (!nsMap.originalPrefixes.has(attrNs)) {
                nsMap.originalPrefixes.set(attrNs, prefix);
                nsMap.reservedPrefixes.add(prefix);
              }
            }
          }
        }
      }
      
      // Process children recursively
      if (Array.isArray(nodeObj[childrenKey])) {
        for (const childObj of nodeObj[childrenKey]) {
          for (const [childName, childData] of Object.entries(childObj)) {
            if (!childName.startsWith('@')) {
              collectOriginalPrefixes(childName, childData);
            }
          }
        }
      }
    };
    
    // Second pass to assign all prefixes
    const assignPrefixes = (name, nodeObj) => {
      // Process element namespace
      const ns = nodeObj[nsKey];
      if (ns && !nsMap.uriToPrefix.has(ns)) {
        // Use original prefix if available
        if (nsMap.originalPrefixes.has(ns)) {
          const prefix = nsMap.originalPrefixes.get(ns);
          nsMap.uriToPrefix.set(ns, prefix);
          nsMap.prefixToUri.set(prefix, ns);
        } else {
          // Generate new prefix
          let newPrefix;
          do {
            newPrefix = `ns${nsMap.nextPrefixNum++}`;
          } while (nsMap.reservedPrefixes.has(newPrefix));
          
          nsMap.uriToPrefix.set(ns, newPrefix);
          nsMap.prefixToUri.set(newPrefix, ns);
        }
      }
      
      // Process attribute namespaces
      if (nodeObj[attrsKey]) {
        for (const [attrName, attrObj] of Object.entries(nodeObj[attrsKey])) {
          // Skip xmlns attributes
          if (attrName === 'xmlns' || attrName.startsWith('xmlns:')) {
            if (attrName.startsWith('xmlns:')) {
              // Extract declared prefix and namespace
              const declaredPrefix = attrName.substring(6);
              const declaredNs = attrObj[this.config.propNames.value];
              
              if (declaredPrefix && declaredNs) {
                nsMap.reservedPrefixes.add(declaredPrefix);
                if (!nsMap.originalPrefixes.has(declaredNs)) {
                  nsMap.originalPrefixes.set(declaredNs, declaredPrefix);
                }
              }
            }
            continue;
          }
          
          const attrNs = attrObj[nsKey];
          if (attrNs && !nsMap.uriToPrefix.has(attrNs)) {
            // Use original prefix if available
            if (nsMap.originalPrefixes.has(attrNs)) {
              const prefix = nsMap.originalPrefixes.get(attrNs);
              nsMap.uriToPrefix.set(attrNs, prefix);
              nsMap.prefixToUri.set(prefix, attrNs);
            } else {
              // Generate new prefix
              let newPrefix;
              do {
                newPrefix = `ns${nsMap.nextPrefixNum++}`;
              } while (nsMap.reservedPrefixes.has(newPrefix));
              
              nsMap.uriToPrefix.set(attrNs, newPrefix);
              nsMap.prefixToUri.set(newPrefix, attrNs);
            }
          }
        }
      }
      
      // Process children recursively
      if (Array.isArray(nodeObj[childrenKey])) {
        for (const childObj of nodeObj[childrenKey]) {
          for (const [childName, childData] of Object.entries(childObj)) {
            if (!childName.startsWith('@')) {
              assignPrefixes(childName, childData);
            }
          }
        }
      }
    };
    
    // Start with the root element
    const rootName = Object.keys(jsonObj)[0];
    const rootObj = jsonObj[rootName];
    
    // First collect original prefixes
    collectOriginalPrefixes(rootName, rootObj);
    
    // Then assign prefixes to all namespaces
    assignPrefixes(rootName, rootObj);
    
    return nsMap;
  }

  /**
   * Declare all namespaces on the root element
   * @param {Element} rootEl - Root element
   * @param {Object} nsMap - Namespace mapping
   */
  declareNamespaces(rootEl, nsMap) {
    // Add all namespace declarations to root
    for (const [uri, prefix] of nsMap.uriToPrefix.entries()) {
      if (uri && prefix) {
        rootEl.setAttributeNS('http://www.w3.org/2000/xmlns/', `xmlns:${prefix}`, uri);
      }
    }
  }

  /**
   * Create an element with proper namespace
   * @param {Document} doc - DOM document
   * @param {string} name - Element name
   * @param {Object} nodeObj - Element JSON object
   * @param {Object} nsMap - Namespace mapping
   * @returns {Element} - Created element
   */
  createElement(doc, name, nodeObj, nsMap) {
    const nsUri = nodeObj[this.config.propNames.namespace] || '';
    
    // Handle element with namespace
    if (nsUri) {
      // Get local name (without prefix)
      const localName = name.includes(':') ? name.split(':')[1] : name;
      
      // Get assigned prefix for this namespace
      const prefix = nsMap.uriToPrefix.get(nsUri);
      
      if (prefix) {
        // Create with namespace and assigned prefix
        try {
          return doc.createElementNS(nsUri, `${prefix}:${localName}`);
        } catch (e) {
          console.warn(`Error creating element with namespace: ${e.message}`);
          return doc.createElement(localName);
        }
      } else {
        // No prefix assigned (should not happen)
        return doc.createElement(localName);
      }
    }
    
    // No namespace - create simple element
    const localName = name.includes(':') ? name.split(':')[1] : name;
    return doc.createElement(localName);
  }

  /**
   * Create an element without namespace handling
   * @param {Document} doc - DOM document
   * @param {string} name - Element name
   * @param {Object} nodeObj - Element JSON object
   * @returns {Element} - Created element
   */
  createSimpleElement(doc, name, nodeObj) {
    // Strip prefix if configured
    if (this.config.stripPrefixes && name.includes(':')) {
      return doc.createElement(name.split(':')[1]);
    }
    return doc.createElement(name);
  }

  /**
   * Process an element with namespace support
   * @param {Document} doc - DOM document
   * @param {Element} element - Element to process
   * @param {Object} nodeObj - Element JSON object
   * @param {Object} nsMap - Namespace mapping
   * @param {boolean} isRoot - Whether this is the root element
   */
  processElement(doc, element, nodeObj, nsMap, isRoot = false) {
    const nsKey = this.config.propNames.namespace;
    const valKey = this.config.propNames.value;
    const attrsKey = this.config.propNames.attributes;
    const cdataKey = this.config.propNames.cdata;
    const commentsKey = this.config.propNames.comments;
    const processingKey = this.config.propNames.processing;
    const childrenKey = this.config.propNames.children;
    
    // Create transform context
    const context = this.nodeProcessor.createTransformContext(
      {
        nodeType: this.domEnv.nodeTypes.ELEMENT_NODE,
        namespaceURI: nodeObj[nsKey] || ""
      },
      element.nodeName,
      "json-to-xml"
    );
    
    // Add attributes (skip xmlns attributes unless this is the root)
    if (nodeObj[attrsKey]) {
      // Process attributes
      for (const [attrName, attrObj] of Object.entries(nodeObj[attrsKey])) {
        // Skip xmlns attributes except at root
        if ((attrName === 'xmlns' || attrName.startsWith('xmlns:')) && !isRoot) {
          continue;
        }
        
        // Get attribute value
        const attrVal = attrObj[valKey];
        if (attrVal === undefined) {
          continue;
        }
        
        // Convert to string if needed
        const strVal = typeof attrVal === 'boolean' || typeof attrVal === 'number'
          ? String(attrVal)
          : attrVal;
        
        // Apply transform if configured
        const transformedVal = this.nodeProcessor.applyTransform(strVal, {
          ...context,
          nodeName: attrName,
          nodeType: this.domEnv.nodeTypes.ATTRIBUTE_NODE,
          isAttribute: true
        }) ?? strVal;
        
        // Special handling for xmlns attributes on root
        if (isRoot && (attrName === 'xmlns' || attrName.startsWith('xmlns:'))) {
          element.setAttribute(attrName, transformedVal);
          continue;
        }
        
        // Process attribute namespace
        const attrNs = attrObj[nsKey] || '';
        
        if (attrNs) {
          // Get assigned prefix
          const prefix = nsMap.uriToPrefix.get(attrNs);
          
          if (prefix) {
            // Get local name (without prefix)
            const localName = attrName.includes(':') ? attrName.split(':')[1] : attrName;
            
            try {
              // Set attribute with namespace and assigned prefix
              element.setAttributeNS(attrNs, `${prefix}:${localName}`, transformedVal);
            } catch (e) {
              // Fallback to regular attribute
              element.setAttribute(localName, transformedVal);
            }
          } else {
            // No prefix assigned (should not happen)
            element.setAttribute(attrName, transformedVal);
          }
        } else {
          // Regular attribute without namespace
          element.setAttribute(attrName, transformedVal);
        }
      }
    }
    
    // Add content
    const content = nodeObj[valKey];
    if (content !== undefined && content !== null) {
      // Format content
      const strContent = typeof content === 'boolean' || typeof content === 'number'
        ? String(content)
        : content;
      
      // Apply transform if configured
      const transformedContent = this.nodeProcessor.applyTransform(strContent, context) ?? strContent;
      
      // Add content to element
      if (typeof transformedContent === 'string') {
        if (this.nodeProcessor.containsHtmlMarkup(transformedContent)) {
          // Mixed content
          if (typeof element.innerHTML !== 'undefined') {
            element.innerHTML = transformedContent;
          } else {
            element.textContent = transformedContent;
          }
        } else {
          // Simple text
          element.textContent = transformedContent;
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
    if (this.config.preserveProcessingInstr && Array.isArray(nodeObj[processingKey])) {
      for (const piText of nodeObj[processingKey]) {
        const [target, data] = piText.split(' ', 2);
        const pi = doc.createProcessingInstruction(target, data || '');
        element.appendChild(pi);
      }
    }
    
    // Process children
    if (Array.isArray(nodeObj[childrenKey])) {
      for (const childObj of nodeObj[childrenKey]) {
        for (const [childName, childData] of Object.entries(childObj)) {
          if (!childName.startsWith('@')) {
            // Create child with namespace
            const childEl = this.createElement(doc, childName, childData, nsMap);
            
            // Process child element
            this.processElement(doc, childEl, childData, nsMap, false);
            
            // Add to parent
            element.appendChild(childEl);
          }
        }
      }
    }
  }

  /**
   * Process an element without namespace support
   * @param {Document} doc - DOM document
   * @param {Element} element - Element to process
   * @param {Object} nodeObj - Element JSON object
   */
  processSimpleElement(doc, element, nodeObj) {
    const valKey = this.config.propNames.value;
    const attrsKey = this.config.propNames.attributes;
    const cdataKey = this.config.propNames.cdata;
    const commentsKey = this.config.propNames.comments;
    const processingKey = this.config.propNames.processing;
    const childrenKey = this.config.propNames.children;
    
    // Create transform context
    const context = this.nodeProcessor.createTransformContext(
      {
        nodeType: this.domEnv.nodeTypes.ELEMENT_NODE,
        namespaceURI: ""
      },
      element.nodeName,
      "json-to-xml"
    );
    
    // Add attributes (without namespace handling)
    if (nodeObj[attrsKey]) {
      for (const [attrName, attrObj] of Object.entries(nodeObj[attrsKey])) {
        // Skip xmlns attributes
        if (attrName === 'xmlns' || attrName.startsWith('xmlns:')) {
          continue;
        }
        
        // Get attribute value
        const attrVal = attrObj[valKey];
        if (attrVal === undefined) {
          continue;
        }
        
        // Convert to string if needed
        const strVal = typeof attrVal === 'boolean' || typeof attrVal === 'number'
          ? String(attrVal)
          : attrVal;
        
        // Apply transform if configured
        const transformedVal = this.nodeProcessor.applyTransform(strVal, {
          ...context,
          nodeName: attrName,
          nodeType: this.domEnv.nodeTypes.ATTRIBUTE_NODE,
          isAttribute: true
        }) ?? strVal;
        
        // Strip prefix if configured
        const processedName = this.config.stripPrefixes && attrName.includes(':')
          ? attrName.split(':')[1]
          : attrName;
        
        // Add attribute
        element.setAttribute(processedName, transformedVal);
      }
    }
    
    // Add content
    const content = nodeObj[valKey];
    if (content !== undefined && content !== null) {
      // Format content
      const strContent = typeof content === 'boolean' || typeof content === 'number'
        ? String(content)
        : content;
      
      // Apply transform if configured
      const transformedContent = this.nodeProcessor.applyTransform(strContent, context) ?? strContent;
      
      // Add content to element
      if (typeof transformedContent === 'string') {
        if (this.nodeProcessor.containsHtmlMarkup(transformedContent)) {
          // Mixed content
          if (typeof element.innerHTML !== 'undefined') {
            element.innerHTML = transformedContent;
          } else {
            element.textContent = transformedContent;
          }
        } else {
          // Simple text
          element.textContent = transformedContent;
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
    if (this.config.preserveProcessingInstr && Array.isArray(nodeObj[processingKey])) {
      for (const piText of nodeObj[processingKey]) {
        const [target, data] = piText.split(' ', 2);
        const pi = doc.createProcessingInstruction(target, data || '');
        element.appendChild(pi);
      }
    }
    
    // Process children
    if (Array.isArray(nodeObj[childrenKey])) {
      for (const childObj of nodeObj[childrenKey]) {
        for (const [childName, childData] of Object.entries(childObj)) {
          if (!childName.startsWith('@')) {
            // Create child without namespace
            const childEl = this.createSimpleElement(doc, childName, childData);
            
            // Process child element
            this.processSimpleElement(doc, childEl, childData);
            
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
    const PADDING = typeof this.config.outputOptions.indent === 'number'
      ? ' '.repeat(this.config.outputOptions.indent)
      : '  ';

    // Handle XML declaration separately if present
    let declaration = "";
    if (xmlString.startsWith("<?xml")) {
      const endIndex = xmlString.indexOf("?>") + 2;
      declaration = xmlString.substring(0, endIndex) + "\n";
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

      if (isClosingTag) {
        indentLevel = Math.max(indentLevel - 1, 0);
      }

      const indent = PADDING.repeat(indentLevel);
      result.push(indent + line);

      if (isOpeningTag) {
        indentLevel++;
      }
    }

    // Prepend the XML declaration if it was present
    return declaration + result.join("\n");
  }
}

export default JSONToXMLConverter;