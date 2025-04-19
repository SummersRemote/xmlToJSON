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
  
  describe('getShortPath method', () => {
    test('should handle shorthand paths for common access patterns', () => {
      // Testing a shortcut path to get all book titles directly
      const bookTitles = navigator.getShortPath(sampleJSON, "catalog.book.title.@val");
      expect(bookTitles).toEqual(["The Catcher in the Rye", "To Kill a Mockingbird"]);
      
      // Testing a shortcut path to get all author names directly
      const authors = navigator.getShortPath(sampleJSON, "catalog.book.author.@val");
      expect(authors).toEqual(["J.D. Salinger", "Harper Lee"]);
    });
    
    test('should handle mixed shorthand and explicit paths', () => {
      // Mix of shorthand and explicit path
      const bookIds = navigator.getShortPath(sampleJSON, "catalog.book.@attrs.id.@val");
      expect(bookIds).toEqual(["bk101", "bk102"]);
    });
  });
  
  describe('findElements method', () => {
    test('should find elements matching criteria', () => {
      // Find books with category = fiction
      const books = navigator.findElements(sampleJSON, {
        'name': 'book',
        '@attrs.category.@val': 'fiction'
      });
      
      expect(books.length).toBe(2);
      expect(books[0].book["@attrs"].id["@val"]).toBe("bk101");
      expect(books[1].book["@attrs"].id["@val"]).toBe("bk102");
      
      // Find book with specific ID
      const specificBook = navigator.findElements(sampleJSON, {
        'name': 'book',
        '@attrs.id.@val': 'bk102'
      });
      
      expect(specificBook.length).toBe(1);
      expect(specificBook[0].book["@attrs"].id["@val"]).toBe("bk102");
    });
    
    test('should return empty array when no elements match', () => {
      const nonExistent = navigator.findElements(sampleJSON, {
        'name': 'book',
        '@attrs.category.@val': 'non-fiction'
      });
      
      expect(nonExistent).toEqual([]);
    });
  });
  
  describe('setPath method', () => {
    test('should update a value at a specific path', () => {
      // Update a title
      const updated = navigator.setPath(
        sampleJSON, 
        "catalog.@children[0].book.@children[0].title.@val", 
        "Updated Title"
      );
      
      // Check the updated value
      expect(updated.catalog["@children"][0].book["@children"][0].title["@val"]).toBe("Updated Title");
      
      // Original should not be modified
      expect(sampleJSON.catalog["@children"][0].book["@children"][0].title["@val"]).toBe("The Catcher in the Rye");
    });
    
    test('should create missing properties if needed', () => {
      // Add a new property
      const updated = navigator.setPath(
        sampleJSON, 
        "catalog.@children[0].book.@children[0].title.@new_prop", 
        "New Value"
      );
      
      // Check the new property
      expect(updated.catalog["@children"][0].book["@children"][0].title["@new_prop"]).toBe("New Value");
      
      // Original should not have the new property
      expect(sampleJSON.catalog["@children"][0].book["@children"][0].title["@new_prop"]).toBeUndefined();
    });
    
    test('should handle array indices when setting values', () => {
      // Add a new element to an array
      const updated = navigator.setPath(
        sampleJSON, 
        "catalog.@children[2]", 
        {
          "magazine": {
            "@val": "New Magazine",
            "@attrs": {}
          }
        }
      );
      
      // Check the new element
      expect(updated.catalog["@children"].length).toBe(3);
      expect(updated.catalog["@children"][2].magazine["@val"]).toBe("New Magazine");
      
      // Original should not be modified
      expect(sampleJSON.catalog["@children"].length).toBe(2);
    });
  });
});