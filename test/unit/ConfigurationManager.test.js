/**
 * Unit tests for the ConfigurationManager class
 */

import ConfigurationManager from '../../src/ConfigurationManager.js';

describe('ConfigurationManager', () => {
  let defaultConfig;
  
  beforeEach(() => {
    // Create a manager with default config to test against
    const defaultManager = new ConfigurationManager();
    defaultConfig = defaultManager.config;
  });
  
  test('should use default configuration when no config is provided', () => {
    const manager = new ConfigurationManager();
    
    // Check some key default properties
    expect(manager.config.preserveNamespaces).toBe(true);
    expect(manager.config.stripPrefixes).toBe(true);
    expect(manager.config.outputOptions.prettyPrint).toBe(true);
    
    // Check default property names
    expect(manager.config.propNames.namespace).toBe('@ns');
    expect(manager.config.propNames.value).toBe('@val');
    expect(manager.config.propNames.children).toBe('@children');
  });
  
  test('should merge user config with defaults', () => {
    const userConfig = {
      preserveNamespaces: false,
      outputOptions: {
        indent: 4
      }
    };
    
    const manager = new ConfigurationManager(userConfig);
    
    // Changed properties should reflect user values
    expect(manager.config.preserveNamespaces).toBe(false);
    expect(manager.config.outputOptions.indent).toBe(4);
    
    // Unchanged properties should keep defaults
    expect(manager.config.stripPrefixes).toBe(true);
    expect(manager.config.propNames.namespace).toBe('@ns');
  });
  
  test('should create reverse mapping for property names', () => {
    const manager = new ConfigurationManager();
    
    // Check reverse mappings
    expect(manager.propNamesReverse['@ns']).toBe('namespace');
    expect(manager.propNamesReverse['@val']).toBe('value');
    expect(manager.propNamesReverse['@attrs']).toBe('attributes');
  });
  
  test('should use custom property names when provided', () => {
    const userConfig = {
      propNames: {
        namespace: '_ns',
        value: '_val',
        attributes: '_attrs'
      }
    };
    
    const manager = new ConfigurationManager(userConfig);
    
    // Check custom property names
    expect(manager.config.propNames.namespace).toBe('_ns');
    expect(manager.config.propNames.value).toBe('_val');
    expect(manager.config.propNames.attributes).toBe('_attrs');
    
    // Check reverse mappings
    expect(manager.propNamesReverse['_ns']).toBe('namespace');
    expect(manager.propNamesReverse['_val']).toBe('value');
    expect(manager.propNamesReverse['_attrs']).toBe('attributes');
  });
  
  test('should calculate XML indent string from config', () => {
    // Test with numeric indent
    const manager1 = new ConfigurationManager({ outputOptions: { indent: 3 } });
    expect(manager1.xmlIndent).toBe('   '); // 3 spaces
    
    // Test with 0 indent
    const manager2 = new ConfigurationManager({ outputOptions: { indent: 0 } });
    expect(manager2.xmlIndent).toBe(''); // Empty string
    
    // Test with non-numeric indent (should use default of 2 spaces)
    const manager3 = new ConfigurationManager({ outputOptions: { indent: '----' } });
    expect(manager3.xmlIndent).toBe('  '); // Default 2 spaces
  });
  
  test('should handle deep merge of nested properties', () => {
    const userConfig = {
      outputOptions: {
        prettyPrint: false,
        json: {
          compact: false
        }
      }
    };
    
    const manager = new ConfigurationManager(userConfig);
    
    // Check that specified properties were changed
    expect(manager.config.outputOptions.prettyPrint).toBe(false);
    expect(manager.config.outputOptions.json.compact).toBe(false);
    
    // Check that unspecified properties were preserved
    expect(manager.config.outputOptions.json.removeEmptyStrings).toBe(true);
    expect(manager.config.outputOptions.indent).toBe(3);
  });
  
  test('shouldPreserve method should return correct values', () => {
    // Default manager preserves most features
    const defaultManager = new ConfigurationManager();
    expect(defaultManager.shouldPreserve('namespace')).toBe(true);
    expect(defaultManager.shouldPreserve('comments')).toBe(true);
    expect(defaultManager.shouldPreserve('whitespace')).toBe(false);
    
    // Custom manager with specific features disabled
    const customManager = new ConfigurationManager({
      preserveNamespaces: false,
      preserveComments: false
    });
    expect(customManager.shouldPreserve('namespace')).toBe(false);
    expect(customManager.shouldPreserve('comments')).toBe(false);
    expect(customManager.shouldPreserve('cdata')).toBe(true);
  });
  
  test('getPropName and getFeatureFromProp should return correct values', () => {
    const manager = new ConfigurationManager();
    
    // Get property name from feature
    expect(manager.getPropName('namespace')).toBe('@ns');
    expect(manager.getPropName('children')).toBe('@children');
    
    // Get feature from property name
    expect(manager.getFeatureFromProp('@ns')).toBe('namespace');
    expect(manager.getFeatureFromProp('@children')).toBe('children');
  });
});