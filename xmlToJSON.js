var xmlToJSON = {};									// create a namespace

xmlToJSON.Parser = (function() {							// declare the object, Parser

    var parserConstructor = function Parser() {						// with a constructor to return (see end of function)
        if(false === (this instanceof Parser)) {
            return new Parser();							// it doesn't do anything, but gives an object to provide method upon
        }
    }

    parserConstructor.prototype.parseString = function (xmlString) {			// such as this one!  add parseString method to the Parser object

			parser = sax.parser(true, {xmlns: true, trim: true});		// get an instance of the sax.js parser
			stack = [];							// create an empty array to hold and collapse objects

											// some tag identifiers for various xml bits, such as
			namespaceKey = '_ns';						//   namespaces,
			attributeKey = '_at';						//   attributes, and
			textKey = '_t';							//   text (also used for attribute values), and
			cdataKey = '_c';						//   cdata

			// sax.js functions begin here
			parser.onopentag = function (node) {
		  		nodeTmp = {};						// node object
		  		data = {}						// node data
		  		name = node.name;					// tag name to use for this node (default)
		  		if (node.uri) {						// test for namespaces
		  			name = node.local;				// switch tag name to local part (no prefixes in tags)
					data[namespaceKey] = node.uri;			// set the namespace as well
				}

				if (!isEmpty(node.attributes) ) {			// do we have an attributes?
					data[attributeKey] = {};			// create an empty data object for them
					for (attr in node.attributes) {			// iterate over the attribute names
						attrTmp = stack.pop();			// pop the attribute object from the stack
											//	sax.js encounters attributes ahead of open tags
											//	so, we created them in the "onattribute" method
						for(var key in attrTmp) break;		// neat trick to fetch the first tag name
						data[attributeKey][key] = attrTmp[key];	// set the attribute
					}
				}
				nodeTmp[name] = data;					// copy the data into the node object
				stack.push(nodeTmp);					// and push it the stack (happens for every element)
			};

			parser.onclosetag = function (name) {
				if (stack.length < 2) {					// make sure there are at least two things on the stack
					return;						// if not, bail
				} else {
					child = stack.pop();				// the most recent item on the stack is a child not
					for(var ckey in child) break;			// get it's tag name

					parent = stack.pop();				// the second item will be it's parent (since we're processing on closetags)
					for(var pkey in parent) break;			// get it's tag name as well

					if ( !(parent[pkey][ckey]) ) {			// if the parent does not contain an item under the child's tag name
						parent[pkey][ckey] = [child[ckey]];	// add it (in an array to support multiple xml elements of the same name)
					} else {					// otherwise
						parent[pkey][ckey].push(child[ckey]);	// push the child object to the existing array of similiarly named children
					}

					stack.push(parent);				// push the updated parent back to the stack
				}
			};

			parser.onattribute = function (attr) {

		  	  		attrTmp = {};					// attribute object
		 			data = {};					// attribute data
		 			name = attr.name;				// tag name to use for this attribute (default)
		 			if (attr.uri) {					// test for namespaces
		 				name = attr.local;			// switch tag name to local part (no prefixes in tags)
						data[namespaceKey] = attr.uri;  	// set the namespace as well
					}
					data[textKey] = attr.value;			// set the value of the attribute

					attrTmp[name] = data;				// copy the data into the attribute object
					stack.push(attrTmp);				// and push it to the stack
			};

			parser.ontext = function (text) {
				if (stack.length > 0) {					// make sure there is at least one object on the stack
					nodeTmp = stack.pop();				// get the object
					for(var key in nodeTmp) break;			// get it's tag name
					nodeTmp[key][textKey] = text;			// set the text value of the node
					stack.push(nodeTmp);				// push the updated object back to the stack
				}
			};

			parser.oncdata = function (cdata) {
				if (stack.length > 0) {					// make sure there is at least one object on the stack
					nodeTmp = stack.pop();				// get the object
					for(var key in nodeTmp) break;			// get it's tag name
					nodeTmp[key][cdataKey] = cdata;			// set the text value of the node
					stack.push(nodeTmp);				// push the updated object back to the stack
				}
			};

			parser.onerror = function (error) {
			  console.debug('error ' + error);				// print errors as they occur
			};
			// end of sax.js methods 					// several nodes were not implemented, such as
											//   processing isntructions, cdata, comments, etc...

			function isEmpty(obj) {						// utility method to test for empty objects, e.g.
				for(var prop in obj) {					//   var mtObj = {}
					if(obj.hasOwnProperty(prop))
						return false;
				}
				return true;
			}

			parser.write(xmlString).close();				// launches the sax parser
			return stack[0];						// leaving the result as the only object on the stack
    }

    return parserConstructor;								// returns the Parser object mentioned earlier
}());
