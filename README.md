xmlToJSON
=========

A simple javascript utility for converting xml into json with support for namespaces and attributes.

Features
* only one tiny, lightweight dependency, [sax.js](https://github.com/isaacs/sax-js)
* small, could be minified along with sax.js to be even smaller (~19kb combined)
* simple parsing.  pass a string, get back a javascipt object
* supports atrributes, text, cdata, namespaces, default namespaces, attributes with namespaces
* lots of inline comments (github keeps messing with the formatting though.  sorry)

Parsing XML with javascript remains one of the great difficulties writing web applications.
Most methods are limited by things such as poor browser support, poor or non-existent namespace support, poor attribute handling, difficult to use or bloated.

The most effective solutions usually involve converting the XML to JSON, and indeed there are several libraries for that.  However, many of them suffer from poor/incomplete represenation especially with regard to namespaces and attributes.

xmlTOJSON may not solve all of your woes, but it solved mine :)

Installation
------------
1. [download sax.js](https://raw.github.com/isaacs/sax-js/master/lib/sax.js).
2. [Download xmlToJSON.js](https://raw.github.com/metatribal/xmlToJSON/master/xmlToJSON.js)
3. Include them both in your html file.
 ```html
<script type="text/javascript" src="path/sax.js"></script>
<script type="text/javascript" src="path/xmlToJSON.js"></script>
 ```
4. Enjoy!
 ```javascript
<script type="text/javascript">
  xmlString = '<xml><a>It Works!</a></xml>';  // an xml string

	var parser = new xmlToJSON.Parser();  // instantiate the parser
	result = parser.parseString(xmlTest8);   // parse!
</script>
 ```
 The (prettified) result of the above code is
 ```html
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



 
