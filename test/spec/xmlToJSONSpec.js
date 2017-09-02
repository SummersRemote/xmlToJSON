
describe("Version", function () {

	it("print version", function () {
		expect(xmlToJSON.version).toEqual("2.0.0-dev");
	});

});

describe("Parsing - grokAttr=true, grokText=true", function () {

	var xml, jsontest;
	var result;
	var options = { grokAttr: true, grokText: true };

	it("Setting up xml, options", function () {
		options = {};
		// xml = ['<?xml version="1.0" encoding="UTF-8"?>',
		// 	'<xml xmlns="http://default.namespace.uri">',
		// 	'    <a>',
		// 	'        <b id="1">one</b>',
		// 	'        <b id="true">true</b>',
		// 	'        <b id="false">false</b>',
		// 	'        <b id="2"><![CDATA[some <cdata>]]>two</b>',
		// 	'        <ns:c xmlns:ns="http://another.namespace" ns:id="3">three</ns:c>',
		// 	'    </a>',
		// 	'	 <e>true</e>',
		// 	'	 <f>false</f>',
		// 	'</xml>'].join('\n');

		xml = ['<?xml version="1.0" encoding="UTF-8"?>',
			'<!-- this is a comment -->',
			'<!-- processing instruction -->',
			'<?myInstruction v1="someValue1" v2="someValue2"?>',
			'<!-- root element, default namespace, defined namespace -->',
			'<xml xmlns="http://default.namespace.uri" xmlns:foo="http://foo.namespace.uri">',
			'    <!-- simple element with children -->',
			'    <a>',
			'    <!-- simple element with single attribute -->',
			'        <b id="1">one</b>',
			'        <!-- truthy text and multiple attributes -->',
			'        <b id="2" truth="true">true</b>',
			'        <b id="3" truth="false">false</b>',
			'        <!-- cdata -->',
			'        <b id="4"><![CDATA[some <cdata>]]>two</b>',
			'    </a>',
			'  <!-- using defined namespace -->',
			'  <foo:c foo:id="5">three</foo:c>',
			'  <!-- inline namespace -->',
			'  <bar:d xmlns:bar="http://bar.namespace.uri" bar:id="6">three</bar:d>',
			'  <!-- simple elements with truthy text -->',
			'	 <e>true</e>',
			'	 <f>false</f>',
			'</xml>'].join('\n');

		jsontest = [
			{
				"type": "instruction",
				"tag": "xml",
				"attributes": [
					{
						"tag": "version",
						"value": "1.0"
					}
				]
			},
			{
				"type": "element",
				"tag": "catalog",
				"text": "",
				"children": [
					{
						"type": "element",
						"tag": "book",
						"text": "",
						"children": [
							{
								"type": "element",
								"tag": "author",
								"text": "Bob",
								"children": [

								]
							},
							{
								"type": "element",
								"tag": "title",
								"text": "a guide to stuff",
								"children": [

								]
							}
						]
					},
					{
						"type": "element",
						"tag": "book",
						"text": "",
						"children": [
							{
								"type": "element",
								"tag": "author",
								"text": "Jane",
								"children": []
							},
							{
								"type": "element",
								"tag": "title",
								"text": "a guide to things",
								"children": []
							}
						]
					}
				]
			}
		]

		console.log(JSON.stringify(jsontest))

		// console.debug(xml);
		// result = xmlToJSON.parseString(xml, options);
		// console.log(JSON.stringify(result))

		// expect(result).toBeDefined();
		expect(jsontest).toBeDefined();

	});

	it("new format - first element", function () {
		expect(jsontest[1].type).toEqual("element");
	});

	it("new format - child is book", function () {
		expect(jsontest[1].children[0].tag).toEqual("book");
	});

	it("new format - book by Bob", function () {
		// would look better as
		// jsontest[1].find('catalog').first('book').first('author')
		// find(ns, el, value) - return array
		// api should include (first(s), each(s), last(s))


		var t = jsontest
			.find(a => a.tag == 'catalog')
			.children
			.filter(b => b.tag == 'book')
			.children
			.filter(c => c.tag == 'author')

		console.log('t', t)

		// expect(jsontest[1].children[0].children[0].text).toEqual("Bob");
	});


	it("reading text node", function () {
		expect(result.xml[0].a[0].b[0]._text).toEqual("one");
	});

	it("reading numeric attribute", function () {
		expect(result.xml[0].a[0].b[0]._attr.id._value).toEqual(1);
	});

	it("reading true attribute", function () {
		expect(result.xml[0].a[0].b[1]._attr.id._value).toEqual(true);
	});

	it("reading false attribute", function () {
		expect(result.xml[0].a[0].b[2]._attr.id._value).toEqual(false);
	});

	it("reading true node", function () {
		expect(result.xml[0].e[0]._text).toEqual(true);
	});

	it("reading false node", function () {
		expect(result.xml[0].f[0]._text).toEqual(false);
	});

});

describe("Parsing - grokAttr=false, grokTest=false", function () {

	var xml;
	var result;
	var options = { grokAttr: false, grokText: false };

	it("Setting up xml, options", function () {
		xml = ['<?xml version="1.0" encoding="UTF-8"?>',
			'<xml xmlns="http://default.namespace.uri">',
			'    <a>',
			'        <b id="1">one</b>',
			'        <b id="true">true</b>',
			'        <b id="false">false</b>',
			'        <b id="2"><![CDATA[some <cdata>]]>two</b>',
			'        <ns:c xmlns:ns="http://another.namespace" ns:id="3">three</ns:c>',
			'    </a>',
			'	 <e>true</e>',
			'	 <f>false</f>',
			'</xml>'].join('\n');

		console.debug(xml);
		result = xmlToJSON.parseString(xml, options);
		console.log(JSON.stringify(result))

		expect(result).toBeDefined();
	});

	it("reading text node", function () {
		expect(result.xml[0].a[0].b[0]._text).toEqual("one");
	});

	it("reading numeric attribute", function () {
		expect(result.xml[0].a[0].b[0]._attr.id._value).toEqual("1");
	});

	it("reading true attribute", function () {
		expect(result.xml[0].a[0].b[1]._attr.id._value).toEqual("true");
	});

	it("reading false attribute", function () {
		expect(result.xml[0].a[0].b[2]._attr.id._value).toEqual("false");
	});

	it("reading true node", function () {
		expect(result.xml[0].e[0]._text).toEqual("true");
	});

	it("reading false node", function () {
		expect(result.xml[0].f[0]._text).toEqual("false");
	});

});
