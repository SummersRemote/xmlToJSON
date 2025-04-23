import { JSDOM } from 'jsdom';
import NodeProcessor from '../../../../src/core/components/NodeProcessor.js';
import ConfigurationManager from '../../../../src/core/components/ConfigurationManager.js';
import ValueTransformer from '../../../../src/core/transformers/ValueTransformer.js';
import { createTestConfig } from '../../../helpers/testUtils.js';
import { TransformerError } from '../../../../src/core/errors/TransformerError.js';
import { TextEncoder, TextDecoder } from 'util';

// Polyfills for jsdom
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Create DOM environment using jsdom
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  contentType: 'text/xml'
});

const domEnv = {
  nodeTypes: {
    ELEMENT_NODE: dom.window.Node.ELEMENT_NODE,
    TEXT_NODE: dom.window.Node.TEXT_NODE,
    CDATA_SECTION_NODE: dom.window.Node.CDATA_SECTION_NODE,
    COMMENT_NODE: dom.window.Node.COMMENT_NODE,
    PROCESSING_INSTRUCTION_NODE: dom.window.Node.PROCESSING_INSTRUCTION_NODE,
    ATTRIBUTE_NODE: dom.window.Node.ATTRIBUTE_NODE
  },
  createSerializer: () => new dom.window.XMLSerializer(),
  createDocument: () => dom.window.document.implementation.createDocument(null, null, null)
};

// Helper to create DOM nodes for testing
function createNode(html) {
  const container = dom.window.document.createElement('div');
  container.innerHTML = html;
  return container.firstChild;
}

