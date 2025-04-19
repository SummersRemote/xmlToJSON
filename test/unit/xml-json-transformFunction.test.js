/**
 * Unit tests for the transform function feature
 */

import { XMLJSONTransformer } from '../../src/xml-json-transformer.js';

describe("XMLJSONTransformer.transformFunction", () => {
  let basicTransformer;
  let transformerWithTransform;
  
  // Sample transform function for type conversion
  const typeConversionTransform = (value, context) => {
    if (context.direction === 'xml-to-json') {
      // Check for null values (xsi:nil)
      if (context.attributes) {
        for (let i = 0; i < context.attributes.length; i++) {
          const attr = context.attributes[i];
          if (attr.namespaceURI === "http://www.w3.org/2001/XMLSchema-instance" &&
              (attr.localName === "nil" || attr.name.endsWith(":nil")) &&
              /^(true|1)$/i.test(attr.value)) {
            return null;
          }
        }
      }
      
      // Nothing to transform if not a string
      if (typeof value !== 'string') return undefined;
      
      // Check for literal "null" (case insensitive)
      if (/^null$/i.test(value)) {
        return null;
      }
      
      // Check for booleans
      if (/^(true|false)$/i.test(value)) {
        return value.toLowerCase() === 'true';
      }
      
      // Check for numbers
      if (/^-?\d+(\.\d+)?$/.test(value)) {
        return Number(value);
      }
    } 
    else if (context.direction === 'json-to-xml') {
      // Convert null to empty string and mark for nil treatment
      if (value === null) {
        context.isNull = true;
        return "";
      }
      
      // Convert numbers to strings
      if (typeof value === 'number') {
        return String(value);
      }
      
      // Convert booleans to strings
      if (typeof value === 'boolean') {
        return value ? 'true' : 'false';
      }
    }
    
    // Return undefined to keep the original value
    return undefined;
  };
  
  beforeEach(() => {
    // Create a fresh transformer instance without transform
    basicTransformer = new XMLJSONTransformer();
    
    // Create a transformer with transform function
    transformerWithTransform = new XMLJSONTransformer({
      transformFunction: typeConversionTransform
    });
  });
  
  describe("XML to JSON transformation", () => {
    test("should transform boolean strings to boolean values", () => {
      const xml = "<root><flag>true</flag><another>false</another></root>";
      
      // Basic transformer keeps strings as strings
      const basicResult = basicTransformer.xmlToJSON(xml);
      expect(typeof basicResult.root["@children"][0].flag["@val"]).toBe("string");
      expect(basicResult.root["@children"][0].flag["@val"]).toBe("true");
      
      // Transformer with transform converts strings to booleans
      const result = transformerWithTransform.xmlToJSON(xml);
      expect(typeof result.root["@children"][0].flag["@val"]).toBe("boolean");
      expect(result.root["@children"][0].flag["@val"]).toBe(true);
      expect(result.root["@children"][1].another["@val"]).toBe(false);
    });
    
    test("should transform numeric strings to numbers", () => {
      const xml = "<root><int>42</int><float>3.14</float><negative>-10</negative></root>";
      
      // Basic transformer keeps strings as strings
      const basicResult = basicTransformer.xmlToJSON(xml);
      expect(typeof basicResult.root["@children"][0].int["@val"]).toBe("string");
      expect(basicResult.root["@children"][0].int["@val"]).toBe("42");
      
      // Transformer with transform converts strings to numbers
      const result = transformerWithTransform.xmlToJSON(xml);
      expect(typeof result.root["@children"][0].int["@val"]).toBe("number");
      expect(result.root["@children"][0].int["@val"]).toBe(42);
      expect(result.root["@children"][1].float["@val"]).toBe(3.14);
      expect(result.root["@children"][2].negative["@val"]).toBe(-10);
    });
    
    test("should handle null values with xsi:nil attribute", () => {
      const xml = '<root><empty xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"></empty></root>';
      
      // Basic transformer keeps empty string
      const basicResult = basicTransformer.xmlToJSON(xml);
      expect(basicResult.root["@children"][0].empty["@val"]).toBe("");
      
      // Transformer with transform converts to null
      const result = transformerWithTransform.xmlToJSON(xml);
      expect(result.root["@children"][0].empty["@val"]).toBe(null);
    });
    
    test("should handle literal 'null' values (case insensitive)", () => {
      const xml = "<root><a>null</a><b>NULL</b><c>Null</c></root>";
      
      // Basic transformer keeps as strings
      const basicResult = basicTransformer.xmlToJSON(xml);
      expect(basicResult.root["@children"][0].a["@val"]).toBe("null");
      
      // Transformer with transform converts to null
      const result = transformerWithTransform.xmlToJSON(xml);
      expect(result.root["@children"][0].a["@val"]).toBe(null);
      expect(result.root["@children"][1].b["@val"]).toBe(null);
      expect(result.root["@children"][2].c["@val"]).toBe(null);
    });
    
    test("should transform attributes too", () => {
      const xml = '<root><item id="123" active="true" count="5"></item></root>';
      
      // Basic transformer keeps as strings
      const basicResult = basicTransformer.xmlToJSON(xml);
      expect(typeof basicResult.root["@children"][0].item["@attrs"].id["@val"]).toBe("string");
      expect(basicResult.root["@children"][0].item["@attrs"].active["@val"]).toBe("true");
      
      // Transformer with transform converts attribute values
      const result = transformerWithTransform.xmlToJSON(xml);
      expect(typeof result.root["@children"][0].item["@attrs"].id["@val"]).toBe("number");
      expect(result.root["@children"][0].item["@attrs"].id["@val"]).toBe(123);
      expect(typeof result.root["@children"][0].item["@attrs"].active["@val"]).toBe("boolean");
      expect(result.root["@children"][0].item["@attrs"].active["@val"]).toBe(true);
      expect(result.root["@children"][0].item["@attrs"].count["@val"]).toBe(5);
    });
  });
  
  describe("JSON to XML transformation", () => {
    test("should transform boolean values to string", () => {
      const json = {
        "root": {
          "@ns": "",
          "@val": "",
          "@attrs": {},
          "@children": [
            {
              "flag": {
                "@ns": "",
                "@val": true
              }
            },
            {
              "another": {
                "@ns": "",
                "@val": false
              }
            }
          ]
        }
      };
      
      // Transform JSON to XML
      const result = transformerWithTransform.jsonToXML(json);
      
      // Convert back to JSON to verify values
      const roundTrip = transformerWithTransform.xmlToJSON(result);
      
      // Check that values were transformed back to booleans
      expect(typeof roundTrip.root["@children"][0].flag["@val"]).toBe("boolean");
      expect(roundTrip.root["@children"][0].flag["@val"]).toBe(true);
      expect(roundTrip.root["@children"][1].another["@val"]).toBe(false);
    });
    
    test("should transform numeric values to string", () => {
      const json = {
        "root": {
          "@ns": "",
          "@val": "",
          "@attrs": {},
          "@children": [
            {
              "int": {
                "@ns": "",
                "@val": 42
              }
            },
            {
              "float": {
                "@ns": "",
                "@val": 3.14
              }
            }
          ]
        }
      };
      
      // Transform JSON to XML
      const result = transformerWithTransform.jsonToXML(json);
      
      // Convert back to JSON to verify values
      const roundTrip = transformerWithTransform.xmlToJSON(result);
      
      // Check that values were transformed back to numbers
      expect(typeof roundTrip.root["@children"][0].int["@val"]).toBe("number");
      expect(roundTrip.root["@children"][0].int["@val"]).toBe(42);
      expect(roundTrip.root["@children"][1].float["@val"]).toBe(3.14);
    });
    
    test("should add xsi:nil attribute for null values", () => {
      const json = {
        "root": {
          "@ns": "",
          "@val": "",
          "@attrs": {},
          "@children": [
            {
              "empty": {
                "@ns": "",
                "@val": null
              }
            }
          ]
        }
      };
      
      // Transform JSON to XML
      const result = transformerWithTransform.jsonToXML(json);
      
      // Check if result contains xsi:nil="true"
      expect(result.includes('xsi:nil="true"')).toBe(true);
      
      // Convert back to JSON to verify values
      const roundTrip = transformerWithTransform.xmlToJSON(result);
      
      // Check that values were transformed back to null
      expect(roundTrip.root["@children"][0].empty["@val"]).toBe(null);
    });
  });
  
  describe("Performance", () => {
    test("should use fast path when no transform function is provided", () => {
      // This test doesn't actually test performance but verifies fast path works
      const xml = "<root><item>42</item></root>";
      
      // Mock _applyTransform to see if it's called
      const spy = jest.spyOn(basicTransformer, '_applyTransform');
      
      // Basic transformer shouldn't call _applyTransform
      basicTransformer.xmlToJSON(xml);
      
      // Verify _applyTransform wasn't called
      expect(spy).not.toHaveBeenCalled();
    });
    
    test("should process large XML efficiently with transform function", () => {
      // Create large XML
      let largeXml = "<root>";
      for (let i = 0; i < 1000; i++) {
        largeXml += `<item id="${i}">${i % 2 === 0 ? 'true' : 'false'}</item>`;
      }
      largeXml += "</root>";
      
      // Measure time with transform
      const startWithTransform = performance.now();
      const resultWithTransform = transformerWithTransform.xmlToJSON(largeXml);
      const endWithTransform = performance.now();
      
      // Measure time without transform
      const startWithoutTransform = performance.now();
      const resultWithoutTransform = basicTransformer.xmlToJSON(largeXml);
      const endWithoutTransform = performance.now();
      
      // Calculate times
      const timeWithTransform = endWithTransform - startWithTransform;
      const timeWithoutTransform = endWithoutTransform - startWithoutTransform;
      
      console.log(`Time with transform: ${timeWithTransform}ms`);
      console.log(`Time without transform: ${timeWithoutTransform}ms`);
      
      // Check that values were transformed
      expect(typeof resultWithTransform.root["@children"][0].item["@val"]).toBe("boolean");
      
      // This isn't a strict test but more of a benchmark
      // Transformer with transform should be reasonable compared to basic
      expect(timeWithTransform).toBeLessThan(timeWithoutTransform * 5);
    });
  });
  
  describe("Custom transform functions", () => {
    test("should support custom transform logic", () => {
      // Custom transform that converts values to uppercase
      const uppercaseTransformer = new XMLJSONTransformer({
        transformFunction: (value, context) => {
          if (context.direction === 'xml-to-json' && typeof value === 'string') {
            return value.toUpperCase();
          }
          return undefined;
        }
      });
      
      const xml = "<root>hello world</root>";
      
      const result = uppercaseTransformer.xmlToJSON(xml);
      expect(result.root["@val"]).toBe("HELLO WORLD");
    });
    
    test("should allow context-based transformations", () => {
      // Transform function that processes values differently based on element name
      const contextTransformer = new XMLJSONTransformer({
        transformFunction: (value, context) => {
          if (context.direction === 'xml-to-json' && typeof value === 'string') {
            // Format based on node name
            if (context.nodeName === 'date') {
              // Convert to date object
              return new Date(value);
            } else if (context.nodeName === 'count') {
              // Convert to number
              return Number(value);
            } else if (context.nodeName === 'active') {
              // Convert to boolean
              return value === 'yes';
            }
          }
          return undefined;
        }
      });
      
      const xml = "<root><date>2023-04-18</date><count>42</count><active>yes</active></root>";
      
      const result = contextTransformer.xmlToJSON(xml);
      
      // Check transformed values
      expect(result.root["@children"][0].date["@val"] instanceof Date).toBe(true);
      expect(typeof result.root["@children"][1].count["@val"]).toBe("number");
      expect(result.root["@children"][1].count["@val"]).toBe(42);
      expect(typeof result.root["@children"][2].active["@val"]).toBe("boolean");
      expect(result.root["@children"][2].active["@val"]).toBe(true);
    });
  });
});