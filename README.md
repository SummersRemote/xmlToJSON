xmlToJSON
=========

A simple javascript utility for converting xml into json with support for namespaces and attributes.

Features
* only one tiny, lightweight dependency, [sax.js](https://github.com/isaacs/sax-js)
* small, could be minified along with sax.js to be even smaller (~19kb combined)
* simple parsing.  pass a string, get back a javascipt object
* supports atrributes, text, cdata, namespaces, default namespaces, attributes with namespaces
* lots of inline comments (github keeps messing with the formatting though.  sorry)

Parsing XML with javascript remains one of the great difficulties of writing web applications.
Most methods are limited by such things as poor browser support, poor or non-existent namespace support, poor attribute handling, difficult to use or bloated.

The most effective solutions usually involve converting the XML to JSON, and indeed there are several libraries for that.  However, many of them suffer from poor/incomplete representation especially with regard to namespaces and attributes.

xmlToJSON may not solve all of your woes, but it solved mine :)

Installation
------------
1. [download sax.js](https://raw.github.com/isaacs/sax-js/master/lib/sax.js).
2. [Download xmlToJSON.js](https://raw.github.com/metatribal/xmlToJSON/master/xmlToJSON.js)
3. Include them both in your html.
 
```
<script type="text/javascript" src="path/sax.js"></script>
```
```
<script type="text/javascript" src="path/xmlToJSON.js"></script>
 ```
Usage
-----
There aren't any options, as of right now.  Simple instantiate the parser and use.
 ```javascript
  var parser = new xmlToJSON.Parser();         // instantiate the parser

  testString = '<xml><a>It Works!</a></xml>';  // get some xml
  result = parser.parseString(testString);     // parse!
 ```
 The (prettified) result of the above code is
 ```javascript
{
    "xml": {
        "a": [
            {
                "_t": "It Works!"
            }
        ]
    }
}
```

Notes on Notation
------------------
* The root node of the XML will be the root tag name
* Child elements are represented as arrays (supports multiple children with the same name).  This requires the use of array index selectors, but it's easy!
* Prefixes are thrown out - all tag names use the corresponding local name
* Namespaces URIs are stored in the _ns object
* Node text and attribute values are stored in the _t object
* Attributes are stored in the _at object.  Its not an array, so each member remains accessible by dot notation.
* CDATA is stored in the _c object

A more complicated example (with namespaces, attributed, and cdata)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<xml xmlns="http://default.namespace.uri">
    <a>
        <b id="1">one</b>
        <b id="2"><![CDATA[some <cdata>]]>two</b>
        <ns:c xmlns:ns="http://another.namespace" ns:id="3">three</ns:c>
    </a>
</xml>
```

results in
```javascript
{
    "xml": {
        "_ns": "http://default.namespace.uri", 
        "_at": {
            "": {
                "_ns": "http://www.w3.org/2000/xmlns/", 
                "_t": "http://default.namespace.uri"
            }
        }, 
        "a": [
            {
                "_ns": "http://default.namespace.uri", 
                "b": [
                    {
                        "_ns": "http://default.namespace.uri", 
                        "_at": {
                            "id": {
                                "_t": "1"
                            }
                        }, 
                        "_t": "one"
                    }, 
                    {
                        "_ns": "http://default.namespace.uri", 
                        "_at": {
                            "id": {
                                "_t": "2"
                            }
                        }, 
                        "_c": "some <cdata>", 
                        "_t": "two"
                    }
                ], 
                "c": [
                    {
                        "_ns": "http://another.namespace", 
                        "_at": {
                            "id": {
                                "_ns": "http://another.namespace", 
                                "_t": "3"
                            }, 
                            "ns": {
                                "_ns": "http://www.w3.org/2000/xmlns/", 
                                "_t": "http://another.namespace"
                            }
                        }, 
                        "_t": "three"
                    }
                ]
            }
        ]
    }
}

```

Accessors
----------
```javascript
result.xml.a[0].b[1]._t;    //returns: "two"
result.xml.a[0].c[0]._at.id._t; // returns: "3"
result.xml.a[0].b;          // returns an array of all children of 'a' named 'b' (prettified below)

[
    {
        "_ns": "http://default.namespace.uri", 
        "_at": {
            "id": {
                "_t": "1"
            }
        }, 
        "_t": "one"
    }, 
    {
        "_ns": "http://default.namespace.uri", 
        "_at": {
            "id": {
                "_t": "2"
            }
        }, 
        "_c": "some <cdata>", 
        "_t": "two"
    }
]

```

 
