import XMLJSONTransformer from '../../../src/core/XMLJSONTransformer';
import { TransformerError, ErrorCodes } from '../../../src/core/errors/TransformerError';
import { loadFixture, createTestConfig, normalizeXML } from '../../helpers/testUtils';

describe('XMLJSONTransformer', () => {
  let transformer;
  const testConfig = createTestConfig();
  
  beforeEach(() => {
    // Create a new instance with test configuration for each test
    transformer = new XMLJSONTransformer(testConfig);
  });
  
  describe('constructor', () => {
    test('should create instance with default config when no config provided', () => {
      const defaultTransformer = new XMLJSONTransformer();
      expect(defaultTransformer.config).toBeDefined();
      expect(defaultTransformer.xmlToJsonConverter).toBeDefined();
      expect(defaultTransformer.jsonToXmlConverter).toBeDefined();
    });
    
    test('should create instance with provided config', () => {
      expect(transformer.config).toEqual(expect.objectContaining(testConfig));
    });
    
    test('should throw error if config is not an object', () => {
      expect(() => new XMLJSONTransformer('invalid')).toThrow(TransformerError);
      expect(() => new XMLJSONTransformer('invalid')).toThrow(/Configuration must be an object/);
    });
  });
  
  describe('xmlToJSON', () => {
    test('should convert simple XML to JSON', () => {
      const xml = loadFixture('xml', 'simple');
      const expectedJson = loadFixture('json', 'simple');
      
      const result = transformer.xmlToJSON(xml);
      expect(result).toEqual(expectedJson);
    });
    
    test('should convert XML with namespaces to JSON', () => {
      const xml = loadFixture('xml', 'namespaces');
      const expectedJson = loadFixture('json', 'namespaces');
      
      const result = transformer.xmlToJSON(xml);
      expect(result).toEqual(expectedJson);
    });
    
    test('should convert XML to JSON and return as string when asString=true', () => {
      const xml = loadFixture('xml', 'simple');
      const result = transformer.xmlToJSON(xml, true);
      
      expect(typeof result).toBe('string');
      expect(() => JSON.parse(result)).not.toThrow();
    });
    
    test('should throw error when XML input is invalid', () => {
      expect(() => transformer.xmlToJSON(null)).toThrow(TransformerError);
      expect(() => transformer.xmlToJSON(null)).toThrow(/XML input must be a non-empty string/);
      expect(() => transformer.xmlToJSON('<invalid>')).toThrow(TransformerError);
    });
  });
  
  describe('jsonToXML', () => {
    test('should convert simple JSON to XML', () => {
      const json = loadFixture('json', 'simple');
      const result = transformer.jsonToXML(json);
      
      // XML can have different whitespace, so normalize for comparison
      const normalizedResult = normalizeXML(result);
      const expectedXml = normalizeXML(loadFixture('xml', 'simple'));
      
      expect(normalizedResult).toContain('<root>');
      expect(normalizedResult).toContain('<child id="1">Hello World</child>');
      expect(normalizedResult).toContain('<child id="2">Test</child>');
      expect(normalizedResult).toContain('</root>');
    });
    
    test('should convert JSON with namespaces to XML', () => {
      const json = loadFixture('json', 'namespaces');
      const result = transformer.jsonToXML(json);
      
      // Check for namespace declarations and prefixed elements
      expect(result).toContain('xmlns:soap="http://www.w3.org/2003/05/soap-envelope"');
      expect(result).toContain('<soap:Envelope');
      expect(result).toContain('<soap:Header>');
      expect(result).toContain('<auth:Credentials');
      expect(result).toContain('<m:GetStock');
    });
    
    test('should throw error when JSON input is invalid', () => {
      expect(() => transformer.jsonToXML(null)).toThrow(TransformerError);
      expect(() => transformer.jsonToXML(null)).toThrow(/JSON input must be a non-empty object/);
      expect(() => transformer.jsonToXML('invalid')).toThrow(TransformerError);
    });
  });
  
  describe('jsonToString', () => {
    test('should convert JSON object to formatted string', () => {
      const json = { test: 'value' };
      const result = transformer.jsonToString(json);
      
      expect(typeof result).toBe('string');
      expect(result).toContain('{\n');  // Should be formatted with indentation
    });
    
    test('should throw error when JSON input is invalid', () => {
      expect(() => transformer.jsonToString(null)).toThrow(TransformerError);
      expect(() => transformer.jsonToString(null)).toThrow(/JSON input must be a non-empty object/);
    });
  });
  
  describe('getPath', () => {
    test('should retrieve value using dot notation path', () => {
      const json = loadFixture('json', 'books');
      
      // Get book title
      const title = transformer.getPath(json, 'library:catalog.@children[0].library:book.@children[1].library:title.@val');
      expect(title).toBe("XML Developer's Guide");
      
      // Get book ID
      const id = transformer.getPath(json, 'library:catalog.@children[0].library:book.@attrs.id.@val');
      expect(id).toBe('bk101');
    });
    
    test('should return fallback value when path not found', () => {
      const json = loadFixture('json', 'simple');
      const result = transformer.getPath(json, 'root.notExist', 'fallback');
      expect(result).toBe('fallback');
    });
    
    test('should throw error when obj is not an object', () => {
      expect(() => transformer.getPath(null, 'test')).toThrow(TransformerError);
      expect(() => transformer.getPath(null, 'test')).toThrow(/Cannot navigate path on non-object/);
    });
    
    test('should throw error when path is not a string', () => {
      const json = loadFixture('json', 'simple');
      expect(() => transformer.getPath(json, null)).toThrow(TransformerError);
      expect(() => transformer.getPath(json, null)).toThrow(/Path must be a non-empty string/);
    });
  });
  
  describe('generateJSONSchema', () => {
    test('should generate JSON schema based on current configuration', () => {
      const schema = transformer.generateJSONSchema();
      
      expect(schema).toBeDefined();
      expect(schema).toHaveProperty('$schema');
      expect(schema).toHaveProperty('title');
      expect(schema).toHaveProperty('type', 'object');
    });
  });
  
  describe('roundtrip conversion', () => {
    test('should maintain fidelity for simple XML through roundtrip conversion', () => {
      const originalXml = loadFixture('xml', 'simple');
      
      // XML to JSON
      const json = transformer.xmlToJSON(originalXml);
      
      // JSON back to XML
      const resultXml = transformer.jsonToXML(json);
      
      // Compare normalized versions to handle whitespace differences
      expect(normalizeXML(resultXml)).toEqual(normalizeXML(originalXml));
    });
    
    test('should maintain namespace information through roundtrip conversion', () => {
      const originalXml = loadFixture('xml', 'namespaces');
      
      // XML to JSON
      const json = transformer.xmlToJSON(originalXml);
      
      // JSON back to XML
      const resultXml = transformer.jsonToXML(json);
      
      // Check for key namespace elements in the result
      expect(resultXml).toContain('xmlns:soap="http://www.w3.org/2003/05/soap-envelope"');
      expect(resultXml).toContain('xmlns:auth="http://example.org/auth"');
      expect(resultXml).toContain('xmlns:m="http://example.org/stock"');
      
      // Check for prefixed elements
      expect(resultXml).toContain('<soap:Envelope');
      expect(resultXml).toContain('<auth:Credentials');
      expect(resultXml).toContain('<m:GetStock');
      
      // Compare normalized versions
      expect(normalizeXML(resultXml)).toEqual(normalizeXML(originalXml));
    });
    
    test('should maintain special nodes through roundtrip conversion', () => {
      const originalXml = loadFixture('xml', 'special-nodes');
      
      // XML to JSON
      const json = transformer.xmlToJSON(originalXml);
      
      // JSON back to XML
      const resultXml = transformer.jsonToXML(json);
      
      // Check for CDATA sections
      expect(resultXml).toContain('<![CDATA[<script>alert("This is CDATA content");</script>]]>');
      
      // Check for comments
      expect(resultXml).toContain('<!-- This is a comment -->');
      expect(resultXml).toContain('<!-- This is another comment -->');
      
      // Check for processing instructions
      expect(resultXml).toContain('<?xml-stylesheet type="text/css" href="style.css"?>');
      
      // Compare normalized versions
      expect(normalizeXML(resultXml)).toEqual(normalizeXML(originalXml));
    });
  });
});