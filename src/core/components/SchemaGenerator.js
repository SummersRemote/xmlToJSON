import { TransformerError } from "../errors/TransformerError.js";
import { ErrorCodes } from "../errors/ErrorCodes.js";

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
    try {
      const propNames = this.config.propNames;
      const compact = this.config.outputOptions.compact || false;
      const removeEmptyValueNodes = this.config.outputOptions.removeEmptyValueNodes || false;
      const preserveNamespaces = this.config.preserveNamespaces;
      const preserveComments = this.config.preserveComments;
      const preserveCDATA = this.config.preserveCDATA;
      const preserveProcessingInstr = this.config.preserveProcessingInstr;
      const preserveTextNodes = this.config.preserveTextNodes;
  
      // Determine which properties are required based on the configuration
      const requiredProps = [];
  
      if (!compact) {
        // Only add collections as required if they're preserved in the config
        requiredProps.push(propNames.attributes);
        
        if (preserveCDATA) requiredProps.push(propNames.cdata);
        if (preserveComments) requiredProps.push(propNames.comments);
        if (preserveProcessingInstr) requiredProps.push(propNames.processing);
        requiredProps.push(propNames.children);
  
        if (!removeEmptyValueNodes && preserveTextNodes) {
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
  
      // Add value property if preserving text nodes
      if (preserveTextNodes) {
        elementProperties[propNames.value] = {
          description: "Text content of the element",
          type: "string",
        };
      }
  
      // Add attributes property
      elementProperties[propNames.attributes] = {
        description: "Element attributes",
        type: "object",
        additionalProperties: {
          type: "object",
          properties: {
            [propNames.value]: {
              description: "Attribute value",
              type: "string",
            },
          },
          required: [propNames.value],
        },
      };
  
      // If preserving namespaces, add namespace properties to attribute schema
      if (preserveNamespaces) {
        elementProperties[propNames.attributes].additionalProperties.properties[
          propNames.namespace
        ] = {
          description: "Namespace URI of the attribute",
          type: "string",
        };
  
        elementProperties[propNames.attributes].additionalProperties.properties[
          propNames.prefix
        ] = {
          description: "Namespace prefix of the attribute",
          type: "string",
        };
  
        // Update required properties for attributes
        elementProperties[propNames.attributes].additionalProperties.required.push(
          propNames.namespace
        );
      }
  
      // Add CDATA property if preserving CDATA
      if (preserveCDATA) {
        elementProperties[propNames.cdata] = {
          description: "CDATA sections within the element",
          type: "array",
          items: {
            type: "string",
          },
        };
      }
  
      // Add comments property if preserving comments
      if (preserveComments) {
        elementProperties[propNames.comments] = {
          description: "Comments within the element",
          type: "array",
          items: {
            type: "string",
          },
        };
      }
  
      // Add processing instructions property if preserving them
      if (preserveProcessingInstr) {
        elementProperties[propNames.processing] = {
          description: "Processing instructions within the element",
          type: "array",
          items: {
            type: "string",
          },
        };
      }
  
      // Add children property with recursive schema
      elementProperties[propNames.children] = {
        description: "Child elements",
        type: "array",
        items: {
          type: "object",
          patternProperties: {
            "^[^@].*$": {
              $ref: "#/definitions/element"
            }
          },
          additionalProperties: false
        },
      };
  
      // Create element definition (will be referenced recursively)
      const elementDefinition = {
        type: "object",
        properties: elementProperties,
        required: requiredProps,
        additionalProperties: false,
      };
  
      // Build the complete schema
      const schema = {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        title: "XMLJSONTransformer JSON Schema",
        description: "Schema for JSON representation of XML documents",
        type: "object",
        patternProperties: {
          "^[^@].*$": {
            $ref: "#/definitions/element"
          }
        },
        additionalProperties: false,
        definitions: {
          element: elementDefinition,
        },
      };
  
      return schema;
    } catch (error) {
      console.error(
        `[${ErrorCodes.TRANSFORM_ERROR}] Schema generation failed: ${error.message}`
      );
      throw new TransformerError(
        `Schema generation failed: ${error.message}`,
        ErrorCodes.TRANSFORM_ERROR
      );
    }
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
