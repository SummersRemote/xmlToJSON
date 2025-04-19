/**
 * Unit tests for the NodeProcessor class
 */

import ConfigurationManager from '../../src/ConfigurationManager.js';
import NodeProcessor from '../../src/NodeProcessor.js';
import DOMEnvironment from '../../src/DOMEnvironment.js';

describe('NodeProcessor', () => {
  let configManager;
  let nodeProcessor;
  let parser;
  
  beforeEach(() => {
    configManager = new ConfigurationManager();
    nodeProcessor = new NodeProcessor(configManager, DOMEnvironment);
    parser = DOMEnvironment.createParser();
  });
  
  // Helper to create a DOM node for testing
  const createNode = (xmlString) => {
    const doc = parser.parseFromString(xmlString, 'text/xml');
    return doc.documentElement;
  };
  
  test('should detect mixed content correctly', () => {
    // Regular element with text
    const simpleNode = createNode('<root>Simple text</root>');
    expect(nodeProcessor.hasMixedContent(simpleNode)).toBe(false);
    
    // Element with only child elements
    const childElementNode = createNode('<root><child>Text</child><child>More</child></root>');
    expect(nodeProcessor.hasMixedContent(childElementNode)).toBe(false);
    
    // Element with mixed content
    const mixedNode = createNode('<root>Text <em>emphasized</em> and normal</root>');
    expect(nodeProcessor.hasMixedContent(mixedNode)).toBe(true);
    
    // Element with whitespace but no actual mixed content
    const whitespaceNode = createNode('<root>\n  <child>Text</child>\n  <child>More</child>\n</root>');
    expect(nodeProcessor.hasMixedContent(whitespaceNode)).toBe(false);
  });
  
  test('should handle HTML markup detection correctly', () => {
    // Plain text
    expect(nodeProcessor.containsHtmlMarkup('Just plain text')).toBe(false);
    
    // HTML markup
    expect(nodeProcessor.containsHtmlMarkup('<em>Emphasized</em> text')).toBe(true);
    expect(nodeProcessor.containsHtmlMarkup('<br/>')).toBe(true);
    
    // XML-like but not HTML
    expect(nodeProcessor.containsHtmlMarkup('2 < 5 and 10 > 3')).toBe(false);
    
    // Non-string input
    expect(nodeProcessor.containsHtmlMarkup(123)).toBe(false);
    expect(nodeProcessor.containsHtmlMarkup(null)).toBe(false);
  });
  
  test('should create transform context correctly', () => {
    const node = createNode('<root xmlns="http://example.org">Test</root>');
    
    // Default no transform case
    expect(nodeProcessor.createTransformContext(node, 'root', 'xml-to-json')).toBeNull();
    
    // With transform function
    const configWithTransform = new ConfigurationManager({
      transformFunction: (val) => val.toUpperCase()
    });
    const processorWithTransform = new NodeProcessor(configWithTransform, DOMEnvironment);
    
    const context = processorWithTransform.createTransformContext(node, 'root', 'xml-to-json');
    expect(context).toEqual({
      nodeName: 'root',
      nodeType: DOMEnvironment.nodeTypes.ELEMENT_NODE,
      namespaceURI: 'http://example.org',
      attributes: node.attributes,
      direction: 'xml-to-json'
    });
  });
  
  test('should apply transform function when configured', () => {
    // Simple uppercase transform
    const uppercaseConfig = new ConfigurationManager({
      transformFunction: (val) => typeof val === 'string' ? val.toUpperCase() : val
    });
    const uppercaseProcessor = new NodeProcessor(uppercaseConfig, DOMEnvironment);
    
    // Test transform
    const context = { direction: 'xml-to-json' };
    expect(uppercaseProcessor.applyTransform('test', context)).toBe('TEST');
    expect(uppercaseProcessor.applyTransform(null, context)).toBeNull();
    expect(uppercaseProcessor.applyTransform(123, context)).toBe(123);
    
    // Test transform that returns undefined
    const undefinedConfig = new ConfigurationManager({
      transformFunction: () => undefined
    });
    const undefinedProcessor = new NodeProcessor(undefinedConfig, DOMEnvironment);
    
    // Should return original value if transform returns undefined
    expect(undefinedProcessor.applyTransform('test', context)).toBe('test');
  });
  
  test('should get inner HTML correctly', () => {
    // Simple node
    const simpleNode = createNode('<root><child>Text</child></root>');
    expect(nodeProcessor.getInnerHTML(simpleNode)).toNormalizeEqual('<child>Text</child>');
    
    // Mixed content node
    const mixedNode = createNode('<root>Text <em>emphasized</em></root>');
    expect(nodeProcessor.getInnerHTML(mixedNode)).toNormalizeEqual('Text <em>emphasized</em>');
    
    // Node with CDATA
    const cdataNode = createNode('<root><![CDATA[<data>Raw</data>]]></root>');
    expect(nodeProcessor.getInnerHTML(cdataNode)).toNormalizeContain('<data>Raw</data>');
  });
});