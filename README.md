xmlToJSON
=========

A simple javascript module for converting XML into JSON within the browser.

Features
* no external dependencies
* small (~3kb minified)
* simple parsing.  pass either a string or xml node and get back a javascipt object ( use JSON.stringify(obj) to get the string representation )
* supports atrributes, text, cdata, namespaces, default namespaces, attributes with namespaces... you get the idea
* lots of rendering of options
* consistent, predictable output
* browser support - it works on IE 9+, and nearly every version of Chrome, Safari, and Firefox as well as iOS, Android, and Blackberry.  (xmlToJSON will work for IE 7/8 as well if you set the xmlns option to false)

Parsing XML (esp. with namespaces) with javascript remains one of the great frustrations of writing web applications.
Most methods are limited by such things as poor browser support, poor or non-existent namespace support, poor attribute handling, incomplete representation, and bloated dependencies.

xmlToJSON may not solve all of your woes, but it solved some of mine :)

Usage
-----
Include the src
```
<script type="text/javascript" src="path/xmlToJSON.js"></script>
 ```
and enjoy!  xmlToJSON is packaged as a simple module, so use it like this
 ```javascript
  testString = '<xml><a>It Works!</a></xml>';  	// get some xml (string or document/node)
  result = xmlToJSON.parseString(testString);	// parse
 ```
 The (prettified) result of the above code is
 ```javascript
{
    "xml": {
        "a": [
            {
                "text": "It Works!"
            }
        ]
    }
}
```

Node Usage
----------
While this library does not officialy support use in the NodeJS environment; several users have reported good results by requiring the xmldom package.

User [sethb0](https://github.com/sethb0) has suggested the following workaround example.

```
const { DOMParser } = require('xmldom');
const xmlToJSON = require('xmlToJSON');
xmlToJSON.stringToXML = (string) => new DOMParser().parseFromString(string, 'text/xml');
```
 

Options
-------
```javascript
// These are the option defaults
var options = { 
	mergeCDATA: true,	// extract cdata and merge with text nodes
	grokAttr: true,		// convert truthy attributes to boolean, etc
	grokText: true,		// convert truthy text/attr to boolean, etc
	normalize: true,	// collapse multiple spaces to single space
	xmlns: true, 		// include namespaces as attributes in output
	namespaceKey: '_ns', 	// tag name for namespace objects
	textKey: '_text', 	// tag name for text nodes
	valueKey: '_value', 	// tag name for attribute values
	attrKey: '_attr', 	// tag for attr groups
	cdataKey: '_cdata',	// tag for cdata nodes (ignored if mergeCDATA is true)
	attrsAsObject: true, 	// if false, key is used as prefix to name, set prefix to '' to merge children and attrs.
	stripAttrPrefix: true, 	// remove namespace prefixes from attributes
	stripElemPrefix: true, 	// for elements of same name in diff namespaces, you can enable namespaces and access the nskey property
	childrenAsArray: true 	// force children into arrays
};	

// you can change the defaults by passing the parser an options object of your own
var myOptions = {
	mergeCDATA: false,
	xmlns: false,
	attrsAsObject: false
}

result = xmlToJSON.parseString(xmlString, myOptions);
```

A more complicated example (with xmlns: true)
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
        "xml": [{
                "attr": {
                        "xmlns": {
                                "value": "http://default.namespace.uri"
                        }
                },
                "a": [{
                        "b": [{
                                "attr": {
                                        "id": {
                                                "value": 1
                                        }
                                },
                                "text": "one"
                        }, {
                                "attr": {
                                        "id": {
                                                "value": 2
                                        }
                                },
                                "text": "some <cdata>two"
                        }],
                        "c": [{
                                "attr": {
                                        "xmlns:ns": {
                                                "value": "http://another.namespace"
                                        },
                                        "id": {
                                                "value": 3
                                        }
                                },
                                "text": "three"
                        }]
                }]
        }]
}
```

