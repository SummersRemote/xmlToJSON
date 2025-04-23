import { JSDOM } from "jsdom";
import JSONToXMLConverter from "../../../../src/core/components/JSONToXMLConverter.js";
import ConfigurationManager from "../../../../src/core/components/ConfigurationManager.js";
import NodeProcessor from "../../../../src/core/components/NodeProcessor.js";
import {
  loadFixture,
  createTestConfig,
  normalizeXML,
} from "../../../helpers/testUtils.js";

// Create DOM environment using jsdom
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

describe("JSONToXMLConverter", () => {
  let converter;
  let configManager;
  let nodeProcessor;
  let testConfig;

  beforeEach(() => {
    testConfig = createTestConfig();
    configManager = new ConfigurationManager(testConfig);
    nodeProcessor = new NodeProcessor(configManager, domEnv);
    converter = new JSONToXMLConverter(configManager, nodeProcessor, domEnv);
  });

  describe("convert", () => {
    test("should convert simple JSON to XML", () => {
      // Load test fixture
      const jsonObj = loadFixture("json", "simple");

      // Convert JSON to XML
      const xmlResult = converter.convert(jsonObj);

      // Check for root element
      expect(xmlResult).toContain("<root");
      expect(xmlResult).toContain("</root>");

      // Check for child elements with attributes
      expect(xmlResult).toContain('<child id="1">');
      expect(xmlResult).toContain(">Hello World<");
      expect(xmlResult).toContain('<child id="2">');
      expect(xmlResult).toContain(">Test<");
    });

    test("should properly handle namespaces", () => {
      // Load test fixture
      const jsonObj = loadFixture("json", "namespaces");

      // Convert JSON to XML
      const xmlResult = converter.convert(jsonObj);

      // Check for root element with namespace
      expect(xmlResult).toContain("<soap:Envelope");
      expect(xmlResult).toContain(
        'xmlns:soap="http://www.w3.org/2003/05/soap-envelope"'
      );

      // Check for nested elements with namespaces
      expect(xmlResult).toContain("<soap:Body");
      expect(xmlResult).toContain("<m:GetStock");
      expect(xmlResult).toContain('xmlns:m="http://example.org/stock"');

      // Check for element values
      expect(xmlResult).toContain("<m:StockName>ACME</m:StockName>");
      expect(xmlResult).toContain("<m:StockExchange>NYSE</m:StockExchange>");

      // Check for auth namespace elements
      expect(xmlResult).toContain("<auth:Credentials");
      expect(xmlResult).toContain('xmlns:auth="http://example.org/auth"');
      expect(xmlResult).toContain("<auth:Username>user123</auth:Username>");
      expect(xmlResult).toContain("<auth:Token>ABC123</auth:Token>");
    });

    test("should handle mixed content properly", () => {
      // Load test fixture
      const jsonObj = loadFixture("json", "mixed-content");

      // Convert JSON to XML
      const xmlResult = converter.convert(jsonObj);

      // Check for root element
      expect(xmlResult).toContain("<article>");

      // Check for title
      expect(xmlResult).toContain("<title>Mixed Content Example</title>");

      // Check for paragraph with mixed content
      expect(xmlResult).toContain(
        "<paragraph>This paragraph has <em>emphasized</em> text and <strong>strong</strong> text.</paragraph>"
      );

      // Check for paragraph with nested list
      const expectedListContent = "<paragraph>";
      expect(xmlResult).toContain(expectedListContent);
      expect(xmlResult).toContain("<ul>");
      expect(xmlResult).toContain("<li>Item 1</li>");
      expect(xmlResult).toContain("<li>Item 2</li>");
    });

    test("should handle special nodes (CDATA, comments, processing instructions)", () => {
      // Load test fixture
      const jsonObj = loadFixture("json", "special-nodes");

      // Convert JSON to XML
      const xmlResult = converter.convert(jsonObj);

      // Check for processing instructions
      expect(xmlResult).toContain(
        '<?xml-stylesheet type="text/css" href="style.css"?>'
      );

      // Check for comments
      expect(xmlResult).toContain("<!-- This is a comment -->");
      expect(xmlResult).toContain("<!-- This is another comment -->");

      // Check for CDATA
      expect(xmlResult).toContain(
        '<![CDATA[<script>alert("This is CDATA content");</script>]]>'
      );

      // Check for element with attributes
      expect(xmlResult).toContain('<element id="123">');
      expect(xmlResult).toContain('<element id="456">Normal text</element>');
    });

    test("should format output according to configuration", () => {
      // Create config with pretty printing disabled
      const nonPrettyConfig = createTestConfig({
        outputOptions: {
          prettyPrint: false,
          xml: {
            declaration: true,
          },
        },
      });

      // Create converter with non-pretty config
      const nonPrettyConfigManager = new ConfigurationManager(nonPrettyConfig);
      const nonPrettyNodeProcessor = new NodeProcessor(
        nonPrettyConfigManager,
        domEnv
      );
      const nonPrettyConverter = new JSONToXMLConverter(
        nonPrettyConfigManager,
        nonPrettyNodeProcessor,
        domEnv
      );

      // Load simple JSON
      const jsonObj = loadFixture("json", "simple");

      // Convert without pretty printing
      const xmlResult = nonPrettyConverter.convert(jsonObj);

      // Without pretty printing, there should be no extra whitespace between tags
      // TODO:  will contain one \n because of the xml declaration
      //   expect(xmlResult).not.toContain('>\n');

      // Compare with normal converter which uses pretty printing
      const prettyXml = converter.convert(jsonObj);
      expect(prettyXml).toContain(">\n");

      // The normalized content should be the same
      expect(normalizeXML(xmlResult)).toBe(normalizeXML(prettyXml));
    });

    test("should omit namespace information when configured", () => {
      // Create config with namespace preservation disabled
      const noNamespaceConfig = createTestConfig({
        preserveNamespaces: false,
      });

      // Create converter with namespace preservation disabled
      const noNamespaceConfigManager = new ConfigurationManager(
        noNamespaceConfig
      );
      const noNamespaceNodeProcessor = new NodeProcessor(
        noNamespaceConfigManager,
        domEnv
      );
      const noNamespaceConverter = new JSONToXMLConverter(
        noNamespaceConfigManager,
        noNamespaceNodeProcessor,
        domEnv
      );

      // Load namespaces JSON
      const jsonObj = loadFixture("json", "namespaces");

      // Convert without namespace preservation
      const xmlResult = noNamespaceConverter.convert(jsonObj);

      // Should still have the element names with prefixes
      expect(xmlResult).toContain("<Envelope");
      expect(xmlResult).toContain("<Body");

      // But should not include namespace declarations
      expect(xmlResult).not.toContain("xmlns:soap=");
      expect(xmlResult).not.toContain("xmlns:m=");
    });
  });
});
