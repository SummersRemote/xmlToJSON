import PathNavigator from '../../../../src/core/components/PathNavigator.js';
import ConfigurationManager from '../../../../src/core/components/ConfigurationManager.js';
import { createTestConfig } from '../../../helpers/testUtils.js';
import { TransformerError } from '../../../../src/core/errors/TransformerError.js';

describe('PathNavigator', () => {
  let pathNavigator;
  let configManager;
  let testConfig;
  
  // Sample JSON object for testing
  const sampleJson = {
    "root": {
      "@ns": "http://example.org/ns",
      "@val": "Root content",
      "@attrs": {
        "id": {
          "@ns": "",
          "@val": "root-1"
        },
        "lang": {
          "@ns": "http://www.w3.org/XML/1998/namespace",
          "@val": "en"
        }
      },
      "@children": [
        {
          "child": {
            "@ns": "http://example.org/ns",
            "@val": "Child 1 content",
            "@attrs": {
              "id": {
                "@ns": "",
                "@val": "child-1"
              }
            },
            "@children": [
              {
                "grandchild": {
                  "@ns": "",
                  "@val": "Grandchild 1",
                  "@attrs": {}
                }
              },
              {
                "grandchild": {
                  "@ns": "",
                  "@val": "Grandchild 2",
                  "@attrs": {}
                }
              }
            ]
          }
        },
        {
          "child": {
            "@ns": "http://example.org/ns",
            "@val": "Child 2 content",
            "@attrs": {
              "id": {
                "@ns": "",
                "@val": "child-2"
              }
            },
            "@children": []
          }
        }
      ]
    }
  };
  
  beforeEach(() => {
    testConfig = createTestConfig();
    configManager = new ConfigurationManager(testConfig);
    pathNavigator = new PathNavigator(configManager);
  });
  
  describe('getPath', () => {
    test('should throw error for null or undefined object', () => {
      expect(() => {
        pathNavigator.getPath(null, 'some.path');
      }).toThrow(TransformerError);
      
      expect(() => {
        pathNavigator.getPath(undefined, 'some.path');
      }).toThrow(TransformerError);
    });
    
    test('should throw error for invalid path', () => {
      expect(() => {
        pathNavigator.getPath(sampleJson, null);
      }).toThrow(TransformerError);
      
      expect(() => {
        pathNavigator.getPath(sampleJson, '');
      }).toThrow(TransformerError);
      
      expect(() => {
        pathNavigator.getPath(sampleJson, 123);
      }).toThrow(TransformerError);
    });
    
    test('should return simple properties directly', () => {
      expect(pathNavigator.getPath(sampleJson, 'root.@ns'))
        .toBe('http://example.org/ns');
      
      expect(pathNavigator.getPath(sampleJson, 'root.@val'))
        .toBe('Root content');
    });
    
    test('should access nested properties with dot notation', () => {
      expect(pathNavigator.getPath(sampleJson, 'root.@attrs.id.@val'))
        .toBe('root-1');
      
      expect(pathNavigator.getPath(sampleJson, 'root.@attrs.lang.@val'))
        .toBe('en');
    });
    
    test('should handle array indices for specific items', () => {
      expect(pathNavigator.getPath(sampleJson, 'root.@children[0].child.@val'))
        .toBe('Child 1 content');
      
      expect(pathNavigator.getPath(sampleJson, 'root.@children[1].child.@val'))
        .toBe('Child 2 content');
    });
    
    test('should return fallback value if path not found', () => {
      const fallback = 'Default Value';
      
      expect(pathNavigator.getPath(sampleJson, 'root.nonexistent', fallback))
        .toBe(fallback);
      
      expect(pathNavigator.getPath(sampleJson, 'nonexistent.path', fallback))
        .toBe(fallback);
      
      expect(pathNavigator.getPath(sampleJson, 'root.@children[99]', fallback))
        .toBe(fallback);
    });
    
    test('should throw error for invalid path segment syntax', () => {
      expect(() => {
        pathNavigator.getPath(sampleJson, 'root.@children[abc]');
      }).toThrow(TransformerError);
      
      expect(() => {
        pathNavigator.getPath(sampleJson, 'root.*invalid');
      }).toThrow(TransformerError);
    });
    
    test('should map over arrays when no index is provided', () => {
      const result = pathNavigator.getPath(sampleJson, 'root.@children.child.@val');
      
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(['Child 1 content', 'Child 2 content']);
    });
    
    test('should search through children collections implicitly', () => {
      // Get all grandchild values
      const result = pathNavigator.getPath(sampleJson, 'root.@children.child.@children.grandchild.@val');
      
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(['Grandchild 1', 'Grandchild 2']);
    });
    
    test('should deeply flatten nested arrays', () => {
      // Create a more complex JSON with nested arrays
      const complexJson = {
        "container": {
          "@children": [
            {
              "group": {
                "@children": [
                  {
                    "item": {
                      "@val": "Item 1"
                    }
                  },
                  {
                    "item": {
                      "@val": "Item 2"
                    }
                  }
                ]
              }
            },
            {
              "group": {
                "@children": [
                  {
                    "item": {
                      "@val": "Item 3"
                    }
                  },
                  {
                    "item": {
                      "@val": "Item 4"
                    }
                  }
                ]
              }
            }
          ]
        }
      };
      
      const result = pathNavigator.getPath(complexJson, 'container.@children.group.@children.item.@val');
      
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(4);
      expect(result).toEqual(['Item 1', 'Item 2', 'Item 3', 'Item 4']);
    });
    
    test('should return empty array when path exists but there are no matches', () => {
      const emptyJson = {
        "root": {
          "@children": []
        }
      };
      
      const result = pathNavigator.getPath(emptyJson, 'root.@children.child');
      
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
    
    test('should handle paths with reserved characters in property names', () => {
      const specialCharsJson = {
        "root": {
          "special@property": {
            "@val": "Special value"
          },
          "property_with_underscores": {
            "@val": "Underscore value"
          },
          "property-with-hyphens": {
            "@val": "Hyphen value"
          },
          "property123": {
            "@val": "Numeric value"
          }
        }
      };
      
      expect(pathNavigator.getPath(specialCharsJson, 'root.special@property.@val'))
        .toBe('Special value');
      
      expect(pathNavigator.getPath(specialCharsJson, 'root.property_with_underscores.@val'))
        .toBe('Underscore value');
      
      expect(pathNavigator.getPath(specialCharsJson, 'root.property-with-hyphens.@val'))
        .toBe('Hyphen value');
      
      expect(pathNavigator.getPath(specialCharsJson, 'root.property123.@val'))
        .toBe('Numeric value');
    });
    
    test('should filter out undefined values when flattening arrays', () => {
      const mixedJson = {
        "container": {
          "@children": [
            {
              "item": {
                "@val": "Item 1"
              }
            },
            {
              "different": {
                "@val": "Different item"
              }
            },
            {
              "item": {
                "@val": "Item 2"
              }
            }
          ]
        }
      };
      
      const result = pathNavigator.getPath(mixedJson, 'container.@children.item.@val');
      
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(result).toEqual(['Item 1', 'Item 2']);
    });
  });
});