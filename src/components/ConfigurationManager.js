/**
 * ConfigurationManager
 *
 * Responsible for handling and validating transformer configuration
 */
class ConfigurationManager {
  /**
   * Creates a new ConfigurationManager with default settings
   * @param {Object} userConfig - User provided configuration
   */
  constructor(userConfig = {}) {
    // Default configuration
    this.config = this.mergeWithDefaults(userConfig);

    // Create a reverse mapping for property names (for JSON to XML conversion)
    this.propNamesReverse = Object.entries(this.config.propNames).reduce(
      (acc, [key, value]) => {
        acc[value] = key;
        return acc;
      },
      {}
    );

    // Calculate XML indentation string
    this.xmlIndent =
      typeof this.config.outputOptions.indent === "number"
        ? " ".repeat(this.config.outputOptions.indent)
        : "  ";
  }

  /**
   * Merges user-provided configuration with default settings
   * @param {Object} userConfig - The user-provided config
   * @returns {Object} - Merged configuration
   */
  mergeWithDefaults(userConfig) {
    const defaultConfig = {
      // Features to preserve during transformation
      preserveNamespaces: true,
      preserveComments: true,
      preserveProcessingInstr: true,
      preserveCDATA: true,
      preserveTextNodes: true,
      preserveWhitespace: false,

      // Type conversion options
      grokBoolean: false,
      grokNumber: false,

      // value transform function
      transformFunction: null,

      // Output options
      outputOptions: {
        prettyPrint: true,
        indent: 3,

        // JSON-specific options
        json: {
          compact: true,
          removeEmptyStrings: true,
        },

        // XML-specific options
        xml: {
          declaration: true,
        },
      },

      // Property names in the JSON representation
      propNames: {
        namespace: "@ns",
        prefix: "@prefix",
        attributes: "@attrs",
        value: "@val",
        cdata: "@cdata",
        comments: "@comments",
        processing: "@processing",
        children: "@children",
      },
    };

    // Deep merge with user config
    return this.deepMerge(defaultConfig, userConfig);
  }

  /**
   * Deep merge two objects
   * @param {Object} target - Target object
   * @param {Object} source - Source object
   * @returns {Object} - Merged object
   */
  deepMerge(target, source) {
    const output = { ...target };

    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach((key) => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }

    return output;
  }

  /**
   * Check if value is an object
   * @param {any} item - Value to check
   * @returns {boolean} - Whether value is an object
   */
  isObject(item) {
    return item && typeof item === "object" && !Array.isArray(item);
  }

  /**
   * Check if a property should be preserved based on configuration
   * @param {string} propType - Type of property
   * @returns {boolean} - Whether the property should be preserved
   */
  shouldPreserve(propType) {
    const preserveMap = {
      namespace: this.config.preserveNamespaces,
      cdata: this.config.preserveCDATA,
      comments: this.config.preserveComments,
      processing: this.config.preserveProcessingInstr,
      whitespace: this.config.preserveWhitespace,
      textNodes: this.config.preserveTextNodes,
    };

    return preserveMap[propType] || false;
  }

  /**
   * Get the config property name for a specific feature
   * @param {string} feature - Feature name
   * @returns {string} - Property name in JSON representation
   */
  getPropName(feature) {
    return this.config.propNames[feature];
  }

  /**
   * Get the feature name from property name
   * @param {string} propName - Property name in JSON
   * @returns {string} - Feature name
   */
  getFeatureFromProp(propName) {
    return this.propNamesReverse[propName];
  }
}

export default ConfigurationManager;
