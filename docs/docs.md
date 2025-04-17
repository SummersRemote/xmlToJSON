# XMLJSONTransformer

A JavaScript utility class for transforming between XML and JSON with support for:
- Elements with namespaces
- Attributes with namespaces
- CDATA sections
- Comments
- Processing instructions
- Mixed content

## Features

- **Bidirectional Transformation**: Convert XML to JSON and back to XML with predictable results
- **Namespace Support**: Properly handle XML namespaces with options to include or strip them
- **Special Node Types**: Support for CDATA sections, comments, and processing instructions
- **Mixed Content**: Simplified handling of elements with mixed content
- **Configurable**: Extensive customization options
- **Lightweight**: No external dependencies

## Installation

```javascript
// Include the XMLJSONTransformer.js file in your project
// or copy the class directly
```

## Usage

### Basic Usage

```javascript
// Create a transformer with default configuration
const transformer = new XMLJSONTransformer();

// Convert XML to JSON
const xmlString = '<root><child>Hello World</child></root>';
const jsonObject = transformer.xmlToJSON(xmlString);

// Convert JSON back to XML
const xmlResult = transformer.jsonToXML(jsonObject);
```

### Getting JSON as a String

```javascript
// Convert XML to a formatted JSON string directly
const jsonString = transformer.xmlToJSON(xmlString, true);

// Or use the convenience method
const jsonObj = transformer.xmlToJSON(xmlString);
const formattedJson = transformer.jsonToString(jsonObj);
```

## Configuration Options

The `XMLJSONTransformer` class accepts a configuration object with the following options:

```javascript
const transformer = new XMLJSONTransformer({
  // Features to preserve during transformation
  preserveNamespaces: true,           // When false, namespace URIs are not included
  preserveComments: true,             // Preserve comment nodes
  preserveProcessingInstructions: true, // Preserve processing instructions
  preserveCDATA: true,                // Preserve CDATA sections
  preserveTextNodes: true,            // Preserve text nodes
  preserveWhitespace: false,          // Preserve whitespace in text nodes
  
  // Element name handling
  stripPrefixes: false,               // When true, namespace prefixes are removed
  
  // Output options for both XML and JSON
  outputOptions: {
    prettyPrint: true,                // Enable pretty printing for both formats
    indent: 2,                        // Number of spaces or string for indentation
    
    // JSON-specific options
    json: {
      compact: false,                 // When true, empty arrays/objects are omitted
      removeEmptyStrings: false       // When true, empty string values are omitted
    },
    
    // XML-specific options (reserved for future use)
    xml: {}
  },
  
  // Property names in the JSON representation
  propNames: {
    namespace: "@ns",                 // Property name for namespace URIs
    value: "@val",                    // Property name for node values
    attributes: "@attrs",             // Property name for attributes
    cdata: "@cdata",                  // Property name for CDATA sections
    comments: "@comments",            // Property name for comments
    processing: "@processing",        // Property name for processing instructions
    children: "@children"             // Property name for child nodes
  }
});
```

### Namespace Handling

You can control how namespaces are handled during transformation with these options:

- **preserveNamespaces**: When set to `true` (default), namespace information is included in the JSON. When set to `false`, namespace information is omitted.

- **stripPrefixes**: When set to `true`, namespace prefixes are removed from element and attribute names in the JSON.

Example with namespace handling options:

```javascript
// Create a transformer that removes namespaces and strips prefixes
const simpleTransformer = new XMLJSONTransformer({
  preserveNamespaces: false,
  stripPrefixes: true
});

// Original XML with namespaces
const xml = `
  <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
    <soap:Body>
      <m:GetStock xmlns:m="http://example.org/stock">
        <m:StockName>ACME</m:StockName>
      </m:GetStock>
    </soap:Body>
  </soap:Envelope>
`;

// Transform to JSON with simplified namespace handling
const json = simpleTransformer.xmlToJSON(xml);
```

### Output Formatting

Control the formatting of both XML and JSON output:

