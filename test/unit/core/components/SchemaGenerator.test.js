import SchemaGenerator from '../../../../src/core/components/SchemaGenerator.js';
import ConfigurationManager from '../../../../src/core/components/ConfigurationManager.js';
import { createTestConfig } from '../../../helpers/testUtils.js';
import { TransformerError } from '../../../../src/core/errors/TransformerError.js';

describe('SchemaGenerator', () => {
  let generator;
  let configManager;
  let testConfig;
  
  beforeEach(() => {
    testConfig = createTestConfig();
    configManager = new ConfigurationManager(testConfig);
    generator = new SchemaGenerator(configManager);
  });
  
  describe('generateSchema', () => {
    test('should generate a valid JSON schema with default configuration', () => {
      const schema = generator.generateSchema();
      
      // Check schema basics
      expect(schema).toBeDefined();
      expect(schema.$schema).toBeDefined();
      expect(schema.title).toBeDefined();
      expect(schema.definitions).toBeDefined();
      expect(schema.definitions.element).toBeDefined();
      
      // Check for required properties in element definition
      const elementDef = schema.definitions.element;
      expect(elementDef.properties).toBeDefined();
      expect(elementDef.required).toContain('@val');
      expect(elementDef.required).toContain('@attrs');
      expect(elementDef.required).toContain('@children');
      
      // Check for namespace properties when preserving namespaces
      expect(elementDef.properties['@ns']).toBeDefined();
      expect(elementDef.properties['@prefix']).toBeDefined();
    });
    
    test('should adjust required properties based on compact mode', () => {
      // Create config with compact mode enabled
      const compactConfig = createTestConfig({
        outputOptions: {
          compact: true
        }
      });
      const compactConfigManager = new ConfigurationManager(compactConfig);
      const compactGenerator = new SchemaGenerator(compactConfigManager);
      
      const schema = compactGenerator.generateSchema();
      
      // With compact mode, fewer properties should be required
      const required = schema.definitions.element.required;
      expect(required.length).toBeLessThan(testConfig.propNames.length);
      
      // Properties should still be defined even if not required
      expect(schema.definitions.element.properties['@attrs']).toBeDefined();
      expect(schema.definitions.element.properties['@children']).toBeDefined();
    });
    
    test('should omit namespace properties when not preserving namespaces', () => {
      // Create config with namespace preservation disabled
      const noNamespaceConfig = createTestConfig({
        preserveNamespaces: false
      });
      const noNamespaceConfigManager = new ConfigurationManager(noNamespaceConfig);
      const noNamespaceGenerator = new SchemaGenerator(noNamespaceConfigManager);
      
      const schema = noNamespaceGenerator.generateSchema();
      
      // Namespace properties should not be in the schema
      expect(schema.definitions.element.properties['@ns']).toBeUndefined();
      expect(schema.definitions.element.properties['@prefix']).toBeUndefined();
      
      // Attribute properties should not include namespace
      const attrProps = schema.definitions.element.properties['@attrs'].additionalProperties.properties;
      expect(attrProps['@ns']).toBeUndefined();
      expect(attrProps['@prefix']).toBeUndefined();
    });
    
    test('should handle custom property names', () => {
      // Create config with custom property names
      const customPropConfig = createTestConfig({
        propNames: {
          namespace: "_ns",
          prefix: "_prefix",
          value: "_text",
          attributes: "_attrs",
          cdata: "_cdata",
          comments: "_comments",
          processing: "_processing",
          children: "_children"
        }
      });
      const customPropConfigManager = new ConfigurationManager(customPropConfig);
      const customPropGenerator = new SchemaGenerator(customPropConfigManager);
      
      const schema = customPropGenerator.generateSchema();
      
      // Check that schema uses custom property names
      expect(schema.definitions.element.properties['_ns']).toBeDefined();
      expect(schema.definitions.element.properties['_text']).toBeDefined();
      expect(schema.definitions.element.properties['_attrs']).toBeDefined();
      expect(schema.definitions.element.properties['_children']).toBeDefined();
    });
    
    test('should omit special node properties when not preserving them', () => {
      // Create config with special node preservation disabled
      const noSpecialNodesConfig = createTestConfig({
        preserveComments: false,
        preserveProcessingInstr: false,
        preserveCDATA: false
      });
      const noSpecialNodesConfigManager = new ConfigurationManager(noSpecialNodesConfig);
      const noSpecialNodesGenerator = new SchemaGenerator(noSpecialNodesConfigManager);
      
      const schema = noSpecialNodesGenerator.generateSchema();
      
      // Special node properties should not be in the schema
      expect(schema.definitions.element.properties['@comments']).toBeUndefined();
      expect(schema.definitions.element.properties['@processing']).toBeUndefined();
      expect(schema.definitions.element.properties['@cdata']).toBeUndefined();
      
      // But other properties should still exist
      expect(schema.definitions.element.properties['@val']).toBeDefined();
      expect(schema.definitions.element.properties['@attrs']).toBeDefined();
      expect(schema.definitions.element.properties['@children']).toBeDefined();
    });
    
    test('should handle errors gracefully', () => {
      // Create a spy to simulate an error
      jest.spyOn(configManager, 'config', 'get').mockImplementation(() => {
        throw new Error('Simulated error');
      });
      
      expect(() => {
        generator.generateSchema();
      }).toThrow(TransformerError);
    });
  });
  
  describe('generateExample', () => {
    test('should generate a valid example based on the current configuration', () => {
      const example = generator.generateExample();
      
      // Check example structure
      expect(example).toBeDefined();
      expect(example.root).toBeDefined();
      
      // Check namespace properties
      expect(example.root['@ns']).toBeDefined();
      expect(example.root['@prefix']).toBeDefined();
      
      // Check for required properties
      expect(example.root['@val']).toBeDefined();
      expect(example.root['@attrs']).toBeDefined();
      
      // Check for child elements
      expect(example.root['@children']).toBeInstanceOf(Array);
      expect(example.root['@children'].length).toBeGreaterThan(0);
      
      // Check a child element
      const child = example.root['@children'][0].child;
      expect(child).toBeDefined();
      expect(child['@ns']).toBeDefined();
      expect(child['@val']).toBeDefined();
    });
    
    test('should adapt example to custom property names', () => {
      // Create config with custom property names
      const customPropConfig = createTestConfig({
        propNames: {
          namespace: "_ns",
          prefix: "_prefix",
          value: "_text",
          attributes: "_attrs",
          cdata: "_cdata",
          comments: "_comments",
          processing: "_processing",
          children: "_children"
        }
      });
      const customPropConfigManager = new ConfigurationManager(customPropConfig);
      const customPropGenerator = new SchemaGenerator(customPropConfigManager);
      
      const example = customPropGenerator.generateExample();
      
      // Check that example uses custom property names
      expect(example.root['_ns']).toBeDefined();
      expect(example.root['_text']).toBeDefined();
      expect(example.root['_attrs']).toBeDefined();
      expect(example.root['_children']).toBeDefined();
    });
  });
});