# XMLJSONTransformer

A JavaScript utility class for bidirectional transformation between XML and JSON with extensive customization options.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
  - [Node.js](#nodejs)
  - [Browser](#browser)
- [Basic Usage](#basic-usage)
  - [Node.js](#nodejs-1)
  - [Browser](#browser-1)
- [Configuration Options](#configuration-options)
- [JSON Structure](#json-structure)
  - [Compact Format](#compact-format)
- [Namespace Handling](#namespace-handling)
- [Mixed Content Handling](#mixed-content-handling)
- [Advanced Features](#advanced-features)
  - [Path Navigation](#path-navigation)
  - [Converting Standard JSON](#standard-json-converter)
  - [Schema Generation](#schema-generation)
  - [Value Transformers](#value-transformers)
- [Examples](#examples)
  - [Example 1: Converting XML with namespaces to JSON](#example-1-converting-xml-with-namespaces-to-json)
  - [Example 2: Converting XML with mixed content to JSON](#example-2-converting-xml-with-mixed-content-to-json)
  - [Example 3: Converting JSON to XML with custom property names](#example-3-converting-json-to-xml-with-custom-property-names)
  - [Example 4: Converting special nodes (CDATA, comments, processing instructions)](#example-4-converting-special-nodes-cdata-comments-processing-instructions)
- [License](#license)

## Features

- **Bidirectional Transformation**: Convert XML to JSON and back to XML with predictable results
- **Namespace Support**: Properly handle XML namespaces with options to include or strip them
- **Special Node Types**: Support for CDATA sections, comments, and processing instructions
- **Mixed Content**: Simplified handling of elements with mixed content
- **Configurable**: Extensive customization options
- **Lightweight**: No external dependencies for core functionality

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

You can also get JSON as a formatted string:

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
  valueTransforms: [],                // Array of value transformers
  
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

## JSON Structure

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

You can control how namespaces are handled during transformation with these options:

- **preserveNamespaces**: When set to `true` (default), namespace information is included in the JSON. When set to `false`, namespace information is omitted.

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

## Advanced Features

### Path Navigation

The library provides a powerful way to access specific data in your JSON structure using dot notation paths:

```javascript
// Get a value using path syntax
const value = transformer.getPath(jsonObj, "root.@children.child.@val");

// Use array indices for specific items
const firstChild = transformer.getPath(jsonObj, "root.@children[0].child.@val");

// Provide a fallback value if path not found
const attr = transformer.getPath(jsonObj, "root.@attrs.missing", "Default");
```

Path navigation supports:

- Dot notation to navigate properties: `root.property.child`
- Array indices to access specific items: `array[0]`
- Automatic flattening of results when accessing collections
- Searching through `@children` collections implicitly
- Fallback values when paths don't exist

**Advanced Examples:**

```javascript
// Get all book titles regardless of nesting level
const titles = transformer.getPath(json, "catalog.book.title.@val");

// Get specific element by index
const firstBookTitle = transformer.getPath(json, "catalog.@children[0].book.@children[0].title.@val");

// Get attribute value
const firstBookId = transformer.getPath(json, "catalog.@children[0].book.@attrs.id.@val");
```


### Standard JSON Converter

The `StandardJSONConverter` provides a way to convert regular JSON objects into the specialized format required by XMLJSONTransformer. This makes it easy to transform any standard JSON data (like API responses or database records) to XML without having to manually restructure it.

#### Basic Usage

```javascript
import { XMLJSONTransformer, StandardJSONConverter } from 'xmltojson';

// Your standard JSON data
const data = {
  "name": "Alice Johnson",
  "age": 30,
  "email": "alice.johnson@example.com",
  "skills": ["JavaScript", "Python", "SQL"]
};

// Convert to XMLJSONTransformer format
const xmlFormat = StandardJSONConverter.convert(data, "person");

// Create an XML string
const transformer = new XMLJSONTransformer();
const xml = transformer.jsonToXML(xmlFormat);

console.log(xml);
// Outputs:
// <person>
//   <name>Alice Johnson</name>
//   <age>30</age>
//   <email>alice.johnson@example.com</email>
//   <skills>
//     <skill>JavaScript</skill>
//     <skill>Python</skill>
//     <skill>SQL</skill>
//   </skills>
// </person>
```

#### Root Element Configuration

You can configure the root element in three ways:

##### 1. Default Root (No Configuration)

```javascript
const xmlFormat = StandardJSONConverter.convert(data);
// Uses "root" as the element name
```

##### 2. Simple String Root

```javascript
const xmlFormat = StandardJSONConverter.convert(data, "person");
// Uses "person" as the element name
```

##### 3. Detailed Root Configuration

```javascript
const xmlFormat = StandardJSONConverter.convert(data, {
  name: "person",                       // Root element name
  ns: "http://example.org/person",      // Namespace URI
  prefix: "p",                          // Namespace prefix
  attributes: {                         // Root element attributes
    id: "12345",
    created: "2023-04-22",
    type: {                            // Complex attribute with namespace
      val: "employee",
      ns: "http://example.org/types",
      prefix: "t"
    }
  }
});
```

This produces XML with namespace and attributes:

```xml
<p:person xmlns:p="http://example.org/person" 
          id="12345" 
          created="2023-04-22" 
          t:type="employee" xmlns:t="http://example.org/types">
  <!-- content -->
</p:person>
```

#### Features

- **Automatic Array Handling**: For arrays (like "skills"), the converter automatically creates singular element names for array items ("skill")
- **Nested Objects**: Maintains the hierarchy of nested objects
- **Data Type Conversion**: Converts all values to strings suitable for XML
- **Null & Undefined Handling**: Safely handles null or undefined values
- **Complex Structures**: Supports arrays of objects and deeply nested structures

#### Handling Different Data Types

- **Primitive Values** (strings, numbers, booleans): Converted to string values
- **Arrays**: Converted to parent-child elements with singular names
- **Objects**: Converted to nested elements preserving hierarchy
- **Null/Undefined**: Converted to empty strings

#### Array Element Naming

For arrays, the converter automatically creates singular element names:

- "skills" array items become "skill" elements
- "addresses" array items become "address" elements
- "data" array items become "dataItem" elements (if no plural 's' is found)

#### Example with Complex Data

```javascript
const orderData = {
  "id": "order-12345",
  "items": [
    {
      "productId": "prod-101",
      "name": "Smartphone",
      "price": 599.99
    },
    {
      "productId": "prod-202",
      "name": "Headphones",
      "price": 129.99
    }
  ],
  "customer": {
    "name": "John Smith",
    "email": "john@example.com"
  }
};

const xmlFormat = StandardJSONConverter.convert(orderData, "order");
const transformer = new XMLJSONTransformer();
const xml = transformer.jsonToXML(xmlFormat);

// Output will maintain all the hierarchical structure in XML format
```





### Schema Generation

The library can generate a JSON Schema that describes the structure of your XML-to-JSON transformations:

```javascript
// Generate schema based on your current configuration
const schema = transformer.generateJSONSchema();
console.log(JSON.stringify(schema, null, 2));
```

This schema can be used for:

1. **Validation**: Validate JSON objects with libraries like Ajv
2. **Documentation**: Generate documentation for your XML/JSON formats
3. **Code Generation**: Generate type definitions or classes
4. **IDE Integration**: Provide autocompletion and validation in editors
5. **Testing**: Create test fixtures and validate outputs

### Value Transformers

The library supports value transformation through a pluggable transformer system:

```javascript
import { BooleanTransformer, NumberTransformer } from 'xmltojson/transformers';

// Create transformers
const boolTransformer = new BooleanTransformer({
  trueValues: ['true', 'yes', '1'],
  falseValues: ['false', 'no', '0']
});

const numTransformer = new NumberTransformer();

// Create transformer with custom value transformers
const transformer = new XMLJSONTransformer({
  valueTransforms: [boolTransformer, numTransformer]
});
```

You can also create custom transformers by extending the `ValueTransformer` class:

```javascript
import { ValueTransformer } from 'xmltojson/transformers';

class CustomTransformer extends ValueTransformer {
  process(value, context = {}) {
    // Transform the value based on context
    if (context.nodeName === 'price') {
      return `$${parseFloat(value).toFixed(2)}`;
    }
    return value;
  }
}
```

Each transformer receives a context object with information about the current node:

| Property | Type | Description |
|----------|------|-------------|
| `nodeName` | String | The local name of the node without any namespace prefix |
| `nodeType` | Number | The DOM node type (1 for Element, 2 for Attribute, 3 for Text, etc.) |
| `namespaceURI` | String | The namespace URI of the node if available |
| `attributes` | NamedNodeMap | The attributes collection for element nodes |
| `direction` | String | Either 'xml-to-json' or 'json-to-xml' indicating conversion direction |
| `isAttribute` | Boolean | True if the current value belongs to an attribute |

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

## License

MIT License