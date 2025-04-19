/**
 * Unit tests for the PathNavigator class
 */

import ConfigurationManager from '../../src/components/ConfigurationManager.js';
import PathNavigator from '../../src/components/PathNavigator.js';

describe('PathNavigator', () => {
  let configManager;
  let navigator;
  let sampleJSON;
  
  beforeEach(() => {
    // Create a default configuration
    configManager = new ConfigurationManager();
    navigator = new PathNavigator(configManager);
    
    // Create a sample JSON structure similar to what would be produced by xmlToJSON
    sampleJSON = {
      "catalog": {
        "@ns": "http://example.org/catalog",
        "@val": "",
        "@attrs": {},
        "@comments": ["This is a catalog of books"],
        "@processing": [],
        "@children": [
          {
            "book": {
              "@ns": "http://example.org/catalog",
              "@val": "",
              "@attrs": {
                "id": {
                  "@val": "bk101",
                  "@ns": ""
                },
                "category": {
                  "@val": "fiction",
                  "@ns": ""
                }
              },
              "@children": [
                {
                  "title": {
                    "@ns": "http://example.org/catalog",
                    "@val": "The Catcher in the Rye",
                    "@attrs": {},
                    "@children": []
                  }
                },
                {
                  "author": {
                    "@ns": "http://example.org/catalog",
                    "@val": "J.D. Salinger",
                    "@attrs": {},
                    "@children": []
                  }
                }
              ]
            }
          },
          {
            "book": {
              "@ns": "http://example.org/catalog",
              "@val": "",
              "@attrs": {
                "id": {
                  "@val": "bk102",
                  "@ns": ""
                },
                "category": {
                  "@val": "fiction",
                  "@ns": ""
                }
              },
              "@children": [
                {
                  "title": {
                    "@ns": "http://example.org/catalog",
                    "@val": "To Kill a Mockingbird",
                    "@attrs": {},
                    "@children": []
                  }
                },
                {
                  "author": {
                    "@ns": "http://example.org/catalog",
                    "@val": "Harper Lee",
                    "@attrs": {},
                    "@children": []
                  }
                }
              ]
            }
          }
        ]
      }
    };
  });
  
  describe('getPath method', () => {
    test('should access root element properties directly', () => {
      const namespace = navigator.getPath(sampleJSON, "catalog.@ns");
      expect(namespace).toBe("http://example.org/catalog");
      
      const comments = navigator.getPath(sampleJSON, "catalog.@comments");
      expect(comments).toEqual(["This is a catalog of books"]);
    });
    
    test('should access child elements by path', () => {
      // Access the first book's id attribute
      const bookId = navigator.getPath(sampleJSON, "catalog.@children[0].book.@attrs.id.@val");
      expect(bookId).toBe("bk101");
      
      // Access the second book's category attribute
      const bookCategory = navigator.getPath(sampleJSON, "catalog.@children[1].book.@attrs.category.@val");
      expect(bookCategory).toBe("fiction");
    });
    
    test('should access nested child elements', () => {
      // Access the first book's title
      const title = navigator.getPath(sampleJSON, "catalog.@children[0].book.@children[0].title.@val");
      expect(title).toBe("The Catcher in the Rye");
      
      // Access the second book's author
      const author = navigator.getPath(sampleJSON, "catalog.@children[1].book.@children[1].author.@val");
      expect(author).toBe("Harper Lee");
    });
    
    test('should flatten results when accessing multiple elements', () => {
      // Access all book titles
      const titles = navigator.getPath(sampleJSON, "catalog.@children.book.@children.title.@val");
      expect(titles).toEqual(["The Catcher in the Rye", "To Kill a Mockingbird"]);
      
      // Access all book authors
      const authors = navigator.getPath(sampleJSON, "catalog.@children.book.@children.author.@val");
      expect(authors).toEqual(["J.D. Salinger", "Harper Lee"]);
    });
    
    test('should return undefined for non-existent paths', () => {
      const nonExistent = navigator.getPath(sampleJSON, "catalog.@children[0].book.@children[5].price.@val");
      expect(nonExistent).toBeUndefined();
    });
    
    test('should use fallback value for non-existent paths when provided', () => {
      const fallback = "Not Found";
      const nonExistent = navigator.getPath(sampleJSON, "catalog.@children[0].book.@children[5].price.@val", fallback);
      expect(nonExistent).toBe(fallback);
    });
    
    test('should handle array indexing correctly', () => {
      // Access specific array elements
      const secondBook = navigator.getPath(sampleJSON, "catalog.@children[1].book");
      expect(secondBook["@attrs"].id["@val"]).toBe("bk102");
      
      // Out of bounds index should return undefined
      const outOfBounds = navigator.getPath(sampleJSON, "catalog.@children[5]");
      expect(outOfBounds).toBeUndefined();
    });
    
    test('should handle null or undefined input gracefully', () => {
      // Test with null object
      const nullResult = navigator.getPath(null, "some.path");
      expect(nullResult).toBeUndefined();
      
      // Test with undefined object
      const undefinedResult = navigator.getPath(undefined, "some.path");
      expect(undefinedResult).toBeUndefined();
      
      // Test with fallback values
      const nullWithFallback = navigator.getPath(null, "some.path", "fallback");
      expect(nullWithFallback).toBe("fallback");
    });
  });
});