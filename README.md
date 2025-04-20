# xmlToJSON 2.0

A JavaScript utility class for bidirectional transformation between XML and JSON with extensive customization options.

![Build Status](https://github.com/summersremote/xmlToJSON/actions/workflows/ci.yml/badge.svg)

## Table of Contents

- [Features](#features)
- [Installation](#installation)
  - [Node.js](#nodejs)
  - [Browser](#browser)
- [Basic Usage](#basic-usage)
  - [Node.js](#nodejs-1)
  - [Browser](#browser-1)
- [Getting JSON as a String](#getting-json-as-a-string)
- [Configuration Options](#configuration-options)
- [JSON Representation](#json-representation)
  - [Compact Format](#compact-format)
- [Namespace Handling](#namespace-handling)
- [Mixed Content Handling](#mixed-content-handling)
- [Using Independent Utility Functions](#using-independent-utility-functions)
  - [PathNavigator - Advanced Path Navigation](#pathnavigator---advanced-path-navigation)
    - [Path Syntax and Special Features](#path-syntax-and-special-features)
    - [Advanced Path Navigation Examples](#advanced-path-navigation-examples)
  - [SchemaGenerator - JSON Schema Generation](#schemagenerator---json-schema-generation)
    - [Uses for the Schema Generator](#uses-for-the-schema-generator)
- [Value Transformers](#value-transformers)
  - [Context Object Properties](#context-object-properties)
  - [Possible Uses for Value Transformers](#possible-uses-for-value-transformers)
- [Examples](#examples)
  - [Example 1: Converting XML with namespaces to JSON](#example-1-converting-xml-with-namespaces-to-json)
  - [Example 2: Converting XML with mixed content to JSON](#example-2-converting-xml-with-mixed-content-to-json)
  - [Example 3: Converting JSON to XML with custom property names](#example-3-converting-json-to-xml-with-custom-property-names)
  - [Example 4: Converting special nodes (CDATA, comments, processing instructions)](#example-4-converting-special-nodes-cdata-comments-processing-instructions)
- [Caveats and Notes](#caveats-and-notes)
- [License](#license)

- **Lightweight**: No external dependencies (~3kb min/gzipped)
- **Bidirectional Transformation**: Convert XML to JSON and back to XML with predictable results
- **Namespace Support**: Properly handle XML namespaces with options to include or strip them
- **Special Node Types**: Support for CDATA sections, comments, and processing instructions
- **Mixed Content**: Simplified handling of elements with mixed content
- **Configurable**: Extensive customization options

## Installation

### Node.js

```bash
npm install xmltojson
```

### Browser

Include the script in your HTML file:

```html
<!-- UMD version -->
<script src="path/to/xmltojson.umd.min.js"></script>

<!-- or use ES modules -->
<script type="module">
  import XMLJSONTransformer from 'path/to/index.min.js';
</script>
```

## Basic Usage

### Node.js

```javascript
import XMLJSONTransformer from 'xmltojson';

// Create a transformer with default configuration
const transformer = new XMLJSONTransformer();

// Convert XML to JSON
const xmlString = '<root><child>Hello World</child></root>';
const jsonObject = transformer.xmlToJSON(xmlString);

// Convert JSON back to XML
const xmlResult = transformer.jsonToXML(jsonObject);

console.log(jsonObject);
console.log(xmlResult);
```

### Browser

```javascript
// UMD version
const transformer = new XMLJSONTransformer();

// Convert XML to JSON
const xmlString = '<root><child>Hello World</child></root>';
const jsonObject = transformer.xmlToJSON(xmlString);

// Convert JSON back to XML
const xmlResult = transformer.jsonToXML(jsonObject);

console.log(jsonObject);
console.log(xmlResult);
```

## Getting JSON as a String

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
  preserveProcessingInstr: true,      // Preserve processing instructions
  preserveCDATA: true,                // Preserve CDATA sections
  preserveTextNodes: true,            // Preserve text nodes
  preserveWhitespace: false,          // Preserve whitespace in text nodes
  
  // Type conversion options
  grokBoolean: false,                 // Convert "true"/"false" strings to boolean values
  grokNumber: false,                  // Convert numeric strings to numbers
  
  // Custom transform function (see section below)
  transformFunction: null,            // Function to transform node values
  
  // Output options for both XML and JSON
  outputOptions: {
    prettyPrint: true,                // Enable pretty printing for both formats
    indent: 3,                        // Number of spaces for indentation
    
    // JSON-specific options
    json: {
      compact: true,                  // When true, empty arrays/objects are omitted
      removeEmptyStrings: true        // When true, empty string values are omitted
    },
    
    // XML-specific options
    xml: {
      declaration: true               // Include XML declaration
    }
  },
  
  // Property names in the JSON representation
  propNames: {
    namespace: "@ns",                 // Property name for namespace URIs
    prefix: "@prefix",                // Property name for namespace prefixes
    value: "@val",                    // Property name for node values
    attributes: "@attrs",             // Property name for attributes
    cdata: "@cdata",                  // Property name for CDATA sections
    comments: "@comments",            // Property name for comments
    processing: "@processing",        // Property name for processing instructions
    children: "@children"             // Property name for child nodes
  }
});
```

## JSON Representation

The JSON representation follows this structure:

```javascript
{
  "element": {
    "@ns": "http://example.org/ns",
    "@prefix": "ex",
    "@val": "Element content",
    "@attrs": {
      "id": {
        "@val": "123",
        "@ns": ""
      },
      "type": {
        "@val": "example",
        "@ns": "http://example.org/ns",
        "@prefix": "ex"
      }
    },
    "@cdata": ["<![CDATA[Raw content]]>"],
    "@comments": ["Comment about the element"],
    "@processing": ["target data"],
    "@children": [
      {
        "child": {
          "@ns": "http://example.org/ns",
          "@prefix": "ex",
          "@val": "Child content",
          "@attrs": {},
          "@cdata": [],
          "@comments": [],
          "@processing": [],
          "@children": []
        }
      }
    ]
  }
}
```

### Compact Format

Using the compact output option creates a more minimal JSON representation by omitting empty collections:

```javascript
{
  "element": {
    "@ns": "http://example.org/ns",
    "@val": "Element content",
    "@attrs": {
      "id": {
        "@val": "123"
      }
    },
    "@children": [
      {
        "child": {
          "@val": "Child content"
        }
      }
    ]
  }
}
```

## Namespace Handling

You can control how namespaces are handled during transformation:

- **preserveNamespaces**: When true (default), namespace information is included in the JSON. When false, namespace information is omitted.

Example with namespace handling:

```javascript
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

// Create a transformer that preserves namespaces
const transformer = new XMLJSONTransformer({
  preserveNamespaces: true
});

// Transform to JSON with namespace information
const json = transformer.xmlToJSON(xml);

// Transform back to XML with namespaces restored
const xmlRestored = transformer.jsonToXML(json);
```

## Mixed Content Handling

When dealing with XML that contains mixed content (elements that have both text and child elements), XMLJSONTransformer uses a special approach:

- Nodes with mixed content will have the entire content (including child elements as markup) stored in the `@val` property
- The child elements won't be processed separately into the `@children` array
- When transforming back to XML, the markup in the value will be preserved

Example:

```javascript
// Original XML with mixed content
const xml = '<paragraph>This has <bold>mixed</bold> content.</paragraph>';

// JSON representation with mixed content
const json = transformer.xmlToJSON(xml);
// {
//   "paragraph": {
//     "@ns": "",
//     "@val": "This has <bold>mixed</bold> content.",
//     "@attrs": {},
//     "@cdata": [],
//     "@comments": [],
//     "@processing": [],
//     "@children": []
//   }
// }

// When transformed back to XML, the original structure is preserved
const xmlRestored = transformer.jsonToXML(json);
// <paragraph>This has <bold>mixed</bold> content.</paragraph>
```

## Using Independent Utility Functions

The library exports several independent components that you can use separately:

```javascript
import { 
  ConfigurationManager, 
  DOMEnvironment, 
  NodeProcessor, 
  XMLToJSONConverter, 
  JSONToXMLConverter,
  PathNavigator,
  SchemaGenerator
} from 'xmltojson';
```

### PathNavigator - Advanced Path Navigation

The `PathNavigator` component provides a powerful way to access specific data in your JSON structure using dot notation paths:

```javascript
const configManager = new ConfigurationManager();
const navigator = new PathNavigator(configManager);

const json = {
  "catalog": {
    "@children": [
      {
        "book": {
          "@attrs": {
            "id": {
              "@val": "bk101"
            }
          },
          "@children": [
            {
              "title": {
                "@val": "The Catcher in the Rye"
              }
            },
            {
              "author": {
                "@val": "J.D. Salinger"
              }
            }
          ]
        }
      },
      {
        "book": {
          "@attrs": {
            "id": {
              "@val": "bk102"
            }
          },
          "@children": [
            {
              "title": {
                "@val": "To Kill a Mockingbird"
              }
            },
            {
              "author": {
                "@val": "Harper Lee"
              }
            }
          ]
        }
      }
    ]
  }
};

// Access all book titles - skips directly to the titles regardless of nesting level
const titles = navigator.getPath(json, "catalog.@children.book.@children.title.@val");
console.log(titles); // ["The Catcher in the Rye", "To Kill a Mockingbird"]

// Get specific element by index
const firstBookTitle = navigator.getPath(json, "catalog.@children[0].book.@children[0].title.@val");
console.log(firstBookTitle); // "The Catcher in the Rye"

// Get attribute value
const firstBookId = navigator.getPath(json, "catalog.@children[0].book.@attrs.id.@val");
console.log(firstBookId); // "bk101"

// Providing a fallback value if path not found
const price = navigator.getPath(json, "catalog.@children[0].book.@children.price.@val", "Not available");
console.log(price); // "Not available"
```

#### Path Syntax and Special Features

- Use dot notation to navigate properties: `root.property.child`
- Use array indices to access specific items: `array[0]` 
- The navigator automatically flattens results when accessing collections
- When a path segment doesn't exist as a direct property, the navigator searches through the `@children` array automatically
- The navigator works with both compact and full JSON representations

#### Advanced Path Navigation Examples

**Getting Values Through Unspecified Segments**

The `getPath` function can automatically navigate through children collections without explicitly specifying them in the path. This is extremely useful for extracting values from deeply nested structures without knowing the exact hierarchy:

```javascript
// Full XML:
// <library>
//   <book category="fiction">
//     <title>Dune</title>
//     <author>Frank Herbert</author>
//   </book>
//   <book category="science">
//     <title>A Brief History of Time</title>
//     <author>Stephen Hawking</author>
//   </book>
// </library>

const json = transformer.xmlToJSON(xmlString);

// Get all book titles directly, even though they're nested in @children
const allTitles = navigator.getPath(json, "library.book.title.@val");
console.log(allTitles); // ["Dune", "A Brief History of Time"]

// Direct path to attributes, skipping intermediate collections
const categories = navigator.getPath(json, "library.book.@attrs.category.@val");
console.log(categories); // ["fiction", "science"]

// Combine array indexing with path skipping
const secondBookAuthor = navigator.getPath(json, "library.book[1].author.@val");
console.log(secondBookAuthor); // "Stephen Hawking"
```

**Mixed Depth Paths**

The path navigator can find matches at different depths in the tree:

```javascript
// Full XML:
// <catalog>
//   <section>
//     <book><title>Book 1</title></book>
//     <subsection>
//       <book><title>Book 2</title></book>
//     </subsection>
//   </section>
//   <book><title>Book 3</title></book>
// </catalog>

const json = transformer.xmlToJSON(xmlString);

// This will find all title values regardless of their nesting level
const allTitles = navigator.getPath(json, "catalog.book.title.@val");
console.log(allTitles); // ["Book 1", "Book 2", "Book 3"]
```

**Direct Value Extraction for Known Paths**

For single values where the path is known, you can specify the exact path:

```javascript
// Get a specific value with known path
const mainTitle = navigator.getPath(json, "catalog.@children[0].section.@children[0].book.@children[0].title.@val");

// Use fallback value if path doesn't exist
const price = navigator.getPath(json, "catalog.book.price.@val", "Not available");
console.log(price); // "Not available" (since price doesn't exist)
```

### SchemaGenerator - JSON Schema Generation

The `SchemaGenerator` component allows you to generate a JSON Schema that describes the structure of your XML-to-JSON transformations. You can access it directly from the transformer instance:

```javascript
// Create a transformer with your desired configuration
const transformer = new XMLJSONTransformer({
  preserveNamespaces: true,
  preserveComments: true,
  // other options...
});

// Generate schema directly from the transformer
const schema = transformer.generateJSONSchema();
console.log(JSON.stringify(schema, null, 2));
```

Alternatively, you can use the SchemaGenerator directly:

```javascript
const configManager = new ConfigurationManager();
const schemaGenerator = new SchemaGenerator(configManager);

// Generate schema according to your current configuration
const schema = schemaGenerator.generateSchema();

// Generate example data based on the schema
const example = schemaGenerator.generateExample();
```

#### Uses for the Schema Generator

1. **Validation**: Use the generated schema with libraries like Ajv to validate JSON objects:
   ```javascript
   import Ajv from 'ajv';
   
   const ajv = new Ajv();
   const validate = ajv.compile(schema);
   const isValid = validate(jsonData);
   
   if (!isValid) {
     console.error("JSON validation errors:", validate.errors);
   }
   ```

2. **Documentation**: Generate documentation for your XML/JSON formats:
   ```javascript
   // Generate schema and save to file
   const fs = require('fs');
   fs.writeFileSync('schema.json', JSON.stringify(schema, null, 2));
   ```

3. **Code Generation**: Use the schema to generate type definitions or classes:
   ```javascript
   // Generate TypeScript interfaces from schema
   import { compile } from 'json-schema-to-typescript';
   
   compile(schema, 'XMLJSONTypes').then(ts => {
     fs.writeFileSync('types.d.ts', ts);
   });
   ```

4. **IDE Integration**: Use the schema for autocompletion and validation in editors like VS Code

5. **Testing**: Create test fixtures and validate outputs:
   ```javascript
   const example = schemaGenerator.generateExample();
   // Use as test fixture or reference implementation
   ```

## Value Transformers

You can provide a custom `transformFunction` in the configuration to transform node values during conversion:

```javascript
// Create a transformer with a custom transform function
const transformer = new XMLJSONTransformer({
  transformFunction: (value, context) => {
    // Context provides information about the current node:
    // - nodeName: Name of the current node
    // - nodeType: Type of node (element, text, attribute, etc.)
    // - namespaceURI: Namespace URI of the node
    // - direction: 'xml-to-json' or 'json-to-xml'
    // - attributes: Node attributes (for element nodes)
    // - isAttribute: Boolean flag indicating if this is an attribute value
    
    // Example: Convert values to uppercase for specific elements
    if (context.nodeName === 'title') {
      return typeof value === 'string' ? value.toUpperCase() : value;
    }
    
    // Example: Format date values
    if (context.nodeName === 'date' && typeof value === 'string') {
      const date = new Date(value);
      return date.toISOString().split('T')[0];
    }
    
    // Return the original value for other nodes
    return value;
  }
});
```

### Context Object Properties

The `context` object passed to transform functions provides detailed information about the node being processed:

| Property | Type | Description |
|----------|------|-------------|
| `nodeName` | String | The local name of the node without any namespace prefix |
| `nodeType` | Number | The DOM node type (1 for Element, 2 for Attribute, 3 for Text, etc.) |
| `namespaceURI` | String | The namespace URI of the node if available |
| `attributes` | NamedNodeMap | The attributes collection for element nodes (null for other node types) |
| `direction` | String | Either 'xml-to-json' or 'json-to-xml' indicating conversion direction |
| `isAttribute` | Boolean | True if the current value belongs to an attribute (only present for attribute values) |

This context information allows you to create sophisticated transformations based on node types, names, and even parent-child relationships when combined with custom navigation logic.

### Possible Uses for Value Transformers

1. **Data Type Conversion**: Convert string values to appropriate data types
   ```javascript
   transformFunction: (value) => {
     if (value === 'true') return true;
     if (value === 'false') return false;
     if (/^\d+$/.test(value)) return parseInt(value, 10);
     if (/^\d+\.\d+$/.test(value)) return parseFloat(value);
     return value;
   }
   ```

2. **Data Formatting**: Format dates, currency, or other specific formats
   ```javascript
   transformFunction: (value, context) => {
     if (context.nodeName === 'price') {
       return `$${parseFloat(value).toFixed(2)}`;
     }
     return value;
   }
   ```

3. **Text Processing**: Normalize text, remove excess whitespace, etc.
   ```javascript
   transformFunction: (value) => {
     if (typeof value === 'string') {
       return value.trim().replace(/\s+/g, ' ');
     }
     return value;
   }
   ```

4. **Content Filtering**: Remove sensitive information or specific content
   ```javascript
   transformFunction: (value, context) => {
     if (context.nodeName === 'email') {
       return value.replace(/(.{2})(.*)@/, '$1***@');
     }
     return value;
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
console.log(JSON.stringify(result, null, 2));
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
console.log(JSON.stringify(result, null, 2));
```

### Example 3: Converting JSON to XML with custom property names

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

### Example 4: Converting special nodes (CDATA, comments, processing instructions)

```javascript
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/css" href="style.css"?>
<root>
  <!-- This is a comment -->
  <element id="123">
    <data><![CDATA[<script>alert("This is CDATA content");</script>]]></data>
  </element>
</root>`;

const transformer = new XMLJSONTransformer({
  preserveComments: true,
  preserveProcessingInstr: true,
  preserveCDATA: true
});

const result = transformer.xmlToJSON(xml);
console.log(JSON.stringify(result, null, 2));

// Convert back to XML
const xmlRestored = transformer.jsonToXML(result);
console.log(xmlRestored);
```

## Caveats and Notes

1. **Browser Compatibility**: The library should work in all modern browsers that support ES6. For older browsers, use the UMD build or a transpilation tool like Babel.

2. **Mixed Content Handling**: When dealing with mixed content, the library preserves the entire content as a string with embedded markup rather than processing child elements separately. This approach works well for document-oriented formats but may not be ideal for data-oriented XML.

3. **Namespace Handling**: By default, the library preserves namespace information. If you don't need namespaces, you can set `preserveNamespaces: false` for a more compact JSON representation.

4. **Large Documents**: For very large XML documents, consider using a streaming parser instead of this library to avoid memory issues.

5. **JSDOM Dependency in Node.js**: When used in Node.js environment, the library may require JSDOM if the environment doesn't provide DOM APIs.

6. **Attribute Order**: The library doesn't guarantee the same order of attributes when converting from XML to JSON and back to XML, as JavaScript objects don't maintain property order (except for newer implementations).

7. **Type Conversion**: If you enable `grokBoolean` and `grokNumber`, be aware that it may convert string values that look like numbers or booleans, which might not be what you want in all cases.

## License

MIT License