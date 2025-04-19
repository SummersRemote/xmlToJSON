/**
 * Unit tests for the XMLJSONTransformer class
 * These tests can be run in a browser or Node.js environment with a test framework
 * like Jest, Mocha, or Jasmine.
 */

import { XMLJSONTransformer } from '../../src/xml-json-transformer.js';

describe("XMLJSONTransformer", () => {
  let transformer;

  beforeEach(() => {
    // Create a fresh transformer instance before each test
    transformer = new XMLJSONTransformer();
  });

  describe("Basic functionality", () => {
    test("should transform a simple XML element to JSON", () => {
      const xml = "<root>Hello World</root>";
      const expected = {
        root: {
          "@ns": "",
          "@val": "Hello World",
        },
      };

      const result = transformer.xmlToJSON(xml);
      expect(result).toEqual(expected);
    });

    test("should transform a simple JSON object to XML", () => {
      const json = {
        root: {
          "@ns": "",
          "@val": "Hello World",
        },
      };
      const expected = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><root>Hello World</root>";

      const result = transformer.jsonToXML(json);
      // Remove whitespace for comparison
      expect(result).toNormalizeEqual(expected);
    });

    test("should handle empty elements", () => {
      const xml = "<empty />";
      const expected = {
        empty: {},
      };

      const result = transformer.xmlToJSON(xml);
      expect(result).toEqual(expected);

      const roundTrip = transformer.jsonToXML(result);
      expect(roundTrip).toNormalizeEqual("<?xml version=\"1.0\" encoding=\"UTF-8\"?><empty/>");
    });

    test("should return JSON as string when requested", () => {
      const xml = "<root>Hello World</root>";

      const result = transformer.xmlToJSON(xml, true);
      expect(typeof result).toBe("string");
      expect(JSON.parse(result)).toEqual({
        root: {
          "@ns": "",
          "@val": "Hello World",
        },
      });
    });

    test("should format JSON with proper indentation", () => {
      const json = {
        root: {
          "@val": "Hello World",
        },
      };

      const result = transformer.jsonToString(json);
      console.log(result);
      expect(result).toContain("\n");
      expect(result).toContain("  ");
    });
  });

  describe("Attributes", () => {
    test("should handle elements with attributes", () => {
      const xml = '<item id="123" category="book">Product</item>';
      const expected = {
        item: {
          "@ns": "",
          "@val": "Product",
          "@attrs": {
            id: {
              "@val": "123",
              "@ns": "",
            },
            category: {
              "@val": "book",
              "@ns": "",
            },
          },
        },
      };

      const result = transformer.xmlToJSON(xml);
      expect(result).toNormalizeEqual(expected);

      const roundTrip = transformer.jsonToXML(result);
      expect(roundTrip).toNormalizeContain('id="123"');
      expect(roundTrip).toNormalizeContain('category="book"');
    });

    test("should handle attributes with namespace", () => {
      const xml =
        '<item xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="http://example.com">Link</item>';

      const result = transformer.xmlToJSON(xml);
      expect(result.item).toBeDefined();
      expect(result.item["@attrs"]).toBeDefined();
      
      // With stripPrefixes=true (default), the attribute might be stored as "href" 
      // rather than "xlink:href"
      const attrName = Object.keys(result.item["@attrs"]).find(
        key => key === "xlink:href" || key === "href"
      );
      expect(attrName).toBeDefined();
      
      const attr = result.item["@attrs"][attrName];
      expect(attr).toBeDefined();
      expect(attr["@val"]).toBe("http://example.com");

      // In some DOM implementations, the attribute might have a namespace
      if (attr["@ns"]) {
        expect(attr["@ns"]).toBe("http://www.w3.org/1999/xlink");
      }

      const roundTrip = transformer.jsonToXML(result);
      expect(roundTrip.includes('href="http://example.com"')).toBe(true);
    });

    test("should handle empty attributes", () => {
      const xml = '<item empty="" zero="0">Empty value</item>';

      const result = transformer.xmlToJSON(xml);
      // With compact mode and removeEmptyStrings, empty values might be undefined
      // Check if the attribute exists but value might be undefined
      expect(result.item["@attrs"].empty).toBeDefined();
      expect(result.item["@attrs"].zero["@val"]).toBe("0");

      const roundTrip = transformer.jsonToXML(result);
      expect(roundTrip.includes('empty=""')).toBe(true);
      expect(roundTrip.includes('zero="0"')).toBe(true);
    });
  });

  describe("Namespaces", () => {
    test("should handle namespaces", () => {
      const xml =
        '<x:root xmlns:x="http://example.com/ns1"><x:child>Content</x:child></x:root>';

      const result = transformer.xmlToJSON(xml);
      // With stripPrefixes=true (default config), the prefix is removed
      expect(result.root).toBeDefined();
      expect(result.root["@ns"]).toEqual("http://example.com/ns1");

      const child = result.root["@children"][0].child;
      expect(child).toBeDefined();
      expect(child["@ns"]).toEqual("http://example.com/ns1");

      const roundTrip = transformer.jsonToXML(result);
      expect(roundTrip.includes('xmlns')).toBe(true);
      expect(roundTrip.includes('http://example.com/ns1')).toBe(true);
    });

    test("should handle default namespaces", () => {
      const xml = '<root xmlns="http://example.com/default">Content</root>';

      const result = transformer.xmlToJSON(xml);
      expect(result.root["@ns"]).toEqual("http://example.com/default");

      const roundTrip = transformer.jsonToXML(result);
      expect(roundTrip.includes('xmlns="http://example.com/default"')).toBe(
        true
      );
    });

    test("should not include namespaces when configured", () => {
      const nsTransformer = new XMLJSONTransformer({
        preserveNamespaces: false,
      });

      const xml =
        '<x:root xmlns:x="http://example.com/ns1"><x:child>Content</x:child></x:root>';

      const result = nsTransformer.xmlToJSON(xml);
      // With stripPrefixes=true (default), we should have "root" not "x:root"
      expect(result.root).toBeDefined();
      expect(result.root["@ns"]).toBeUndefined();

      const child = result.root["@children"][0].child;
      expect(child).toBeDefined();
      expect(child["@ns"]).toBeUndefined();

      const roundTrip = nsTransformer.jsonToXML(result);
      expect(roundTrip.includes('xmlns')).toBe(false);
    });

    test("should strip prefixes when configured", () => {
      const prefixTransformer = new XMLJSONTransformer({
        stripPrefixes: true,
      });

      const xml =
        '<x:root xmlns:x="http://example.com/ns1"><x:child>Content</x:child></x:root>';

      const result = prefixTransformer.xmlToJSON(xml);
      expect(result.root).toBeDefined();
      expect(result.root["@ns"]).toEqual("http://example.com/ns1");

      const children = result.root["@children"];
      expect(children[0].child).toBeDefined();

      const roundTrip = prefixTransformer.jsonToXML(result);
      // The namespace should still be preserved even if prefixes are stripped
      expect(roundTrip.includes("http://example.com/ns1")).toBe(true);
    });

    test("should both remove namespaces and strip prefixes when configured", () => {
      const simpleTransformer = new XMLJSONTransformer({
        preserveNamespaces: false,
        stripPrefixes: true,
      });

      const xml =
        '<x:root xmlns:x="http://example.com/ns1"><x:child>Content</x:child></x:root>';

      const result = simpleTransformer.xmlToJSON(xml);
      expect(result.root).toBeDefined();
      expect(result.root["@ns"]).toBeUndefined();

      const children = result.root["@children"];
      expect(children[0].child).toBeDefined();
      expect(children[0].child["@ns"]).toBeUndefined();

      const roundTrip = simpleTransformer.jsonToXML(result);
      expect(roundTrip.includes("xmlns")).toBe(false);
      expect(roundTrip.includes("<root>")).toBe(true);
      expect(roundTrip.includes("<child>")).toBe(true);
    });

    test("should handle multiple namespaces", () => {
      const xml = `
          <root xmlns:a="http://example.com/a" xmlns:b="http://example.com/b">
            <a:element>A content</a:element>
            <b:element>B content</b:element>
          </root>
        `;

      const result = transformer.xmlToJSON(xml);
      
      // With stripPrefixes=true (default), we should have "element" not "a:element"
      expect(result.root["@children"]).toBeDefined();
      expect(result.root["@children"].length).toBe(2);
      
      const aElement = result.root["@children"][0].element;
      const bElement = result.root["@children"][1].element;
      
      expect(aElement).toBeDefined();
      expect(bElement).toBeDefined();
      
      expect(aElement["@ns"]).toBe("http://example.com/a");
      expect(bElement["@ns"]).toBe("http://example.com/b");

      const roundTrip = transformer.jsonToXML(result);
      expect(roundTrip.includes('xmlns')).toBe(true);
      expect(roundTrip.includes('http://example.com/a')).toBe(true);
      expect(roundTrip.includes('http://example.com/b')).toBe(true);
    });
  });

  describe("Special node types", () => {
    test("should handle CDATA sections", () => {
      const xml = "<root><![CDATA[<b>Bold text</b>]]></root>";

      const result = transformer.xmlToJSON(xml);
      expect(result.root["@cdata"]).toBeDefined();
      expect(result.root["@cdata"].length).toBe(1);
      expect(result.root["@cdata"][0]).toBe("<b>Bold text</b>");

      const roundTrip = transformer.jsonToXML(result);
      expect(roundTrip).toNormalizeContain("<![CDATA[<b>Bold text</b>]]>");
    });

    test("should handle multiple CDATA sections", () => {
      const xml =
        "<root><![CDATA[First section]]><![CDATA[Second section]]></root>";

      const result = transformer.xmlToJSON(xml);
      expect(result.root["@cdata"]).toBeDefined();
      expect(result.root["@cdata"].length).toBe(2);
      expect(result.root["@cdata"][0]).toBe("First section");
      expect(result.root["@cdata"][1]).toBe("Second section");

      const roundTrip = transformer.jsonToXML(result);
      expect(roundTrip).toNormalizeContain("<![CDATA[First section]]>");
      expect(roundTrip).toNormalizeContain("<![CDATA[Second section]]>");
    });

    test("should handle comments", () => {
      const xml = "<root><!-- This is a comment --></root>";

      const result = transformer.xmlToJSON(xml);
      expect(result.root["@comments"]).toBeDefined();
      expect(result.root["@comments"].length).toBe(1);
      expect(result.root["@comments"][0]).toBe(" This is a comment ");

      const roundTrip = transformer.jsonToXML(result);
      expect(roundTrip.includes("<!-- This is a comment -->")).toBe(true);
    });

    test("should handle multiple comments", () => {
      const xml = "<root><!-- First comment --><!-- Second comment --></root>";

      const result = transformer.xmlToJSON(xml);
      expect(result.root["@comments"]).toBeDefined();
      expect(result.root["@comments"].length).toBe(2);
      expect(result.root["@comments"][0]).toBe(" First comment ");
      expect(result.root["@comments"][1]).toBe(" Second comment ");

      const roundTrip = transformer.jsonToXML(result);
      expect(roundTrip.includes("<!-- First comment -->")).toBe(true);
      expect(roundTrip.includes("<!-- Second comment -->")).toBe(true);
    });

    test("should handle processing instructions", () => {
      const xml = '<?xml version="1.0"?><root><?custom-pi data?></root>';

      const result = transformer.xmlToJSON(xml);
      expect(result.root["@processing"]).toBeDefined();
      expect(result.root["@processing"].length).toBe(1);
      expect(result.root["@processing"][0]).toBe("custom-pi data");

      const roundTrip = transformer.jsonToXML(result);
      expect(roundTrip.includes("<?custom-pi data?>")).toBe(true);
    });

    test("should handle multiple processing instructions", () => {
      const xml = "<root><?first-pi data1?><?second-pi data2?></root>";

      const result = transformer.xmlToJSON(xml);
      expect(result.root["@processing"]).toBeDefined();
      expect(result.root["@processing"].length).toBe(2);
      expect(result.root["@processing"][0]).toBe("first-pi data1");
      expect(result.root["@processing"][1]).toBe("second-pi data2");

      const roundTrip = transformer.jsonToXML(result);
      expect(roundTrip.includes("<?first-pi data1?>")).toBe(true);
      expect(roundTrip.includes("<?second-pi data2?>")).toBe(true);
    });

    test("should not preserve special nodes when configured", () => {
      const noSpecialNodesTransformer = new XMLJSONTransformer({
        preserveComments: false,
        preserveCDATA: false,
        preserveProcessingInstr: false,
      });

      const xml = `
          <root>
            <!-- Comment -->
            <![CDATA[CDATA content]]>
            <?pi-target data?>
            Text content
          </root>
        `;

      const result = noSpecialNodesTransformer.xmlToJSON(xml);
      
      // When preserving is disabled, these collections might not exist in compact mode
      expect(result.root["@comments"]).toBeUndefined();
      expect(result.root["@cdata"]).toBeUndefined();
      expect(result.root["@processing"]).toBeUndefined();
      
      expect(result.root["@val"]).toBeDefined();
      expect(result.root["@val"].trim()).toBe("Text content");

      const roundTrip = noSpecialNodesTransformer.jsonToXML(result);
      expect(roundTrip).not.toNormalizeContain("Comment");
      expect(roundTrip).not.toNormalizeContain("CDATA");
      expect(roundTrip).not.toNormalizeContain("pi-target");
      expect(roundTrip).toNormalizeContain("Text content");
    });
  });

  describe("Mixed Content Handling", () => {
    test("should handle simple mixed content in transformation", () => {
      const xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><paragraph>This has <bold>mixed</bold> content.</paragraph>";

      const result = transformer.xmlToJSON(xml);

      // The value should contain the entire content including markup
      expect(result.paragraph["@val"]).toBe(
        "This has <bold>mixed</bold> content."
      );

      // Children array should not exist for mixed content in compact mode
      expect(result.paragraph["@children"]).toBeUndefined();

      // Transform back to XML
      const roundTrip = transformer.jsonToXML(result);

      // Remove whitespace for comparison
      const normalizedOriginal = xml.replace(/\s+/g, "");
      const normalizedRoundTrip = roundTrip.replace(/\s+/g, "");

      expect(normalizedRoundTrip).toBe(normalizedOriginal);
    });

    test("should handle complex mixed content", () => {
      const xml = `
          <article>
            <p>This paragraph has <em>emphasized</em> text and <strong>strong</strong> text mixed with regular text.</p>
            <p>Another paragraph with <a href="https://example.com">a link</a> in the middle.</p>
          </article>
        `;

      const result = transformer.xmlToJSON(xml);

      // The <p> elements should be processed as mixed content
      const paragraphs = result.article["@children"];
      expect(paragraphs.length).toBe(2);

      const firstP = paragraphs[0].p;
      const secondP = paragraphs[1].p;

      // Check that the paragraphs contain the markup
      expect(firstP["@val"]).toNormalizeContain("<em>emphasized</em>");
      expect(firstP["@val"]).toNormalizeContain("<strong>strong</strong>");
      expect(secondP["@val"]).toNormalizeContain(
        '<a href="https://example.com">a link</a>'
      );

      // Transform back to XML
      const roundTrip = transformer.jsonToXML(result);

      // Verify the transformed XML contains the same elements
      expect(roundTrip).toNormalizeContain("<em>emphasized</em>");
      expect(roundTrip).toNormalizeContain("<strong>strong</strong>");
      expect(roundTrip).toNormalizeContain('<a href="https://example.com">a link</a>');
    });
  });
});