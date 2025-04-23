import { TransformerError } from "../errors/TransformerError.js";
import { ErrorCodes } from "../errors/ErrorCodes.js";

/**
 * DOMEnvironment module
 *
 * Provides a unified DOM API that works in both browser and Node.js environments
 */

// Environment detection and setup - utilizing a more modular approach
const DOMEnvironment = (() => {
  // Environment-specific DOM implementation
  let domParser, xmlSerializer, nodeTypes, docImplementation;

  try {
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
          PROCESSING_INSTRUCTION_NODE:
            dom.window.Node.PROCESSING_INSTRUCTION_NODE,
          ATTRIBUTE_NODE: dom.window.Node.ATTRIBUTE_NODE,
        };
        docImplementation = dom.window.document.implementation;
      } catch (error) {
        console.error(
          `[${ErrorCodes.DOM_ERROR}] Failed to initialize JSDOM: ${error.message}`
        );
        throw new TransformerError(
          `Failed to initialize JSDOM: ${error.message}`,
          ErrorCodes.DOM_ERROR
        );
      }
    } else {
      // Browser environment
      if (!window.DOMParser) {
        console.error(
          `[${ErrorCodes.DOM_ERROR}] DOMParser is not available in this environment`
        );
        throw new TransformerError(
          "DOMParser is not available in this environment",
          ErrorCodes.DOM_ERROR
        );
      }

      if (!window.XMLSerializer) {
        console.error(
          `[${ErrorCodes.DOM_ERROR}] XMLSerializer is not available in this environment`
        );
        throw new TransformerError(
          "XMLSerializer is not available in this environment",
          ErrorCodes.DOM_ERROR
        );
      }

      domParser = window.DOMParser;
      xmlSerializer = window.XMLSerializer;
      nodeTypes = {
        ELEMENT_NODE: Node.ELEMENT_NODE,
        TEXT_NODE: Node.TEXT_NODE,
        CDATA_SECTION_NODE: Node.CDATA_SECTION_NODE,
        COMMENT_NODE: Node.COMMENT_NODE,
        PROCESSING_INSTRUCTION_NODE: Node.PROCESSING_INSTRUCTION_NODE,
        ATTRIBUTE_NODE: Node.ATTRIBUTE_NODE,
      };
      docImplementation = document.implementation;
    }
  } catch (error) {
    console.error(
      `[${ErrorCodes.DOM_ERROR}] DOM environment initialization failed: ${error.message}`
    );
    throw new TransformerError(
      `DOM environment initialization failed: ${error.message}`,
      ErrorCodes.DOM_ERROR
    );
  }

  return {
    createParser: () => {
      try {
        return new domParser();
      } catch (error) {
        console.error(
          `[${ErrorCodes.DOM_ERROR}] Failed to create DOM parser: ${error.message}`
        );
        throw new TransformerError(
          `Failed to create DOM parser: ${error.message}`,
          ErrorCodes.DOM_ERROR
        );
      }
    },
    createSerializer: () => {
      try {
        return new xmlSerializer();
      } catch (error) {
        console.error(
          `[${ErrorCodes.DOM_ERROR}] Failed to create XML serializer: ${error.message}`
        );
        throw new TransformerError(
          `Failed to create XML serializer: ${error.message}`,
          ErrorCodes.DOM_ERROR
        );
      }
    },
    nodeTypes,
    implementation: docImplementation,
    createDocument: (...args) => {
      try {
        return docImplementation.createDocument(...args);
      } catch (error) {
        console.error(
          `[${ErrorCodes.DOM_ERROR}] Failed to create document: ${error.message}`
        );
        throw new TransformerError(
          `Failed to create document: ${error.message}`,
          ErrorCodes.DOM_ERROR
        );
      }
    },
  };
})();

export default DOMEnvironment;
