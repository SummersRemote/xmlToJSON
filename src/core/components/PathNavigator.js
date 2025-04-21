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

    function traverse(node, keys) {
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
    }

    const result = traverse(obj, parts);

    // Deep flatten helper
    const deepFlatten = (arr) =>
      Array.isArray(arr) ? arr.flatMap((el) => deepFlatten(el)) : [arr];

    if (Array.isArray(result)) {
      // Always return the flattened array, even if empty
      return deepFlatten(result).filter((v) => v !== undefined);
    }

    return result;
  }
}

export default PathNavigator;
