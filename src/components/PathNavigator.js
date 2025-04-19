/**
 * PathNavigator
 * 
 * Handles path-based access to the JSON representation
 */
class PathNavigator {
    /**
     * Creates a new PathNavigator
     * @param {ConfigurationManager} configManager - Configuration manager
     */
    constructor(configManager) {
      this.configManager = configManager;
      this.config = configManager.config;
    }
    
    /**
     * Get a value from a JSON object using a dot-notation path
     * @param {Object} obj - JSON object
     * @param {string} path - Dot-notation path
     * @param {any} fallback - Fallback value if path not found
     * @returns {any} - Value at path or fallback
     */
    getPath(obj, path, fallback = undefined) {
      if (!obj || !path) return fallback;
  
      const parts = path.split(".");
      const childrenKey = this.config.propNames.children;
  
      // Store 'this' reference for use in the inner function
      const self = this;
  
      // Function to traverse the object
      const traverse = (node, keys) => {
        if (keys.length === 0) return node;
  
        const [key, ...rest] = keys;
  
        // Validate key syntax - ensure it's a valid property name with optional array index
        const match = key.match(/^([a-zA-Z0-9_@]+)(?:\[(\d+)\])?$/);
        if (!match) return fallback; // Return fallback for invalid syntax
  
        const [, baseKey, index] = match;
  
        const val = node?.[baseKey];
        if (val !== undefined) {
          if (Array.isArray(val)) {
            if (index !== undefined) {
              const indexValue = val[Number(index)];
              return indexValue !== undefined
                ? traverse(indexValue, rest)
                : fallback;
            } else {
              return val.map((child) => traverse(child, rest));
            }
          } else {
            return traverse(val, rest);
          }
        }
  
        // Try searching children if key not directly present
        if (node && Array.isArray(node[childrenKey])) {
          const matches = node[childrenKey]
            .map((child) => child?.[baseKey])
            .filter((v) => v !== undefined);
  
          if (index !== undefined) {
            const item = matches[Number(index)];
            return item ? traverse(item, rest) : fallback;
          }
  
          if (matches.length === 0) {
            // If we're at the end of our path, return an empty array for consistency
            if (rest.length === 0) return [];
            // Otherwise return fallback
            return fallback;
          }
  
          return matches.map((child) => traverse(child, rest));
        }
  
        return fallback;
      };
  
      const result = traverse(obj, parts);
  
      // Helper to deep flatten arrays
      const deepFlatten = (arr) =>
        Array.isArray(arr) ? arr.flatMap((el) => deepFlatten(el)) : [arr];
  
      if (Array.isArray(result)) {
        // Always return the flattened array, even if empty
        return deepFlatten(result).filter((v) => v !== undefined);
      }
  
      return result;
    }
    
    /**
     * Shorthand method for common access patterns
     * This method allows for shortcuts like "root.book.title.@val" instead of
     * "root.@children.book.@children.title.@val"
     * @param {Object} obj - JSON object
     * @param {string} path - Shorthand path
     * @param {any} fallback - Fallback value if path not found
     * @returns {any} - Value at path or fallback
     */
    getShortPath(obj, path, fallback = undefined) {
      // Replace any segments that don't start with @ with their full path
      // e.g., "root.book.title" becomes "root.@children.book.@children.title"
      const childrenKey = this.config.propNames.children;
      const expandedPath = path.replace(/\.([^@][^.]*)/g, `.${childrenKey}.$1`);
      
      return this.getPath(obj, expandedPath, fallback);
    }
    
    /**
     * Find elements in a JSON object that match specific criteria
     * @param {Object} obj - JSON object
     * @param {Object} criteria - Criteria to match (key-value pairs)
     * @returns {Array} - Array of matching elements
     */
    findElements(obj, criteria) {
      const results = [];
      const childrenKey = this.config.propNames.children;
      
      // Function to check if an element matches criteria
      const isMatch = (element) => {
        for (const [key, value] of Object.entries(criteria)) {
          // Handle special case for element name
          if (key === 'name') {
            const elementName = Object.keys(element)[0];
            if (elementName !== value) return false;
            continue;
          }
          
          // For other criteria, check the property value
          const propPath = `${Object.keys(element)[0]}.${key}`;
          const propValue = this.getPath(element, propPath);
          
          if (propValue !== value) return false;
        }
        
        return true;
      };
      
      // Function to recursively search elements
      const searchElements = (node) => {
        // Check if current node is a match
        if (isMatch(node)) {
          results.push(node);
        }
        
        // Get the first element name
        const elementName = Object.keys(node)[0];
        if (!elementName) return;
        
        // Get children array
        const children = node[elementName][childrenKey];
        if (!Array.isArray(children)) return;
        
        // Recursively search children
        for (const child of children) {
          searchElements(child);
        }
      };
      
      searchElements(obj);
      return results;
    }
    
    /**
     * Update a value at a specific path in the JSON object
     * @param {Object} obj - JSON object
     * @param {string} path - Path to the value
     * @param {any} value - New value
     * @returns {Object} - Updated JSON object
     */
    setPath(obj, path, value) {
      if (!obj || !path) return obj;
      
      // Create a deep clone of the object to avoid modifying the original
      const result = JSON.parse(JSON.stringify(obj));
      const parts = path.split(".");
      
      // Function to set value at path
      const setValue = (node, keys, val) => {
        if (keys.length === 0) return val;
        
        const [key, ...rest] = keys;
        
        // Parse array index if present
        const match = key.match(/^([a-zA-Z0-9_@]+)(?:\[(\d+)\])?$/);
        if (!match) return node; // Invalid key syntax
        
        const [, baseKey, index] = match;
        
        // If we're at the last key, set the value
        if (rest.length === 0) {
          if (index !== undefined && Array.isArray(node[baseKey])) {
            // Set value in array at index
            node[baseKey][Number(index)] = val;
          } else {
            // Set property value
            node[baseKey] = val;
          }
          return node;
        }
        
        // Otherwise, continue traversing
        if (!node[baseKey]) {
          // Create missing property
          if (index !== undefined) {
            // Create array if index is specified
            node[baseKey] = [];
          } else {
            // Create object otherwise
            node[baseKey] = {};
          }
        }
        
        if (index !== undefined && Array.isArray(node[baseKey])) {
          // Ensure array has enough elements
          while (node[baseKey].length <= Number(index)) {
            node[baseKey].push({});
          }
          
          // Update element at index
          node[baseKey][Number(index)] = setValue(node[baseKey][Number(index)] || {}, rest, val);
        } else {
          // Update property
          node[baseKey] = setValue(node[baseKey], rest, val);
        }
        
        return node;
      };
      
      return setValue(result, parts, value);
    }
  }
  
  export default PathNavigator;