describe('NodeProcessor', () => {
  let nodeProcessor;
  let configManager;
  let testConfig;
  
  beforeEach(() => {
    testConfig = createTestConfig();
    configManager = new ConfigurationManager(testConfig);
    nodeProcessor = new NodeProcessor(configManager, domEnv);
  });
  
  describe('isStructuralNode', () => {
    test('should return false for non-element nodes', () => {
      const textNode = dom.window.document.createTextNode('Some text');
      expect(nodeProcessor.isStructuralNode(textNode)).toBe(false);
    });
    
    test('should return false for element nodes without children', () => {
      const elementNode = dom.window.document.createElement('div');
      expect(nodeProcessor.isStructuralNode(elementNode)).toBe(false);
    });
    
    test('should return true for elements with only whitespace text nodes', () => {
      const elementNode = createNode(`<div>   <span></span></div>`);
      expect(nodeProcessor.isStructuralNode(elementNode)).toBe(true);
    });
    
    test('should return false for elements with non-whitespace text nodes', () => {
      const elementNode = createNode(`<div>Some text<span></span></div>`);
      expect(nodeProcessor.isStructuralNode(elementNode)).toBe(false);
    });
  });
  
  describe('hasMixedContent', () => {
    test('should return false for non-element nodes', () => {
      const textNode = dom.window.document.createTextNode('Some text');
      expect(nodeProcessor.hasMixedContent(textNode)).toBe(false);
    });
    
    test('should return false for element nodes without children', () => {
      const elementNode = dom.window.document.createElement('div');
      expect(nodeProcessor.hasMixedContent(elementNode)).toBe(false);
    });
    
    test('should return false if text nodes are not preserved', () => {
      // Override config to not preserve text nodes
      testConfig.preserveTextNodes = false;
      configManager = new ConfigurationManager(testConfig);
      nodeProcessor = new NodeProcessor(configManager, domEnv);
      
      const elementNode = createNode(`<div>Some text<span></span></div>`);
      expect(nodeProcessor.hasMixedContent(elementNode)).toBe(false);
    });
    
    test('should return true for elements with both text and element nodes', () => {
      const elementNode = createNode(`<div>Some text<span></span></div>`);
      expect(nodeProcessor.hasMixedContent(elementNode)).toBe(true);
    });
    
    test('should ignore whitespace-only text nodes when checking for mixed content', () => {
      const elementNode = createNode(`<div>   <span></span></div>`);
      expect(nodeProcessor.hasMixedContent(elementNode)).toBe(false);
    });
  });
  
  describe('getInnerHTML', () => {
    test('should return innerHTML if available', () => {
      const node = createNode(`<div><span>Test</span></div>`);
      expect(nodeProcessor.getInnerHTML(node)).toContain('<span>Test</span>');
    });
    
    test('should fallback to serializing child nodes if innerHTML not available', () => {
      // Create a node and remove the innerHTML property to test fallback
      const node = createNode(`<div><p>Child 1</p><p>Child 2</p></div>`);
      
      // Store the original method
      const originalInnerHTML = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(node), 'innerHTML'
      );
      
      // Delete innerHTML temporarily
      Object.defineProperty(node, 'innerHTML', {
        get: undefined,
        configurable: true
      });
      
      // Test the fallback
      const result = nodeProcessor.getInnerHTML(node);
      
      // Restore original innerHTML
      if (originalInnerHTML) {
        Object.defineProperty(node, 'innerHTML', originalInnerHTML);
      }
      
      expect(result).toContain('Child 1');
      expect(result).toContain('Child 2');
    });
  });
  
  describe('createContext', () => {
    test('should create a context with required properties', () => {
      const context = nodeProcessor.createContext({
        direction: 'xml-to-json',
        nodeName: 'testNode',
        nodeType: domEnv.nodeTypes.ELEMENT_NODE,
        namespaceURI: 'http://example.org'
      });
      
      expect(context).toEqual({
        direction: 'xml-to-json',
        nodeName: 'testNode',
        nodeType: domEnv.nodeTypes.ELEMENT_NODE,
        namespaceURI: 'http://example.org',
        isAttribute: false,
        parentContext: null,
        metadata: {}
      });
    });
    
    test('should set isAttribute based on nodeType', () => {
      const context = nodeProcessor.createContext({
        direction: 'xml-to-json',
        nodeName: 'attr',
        nodeType: domEnv.nodeTypes.ATTRIBUTE_NODE
      });
      
      expect(context.isAttribute).toBe(true);
    });
    
    test('should override isAttribute with provided value', () => {
      const context = nodeProcessor.createContext({
        direction: 'xml-to-json',
        nodeName: 'testNode',
        nodeType: domEnv.nodeTypes.ELEMENT_NODE,
        isAttribute: true
      });
      
      expect(context.isAttribute).toBe(true);
    });
    
    test('should throw error if required properties are missing', () => {
      expect(() => {
        nodeProcessor.createContext({
          // Missing direction
          nodeName: 'testNode',
          nodeType: domEnv.nodeTypes.ELEMENT_NODE
        });
      }).toThrow(TransformerError);
      
      expect(() => {
        nodeProcessor.createContext({
          direction: 'xml-to-json',
          // Missing nodeName
          nodeType: domEnv.nodeTypes.ELEMENT_NODE
        });
      }).toThrow(TransformerError);
      
      expect(() => {
        nodeProcessor.createContext({
          direction: 'xml-to-json',
          nodeName: 'testNode'
          // Missing nodeType
        });
      }).toThrow(TransformerError);
    });
  });
  
  describe('applyTransform', () => {
    test('should return original value if no transformers configured', () => {
      const value = 'test value';
      const context = {
        direction: 'xml-to-json',
        nodeName: 'testNode',
        nodeType: domEnv.nodeTypes.TEXT_NODE
      };
      
      expect(nodeProcessor.applyTransform(value, context)).toBe(value);
    });
    
    test('should apply all transformers in sequence', () => {
      // Create test transformers
      class TestTransformer1 extends ValueTransformer {
        process(value) {
          return value + '_t1';
        }
      }
      
      class TestTransformer2 extends ValueTransformer {
        process(value) {
          return value + '_t2';
        }
      }
      
      // Create processor with transformers
      const config = createTestConfig({
        valueTransforms: [new TestTransformer1(), new TestTransformer2()]
      });
      const configManager = new ConfigurationManager(config);
      const processor = new NodeProcessor(configManager, domEnv);
      
      const value = 'test';
      const context = {
        direction: 'xml-to-json',
        nodeName: 'testNode',
        nodeType: domEnv.nodeTypes.TEXT_NODE
      };
      
      expect(processor.applyTransform(value, context)).toBe('test_t1_t2');
    });
    
    test('should throw error if a transformer is invalid', () => {
      // Invalid transformer without process method
      const invalidTransformer = {};
      
      // Create processor with invalid transformer
      const config = createTestConfig({
        valueTransforms: [invalidTransformer]
      });
      const configManager = new ConfigurationManager(config);
      const processor = new NodeProcessor(configManager, domEnv);
      
      expect(() => {
        processor.applyTransform('test', {
          direction: 'xml-to-json',
          nodeName: 'testNode',
          nodeType: domEnv.nodeTypes.TEXT_NODE
        });
      }).toThrow(TransformerError);
    });
    
    test('should handle undefined or null values', () => {
      expect(nodeProcessor.applyTransform(undefined)).toBe(undefined);
      expect(nodeProcessor.applyTransform(null)).toBe(null);
    });
    
    test('should create context if only options provided', () => {
      const value = 'test';
      const result = nodeProcessor.applyTransform(value, {
        direction: 'xml-to-json',
        nodeName: 'testNode',
        nodeType: domEnv.nodeTypes.TEXT_NODE
      });
      
      expect(result).toBe(value);
    });
  });
  
  describe('containsHtmlMarkup', () => {
    test('should return true for strings with HTML tags', () => {
      expect(nodeProcessor.containsHtmlMarkup('<span>Test</span>')).toBe(true);
      expect(nodeProcessor.containsHtmlMarkup('Text with <br> tag')).toBe(true);
      expect(nodeProcessor.containsHtmlMarkup('<img src="test.jpg">')).toBe(true);
    });
    
    test('should return false for strings without HTML tags', () => {
      expect(nodeProcessor.containsHtmlMarkup('Plain text')).toBe(false);
      expect(nodeProcessor.containsHtmlMarkup('Text with > symbol')).toBe(false);
      expect(nodeProcessor.containsHtmlMarkup('1 < 2 is true')).toBe(false);
    });
    
    test('should return false for non-string values', () => {
      expect(nodeProcessor.containsHtmlMarkup(null)).toBe(false);
      expect(nodeProcessor.containsHtmlMarkup(undefined)).toBe(false);
      expect(nodeProcessor.containsHtmlMarkup(123)).toBe(false);
      expect(nodeProcessor.containsHtmlMarkup({})).toBe(false);
    });
  });
});