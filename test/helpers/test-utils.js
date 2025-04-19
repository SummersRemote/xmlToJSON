/**
 * Test utilities for XMLJSONTransformer tests
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Read a fixture file from the fixtures directory
 * @param {string} filename - Name of the fixture file
 * @param {string} type - Type of fixture ('xml-samples' or 'json-samples')
 * @returns {string} - Content of the fixture file
 */
export const readFixture = (filename, type = 'xml-samples') => {
  const fixturePath = path.join(__dirname, '../fixtures', type, filename);
  return fs.readFileSync(fixturePath, 'utf8');
};

/**
 * Normalize XML string by removing whitespace and comments
 * @param {string} xml - XML string to normalize
 * @returns {string} - Normalized XML string
 */
export const normalizeXML = (xml) => {
  return xml
    .replace(/<!--.*?-->/g, '') // Remove comments
    .replace(/>\s+</g, '><') // Remove whitespace between tags
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim(); // Trim leading/trailing whitespace
};

/**
 * Create a JSON object with the most common properties pre-filled
 * @param {string} elementName - Name of the root element
 * @param {string} value - Text content of the element
 * @param {Object} options - Additional options
 * @returns {Object} - JSON object with common properties
 */
export const createBaseJSON = (elementName, value = '', options = {}) => {
  const {
    attributes = {},
    children = [],
    namespace = '',
    comments = [],
    cdata = [],
    processing = []
  } = options;
  
  // Convert attributes from simple object to XMLJSONTransformer format
  const formattedAttrs = {};
  for (const [key, val] of Object.entries(attributes)) {
    formattedAttrs[key] = {
      '@val': val,
      '@ns': ''
    };
  }
  
  // Create base object
  const result = {};
  result[elementName] = {
    '@ns': namespace,
    '@val': value,
    '@attrs': formattedAttrs,
    '@children': children,
    '@comments': comments,
    '@cdata': cdata,
    '@processing': processing
  };
  
  return result;
};

/**
 * Create a simple XML string for testing
 * @param {string} elementName - Name of the root element
 * @param {string} value - Text content of the element
 * @param {Object} options - Additional options
 * @returns {string} - XML string
 */
export const createSimpleXML = (elementName, value = '', options = {}) => {
  const {
    attributes = {},
    children = [],
    declaration = true
  } = options;
  
  // Create attributes string
  const attrs = Object.entries(attributes)
    .map(([key, val]) => `${key}="${val}"`)
    .join(' ');
  
  // Create children string
  const childrenStr = children
    .map(([name, val]) => `<${name}>${val}</${name}>`)
    .join('');
  
  // Create XML
  const xml = `<${elementName}${attrs ? ' ' + attrs : ''}>${value}${childrenStr}</${elementName}>`;
  
  // Add declaration if requested
  return declaration ? `<?xml version="1.0" encoding="UTF-8"?>\n${xml}` : xml;
};

/**
 * Parse XML string into DOM node for testing
 * @param {string} xmlString - XML string to parse
 * @returns {Document} - DOM document
 */
export const parseXML = (xmlString) => {
  const parser = new DOMParser();
  return parser.parseFromString(xmlString, 'text/xml');
};

/**
 * Generate a random attribute map for testing
 * @param {number} count - Number of attributes to generate
 * @returns {Object} - Map of attribute names to values
 */
export const generateRandomAttributes = (count = 3) => {
  const attrs = {};
  for (let i = 0; i < count; i++) {
    attrs[`attr${i}`] = `value${i}`;
  }
  return attrs;
};

/**
 * Generate a random array of child elements for testing
 * @param {number} count - Number of child elements to generate
 * @returns {Array} - Array of child name/value pairs
 */
export const generateRandomChildren = (count = 3) => {
  const children = [];
  for (let i = 0; i < count; i++) {
    children.push([`child${i}`, `value${i}`]);
  }
  return children;
};