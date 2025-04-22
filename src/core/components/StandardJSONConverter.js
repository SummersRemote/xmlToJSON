/**
 * StandardJSONConverter
 *
 * Converts standard JSON objects to the format expected by XMLJSONTransformer
 */
class StandardJSONConverter {
    /**
     * Converts standard JSON to the format expected by XMLJSONTransformer
     * @param {Object} standardJson - The standard JSON object to convert
     * @param {Object|string} rootConfig - Either a string for the root element name or an object with detailed configuration
     * @returns {Object} - JSON in the format expected by XMLJSONTransformer
     */
    static convert(standardJson, rootConfig = "root") {
      // Helper function to process nested objects and arrays
      function processValue(value, parentKey) {
        if (value === null || value === undefined) {
          return { "@ns": "", "@val": "", "@attrs": {} };
        } else if (typeof value === "object" && !Array.isArray(value)) {
          // Handle nested objects
          return processObject(value, parentKey);
        } else if (Array.isArray(value)) {
          // Handle arrays
          return processArray(value, parentKey);
        } else {
          // Handle primitive values
          return { "@ns": "", "@val": String(value), "@attrs": {} };
        }
      }
  
      // Process objects into the expected format
      function processObject(obj, parentKey) {
        const result = {
          "@ns": "",
          "@val": "",
          "@attrs": {},
          "@children": []
        };
  
        for (const [key, value] of Object.entries(obj)) {
          if (Array.isArray(value)) {
            // Add processed array as a child
            const arrayResult = processArray(value, key);
            const arrayKey = Object.keys(arrayResult)[0];
            const childObj = {};
            childObj[arrayKey] = arrayResult[arrayKey];
            result["@children"].push(childObj);
          } else if (typeof value === "object" && value !== null) {
            // Add nested object as a child
            const childObj = {};
            childObj[key] = processValue(value, key);
            result["@children"].push(childObj);
          } else {
            // Add primitive value as a child
            const childObj = {};
            childObj[key] = { "@ns": "", "@val": String(value), "@attrs": {} };
            result["@children"].push(childObj);
          }
        }
  
        return result;
      }
  
      // Process arrays into a series of child elements
      function processArray(arr, parentKey) {
        // For arrays, create a parent element with multiple children
        const singular = parentKey.endsWith('s') ? parentKey.slice(0, -1) : parentKey + "Item";
        
        const result = {};
        result[parentKey] = {
          "@ns": "",
          "@val": "",
          "@attrs": {},
          "@children": arr.map(item => {
            const child = {};
            child[singular] = typeof item === "object" && item !== null
              ? processValue(item, singular)
              : { "@ns": "", "@val": String(item), "@attrs": {} };
            return child;
          })
        };
        
        return result;
      }
  
      // Start the conversion process
      const result = {};
      
      // Handle different rootConfig types
      if (typeof rootConfig === "string") {
        // Simple string root name
        result[rootConfig] = processObject(standardJson, rootConfig);
      } else if (typeof rootConfig === "object" && rootConfig !== null) {
        // Detailed root configuration object
        const rootName = rootConfig.name || "root";
        const rootObj = processObject(standardJson, rootName);
        
        // Apply namespace if provided
        if (rootConfig.ns !== undefined) {
          rootObj["@ns"] = rootConfig.ns;
        }
        
        // Apply prefix if provided
        if (rootConfig.prefix !== undefined) {
          rootObj["@prefix"] = rootConfig.prefix;
        }
        
        // Apply attributes if provided
        if (rootConfig.attributes && typeof rootConfig.attributes === "object") {
          for (const [attrName, attrValue] of Object.entries(rootConfig.attributes)) {
            rootObj["@attrs"][attrName] = {
              "@ns": "",
              "@val": String(attrValue)
            };
            
            // Apply attribute namespace if provided
            if (typeof attrValue === "object" && attrValue !== null) {
              if (attrValue.ns !== undefined) {
                rootObj["@attrs"][attrName]["@ns"] = attrValue.ns;
              }
              if (attrValue.val !== undefined) {
                rootObj["@attrs"][attrName]["@val"] = String(attrValue.val);
              }
              if (attrValue.prefix !== undefined) {
                rootObj["@attrs"][attrName]["@prefix"] = attrValue.prefix;
              }
            }
          }
        }
        
        result[rootName] = rootObj;
      } else {
        // Default to "root" if rootConfig is not valid
        result["root"] = processObject(standardJson, "root");
      }
      
      return result;
    }
  }
  
  export default StandardJSONConverter;