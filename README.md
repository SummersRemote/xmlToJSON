xmlToJSON (updated Sept 6, 2013)
=========

A simple javascript utility for converting xml into json.

Features
* no external dependencies
* small (~3kb minified)
* simple parsing.  pass a string, get back a javascipt object ( use JSON.stringify(obj) to get the string representation )
* supports atrributes, text, cdata, namespaces, default namespaces, attributes with namespaces, you get the idea
* plenty of options

Parsing XML with javascript remains one of the great difficulties of writing web applications.
Most methods are limited by such things as poor browser support, poor or non-existent namespace support, poor attribute handling, difficult to use or bloated.

The most effective solutions usually involve converting the XML to JSON, and indeed there are several libraries for that.  However, many of them suffer from poor/incomplete representation especially with regard to namespaces and attributes.

xmlToJSON may not solve all of your woes, but it solved mine :)

Usage
-----
Include the src
```
<script type="text/javascript" src="path/xmlToJSON.js"></script>
 ```
and enjoy!  xmlToJSON is packaged as a simple module, so use it like this
 ```javascript
  testString = '<xml><a>It Works!</a></xml>';  	// get some xml
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

Options
-------
```javascript
// these are the default options
var options = {
	parseCDATA: true,	// extract cdata and merge with text
	grokAttr: true,		// convert truthy attributes to boolean, etc
	grokText: true,		// convert truthy text to boolean, etc
	normalize: true,	// collapse multiple spaces to single space
	xmlns: false, 		// include namespaces as attribute in output
	namespaceKey: 'ns', 	// tag name for namespace objects
	textKey: 'text', 	// tag name for text values
	valueKey: 'value', 	// tag name for attribute values
	attrKey: 'attr', 	// tag for attr groups
	attrsAsObject: true, 	// if false, key is used as prefix to name, set prefix to '' to merge children and attrs.
	stripAttrPrefix: true, 	// remove namespace prefixes from nodes(el and attr) (set false if you have elements with the same name in different namespaces)
	stripElemPrefix: true, 	// for elements of same name in diff prefixes, you can use the namespaceKey to determine which it is.
	childrenAsArray: true 	// force children into arrays
};	

// you can change the defaults by passing the parser an options object of your own
var myOptions - {
	parseCDATA: false,
	xmlns: true
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
 
