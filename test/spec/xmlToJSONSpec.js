
describe("Version", function() {

    it("print version", function() {
		expect(xmlToJSON.version).toMatch(/^1\.3/);
    });

});

describe("Parsing - grokAttr=true, grokText=true", function() {

	var xml;
	var result;
	var options = {grokAttr: true, grokText: true};

	it("Setting up xml, options", function () {
		options = {};
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

    it("reading text node", function() {
        expect(result.xml[0].a[0].b[0]._text).toEqual("one");
    });

    it("reading numeric attribute", function() {
        expect(result.xml[0].a[0].b[0]._attr.id._value).toEqual(1);
    });

    it("reading true attribute", function() {
        expect(result.xml[0].a[0].b[1]._attr.id._value).toEqual(true);
    });

    it("reading false attribute", function() {
        expect(result.xml[0].a[0].b[2]._attr.id._value).toEqual(false);
    });

    it("reading true node", function() {
        expect(result.xml[0].e[0]._text).toEqual(true);
    });

    it("reading false node", function() {
        expect(result.xml[0].f[0]._text).toEqual(false);
    });

});

describe("Parsing - grokAttr=false, grokTest=false", function() {

	var xml;
	var result;
	var options = {grokAttr: false, grokText: false};

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

    it("reading text node", function() {
        expect(result.xml[0].a[0].b[0]._text).toEqual("one");
    });

    it("reading numeric attribute", function() {
        expect(result.xml[0].a[0].b[0]._attr.id._value).toEqual("1");
    });

    it("reading true attribute", function() {
        expect(result.xml[0].a[0].b[1]._attr.id._value).toEqual("true");
    });

    it("reading false attribute", function() {
        expect(result.xml[0].a[0].b[2]._attr.id._value).toEqual("false");
    });

    it("reading true node", function() {
        expect(result.xml[0].e[0]._text).toEqual("true");
    });

    it("reading false node", function() {
        expect(result.xml[0].f[0]._text).toEqual("false");
    });

});
