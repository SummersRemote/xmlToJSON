/**
 * Unit tests for type conversion features in XMLJSONTransformer
 */

import { XMLJSONTransformer } from '../../src/xml-json-transformer.js';

describe("XMLJSONTransformer type conversion", () => {
  let transformer;
  let typeTransformer;

  beforeEach(() => {
    // Create a standard transformer with no type conversion
    transformer = new XMLJSONTransformer();
    
    // Create a transformer with type conversion enabled
    typeTransformer = new XMLJSONTransformer({
      outputOptions: {
        json: {
          grokBooleans: true,
          grokNumbers: true,
          grokNull: true
        }
      }
    });
  });

  describe("Boolean conversion", () => {
    test("should convert true/false strings to boolean values", () => {
      const xml = '<root><trueValue>true</trueValue><falseValue>false</falseValue></root>';
      
      const result = typeTransformer.xmlToJSON(xml);
      
      expect(typeof result.root["@children"][0].trueValue["@val"]).toBe("boolean");
      expect(result.root["@children"][0].trueValue["@val"]).toBe(true);
      expect(typeof result.root["@children"][1].falseValue["@val"]).toBe("boolean");
      expect(result.root["@children"][1].falseValue["@val"]).toBe(false);
    });
    
    test("should handle case-insensitive boolean conversion", () => {
      const xml = '<root><value1>TRUE</value1><value2>False</value2></root>';
      
      const result = typeTransformer.xmlToJSON(xml);
      
      expect(typeof result.root["@children"][0].value1["@val"]).toBe("boolean");
      expect(result.root["@children"][0].value1["@val"]).toBe(true);
      expect(typeof result.root["@children"][1].value2["@val"]).toBe("boolean");
      expect(result.root["@children"][1].value2["@val"]).toBe(false);
    });
    
    test("should not convert other strings to boolean", () => {
      const xml = '<root><value1>yes</value1><value2>no</value2><value3>1</value3><value4>0</value4></root>';
      
      const result = typeTransformer.xmlToJSON(xml);
      
      // These values should remain strings
      expect(typeof result.root["@children"][0].value1["@val"]).toBe("string");
      expect(result.root["@children"][0].value1["@val"]).toBe("yes");
      expect(typeof result.root["@children"][1].value2["@val"]).toBe("string");
      expect(result.root["@children"][1].value2["@val"]).toBe("no");
      // These may be converted to numbers due to grokNumbers being enabled
      expect(typeof result.root["@children"][2].value3["@val"]).toBe("number");
      expect(typeof result.root["@children"][3].value4["@val"]).toBe("number");
    });
    
    test("should convert boolean attribute values", () => {
      const xml = '<root><item boolAttr1="true" boolAttr2="false" otherAttr="text" /></root>';
      
      const result = typeTransformer.xmlToJSON(xml);
      const item = result.root["@children"][0].item;
      
      expect(typeof item["@attrs"].boolAttr1["@val"]).toBe("boolean");
      expect(item["@attrs"].boolAttr1["@val"]).toBe(true);
      expect(typeof item["@attrs"].boolAttr2["@val"]).toBe("boolean");
      expect(item["@attrs"].boolAttr2["@val"]).toBe(false);
      expect(typeof item["@attrs"].otherAttr["@val"]).toBe("string");
      expect(item["@attrs"].otherAttr["@val"]).toBe("text");
    });
  });
  
  describe("Number conversion", () => {
    test("should convert integer strings to numbers", () => {
      const xml = '<root><int1>42</int1><int2>-123</int2><int3>0</int3></root>';
      
      const result = typeTransformer.xmlToJSON(xml);
      
      expect(typeof result.root["@children"][0].int1["@val"]).toBe("number");
      expect(result.root["@children"][0].int1["@val"]).toBe(42);
      expect(typeof result.root["@children"][1].int2["@val"]).toBe("number");
      expect(result.root["@children"][1].int2["@val"]).toBe(-123);
      expect(typeof result.root["@children"][2].int3["@val"]).toBe("number");
      expect(result.root["@children"][2].int3["@val"]).toBe(0);
    });
    
    test("should convert floating-point strings to numbers", () => {
      const xml = '<root><float1>3.14159</float1><float2>-0.5</float2><float3>0.0</float3></root>';
      
      const result = typeTransformer.xmlToJSON(xml);
      
      expect(typeof result.root["@children"][0].float1["@val"]).toBe("number");
      expect(result.root["@children"][0].float1["@val"]).toBe(3.14159);
      expect(typeof result.root["@children"][1].float2["@val"]).toBe("number");
      expect(result.root["@children"][1].float2["@val"]).toBe(-0.5);
      expect(typeof result.root["@children"][2].float3["@val"]).toBe("number");
      expect(result.root["@children"][2].float3["@val"]).toBe(0.0);
    });
    
    test("should convert scientific notation to numbers", () => {
      const xml = '<root><sci1>1.23e-4</sci1><sci2>6.02E23</sci2><sci3>-2.998e8</sci3></root>';
      
      const result = typeTransformer.xmlToJSON(xml);
      
      expect(typeof result.root["@children"][0].sci1["@val"]).toBe("number");
      expect(result.root["@children"][0].sci1["@val"]).toBeCloseTo(0.000123);
      expect(typeof result.root["@children"][1].sci2["@val"]).toBe("number");
      expect(result.root["@children"][1].sci2["@val"]).toBeCloseTo(6.02e23);
      expect(typeof result.root["@children"][2].sci3["@val"]).toBe("number");
      expect(result.root["@children"][2].sci3["@val"]).toBeCloseTo(-2.998e8);
    });
    
    test("should handle numbers with commas as separators", () => {
      const xml = '<root><num1>1,234</num1><num2>1,234,567</num2><num3>-9,876.54</num3></root>';
      
      const result = typeTransformer.xmlToJSON(xml);
      
      expect(typeof result.root["@children"][0].num1["@val"]).toBe("number");
      expect(result.root["@children"][0].num1["@val"]).toBe(1234);
      expect(typeof result.root["@children"][1].num2["@val"]).toBe("number");
      expect(result.root["@children"][1].num2["@val"]).toBe(1234567);
      expect(typeof result.root["@children"][2].num3["@val"]).toBe("number");
      expect(result.root["@children"][2].num3["@val"]).toBe(-9876.54);
    });
    
    test("should preserve special numeric-looking strings", () => {
      const xml = '<root><zip>02115</zip><phone>555-123-4567</phone><id>AB-12345</id></root>';
      
      const result = typeTransformer.xmlToJSON(xml);
      
      // Leading zero should be preserved as a string
      expect(typeof result.root["@children"][0].zip["@val"]).toBe("string");
      expect(result.root["@children"][0].zip["@val"]).toBe("02115");
      
      // Phone numbers with dashes should be preserved as strings
      expect(typeof result.root["@children"][1].phone["@val"]).toBe("string");
      expect(result.root["@children"][1].phone["@val"]).toBe("555-123-4567");
      
      // IDs with mixed characters should be preserved as strings
      expect(typeof result.root["@children"][2].id["@val"]).toBe("string");
      expect(result.root["@children"][2].id["@val"]).toBe("AB-12345");
    });
    
    test("should convert numeric attribute values", () => {
      const xml = '<root><item numAttr1="42" numAttr2="3.14" numAttr3="1.23e-4" numAttr4="1,234" /></root>';
      
      const result = typeTransformer.xmlToJSON(xml);
      const item = result.root["@children"][0].item;
      
      expect(typeof item["@attrs"].numAttr1["@val"]).toBe("number");
      expect(item["@attrs"].numAttr1["@val"]).toBe(42);
      expect(typeof item["@attrs"].numAttr2["@val"]).toBe("number");
      expect(item["@attrs"].numAttr2["@val"]).toBe(3.14);
      expect(typeof item["@attrs"].numAttr3["@val"]).toBe("number");
      expect(item["@attrs"].numAttr3["@val"]).toBeCloseTo(0.000123);
      expect(typeof item["@attrs"].numAttr4["@val"]).toBe("number");
      expect(item["@attrs"].numAttr4["@val"]).toBe(1234);
    });
  });
  
  describe("Null conversion", () => {
    test("should convert 'null' string to null value", () => {
      const xml = '<root><nullValue>null</nullValue><notNull>nil</notNull></root>';
      
      const result = typeTransformer.xmlToJSON(xml);
      
      expect(result.root["@children"][0].nullValue["@val"]).toBe(null);
      expect(typeof result.root["@children"][1].notNull["@val"]).toBe("string");
      expect(result.root["@children"][1].notNull["@val"]).toBe("nil");
    });
    
    test("should handle case-insensitive null conversion", () => {
      const xml = '<root><value1>NULL</value1><value2>Null</value2></root>';
      
      const result = typeTransformer.xmlToJSON(xml);
      
      expect(result.root["@children"][0].value1["@val"]).toBe(null);
      expect(result.root["@children"][1].value2["@val"]).toBe(null);
    });
    
    test("should handle xsi:nil attribute", () => {
      const xml = `
        <root xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
          <nilElement xsi:nil="true"></nilElement>
          <nilElement2 xsi:nil="1"></nilElement2>
          <notNil xsi:nil="false"></notNil>
          <regular>value</regular>
        </root>
      `;
      
      const result = typeTransformer.xmlToJSON(xml);
      
      expect(result.root["@children"][0].nilElement["@val"]).toBe(null);
      expect(result.root["@children"][1].nilElement2["@val"]).toBe(null);
      expect(result.root["@children"][2].notNil["@val"]).toBe("");
      expect(result.root["@children"][3].regular["@val"]).toBe("value");
    });
    
    test("should convert null attribute values", () => {
      const xml = '<root><item nullAttr="null" otherAttr="text" /></root>';
      
      const result = typeTransformer.xmlToJSON(xml);
      const item = result.root["@children"][0].item;
      
      expect(item["@attrs"].nullAttr["@val"]).toBe(null);
      expect(typeof item["@attrs"].otherAttr["@val"]).toBe("string");
      expect(item["@attrs"].otherAttr["@val"]).toBe("text");
    });
  });
  
  describe("Type conversion disabled", () => {
    test("should keep values as strings when type conversion is disabled", () => {
      const xml = `
        <root>
          <boolTrue>true</boolTrue>
          <boolFalse>false</boolFalse>
          <int>42</int>
          <float>3.14</float>
          <sci>1.23e-4</sci>
          <null>null</null>
        </root>
      `;
      
      const result = transformer.xmlToJSON(xml);
      
      expect(typeof result.root["@children"][0].boolTrue["@val"]).toBe("string");
      expect(result.root["@children"][0].boolTrue["@val"]).toBe("true");
      expect(typeof result.root["@children"][1].boolFalse["@val"]).toBe("string");
      expect(result.root["@children"][1].boolFalse["@val"]).toBe("false");
      expect(typeof result.root["@children"][2].int["@val"]).toBe("string");
      expect(result.root["@children"][2].int["@val"]).toBe("42");
      expect(typeof result.root["@children"][3].float["@val"]).toBe("string");
      expect(result.root["@children"][3].float["@val"]).toBe("3.14");
      expect(typeof result.root["@children"][4].sci["@val"]).toBe("string");
      expect(result.root["@children"][4].sci["@val"]).toBe("1.23e-4");
      expect(typeof result.root["@children"][5].null["@val"]).toBe("string");
      expect(result.root["@children"][5].null["@val"]).toBe("null");
    });
  });
  
  describe("Round-trip conversion", () => {
    test("should properly convert types back to XML strings", () => {
      const xml = `
        <root>
          <boolTrue>true</boolTrue>
          <boolFalse>false</boolFalse>
          <int>42</int>
          <float>3.14</float>
          <nullValue>null</nullValue>
          <item boolAttr="true" numAttr="42" nullAttr="null" />
        </root>
      `;
      
      // First convert to JSON with type conversion
      const jsonObj = typeTransformer.xmlToJSON(xml);
      
      // Then convert back to XML
      const newXml = typeTransformer.jsonToXML(jsonObj);
      
      // Verify the values are properly converted back to strings
      expect(newXml).toNormalizeContain("<boolTrue>true</boolTrue>");
      expect(newXml).toNormalizeContain("<boolFalse>false</boolFalse>");
      expect(newXml).toNormalizeContain("<int>42</int>");
      expect(newXml).toNormalizeContain("<float>3.14</float>");
      expect(newXml).toNormalizeContain("<nullValue>null</nullValue>");
      expect(newXml).toNormalizeContain('boolAttr="true"');
      expect(newXml).toNormalizeContain('numAttr="42"');
      expect(newXml).toNormalizeContain('nullAttr="null"');
    });
    
    test("should handle xsi:nil attributes correctly in round-trip", () => {
      const xml = `
        <root xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
          <nilElement xsi:nil="true"></nilElement>
        </root>
      `;
      
      // First convert to JSON with type conversion
      const jsonObj = typeTransformer.xmlToJSON(xml);
      
      // Verify nil element has null value
      expect(jsonObj.root["@children"][0].nilElement["@val"]).toBe(null);
      
      // Convert back to XML
      const newXml = typeTransformer.jsonToXML(jsonObj);
      
      // Verify the xsi:nil attribute is preserved or recreated
      expect(newXml).toNormalizeContain('xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"');
      expect(newXml).toNormalizeContain('xsi:nil="true"');
    });
    
    test("should convert null values back to xsi:nil elements", () => {
      // Create a JSON object with a null value
      const jsonObj = {
        "root": {
          "@ns": "",
          "@val": "",
          "@children": [
            {
              "nullElement": {
                "@ns": "",
                "@val": null
              }
            }
          ]
        }
      };
      
      // Convert to XML
      const xml = typeTransformer.jsonToXML(jsonObj);
      
      // Verify the null value is represented with xsi:nil
      expect(xml).toNormalizeContain('xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"');
      expect(xml).toNormalizeContain('xsi:nil="true"');
    });
  });
  
  describe("Mixed content with type conversion", () => {
    test("should not break mixed content handling when type conversion is enabled", () => {
      const xml = '<paragraph>This contains <strong>42</strong> as a number and <em>true</em> as a boolean.</paragraph>';
      
      const result = typeTransformer.xmlToJSON(xml);
      
      // Mixed content should be preserved as string
      expect(typeof result.paragraph["@val"]).toBe("string");
      expect(result.paragraph["@val"]).toBe('This contains <strong>42</strong> as a number and <em>true</em> as a boolean.');
      
      // Convert back to XML
      const newXml = typeTransformer.jsonToXML(result);
      
      // Verify mixed content is preserved
      expect(newXml).toNormalizeContain('<paragraph>This contains <strong>42</strong> as a number and <em>true</em> as a boolean.</paragraph>');
    });
  });
  
  describe("Configuration combinations", () => {
    test("should handle individual type conversion options", () => {
      // Create transformers with individual options enabled
      const booleanTransformer = new XMLJSONTransformer({
        outputOptions: { json: { grokBooleans: true } }
      });
      
      const numberTransformer = new XMLJSONTransformer({
        outputOptions: { json: { grokNumbers: true } }
      });
      
      const nullTransformer = new XMLJSONTransformer({
        outputOptions: { json: { grokNull: true } }
      });
      
      const xml = `
        <root>
          <boolValue>true</boolValue>
          <numValue>42</numValue>
          <nullValue>null</nullValue>
        </root>
      `;
      
      const boolResult = booleanTransformer.xmlToJSON(xml);
      const numResult = numberTransformer.xmlToJSON(xml);
      const nullResult = nullTransformer.xmlToJSON(xml);
      
      // Boolean transformer should only convert boolean
      expect(typeof boolResult.root["@children"][0].boolValue["@val"]).toBe("boolean");
      expect(typeof boolResult.root["@children"][1].numValue["@val"]).toBe("string");
      expect(typeof boolResult.root["@children"][2].nullValue["@val"]).toBe("string");
      
      // Number transformer should only convert number
      expect(typeof numResult.root["@children"][0].boolValue["@val"]).toBe("string");
      expect(typeof numResult.root["@children"][1].numValue["@val"]).toBe("number");
      expect(typeof numResult.root["@children"][2].nullValue["@val"]).toBe("string");
      
      // Null transformer should only convert null
      expect(typeof nullResult.root["@children"][0].boolValue["@val"]).toBe("string");
      expect(typeof nullResult.root["@children"][1].numValue["@val"]).toBe("string");
      expect(nullResult.root["@children"][2].nullValue["@val"]).toBe(null);
    });
  });
});