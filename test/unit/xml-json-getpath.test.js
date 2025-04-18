/**
 * Unit tests for the getPath method of XMLJSONTransformer
 */

import { XMLJSONTransformer } from '../../src/xml-json-transformer.js';

describe("XMLJSONTransformer.getPath", () => {
  let transformer;
  let sampleJSON;

  beforeEach(() => {
    // Create a fresh transformer instance before each test
    transformer = new XMLJSONTransformer();
    
    // Create a sample JSON structure similar to what would be produced by xmlToJSON
    sampleJSON = {
      "catalog": {
        "@ns": "http://example.org/catalog",
        "@val": "",
        "@attrs": {},
        "@cdata": [],
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
              "@cdata": [],
              "@comments": [],
              "@processing": [],
              "@children": [
                {
                  "title": {
                    "@ns": "http://example.org/catalog",
                    "@val": "The Catcher in the Rye",
                    "@attrs": {},
                    "@cdata": [],
                    "@comments": [],
                    "@processing": [],
                    "@children": []
                  }
                },
                {
                  "author": {
                    "@ns": "http://example.org/catalog",
                    "@val": "J.D. Salinger",
                    "@attrs": {},
                    "@cdata": [],
                    "@comments": [],
                    "@processing": [],
                    "@children": []
                  }
                },
                {
                  "year": {
                    "@ns": "http://example.org/catalog",
                    "@val": "1951",
                    "@attrs": {},
                    "@cdata": [],
                    "@comments": [],
                    "@processing": [],
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
              "@cdata": [],
              "@comments": [],
              "@processing": [],
              "@children": [
                {
                  "title": {
                    "@ns": "http://example.org/catalog",
                    "@val": "To Kill a Mockingbird",
                    "@attrs": {},
                    "@cdata": [],
                    "@comments": [],
                    "@processing": [],
                    "@children": []
                  }
                },
                {
                  "author": {
                    "@ns": "http://example.org/catalog",
                    "@val": "Harper Lee",
                    "@attrs": {},
                    "@cdata": [],
                    "@comments": [],
                    "@processing": [],
                    "@children": []
                  }
                },
                {
                  "year": {
                    "@ns": "http://example.org/catalog",
                    "@val": "1960",
                    "@attrs": {},
                    "@cdata": [],
                    "@comments": [],
                    "@processing": [],
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

  test("should access root element properties directly", () => {
    const namespace = transformer.getPath(sampleJSON, "catalog.@ns");
    expect(namespace).toBe("http://example.org/catalog");
    
    const comments = transformer.getPath(sampleJSON, "catalog.@comments");
    expect(comments).toEqual(["This is a catalog of books"]);
  });

  test("should access child elements by path", () => {
    // Access the first book's id attribute
    const bookId = transformer.getPath(sampleJSON, "catalog.@children[0].book.@attrs.id.@val");
    expect(bookId).toBe("bk101");
    
    // Access the second book's category attribute
    const bookCategory = transformer.getPath(sampleJSON, "catalog.@children[1].book.@attrs.category.@val");
    expect(bookCategory).toBe("fiction");
  });

  test("should access nested child elements", () => {
    // Access the first book's title
    const title = transformer.getPath(sampleJSON, "catalog.@children[0].book.@children[0].title.@val");
    expect(title).toBe("The Catcher in the Rye");
    
    // Access the second book's author
    const author = transformer.getPath(sampleJSON, "catalog.@children[1].book.@children[1].author.@val");
    expect(author).toBe("Harper Lee");
  });

  test("should flatten results when accessing multiple elements", () => {
    // Access all book titles (should be flattened automatically)
    const titles = transformer.getPath(sampleJSON, "catalog.@children.book.@children.title.@val");
    expect(titles).toEqual(["The Catcher in the Rye", "To Kill a Mockingbird"]);
    
    // Access all book years
    const years = transformer.getPath(sampleJSON, "catalog.@children.book.@children.year.@val");
    expect(years).toEqual(["1951", "1960"]);
  });

  test("should return undefined for non-existent paths", () => {
    const nonExistent = transformer.getPath(sampleJSON, "catalog.@children[0].book.@children[5].price.@val");
    expect(nonExistent).toBeUndefined();
  });

  test("should use fallback value for non-existent paths when provided", () => {
    const fallback = "Not Found";
    const nonExistent = transformer.getPath(sampleJSON, "catalog.@children[0].book.@children[5].price.@val", fallback);
    expect(nonExistent).toBe(fallback);
  });

  test("should handle array indexing correctly", () => {
    // Access specific array elements
    const secondBook = transformer.getPath(sampleJSON, "catalog.@children[1].book");
    expect(secondBook["@attrs"].id["@val"]).toBe("bk102");
    
    // Out of bounds index should return undefined
    const outOfBounds = transformer.getPath(sampleJSON, "catalog.@children[5]");
    expect(outOfBounds).toBeUndefined();
  });

  test("should handle accessing specific elements by direct reference", () => {
    // Direct reference to all books
    const books = transformer.getPath(sampleJSON, "catalog.@children.book");
    expect(books.length).toBe(2);
    expect(books[0]["@attrs"].id["@val"]).toBe("bk101");
    expect(books[1]["@attrs"].id["@val"]).toBe("bk102");
  });

  test("should handle shortcut paths for common access patterns", () => {
    // Testing a shortcut path to get all book titles directly
    const bookTitles = transformer.getPath(sampleJSON, "catalog.book.title.@val");
    expect(bookTitles).toEqual(["The Catcher in the Rye", "To Kill a Mockingbird"]);
    
    // Testing a shortcut path to get all author names directly
    const authors = transformer.getPath(sampleJSON, "catalog.book.author.@val");
    expect(authors).toEqual(["J.D. Salinger", "Harper Lee"]);
  });

  test("should handle custom configuration of property names", () => {
    // Create a transformer with custom property names
    const customTransformer = new XMLJSONTransformer({
      propNames: {
        namespace: "_ns",
        value: "_val",
        attributes: "_attrs",
        children: "_children"
      }
    });
    
    // Create a sample with custom property names
    const customJSON = {
      "catalog": {
        "_ns": "http://example.org/catalog",
        "_val": "",
        "_attrs": {},
        "_children": [
          {
            "book": {
              "_ns": "http://example.org/catalog",
              "_val": "",
              "_attrs": {
                "id": {
                  "_val": "bk101",
                  "_ns": ""
                }
              },
              "_children": [
                {
                  "title": {
                    "_ns": "http://example.org/catalog",
                    "_val": "The Catcher in the Rye",
                    "_attrs": {},
                    "_children": []
                  }
                }
              ]
            }
          }
        ]
      }
    };
    
    // Access properties using custom property names
    const bookTitle = customTransformer.getPath(customJSON, "catalog._children[0].book._children[0].title._val");
    expect(bookTitle).toBe("The Catcher in the Rye");
  });

  test("should handle complex nested structures", () => {
    // Create a more complex nested structure
    const complexJSON = {
      "library": {
        "@ns": "",
        "@val": "",
        "@attrs": {},
        "@cdata": [],
        "@comments": [],
        "@processing": [],
        "@children": [
          {
            "section": {
              "@ns": "",
              "@val": "",
              "@attrs": {
                "name": {
                  "@val": "fiction",
                  "@ns": ""
                }
              },
              "@cdata": [],
              "@comments": [],
              "@processing": [],
              "@children": [
                {
                  "shelf": {
                    "@ns": "",
                    "@val": "",
                    "@attrs": {
                      "id": {
                        "@val": "A1",
                        "@ns": ""
                      }
                    },
                    "@cdata": [],
                    "@comments": [],
                    "@processing": [],
                    "@children": [
                      {
                        "book": {
                          "@ns": "",
                          "@val": "",
                          "@attrs": {
                            "id": {
                              "@val": "book1",
                              "@ns": ""
                            }
                          },
                          "@cdata": [],
                          "@comments": [],
                          "@processing": [],
                          "@children": [
                            {
                              "title": {
                                "@ns": "",
                                "@val": "Nested Book Title",
                                "@attrs": {},
                                "@cdata": [],
                                "@comments": [],
                                "@processing": [],
                                "@children": []
                              }
                            }
                          ]
                        }
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    };
    
    // Access deeply nested elements
    const shelfId = transformer.getPath(complexJSON, "library.@children[0].section.@children[0].shelf.@attrs.id.@val");
    expect(shelfId).toBe("A1");
    
    // Access book title using shortcut path
    const bookTitle = transformer.getPath(complexJSON, "library.section.shelf.book.title.@val");
    expect(bookTitle).toEqual(["Nested Book Title"]);
  });

  test("should handle empty arrays and objects gracefully", () => {
    const emptyJSON = {
      "root": {
        "@ns": "",
        "@val": "",
        "@attrs": {},
        "@cdata": [],
        "@comments": [],
        "@processing": [],
        "@children": []
      }
    };
    
    // Access properties of an empty JSON structure
    const children = transformer.getPath(emptyJSON, "root.@children");
    expect(children).toEqual([]);
    
    // Access non-existent child elements
    const nonExistent = transformer.getPath(emptyJSON, "root.@children.element");
    expect(nonExistent).toEqual([]);
  });

  test("should handle invalid paths gracefully", () => {
    // Test with invalid path syntax
    const invalidPath = transformer.getPath(sampleJSON, "catalog.$$invalid..path");
    expect(invalidPath).toBeUndefined();
    
    // Test with fallback value
    const withFallback = transformer.getPath(sampleJSON, "catalog.$$invalid..path", "fallback");
    expect(withFallback).toBe("fallback");
  });

  test("should handle null or undefined input gracefully", () => {
    // Test with null object
    const nullResult = transformer.getPath(null, "some.path");
    expect(nullResult).toBeUndefined();
    
    // Test with undefined object
    const undefinedResult = transformer.getPath(undefined, "some.path");
    expect(undefinedResult).toBeUndefined();
    
    // Test with fallback values
    const nullWithFallback = transformer.getPath(null, "some.path", "fallback");
    expect(nullWithFallback).toBe("fallback");
  });
});