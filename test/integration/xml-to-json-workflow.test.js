/**
 * Integration tests for JSON to XML workflow
 * 
 * Tests the complete flow from JSON structure to XML conversion,
 * including handling of various features and edge cases.
 */

import XMLJSONTransformer from '../../src/core/XMLJSONTransformer.js';

describe('JSON to XML Workflow', () => {
  let transformer;
  
  beforeEach(() => {
    // Create a transformer with default settings
    transformer = new XMLJSONTransformer();
  });
  
  test('should transform simple JSON to XML', () => {
    const json = {
      "root": {
        "@ns": "",
        "@val": "",
        "@attrs": {
          "version": {
            "@val": "1.0",
            "@ns": ""
          }
        },
        "@children": [
          {
            "element": {
              "@ns": "",
              "@val": "Simple text",
              "@attrs": {
                "id": {
                  "@val": "123",
                  "@ns": ""
                }
              }
            }
          }
        ]
      }
    };
    
    const xml = transformer.jsonToXML(json);
    
    // Check structure
    expect(xml).toNormalizeContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toNormalizeContain('<root version="1.0">');
    expect(xml).toNormalizeContain('<element id="123">Simple text</element>');
    
    // Round-trip should produce equivalent JSON
    const roundTrip = transformer.xmlToJSON(xml);
    expect(roundTrip.root['@attrs'].version['@val']).toBe('1.0');
    expect(roundTrip.root['@children'][0].element['@val']).toBe('Simple text');
  });
  
  test('should handle namespaces in JSON to XML conversion', () => {
    const json = {
      "Envelope": {
        "@ns": "http://www.w3.org/2003/05/soap-envelope",
        "@val": "",
        "@attrs": {},
        "@children": [
          {
            "Body": {
              "@ns": "http://www.w3.org/2003/05/soap-envelope",
              "@val": "",
              "@children": [
                {
                  "GetStock": {
                    "@ns": "http://www.example.org/stock",
                    "@val": "",
                    "@children": [
                      {
                        "StockName": {
                          "@ns": "http://www.example.org/stock",
                          "@val": "ACME"
                        }
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    };
    
    const xml = transformer.jsonToXML(json);
    
    // Check namespace declarations and prefixes
    expect(xml).toNormalizeContain('xmlns="http://www.w3.org/2003/05/soap-envelope"');
    // The prefix may vary, but the namespace URI should be present
    expect(xml).toNormalizeContain('http://www.example.org/stock');
    expect(xml).toNormalizeContain('<StockName');
    expect(xml).toNormalizeContain('>ACME<');
    
    // Test with prefixes preserved
    const prefixTransformer = new XMLJSONTransformer({
      stripPrefixes: false
    });
    
    // Create JSON with explicit prefixes
    const jsonWithPrefixes = {
      "soap:Envelope": {
        "@ns": "http://www.w3.org/2003/05/soap-envelope",
        "@val": "",
        "@attrs": {},
        "@children": [
          {
            "soap:Body": {
              "@ns": "http://www.w3.org/2003/05/soap-envelope",
              "@children": [
                {
                  "m:GetStock": {
                    "@ns": "http://www.example.org/stock",
                    "@children": [
                      {
                        "m:StockName": {
                          "@ns": "http://www.example.org/stock",
                          "@val": "ACME"
                        }
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    };
    
    const xmlWithPrefixes = prefixTransformer.jsonToXML(jsonWithPrefixes);
    expect(xmlWithPrefixes).toNormalizeContain('<soap:Envelope');
    expect(xmlWithPrefixes).toNormalizeContain('<soap:Body');
    expect(xmlWithPrefixes).toNormalizeContain('<m:GetStock');
    expect(xmlWithPrefixes).toNormalizeContain('<m:StockName');
  });
  
  test('should handle special nodes in JSON to XML conversion', () => {
    const json = {
      "root": {
        "@ns": "",
        "@val": "",
        "@attrs": {},
        "@comments": ["This is a comment", "Another comment"],
        "@processing": ["xml-stylesheet type=\"text/css\" href=\"style.css\""],
        "@children": [
          {
            "element": {
              "@ns": "",
              "@val": "",
              "@attrs": {
                "id": {
                  "@val": "123",
                  "@ns": ""
                }
              },
              "@cdata": ["<script>alert('Hello');</script>"]
            }
          }
        ]
      }
    };
    
    const xml = transformer.jsonToXML(json);
    
    // Check special nodes
    expect(xml).toNormalizeContain('<!-- This is a comment -->');
    expect(xml).toNormalizeContain('<!-- Another comment -->');
    expect(xml).toNormalizeContain('<?xml-stylesheet type="text/css" href="style.css"?>');
    expect(xml).toNormalizeContain('<![CDATA[<script>alert(\'Hello\');</script>]]>');
    
    // Round-trip check
    const roundTrip = transformer.xmlToJSON(xml);
    expect(roundTrip.root['@comments']).toContainEqual('This is a comment');
    expect(roundTrip.root['@processing'][0]).toBe('xml-stylesheet type="text/css" href="style.css"');
    expect(roundTrip.root['@children'][0].element['@cdata'][0]).toBe('<script>alert(\'Hello\');</script>');
  });
  
  test('should handle mixed content in JSON to XML conversion', () => {
    const json = {
      "paragraph": {
        "@ns": "",
        "@val": "This is <em>mixed</em> content with <strong>formatting</strong>.",
        "@attrs": {}
      }
    };
    
    const xml = transformer.jsonToXML(json);
    
    // Check mixed content
    expect(xml).toNormalizeContain('<paragraph>This is <em>mixed</em> content with <strong>formatting</strong>.</paragraph>');
    
    // Round-trip check
    const roundTrip = transformer.xmlToJSON(xml);
    expect(roundTrip.paragraph['@val']).toBe('This is <em>mixed</em> content with <strong>formatting</strong>.');
  });
  
  test('should apply custom transform functions when converting from JSON to XML', () => {
    // Create transformer with custom transform
    const customTransformer = new XMLJSONTransformer({
      transformFunction: (value, context) => {
        if (typeof value !== 'string') return value;
        
        if (context.direction === 'json-to-xml') {
          // For XML output, wrap text in square brackets
          return `[${value}]`;
        }
        return value;
      }
    });
    
    const json = {
      "root": {
        "@val": "Root text",
        "@attrs": {
          "attr": {
            "@val": "Attribute value"
          }
        },
        "@children": [
          {
            "child": {
              "@val": "Child text"
            }
          }
        ]
      }
    };
    
    const xml = customTransformer.jsonToXML(json);
    
    // Check transformed values
    expect(xml).toNormalizeContain('<root attr="[Attribute value]">[Root text]');
    expect(xml).toNormalizeContain('<child>[Child text]</child>');
  });
  
  test('should handle empty and null values correctly', () => {
    const json = {
      "root": {
        "@val": "",
        "@attrs": {
          "empty": {
            "@val": ""
          },
          "zero": {
            "@val": "0"
          }
        },
        "@children": [
          {
            "empty": {
              "@val": ""
            }
          },
          {
            "null": {
              "@val": null
            }
          }
        ]
      }
    };
    
    const xml = transformer.jsonToXML(json);
    
    // Check empty and null values
    expect(xml).toNormalizeContain('<root empty="" zero="0">');
    expect(xml).toNormalizeContain('<empty></empty>');
    expect(xml).toNormalizeContain('<null>');
    
    // Transformer with xsi:nil for null values
    const nilTransformer = new XMLJSONTransformer({
      transformFunction: (value, context) => {
        if (value === null) {
          context.isNull = true;
          return '';
        }
        return value;
      }
    });
    
    const xmlWithNil = nilTransformer.jsonToXML(json);
    expect(xmlWithNil).toNormalizeContain('xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"');
    expect(xmlWithNil).toNormalizeContain('xsi:nil="true"');
  });
  
  test('should handle deeply nested structures', () => {
    const json = {
      "level1": {
        "@val": "",
        "@children": [
          {
            "level2": {
              "@val": "",
              "@children": [
                {
                  "level3": {
                    "@val": "",
                    "@children": [
                      {
                        "level4": {
                          "@val": "Deep content"
                        }
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    };
    
    const xml = transformer.jsonToXML(json);
    
    // Check nested structure
    expect(xml).toNormalizeContain('<level1>');
    expect(xml).toNormalizeContain('<level2>');
    expect(xml).toNormalizeContain('<level3>');
    expect(xml).toNormalizeContain('<level4>Deep content</level4>');
    
    // Proper nesting (using simplified checks)
    const nestedPattern = /<level1>\s*<level2>\s*<level3>\s*<level4>Deep content<\/level4>\s*<\/level3>\s*<\/level2>\s*<\/level1>/;
    expect(xml.replace(/\n/g, ' ')).toMatch(nestedPattern);
  });
  
  test('should pretty print XML output when configured', () => {
    const json = {
      "root": {
        "@val": "",
        "@children": [
          {
            "child": {
              "@val": "Value"
            }
          }
        ]
      }
    };
    
    // Default pretty printing
    const prettyXml = transformer.jsonToXML(json);
    expect(prettyXml).toContain('\n');
    expect(prettyXml).toMatch(/>\s+</);
    
    // Disable pretty printing
    const compactTransformer = new XMLJSONTransformer({
      outputOptions: {
        prettyPrint: false
      }
    });
    
    const compactXml = compactTransformer.jsonToXML(json);
    // Should be compact with no extra whitespace
    expect(compactXml).not.toContain('\n');
    expect(compactXml).not.toMatch(/>\s+</);
    
    // Custom indentation
    const customIndentTransformer = new XMLJSONTransformer({
      outputOptions: {
        indent: 4
      }
    });
    
    const customIndentXml = customIndentTransformer.jsonToXML(json);
    expect(customIndentXml).toContain('    '); // 4 spaces
  });
});