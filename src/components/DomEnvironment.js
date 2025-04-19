/**
 * DOMEnvironment module
 * 
 * Provides a unified DOM API that works in both browser and Node.js environments
 */

// Environment detection and setup - utilizing a more modular approach
const DOMEnvironment = (() => {
    // Environment-specific DOM implementation
    let domParser, xmlSerializer, nodeTypes, docImplementation;
  
    if (typeof window === "undefined") {
      // Node.js environment - use JSDOM
      try {
        const { JSDOM } = require("jsdom");
        const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
          contentType: "text/xml",
        });
  
        domParser = dom.window.DOMParser;
        xmlSerializer = dom.window.XMLSerializer;
        nodeTypes = {
          ELEMENT_NODE: dom.window.Node.ELEMENT_NODE,
          TEXT_NODE: dom.window.Node.TEXT_NODE,
          CDATA_SECTION_NODE: dom.window.Node.CDATA_SECTION_NODE,
          COMMENT_NODE: dom.window.Node.COMMENT_NODE,
          PROCESSING_INSTRUCTION_NODE: dom.window.Node.PROCESSING_INSTRUCTION_NODE,
          ATTRIBUTE_NODE: dom.window.Node.ATTRIBUTE_NODE
        };
        docImplementation = dom.window.document.implementation;
      } catch (error) {
        throw new Error(`Failed to initialize JSDOM: ${error.message}`);
      }
    } else {
      // Browser environment
      domParser = window.DOMParser;
      xmlSerializer = window.XMLSerializer;
      nodeTypes = {
        ELEMENT_NODE: Node.ELEMENT_NODE,
        TEXT_NODE: Node.TEXT_NODE,
        CDATA_SECTION_NODE: Node.CDATA_SECTION_NODE,
        COMMENT_NODE: Node.COMMENT_NODE,
        PROCESSING_INSTRUCTION_NODE: Node.PROCESSING_INSTRUCTION_NODE,
        ATTRIBUTE_NODE: Node.ATTRIBUTE_NODE
      };
      docImplementation = document.implementation;
    }
  
    return {
      createParser: () => new domParser(),
      createSerializer: () => new xmlSerializer(),
      nodeTypes,
      implementation: docImplementation,
      createDocument: (...args) => docImplementation.createDocument(...args)
    };
  })();
  
  export default DOMEnvironment;