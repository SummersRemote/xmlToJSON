import ConfigurationManager from '../../../../src/core/components/ConfigurationManager';
import { createTestConfig } from '../../../helpers/testUtils';

describe('ConfigurationManager', () => {
  let configManager;
  let testConfig;
  
  beforeEach(() => {
    testConfig = createTestConfig();
    configManager = new ConfigurationManager(testConfig);
  });
  
  describe('constructor', () => {
    test('should create with default configuration when no config provided', () => {
      const defaultConfigManager = new ConfigurationManager();
      
      expect(defaultConfigManager.config).toBeDefined();
      expect(defaultConfigManager.propNamesReverse).toBeDefined();
      expect(defaultConfigManager.xmlIndent).toBeDefined();
    });
    
    test('should create a reverse mapping for property names', () => {
      // Check if reverse mapping was created correctly
      expect(configManager.propNamesReverse["@ns"]).toBe("namespace");
      expect(configManager.propNamesReverse["@val"]).toBe("value");
      expect(configManager.propNamesReverse["@children"]).toBe("children");
    });
    
    test('should use provided configuration', () => {
      expect(configManager.config.preserveNamespaces).toBe(testConfig.preserveNamespaces);
      expect(configManager.config.propNames).toEqual(testConfig.propNames);
      expect(configManager.config.outputOptions.indent).toBe(testConfig.outputOptions.indent);
    });
    
    test('should calculate XML indentation string', () => {
      // Default indent is 2 spaces
      expect(configManager.xmlIndent.length).toBe(testConfig.outputOptions.indent);
      
      // Test with a different indent value
      const customConfig = createTestConfig({ outputOptions: { indent: 4 } });
      const customManager = new ConfigurationManager(customConfig);
      expect(customManager.xmlIndent.length).toBe(4);
      expect(customManager.xmlIndent).toBe('    ');
    });
  });
  
  describe('mergeWithDefaults', () => {
    test('should merge user config with defaults', () => {
      const userConfig = {
        preserveNamespaces: false,
        outputOptions: {
          indent: 4
        }
      };
      
      const mergedConfig = configManager.mergeWithDefaults(userConfig);
      
      // Should override values from userConfig
      expect(mergedConfig.preserveNamespaces).toBe(false);
      expect(mergedConfig.outputOptions.indent).toBe(4);
      
      // Should keep default values for properties not in userConfig
      expect(mergedConfig.preserveComments).toBeDefined();
      expect(mergedConfig.propNames).toBeDefined();
    });
    
    test('should handle deep merging of nested properties', () => {
      const userConfig = {
        outputOptions: {
          json: {
            compact: false
          }
        }
      };
      
      const mergedConfig = configManager.mergeWithDefaults(userConfig);
      
      // Should override only the specified nested property
      expect(mergedConfig.outputOptions.json.compact).toBe(false);
      
      // Should retain other nested properties
      expect(mergedConfig.outputOptions.removeEmptyValueNodes).toBeDefined();
      expect(mergedConfig.outputOptions.prettyPrint).toBeDefined();
    });
  });
  
  describe('shouldPreserve', () => {
    test('should return true for features configured to be preserved', () => {
      const config = createTestConfig({
        preserveNamespaces: true,
        preserveComments: true,
        preserveCDATA: false
      });
      
      const manager = new ConfigurationManager(config);
      
      expect(manager.shouldPreserve('namespace')).toBe(true);
      expect(manager.shouldPreserve('comments')).toBe(true);
      expect(manager.shouldPreserve('cdata')).toBe(false);
    });
    
    test('should return false for unknown property types', () => {
      expect(configManager.shouldPreserve('unknown')).toBe(false);
    });
  });
  
  describe('getPropName and getFeatureFromProp', () => {
    test('should get property name for a specific feature', () => {
      expect(configManager.getPropName('namespace')).toBe('@ns');
      expect(configManager.getPropName('value')).toBe('@val');
      expect(configManager.getPropName('children')).toBe('@children');
    });
    
    test('should get feature name from property name', () => {
      expect(configManager.getFeatureFromProp('@ns')).toBe('namespace');
      expect(configManager.getFeatureFromProp('@val')).toBe('value');
      expect(configManager.getFeatureFromProp('@children')).toBe('children');
    });
  });
  
  describe('deepMerge', () => {
    test('should properly merge nested objects', () => {
      const target = {
        a: 1,
        b: {
          c: 2,
          d: 3
        }
      };
      
      const source = {
        b: {
          c: 4,
          e: 5
        },
        f: 6
      };
      
      const result = configManager.deepMerge(target, source);
      
      expect(result).toEqual({
        a: 1,
        b: {
          c: 4, // Overridden
          d: 3, // Preserved
          e: 5  // Added
        },
        f: 6    // Added
      });
    });
    
    test('should handle non-object values', () => {
      const target = { a: 1, b: 2 };
      const source = { b: 'test' };
      
      const result = configManager.deepMerge(target, source);
      
      expect(result).toEqual({
        a: 1,
        b: 'test' // Overridden with string
      });
    });
  });
  
  describe('isObject', () => {
    test('should correctly identify objects', () => {
      expect(configManager.isObject({})).toBe(true);
      expect(configManager.isObject({ a: 1 })).toBe(true);
      
      // Should return false for non-objects
      expect(configManager.isObject(null)).toBe(false);
      expect(configManager.isObject(undefined)).toBe(false);
      expect(configManager.isObject([])).toBe(false);
      expect(configManager.isObject('string')).toBe(false);
      expect(configManager.isObject(123)).toBe(false);
    });
  });
});