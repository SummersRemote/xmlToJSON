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

      // Rest of the method implementation...
      // (keep the existing code)

      // Return the final schema
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
