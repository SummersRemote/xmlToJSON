# xmlToJSON 2.0

A JavaScript utility class for transforming from XML to JSON **and back again!**

Features
- **Lightweight**: No external dependencies, (~3kb min/gzipd)
- **Bidirectional Transformation**: Convert XML to JSON and back to XML with predictable results
- **Namespace Support**: Properly handle XML namespaces with options to include or strip them
- **Special Node Types**: Support for CDATA sections, comments, and processing instructions
- **Mixed Content**: Simplified handling of elements with mixed content
- **Configurable**: Extensive customization options

![Build Status](https://github.com/summersremote/xmlToJSON/actions/workflows/ci.yml/badge.svg)

## Installation

TODO: browser, node, module, esm, umd....

## Usage

TODO: basic examples

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

## Mixed Content Handling

When dealing with XML that contains mixed content (elements that have both text and child elements), XMLJSONTransformer uses a simplified approach:

- Nodes with mixed content will have the entire content (including child elements as markup) stored in the `@val` property
- The child elements won't be processed separately into the `@children` array
- When transforming back to XML, the markup in the value will be preserved

## Examples