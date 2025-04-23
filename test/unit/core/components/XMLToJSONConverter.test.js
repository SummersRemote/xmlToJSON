import { JSDOM } from "jsdom";
import XMLToJSONConverter from "../../../../src/core/components/XMLToJSONConverter.js";
import ConfigurationManager from "../../../../src/core/components/ConfigurationManager.js";
import NodeProcessor from "../../../../src/core/components/NodeProcessor.js";
import {
  createTestConfig,
  loadFixture,
  normalizeXML,
} from "../../../helpers/testUtils.js";
import { TransformerError } from "../../../../src/core/errors/TransformerError.js";

// Set up DOM environment
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
  contentType: "text/xml",
});

const domEnv = {
  nodeTypes: {
    ELEMENT_NODE: dom.window.Node.ELEMENT_NODE,
    TEXT_NODE: dom.window.Node.TEXT_NODE,
    CDATA_SECTION_NODE: dom.window.Node.CDATA_SECTION_NODE,
    COMMENT_NODE: dom.window.Node.COMMENT_NODE,
    PROCESSING_INSTRUCTION_NODE: dom.window.Node.PROCESSING_INSTRUCTION_NODE,
    ATTRIBUTE_NODE: dom.window.Node.ATTRIBUTE_NODE,
  },
  createParser: () => new dom.window.DOMParser(),
  createSerializer: () => new dom.window.XMLSerializer(),
  createDocument: () =>
    dom.window.document.implementation.createDocument(null, null, null),
};

describe("XMLToJSONConverter", () => {
  let converter;
  let configManager;
  let nodeProcessor;

  beforeEach(() => {
    const config = createTestConfig();
    configManager = new ConfigurationManager(config);
    nodeProcessor = new NodeProcessor(configManager, domEnv);
    converter = new XMLToJSONConverter(configManager, nodeProcessor, domEnv);
  });

  describe("convert", () => {
    test("should convert simple XML to JSON", () => {
      const xmlString = loadFixture("xml", "simple");
      const result = converter.convert(xmlString);

      // Check structure and key fields
      expect(result).toHaveProperty("root");
      expect(result.root).toHaveProperty("@children");
      expect(Array.isArray(result.root["@children"])).toBe(true);
      expect(result.root["@children"].length).toBe(2);

      // Check specific values from the first child element
      const firstChild = result.root["@children"][0].child;
      expect(firstChild["@val"]).toBe("Hello World");
      expect(firstChild["@attrs"].id["@val"]).toBe("1");

      // Compare with expected fixture
      const expectedJson = loadFixture("json", "simple");
      expect(result).toEqual(expectedJson);
    });

    test("should convert XML with namespaces to JSON", () => {
      const xmlString = loadFixture("xml", "namespaces");
      const result = converter.convert(xmlString);

      // Check namespace properties
      expect(result).toHaveProperty("Envelope");
      expect(result["Envelope"]["@ns"]).toBe(
        "http://www.w3.org/2003/05/soap-envelope"
      );
      expect(result["Envelope"]["@prefix"]).toBe("soap");

      // Check namespace in nested elements
      const header = result["Envelope"]["@children"][0]["Header"];
      expect(header["@ns"]).toBe("http://www.w3.org/2003/05/soap-envelope");

      // Check specific element with different namespace
      const getStock =
        result["Envelope"]["@children"][1]["Body"]["@children"][0]["GetStock"];
      expect(getStock["@ns"]).toBe("http://example.org/stock");
      expect(getStock["@prefix"]).toBe("m");

      // Verify a specific value in deeply nested element
      const stockName = getStock["@children"][0]["StockName"];
      expect(stockName["@val"]).toBe("ACME");

      // Compare with expected fixture
      // TODO:  This doesn't work.  Need new technique
      //   const expectedJson = loadFixture('json', 'namespaces');
      //   expect(result).toEqual(expectedJson);
    });

    test("should convert XML with mixed content to JSON", () => {
      const xmlString = loadFixture("xml", "mixed-content");
      const result = converter.convert(xmlString);

      // Check if the mixed content is preserved in @val property
      const paragraphs = result.article["@children"].filter(
        (child) => "paragraph" in child
      );
      expect(paragraphs.length).toBe(2);

      // First paragraph with simple mixed content
      const firstParagraph = paragraphs[0].paragraph;
      expect(firstParagraph["@val"]).toContain("<em>emphasized</em>");
      expect(firstParagraph["@val"]).toContain("<strong>strong</strong>");

      // Second paragraph with more complex mixed content (nested list)
      const secondParagraph = paragraphs[1].paragraph;
      expect(secondParagraph["@val"]).toContain("<ul>");
      expect(secondParagraph["@val"]).toContain("<li>Item 1</li>");

      // Compare with expected fixture
      const expectedJson = loadFixture("json", "mixed-content");
      expect(result).toEqual(expectedJson);
    });

    test("should convert XML with special nodes to JSON", () => {
      const xmlString = loadFixture("xml", "special-nodes");
      const result = converter.convert(xmlString);

      // Check for processing instruction
      expect(result.root["@processing"].length).toBe(1);
      expect(result.root["@processing"][0]).toContain("xml-stylesheet");

      // Check for comments
      expect(result.root["@comments"].length).toBe(2);
      expect(result.root["@comments"][0]).toContain("This is a comment");

      // Check for CDATA section
      const dataElement =
        result.root["@children"][0].element["@children"][0].data;
      expect(dataElement["@cdata"].length).toBe(1);
      expect(dataElement["@cdata"][0]).toContain(
        'alert("This is CDATA content")'
      );

      // Compare with expected fixture
      const expectedJson = loadFixture("json", "special-nodes");
      expect(result).toEqual(expectedJson);
    });

    test("should throw error for invalid XML input", () => {
      // XML with unclosed tag
      const invalidXml = "<root><child>test</unclosed></root>";

      expect(() => {
        converter.convert(invalidXml);
      }).toThrow(TransformerError);
    });

    test("should throw error for non-string input", () => {
      expect(() => {
        converter.convert(null);
      }).toThrow(TransformerError);

      expect(() => {
        converter.convert(123);
      }).toThrow(TransformerError);

      expect(() => {
        converter.convert({});
      }).toThrow(TransformerError);
    });
  });
});
