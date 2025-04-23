import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


/**
 * Load test fixture file
 * @param {string} type - Type of fixture (xml|json)
 * @param {string} name - Name of the fixture file without extension
 * @returns {string|Object} - File contents as string (XML) or parsed object (JSON)
 */
export function loadFixture(type, name) {
  const fixturePath = path.resolve(__dirname, '..', 'fixtures', type, `${name}.${type}`);

  try {
    const content = fs.readFileSync(fixturePath, 'utf8');
    
    // Parse JSON fixtures, return XML as string
    if (type === 'json') {
      return JSON.parse(content);
    }
    
    return content;
  } catch (error) {
    throw new Error(`Error loading fixture ${fixturePath}: ${error.message}`);
  }
}

/**
 * Create a complete configuration for testing
 * @param {Object} overrides - Configuration overrides
 * @returns {Object} - Complete configuration object
 */
export function createTestConfig(overrides = {}) {
  // Base test configuration with all options specified
  const baseConfig = {
      // Features to preserve during transformation
      preserveNamespaces: true,
      preserveComments: true,
      preserveProcessingInstr: true,
      preserveCDATA: true,
      preserveTextNodes: true,
      preserveWhitespace: false,

      // value transforms
      valueTransforms: [],

      // Output options
      outputOptions: {
        prettyPrint: false,
        indent: 3,
        compact: false, 
        removeEmptyValueNodes: false,

        // JSON-specific options
        json: {
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
  
  // Deep merge with overrides
  return deepMerge(baseConfig, overrides);
}

/**
 * Deep merge two objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} - Merged object
 */
function deepMerge(target, source) {
  const output = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
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
function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Normalize XML string by removing whitespace between tags
 * @param {string} xml - XML string
 * @returns {string} - Normalized XML string
 */
export function normalizeXML(xml) {
  return xml
    .replace(/>\s+</g, '><')   // Remove whitespace between tags
    .replace(/\s+/g, ' ')      // Normalize whitespace
    .trim();                   // Trim leading/trailing whitespace
}