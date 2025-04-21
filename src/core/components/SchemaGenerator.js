/**
 * SchemaGenerator
 *
 * Generates JSON schema for the XMLJSONTransformer
 */
class SchemaGenerator {
  /**
   * Creates a new SchemaGenerator
   * @param {ConfigurationManager} configManager - Configuration manager
   */
  constructor(configManager) {
    this.configManager = configManager;
    this.config = configManager.config;
  }

  /**
   * Generate a JSON schema that matches the current configuration
   * @returns {Object} - JSON schema
   */
  generateSchema() {
    const propNames = this.config.propNames;
    const compact = this.config.outputOptions?.json?.compact || false;
    const removeEmptyStrings =
      this.config.outputOptions?.json?.removeEmptyStrings || false;
    const preserveNamespaces = this.config.preserveNamespaces;

    // Determine which properties are required based on the configuration
    const requiredProps = [];

    if (!compact) {
      requiredProps.push(
        propNames.attributes,
        propNames.cdata,
        propNames.comments,
        propNames.processing,
        propNames.children
      );

      if (!removeEmptyStrings) {
        requiredProps.push(propNames.value);

        if (preserveNamespaces) {
          requiredProps.push(propNames.namespace);
          // Note: prefix is not required as it may not be present for all elements
        }
      }
    }

    // Create schema for element properties
    const elementProperties = {};

    // Add namespace property if preserving namespaces
    if (preserveNamespaces) {
      elementProperties[propNames.namespace] = {
        description: "Namespace URI of the element",
        type: "string",
      };

      // Add prefix property if preserving namespaces
      elementProperties[propNames.prefix] = {
        description: "Namespace prefix of the element",
        type: "string",
      };
    }

    // Add value property
    elementProperties[propNames.value] = {
      description:
        "Text content of the element or raw content for mixed content elements",
      type: "string",
    };

    // Add attributes property
    elementProperties[propNames.attributes] = {
      description: "Element attributes",
      type: "object",
      patternProperties: {
        "^.*$": {
          type: "object",
          properties: {},
        },
      },
    };

    // Add attribute properties based on configuration
    const attrProperties =
      elementProperties[propNames.attributes].patternProperties["^.*$"]
        .properties;

    attrProperties[propNames.value] = {
      description: "Attribute value",
      type: "string",
    };

    if (preserveNamespaces) {
      attrProperties[propNames.namespace] = {
        description: "Namespace URI of the attribute",
        type: "string",
      };

      // Add prefix property for attributes
      attrProperties[propNames.prefix] = {
        description: "Namespace prefix of the attribute",
        type: "string",
      };
    }

    // Set required properties for attributes
    const requiredAttrProps = [propNames.value];
    if (preserveNamespaces) {
      requiredAttrProps.push(propNames.namespace);
      // Note: prefix is not required as it may not be present for all attributes
    }

    elementProperties[propNames.attributes].patternProperties["^.*$"].required =
      requiredAttrProps;

    // Rest of the method remains the same...

    // Add CDATA property
    elementProperties[propNames.cdata] = {
      description: "CDATA sections within the element",
      type: "array",
      items: {
        type: "string",
      },
    };

    // Add comments property
    elementProperties[propNames.comments] = {
      description: "Comments within the element",
      type: "array",
      items: {
        type: "string",
      },
    };

    // Add processing instructions property
    elementProperties[propNames.processing] = {
      description: "Processing instructions within the element",
      type: "array",
      items: {
        type: "string",
      },
    };

    // Create the recursive child elements schema
    const childElementSchema = {
      type: "object",
      properties: {}, // Will be filled in by the self-reference below
      required: [],
    };

    // Add children property
    elementProperties[propNames.children] = {
      description: "Child elements",
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        patternProperties: {
          "^[^@].*$": childElementSchema,
        },
      },
    };

    // Create the final schema object
    const schema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      title: "XMLJSONTransformer Schema",
      description: "JSON Schema for XML representation in XMLJSONTransformer",
      type: "object",
      additionalProperties: false,
      patternProperties: {
        "^[^@].*$": {
          description: "XML element name as property key",
          type: "object",
          properties: elementProperties,
          required: requiredProps,
        },
      },
      allOf: [
        {
          description: "Schema requires exactly one XML element as the root",
          minProperties: 1,
          maxProperties: 1,
        },
      ],
    };

    return schema;
  }

  /**
   * Generate an example based on the schema
   * @returns {Object} - Example JSON object
   */
  generateExample() {
    const propNames = this.config.propNames;

    // Simple example with common features
    return {
      root: {
        [propNames.namespace]: "http://example.org/ns",
        [propNames.prefix]: "ex", // Added prefix property
        [propNames.value]: "Root content",
        [propNames.attributes]: {
          id: {
            [propNames.value]: "root-1",
            [propNames.namespace]: "",
          },
          lang: {
            [propNames.value]: "en",
            [propNames.namespace]: "",
            [propNames.prefix]: "xml", // Added prefix property to attribute
          },
        },
        [propNames.children]: [
          {
            child: {
              [propNames.namespace]: "http://example.org/ns",
              [propNames.prefix]: "ex", // Added prefix property
              [propNames.value]: "Child content",
              [propNames.attributes]: {},
              [propNames.cdata]: ["<data>Raw content</data>"],
              [propNames.comments]: ["Comment about the child"],
              [propNames.children]: [],
            },
          },
        ],
      },
    };
  }
}

export default SchemaGenerator;
