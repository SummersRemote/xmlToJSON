import NodeProcessor from '../../../../src/core/components/NodeProcessor';
import ConfigurationManager from '../../../../src/core/components/ConfigurationManager';
import DOMEnvironment from '../../../../src/core/components/DomEnvironment';
import ValueTransformer from '../../../../src/core/transformers/ValueTransformer';
import { TransformerError } from '../../../../src/core/errors/TransformerError';
import { createTestConfig } from '../../../helpers/testUtils';

describe('NodeProcessor', () => {
  let nodeProcessor;
  let configManager;
  let mockDomEnv;
  
  // Create a simple custom transformer for testing
  class TestTransformer extends ValueTransformer {
    process(value, context = {}) {
      if (typeof value === 'string') {
        return value.toUpperCase();
      }
      return value;
    }
  }
  
  beforeEach(() => {
    // Set up a mock DOM environment for testing
    mockDomEnv = {
      nodeTypes: {
        ELEMENT_NODE: 1,
        ATTRIBUTE_NODE: 2,
        TEXT_NODE: 3,
        CDATA_SECTION_NODE: 4,
        PROCESSING_INSTRUCTION_NODE: 7,
        COMMENT_NODE: 8
      },
      createSerializer: jest.fn().mockReturnValue({
        serializeToString: jest.fn(node => {
          if (node.nodeType === mockDomEnv.nodeTypes.TEXT_NODE) {
            return node.textContent;
          }
          return `<${node.nodeName}>${node.textContent}</${node.nodeName}>`;
        })
      })
    };
    
    // Create a test configuration with value transformers
    const testConfig = createTestConfig({
      valueTransforms: [new TestTransformer()]
    });
    
    configManager = new ConfigurationManager(testConfig);
    nodeProcessor = new NodeProcessor(configManager, mockDomEnv);
  });
  
  describe('constructor', () => {
    test('should initialize with config manager and DOM environment', () => {
      expect(nodeProcessor.configManager).toBe(configManager);
      expect(nodeProcessor.domEnv).toBe(mockDomEnv);
      expect(nodeProcessor.config).toBe(configManager.config);
      expect(nodeProcessor.valueTransforms).toHaveLength(1);
      expect(nodeProcessor.valueTransforms[0]).toBeInstanceOf(TestTransformer);
    });
  });
  
  describe('isStructuralNode', () => {
    test('should identify structural nodes correctly', () => {
      // Mock a structural node (has only element children and whitespace text)
      const structuralNode = {
        nodeType: mockDomEnv.nodeTypes.ELEMENT_NODE,
        hasChildNodes: () => true,
        childNodes: [
          { nodeType: mockDomEnv.nodeTypes.TEXT_NODE, textContent: ' ' },
          { nodeType: mockDomEnv.nodeTypes.ELEMENT_NODE },
          { nodeType: mockDomEnv.nodeTypes.TEXT_NODE, textContent: '\n  ' }
        ]
      };
      
      expect(nodeProcessor.isStructuralNode(structuralNode)).toBe(true);
    });
    
    test('should identify non-structural nodes correctly', () => {
      // Mock a node with meaningful text content
      const nonStructuralNode = {
        nodeType: mockDomEnv.nodeTypes.ELEMENT_NODE,
        hasChildNodes: () => true,
        childNodes: [
          { nodeType: mockDomEnv.nodeTypes.TEXT_NODE, textContent: 'This is text content' },
          { nodeType: mockDomEnv.nodeTypes.ELEMENT_NODE }
        ]
      };
      
      expect(nodeProcessor.isStructuralNode(nonStructuralNode)).toBe(false);
    });
    
    test('should return false for non-element nodes', () => {
      const textNode = { nodeType: mockDomEnv.nodeTypes.TEXT_NODE };
      expect(nodeProcessor.isStructuralNode(textNode)).toBe(false);
    });
    
    test('should return false for nodes without children', () => {
      const emptyNode = {
        nodeType: mockDomEnv.nodeTypes.ELEMENT_NODE,
        hasChildNodes: () => false
      };
      expect(nodeProcessor.isStructuralNode(emptyNode)).toBe(false);
    });
  });
  
  describe('hasMixedContent', () => {
    test('should identify nodes with mixed content', () => {
      // Mock a node with both text and element children
      const mixedNode = {
        nodeType: mockDomEnv.nodeTypes.ELEMENT_NODE,
        hasChildNodes: () => true,
        childNodes: [
          { nodeType: mockDomEnv.nodeTypes.TEXT_NODE, textContent: 'Text content' },
          { nodeType: mockDomEnv.nodeTypes.ELEMENT_NODE }
        ]
      };
      
      expect(nodeProcessor.hasMixedContent(mixedNode)).toBe(true);
    });
    
    test('should not identify nodes with only whitespace and elements as mixed', () => {
      // Mock a node with whitespace text and element children
      const notMixedNode = {
        nodeType: mockDomEnv.nodeTypes.ELEMENT_NODE,
        hasChildNodes: () => true,
        childNodes: [
          { nodeType: mockDomEnv.nodeTypes.TEXT_NODE, textContent: ' \n ' },
          { nodeType: mockDomEnv.nodeTypes.ELEMENT_NODE }
        ]
      };
      
      expect(nodeProcessor.hasMixedContent(notMixedNode)).toBe(false);
    });
    
    test('should not identify nodes with only elements as mixed', () => {
      const elementsOnlyNode = {
        nodeType: mockDomEnv.nodeTypes.ELEMENT_NODE,
        hasChildNodes: () => true,
        childNodes: [
          { nodeType: mockDomEnv.nodeTypes.ELEMENT_NODE },
          { nodeType: mockDomEnv.nodeTypes.ELEMENT_NODE }
        ]
      };
      
      expect(nodeProcessor.hasMixedContent(elementsOnlyNode)).toBe(false);
    });
    
    test('should not identify nodes with only text as mixed', () => {
      const textOnlyNode = {
        nodeType: mockDomEnv.nodeTypes.ELEMENT_NODE,
        hasChildNodes: () => true,
        childNodes: [
          { nodeType: mockDomEnv.nodeTypes.TEXT_NODE, textContent: 'Text content' }
        ]
      };
      
      expect(nodeProcessor.hasMixedContent(textOnlyNode)).toBe(false);
    });
    
    test('should return false if preserveTextNodes is false', () => {
      // Create a processor with preserveTextNodes = false
      const config = createTestConfig({ preserveTextNodes: false });
      const configMgr = new ConfigurationManager(config);
      const processor = new NodeProcessor(configMgr, mockDomEnv);
      
      const mixedNode = {
        nodeType: mockDomEnv.nodeTypes.ELEMENT_NODE,
        hasChildNodes: () => true,
        childNodes: [
          { nodeType: mockDomEnv.nodeTypes.TEXT_NODE, textContent: 'Text content' },
          { nodeType: mockDomEnv.nodeTypes.ELEMENT_NODE }
        ]
      };
      
      expect(processor.hasMixedContent(mixedNode)).toBe(false);
    });
  });
  
  describe('getInnerHTML', () => {
    test('should return innerHTML if available', () => {
      const node = {
        innerHTML: '<child>content</child>'
      };
      
      expect(nodeProcessor.getInnerHTML(node)).toBe('<child>content</child>');
    });
    
    test('should use serializer fallback if innerHTML not available', () => {
      const node = {
        childNodes: [
          { 
            nodeType: mockDomEnv.nodeTypes.ELEMENT_NODE, 
            nodeName: 'child',
            textContent: 'content'
          }
        ]
      };
      
      expect(nodeProcessor.getInnerHTML(node)).toBe('<child>content</child>');
    });
  });
  
  describe('createContext', () => {
    test('should create a standardized context object', () => {
      const options = {
        direction: 'xml-to-json',
        nodeName: 'test',
        nodeType: mockDomEnv.nodeTypes.ELEMENT_NODE,
        namespaceURI: 'http://example.org',
        isAttribute: false,
        metadata: { test: true }
      };
      
      const context = nodeProcessor.createContext(options);
      
      expect(context).toEqual({
        direction: 'xml-to-json',
        nodeName: 'test',
        nodeType: mockDomEnv.nodeTypes.ELEMENT_NODE,
        namespaceURI: 'http://example.org',
        isAttribute: false,
        parentContext: null,
        metadata: { test: true }
      });
    });
    
    test('should set default values for optional properties', () => {
      const options = {
        direction: 'xml-to-json',
        nodeName: 'test',
        nodeType: mockDomEnv.nodeTypes.ELEMENT_NODE
      };
      
      const context = nodeProcessor.createContext(options);
      
      expect(context.namespaceURI).toBe('');
      expect(context.isAttribute).toBe(false);
      expect(context.parentContext).toBeNull();
      expect(context.metadata).toEqual({});
    });
    
    test('should set isAttribute to true for attribute nodes', () => {
      const options = {
        direction: 'xml-to-json',
        nodeName: 'test',
        nodeType: mockDomEnv.nodeTypes.ATTRIBUTE_NODE
      };
      
      const context = nodeProcessor.createContext(options);
      
      expect(context.isAttribute).toBe(true);
    });
    
    test('should throw error if required properties are missing', () => {
      // Missing direction
      expect(() => nodeProcessor.createContext({
        nodeName: 'test',
        nodeType: 1
      })).toThrow(TransformerError);
      
      // Missing nodeName
      expect(() => nodeProcessor.createContext({
        direction: 'xml-to-json',
        nodeType: 1
      })).toThrow(TransformerError);
      
      // Missing nodeType
      expect(() => nodeProcessor.createContext({
        direction: 'xml-to-json',
        nodeName: 'test'
      })).toThrow(TransformerError);
    });
  });
  
  describe('applyTransform', () => {
    test('should process value through transformer pipeline', () => {
      const context = nodeProcessor.createContext({
        direction: 'xml-to-json',
        nodeName: 'test',
        nodeType: mockDomEnv.nodeTypes.ELEMENT_NODE
      });
      
      // TestTransformer should convert strings to uppercase
      const result = nodeProcessor.applyTransform('test value', context);
      
      expect(result).toBe('TEST VALUE');
    });
    
    test('should return unchanged value for null or undefined', () => {
      const context = nodeProcessor.createContext({
        direction: 'xml-to-json',
        nodeName: 'test',
        nodeType: mockDomEnv.nodeTypes.ELEMENT_NODE
      });
      
      expect(nodeProcessor.applyTransform(null, context)).toBeNull();
      expect(nodeProcessor.applyTransform(undefined, context)).toBeUndefined();
    });
    
    test('should return unchanged value for non-string types', () => {
      const context = nodeProcessor.createContext({
        direction: 'xml-to-json',
        nodeName: 'test',
        nodeType: mockDomEnv.nodeTypes.ELEMENT_NODE
      });
      
      const numberValue = 123;
      const boolValue = true;
      const objectValue = { key: 'value' };
      
      expect(nodeProcessor.applyTransform(numberValue, context)).toBe(numberValue);
      expect(nodeProcessor.applyTransform(boolValue, context)).toBe(boolValue);
      expect(nodeProcessor.applyTransform(objectValue, context)).toBe(objectValue);
    });
    
    test('should create a context from options if not a full context object', () => {
      // Using just options instead of a full context
      const options = {
        direction: 'xml-to-json',
        nodeName: 'test',
        nodeType: mockDomEnv.nodeTypes.ELEMENT_NODE
      };
      
      const result = nodeProcessor.applyTransform('test value', options);
      
      expect(result).toBe('TEST VALUE');
    });
    
    test('should throw error if transformer is invalid', () => {
      // Create processor with invalid transformer
      const config = createTestConfig({
        valueTransforms: [{ /* missing process method */ }]
      });
      const configMgr = new ConfigurationManager(config);
      const processor = new NodeProcessor(configMgr, mockDomEnv);
      
      const context = processor.createContext({
        direction: 'xml-to-json',
        nodeName: 'test',
        nodeType: mockDomEnv.nodeTypes.ELEMENT_NODE
      });
      
      expect(() => processor.applyTransform('test', context)).toThrow(TransformerError);
    });
  });
  
  describe('containsHtmlMarkup', () => {
    test('should detect HTML markup in strings', () => {
      expect(nodeProcessor.containsHtmlMarkup('<div>content</div>')).toBe(true);
      expect(nodeProcessor.containsHtmlMarkup('Text with <em>emphasis</em>')).toBe(true);
      expect(nodeProcessor.containsHtmlMarkup('<br>')).toBe(true);
    });
    
    test('should return false for strings without HTML markup', () => {
      expect(nodeProcessor.containsHtmlMarkup('Plain text')).toBe(false);
      expect(nodeProcessor.containsHtmlMarkup('Text with > character')).toBe(false);
      expect(nodeProcessor.containsHtmlMarkup('Text with < character')).toBe(false);
    });
    
    test('should return false for non-string values', () => {
      expect(nodeProcessor.containsHtmlMarkup(null)).toBe(false);
      expect(nodeProcessor.containsHtmlMarkup(undefined)).toBe(false);
      expect(nodeProcessor.containsHtmlMarkup(123)).toBe(false);
      expect(nodeProcessor.containsHtmlMarkup({})).toBe(false);
    });
  });
});