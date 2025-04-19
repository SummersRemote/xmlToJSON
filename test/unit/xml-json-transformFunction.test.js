/**
 * Simplified unit tests for the transform function feature
 */

import { XMLJSONTransformer } from '../../src/xml-json-transformer.js';

describe("XMLJSONTransformer.transformFunction (Simple Case)", () => {
  let transformer;
  
  // Simple transform function:
  // - For XML to JSON: element values to uppercase, attribute values to lowercase
  // - For JSON to XML: reverse operations
  const simpleTransform = (value, context) => {
    // Skip null/undefined values
    if (value === null || value === undefined) return value;
    
    // Skip non-string values
    if (typeof value !== 'string') return value;
    
    if (context.direction === 'xml-to-json') {
      // XML to JSON transformation
      if (context.isAttribute) {
        // Attribute values to lowercase
        return value.toLowerCase();
      } else {
        // Element values to uppercase
        return value.toUpperCase();
      }
    } else if (context.direction === 'json-to-xml') {
      // JSON to XML transformation
      if (context.isAttribute) {
        // Attribute values back to uppercase
        return value.toUpperCase();
      } else {
        // Element values back to lowercase
        return value.toLowerCase();
      }
    }
    
    // Default case
    return value;
  };
  
  beforeEach(() => {
    // Create a transformer with the simple transform function
    transformer = new XMLJSONTransformer({
      transformFunction: simpleTransform
    });
  });
  
  test("should transform element values to uppercase and attribute values to lowercase", () => {
    const xml = '<root id="ID123"><child name="Name">value</child></root>';
    
    const result = transformer.xmlToJSON(xml);
    
    // Element values should be uppercase
    expect(result.root["@children"][0].child["@val"]).toBe("VALUE");
    
    // Attribute values should be lowercase
    expect(result.root["@attrs"].id["@val"]).toBe("id123");
    expect(result.root["@children"][0].child["@attrs"].name["@val"]).toBe("name");
  });
  
  test("should reverse transformations when converting from JSON to XML", () => {
    const json = {
      "root": {
        "@ns": "",
        "@val": "ROOT VALUE",
        "@attrs": {
          "id": {
            "@val": "id123",
            "@ns": ""
          }
        },
        "@children": [
          {
            "child": {
              "@ns": "",
              "@val": "CHILD VALUE",
              "@attrs": {
                "name": {
                  "@val": "name",
                  "@ns": ""
                }
              }
            }
          }
        ]
      }
    };
    
    const xml = transformer.jsonToXML(json);
    
    // Element values should be lowercase in XML
    expect(xml).toNormalizeContain('>root value<');
    expect(xml).toNormalizeContain('>child value<');
    
    // Attribute values should be uppercase in XML
    expect(xml).toNormalizeContain('id="ID123"');
    expect(xml).toNormalizeContain('name="NAME"');
  });
  
  test("should handle bidirectional transformation correctly", () => {
    const originalXml = '<root id="ID123"><child name="Name">value</child></root>';
    
    // Convert XML to JSON
    const json = transformer.xmlToJSON(originalXml);
    
    // Convert JSON back to XML
    const newXml = transformer.jsonToXML(json);
    
    // Convert the new XML to JSON again to verify transformations
    const newJson = transformer.xmlToJSON(newXml);
    
    // Check that values were transformed as expected
    // Element values: value -> VALUE -> value -> VALUE
    expect(newJson.root["@children"][0].child["@val"]).toNormalizeContain("VALUE");
    
    // Attribute values: ID123 -> id123 -> ID123 -> id123
    expect(newJson.root["@attrs"].id["@val"]).toNormalizeContain("id123");
    expect(newJson.root["@children"][0].child["@attrs"].name["@val"]).toNormalizeContain("name");
  });
  
  test("should handle mixed content", () => {
    const xml = '<p>This is <em>mixed</em> content</p>';
    
    const result = transformer.xmlToJSON(xml);
    
    // Mixed content is stored as a single value
    // It should be transformed to uppercase
    expect(result.p["@val"]).toNormalizeContain("THIS IS <EM>MIXED</EM> CONTENT");
    
    // Convert back to XML
    const newXml = transformer.jsonToXML(result);
    
    // Check the content is transformed to lowercase
    expect(newXml).toNormalizeContain('>this is <em>mixed</em> content<');
  });
});