```javascript
const transformer = new XMLJSONTransformer({
  outputOptions: {
    prettyPrint: true,    // Enable/disable pretty printing for both XML and JSON
    indent: 2,            // Number of spaces or a string for indentation
    json: {
      compact: true,      // Remove empty arrays/objects from JSON
      removeEmptyStrings: true  // Remove empty string values
    }
  }
});
```

## Mixed Content Handling

When dealing with XML that contains mixed content (elements that have both text and child elements), XMLJSONTransformer uses a simplified approach:

- Nodes with mixed content will have the entire content (including child elements as markup) stored in the `@val` property
- The child elements won't be processed separately into the `@children` array
- When transforming back to XML, the markup in the value will be preserved

This approach is useful for document-oriented XML formats like XHTML where mixed content is common.

Example:

```javascript
// Original XML with mixed content
const xml = '<paragraph>This has <bold>mixed</bold> content.</paragraph>';

// JSON representation
{
  "paragraph": {
    "@ns": "",
    "@val": "This has <bold>mixed</bold> content.",
    "@attrs": {},
    "@cdata": [],
    "@comments": [],
    "@processing": [],
    "@children": []
  }
}

// When transformed back to XML, the original structure is preserved
```

## JSON Schema

The JSON representation follows this schema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "XML to JSON Model",
  "type": "object",
  "patternProperties": {
    "^[^@].*$": {
      "type": "object",
      "properties": {
        "@ns": { "type": "string" },
        "@val": { "type": "string" },
        "@attrs": {
          "type": "object",
          "additionalProperties": {
            "type": "object",
            "properties": {
              "@val": { "type": "string" },
              "@ns": { "type": "string" }
            },
            "required": ["@val", "@ns"],
            "additionalProperties": false
          }
        },
        "@cdata": {
          "type": "array",
          "items": { "type": "string" }
        },
        "@comments": {
          "type": "array",
          "items": { "type": "string" }
        },
        "@processing": {
          "type": "array",
          "items": { "type": "string" }
        },
        "@children": {
          "type": "array",
          "items": {
            "type": "object",
            "patternProperties": {
              "^[^@].*$": {
                "type": "array",
                "items": { "$ref": "#" }
              }
            },
            "additionalProperties": false
          }
        }
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false
}
```

## Compact Format

Using the compact output option creates a more minimal JSON representation:

```javascript
const transformer = new XMLJSONTransformer({
  outputOptions: {
    json: {
      compact: true,
      removeEmptyStrings: true
    }
  }
});

// Original XML
const xml = '<root><child attr="value"></child></root>';

// Compact JSON output
{
  "root": {
    "@children": [
      {
        "child": {
          "@attrs": {
            "attr": {
              "@val": "value"
            }
          }
        }
      }
    ]
  }
}
```

## Examples

### Example 1: Converting XML with namespaces to JSON

```javascript
const xml = `
<book:catalog xmlns:book="http://example.org/book">
  <book:book id="bk101">
    <book:author>Gambardella, Matthew</book:author>
    <book:title>XML Developer's Guide</book:title>
    <book:price>44.95</book:price>
  </book:book>
</book:catalog>
`;

const transformer = new XMLJSONTransformer();
const result = transformer.xmlToJSON(xml);
console.log(transformer.jsonToString(result));
```

### Example 2: Converting XML with mixed content to JSON

```javascript
const xml = `
<article>
  <p>This paragraph has <em>emphasized</em> text and <strong>strong</strong> text.</p>
</article>
`;

const transformer = new XMLJSONTransformer();
const result = transformer.xmlToJSON(xml);
console.log(transformer.jsonToString(result));
```

### Example 3: Converting JSON to XML with custom properties

```javascript
const transformer = new XMLJSONTransformer({
  propNames: {
    namespace: "_ns",
    value: "_text",
    attributes: "_attrs",
    children: "_children"
  }
});

// Your custom JSON structure using _ns, _text, etc.
const json = {
  "element": {
    "_text": "Content",
    "_attrs": {
      "id": {
        "_ns": "",
        "_text": "123"
      }
    }
  }
};

const xml = transformer.jsonToXML(json);
console.log(xml);
```

## License

MIT License