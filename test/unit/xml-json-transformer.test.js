/**
 * Unit tests for the XMLJSONTransformer class
 * These tests can be run in a browser or Node.js environment with a test framework
 * like Jest, Mocha, or Jasmine.
 */

describe('XMLJSONTransformer', () => {
    let transformer;
    
    beforeEach(() => {
      // Create a fresh transformer instance before each test
      transformer = new XMLJSONTransformer();
    });
    
    describe('Basic functionality', () => {
      test('should transform a simple XML element to JSON', () => {
        const xml = '<root>Hello World</root>';
        const expected = {
          'root': {
            '@ns': '',
            '@val': 'Hello World',
            '@attrs': {},
            '@cdata': [],
            '@comments': [],
            '@processing': [],
            '@children': []
          }
        };
        
        const result = transformer.xmlToJSON(xml);
        expect(result).toEqual(expected);
      });
      
      test('should transform a simple JSON object to XML', () => {
        const json = {
          'root': {
            '@ns': '',
            '@val': 'Hello World',
            '@attrs': {},
            '@cdata': [],
            '@comments': [],
            '@processing': [],
            '@children': []
          }
        };
        const expected = '<root>Hello World</root>';
        
        const result = transformer.jsonToXML(json);
        // Remove whitespace for comparison
        expect(result.replace(/\s+/g, '')).toEqual(expected);
      });
      
      test('should handle empty elements', () => {
        const xml = '<empty />';
        const expected = {
          'empty': {
            '@ns': '',
            '@val': '',
            '@attrs': {},
            '@cdata': [],
            '@comments': [],
            '@processing': [],
            '@children': []
          }
        };
        
        const result = transformer.xmlToJSON(xml);
        expect(result).toEqual(expected);
        
        const roundTrip = transformer.jsonToXML(result);
        expect(roundTrip.replace(/\s+/g, '')).toEqual('<empty/>');
      });
  
      test('should return JSON as string when requested', () => {
        const xml = '<root>Hello World</root>';
        
        const result = transformer.xmlToJSON(xml, true);
        expect(typeof result).toBe('string');
        expect(JSON.parse(result)).toEqual({
          'root': {
            '@ns': '',
            '@val': 'Hello World',
            '@attrs': {},
            '@cdata': [],
            '@comments': [],
            '@processing': [],
            '@children': []
          }
        });
      });
  
      test('should format JSON with proper indentation', () => {
        const json = {
          'root': {
            '@val': 'Hello World'
          }
        };
        
        const result = transformer.jsonToString(json);
        expect(result).toContain('\n');
        expect(result).toContain('  ');
      });
    });
    
    describe('Attributes', () => {
      test('should handle elements with attributes', () => {
        const xml = '<item id="123" category="book">Product</item>';
        const expected = {
          'item': {
            '@ns': '',
            '@val': 'Product',
            '@attrs': {
              'id': {
                '@val': '123',
                '@ns': ''
              },
              'category': {
                '@val': 'book',
                '@ns': ''
              }
            },
            '@cdata': [],
            '@comments': [],
            '@processing': [],
            '@children': []
          }
        };
        
        const result = transformer.xmlToJSON(xml);
        expect(result).toEqual(expected);
        
        const roundTrip = transformer.jsonToXML(result);
        expect(roundTrip.includes('id="123"')).toBe(true);
        expect(roundTrip.includes('category="book"')).toBe(true);
      });
      
      test('should handle attributes with namespace', () => {
        const xml = '<item xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="http://example.com">Link</item>';
        
        const result = transformer.xmlToJSON(xml);
        const attr = result.item['@attrs']['xlink:href'];
        
        expect(attr).toBeDefined();
        expect(attr['@val']).toBe('http://example.com');
        
        // In some DOM implementations, the attribute might have a namespace
        if (attr['@ns']) {
          expect(attr['@ns']).toBe('http://www.w3.org/1999/xlink');
        }
        
        const roundTrip = transformer.jsonToXML(result);
        expect(roundTrip.includes('xlink:href="http://example.com"')).toBe(true);
      });
      
      test('should handle empty attributes', () => {
        const xml = '<item empty="" zero="0">Empty value</item>';
        
        const result = transformer.xmlToJSON(xml);
        expect(result.item['@attrs'].empty['@val']).toBe('');
        expect(result.item['@attrs'].zero['@val']).toBe('0');
        
        const roundTrip = transformer.jsonToXML(result);
        expect(roundTrip.includes('empty=""')).toBe(true);
        expect(roundTrip.includes('zero="0"')).toBe(true);
      });
    });
    
    describe('Namespaces', () => {
      test('should handle namespaces', () => {
        const xml = '<x:root xmlns:x="http://example.com/ns1"><x:child>Content</x:child></x:root>';
        
        const result = transformer.xmlToJSON(xml);
        expect(result['x:root']['@ns']).toEqual('http://example.com/ns1');
        
        const child = result['x:root']['@children'][0]['x:child'];
        expect(child['@ns']).toEqual('http://example.com/ns1');
        
        const roundTrip = transformer.jsonToXML(result);
        expect(roundTrip.includes('xmlns:x="http://example.com/ns1"')).toBe(true);
      });
      
      test('should handle default namespaces', () => {
        const xml = '<root xmlns="http://example.com/default">Content</root>';
        
        const result = transformer.xmlToJSON(xml);
        expect(result['root']['@ns']).toEqual('http://example.com/default');
        
        const roundTrip = transformer.jsonToXML(result);
        expect(roundTrip.includes('xmlns="http://example.com/default"')).toBe(true);
      });
      
      test('should not include namespaces when configured', () => {
        const nsTransformer = new XMLJSONTransformer({
          preserveNamespaces: false
        });
        
        const xml = '<x:root xmlns:x="http://example.com/ns1"><x:child>Content</x:child></x:root>';
        
        const result = nsTransformer.xmlToJSON(xml);
        expect(result['x:root']['@ns']).toBeUndefined();
        
        const child = result['x:root']['@children'][0]['x:child'];
        expect(child['@ns']).toBeUndefined();
        
        const roundTrip = nsTransformer.jsonToXML(result);
        expect(roundTrip.includes('xmlns:x="http://example.com/ns1"')).toBe(false);
      });
      
      test('should strip prefixes when configured', () => {
        const prefixTransformer = new XMLJSONTransformer({
          stripPrefixes: true
        });
        
        const xml = '<x:root xmlns:x="http://example.com/ns1"><x:child>Content</x:child></x:root>';
        
        const result = prefixTransformer.xmlToJSON(xml);
        expect(result['root']).toBeDefined();
        expect(result['root']['@ns']).toEqual('http://example.com/ns1');
        
        const children = result['root']['@children'];
        expect(children[0]['child']).toBeDefined();
        
        const roundTrip = prefixTransformer.jsonToXML(result);
        // The namespace should still be preserved even if prefixes are stripped
        expect(roundTrip.includes('http://example.com/ns1')).toBe(true);
      });
      
      test('should both remove namespaces and strip prefixes when configured', () => {
        const simpleTransformer = new XMLJSONTransformer({
          preserveNamespaces: false,
          stripPrefixes: true
        });
        
        const xml = '<x:root xmlns:x="http://example.com/ns1"><x:child>Content</x:child></x:root>';
        
        const result = simpleTransformer.xmlToJSON(xml);
        expect(result['root']).toBeDefined();
        expect(result['root']['@ns']).toBeUndefined();
        
        const children = result['root']['@children'];
        expect(children[0]['child']).toBeDefined();
        expect(children[0]['child']['@ns']).toBeUndefined();
        
        const roundTrip = simpleTransformer.jsonToXML(result);
        expect(roundTrip.includes('xmlns')).toBe(false);
        expect(roundTrip.includes('<root>')).toBe(true);
        expect(roundTrip.includes('<child>')).toBe(true);
      });
      
      test('should handle multiple namespaces', () => {
        const xml = `
          <root xmlns:a="http://example.com/a" xmlns:b="http://example.com/b">
            <a:element>A content</a:element>
            <b:element>B content</b:element>
          </root>
        `;
        
        const result = transformer.xmlToJSON(xml);
        const aElement = result.root['@children'][0]['a:element'];
        const bElement = result.root['@children'][1]['b:element'];
        
        expect(aElement['@ns']).toBe('http://example.com/a');
        expect(bElement['@ns']).toBe('http://example.com/b');
        
        const roundTrip = transformer.jsonToXML(result);
        expect(roundTrip.includes('xmlns:a="http://example.com/a"')).toBe(true);
        expect(roundTrip.includes('xmlns:b="http://example.com/b"')).toBe(true);
      });
    });
    
    describe('Special node types', () => {
      test('should handle CDATA sections', () => {
        const xml = '<root><![CDATA[<b>Bold text</b>]]></root>';
        
        const result = transformer.xmlToJSON(xml);
        expect(result['root']['@cdata']).toContain('<b>Bold text</b>');
        
        const roundTrip = transformer.jsonToXML(result);
        expect(roundTrip.includes('<![CDATA[<b>Bold text</b>]]>')).toBe(true);
      });
      
      test('should handle multiple CDATA sections', () => {
        const xml = '<root><![CDATA[First section]]><![CDATA[Second section]]></root>';
        
        const result = transformer.xmlToJSON(xml);
        expect(result.root['@cdata'].length).toBe(2);
        expect(result.root['@cdata'][0]).toBe('First section');
        expect(result.root['@cdata'][1]).toBe('Second section');
        
        const roundTrip = transformer.jsonToXML(result);
        expect(roundTrip.includes('<![CDATA[First section]]>')).toBe(true);
        expect(roundTrip.includes('<![CDATA[Second section]]>')).toBe(true);
      });
      
      test('should handle comments', () => {
        const xml = '<root><!-- This is a comment --></root>';
        
        const result = transformer.xmlToJSON(xml);
        expect(result['root']['@comments']).toContain(' This is a comment ');
        
        const roundTrip = transformer.jsonToXML(result);
        expect(roundTrip.includes('<!-- This is a comment -->')).toBe(true);
      });
      
      test('should handle multiple comments', () => {
        const xml = '<root><!-- First comment --><!-- Second comment --></root>';
        
        const result = transformer.xmlToJSON(xml);
        expect(result.root['@comments'].length).toBe(2);
        expect(result.root['@comments'][0]).toBe(' First comment ');
        expect(result.root['@comments'][1]).toBe(' Second comment ');
        
        const roundTrip = transformer.jsonToXML(result);
        expect(roundTrip.includes('<!-- First comment -->')).toBe(true);
        expect(roundTrip.includes('<!-- Second comment -->')).toBe(true);
      });
      
      test('should handle processing instructions', () => {
        const xml = '<?xml version="1.0"?><root><?custom-pi data?></root>';
        
        const result = transformer.xmlToJSON(xml);
        expect(result['root']['@processing']).toContain('custom-pi data');
        
        const roundTrip = transformer.jsonToXML(result);
        expect(roundTrip.includes('<?custom-pi data?>')).toBe(true);
      });
      
      test('should handle multiple processing instructions', () => {
        const xml = '<root><?first-pi data1?><?second-pi data2?></root>';
        
        const result = transformer.xmlToJSON(xml);
        expect(result.root['@processing'].length).toBe(2);
        expect(result.root['@processing'][0]).toBe('first-pi data1');
        expect(result.root['@processing'][1]).toBe('second-pi data2');
        
        const roundTrip = transformer.jsonToXML(result);
        expect(roundTrip.includes('<?first-pi data1?>')).toBe(true);
        expect(roundTrip.includes('<?second-pi data2?>')).toBe(true);
      });
      
      test('should not preserve special nodes when configured', () => {
        const noSpecialNodesTransformer = new XMLJSONTransformer({
          preserveComments: false,
          preserveCDATA: false,
          preserveProcessingInstructions: false
        });
        
        const xml = `
          <root>
            <!-- Comment -->
            <![CDATA[CDATA content]]>
            <?pi-target data?>
            Text content
          </root>
        `;
        
        const result = noSpecialNodesTransformer.xmlToJSON(xml);
        
        expect(result.root['@comments'].length).toBe(0);
        expect(result.root['@cdata'].length).toBe(0);
        expect(result.root['@processing'].length).toBe(0);
        expect(result.root['@val']).toContain('Text content');
        
        const roundTrip = noSpecialNodesTransformer.jsonToXML(result);
        expect(roundTrip.includes('Comment')).toBe(false);
        expect(roundTrip.includes('CDATA')).toBe(false);
        expect(roundTrip.includes('pi-target')).toBe(false);
        expect(roundTrip.includes('Text content')).toBe(true);
      });
    });
    
    describe('Nested elements', () => {
      test('should handle nested elements', () => {
        const xml = '<root><child><grandchild>Content</grandchild></child></root>';
        
        const result = transformer.xmlToJSON(xml);
        const child = result['root']['@children'][0]['child'];
        expect(child).toBeDefined();
        
        const grandchild = child['@children'][0]['grandchild'];
        expect(grandchild).toBeDefined();
        expect(grandchild['@val']).toEqual('Content');
        
        const roundTrip = transformer.jsonToXML(result);
        expect(roundTrip.includes('<grandchild>Content</grandchild>')).toBe(true);
      });
      
      test('should handle deeply nested elements', () => {
        const xml = '<a><b><c><d><e>Deep</e></d></c></b></a>';
        
        const result = transformer.xmlToJSON(xml);
        
        // Navigate to the innermost element
        const b = result.a['@children'][0].b;
        const c = b['@children'][0].c;
        const d = c['@children'][0].d;
        const e = d['@children'][0].e;
        
        expect(e['@val']).toBe('Deep');
        
        const roundTrip = transformer.jsonToXML(result);
        expect(roundTrip.includes('<e>Deep</e>')).toBe(true);
      });
      
      test('should handle elements with siblings', () => {
        const xml = '<root><first>1</first><second>2</second><third>3</third></root>';
        
        const result = transformer.xmlToJSON(xml);
        const children = result.root['@children'];
        
        expect(children.length).toBe(3);
        expect(children[0].first['@val']).toBe('1');
        expect(children[1].second['@val']).toBe('2');
        expect(children[2].third['@val']).toBe('3');
        
        const roundTrip = transformer.jsonToXML(result);
        expect(roundTrip.includes('<first>1</first>')).toBe(true);
        expect(roundTrip.includes('<second>2</second>')).toBe(true);
        expect(roundTrip.includes('<third>3</third>')).toBe(true);
      });
      
      test('should handle elements with mixed siblings', () => {
        const xml = `
          <root>
            <text>Text element</text>
            <!-- Comment between elements -->
            <![CDATA[CDATA between elements]]>
            <another>Another element</another>
          </root>
        `;
        
        const result = transformer.xmlToJSON(xml);
        
        expect(result.root['@comments'].length).toBe(1);
        expect(result.root['@cdata'].length).toBe(1);
        
        const children = result.root['@children'];
        expect(children.length).toBe(2);
        expect(children[0].text['@val']).toBe('Text element');
        expect(children[1].another['@val']).toBe('Another element');
        
        const roundTrip = transformer.jsonToXML(result);
        expect(roundTrip.includes('<text>Text element</text>')).toBe(true);
        expect(roundTrip.includes('<!-- Comment between elements -->')).toBe(true);
        expect(roundTrip.includes('<![CDATA[CDATA between elements]]>')).toBe(true);
        expect(roundTrip.includes('<another>Another element</another>')).toBe(true);
      });
    });
    
    describe('Compact format', () => {
      test('should generate compact JSON output when configured', () => {
        const compactTransformer = new XMLJSONTransformer({
          outputOptions: {
            json: {
              compact: true,
              removeEmptyStrings: true
            }
          }
        });
        
        const xml = '<root><empty /><child>Content</child></root>';
        
        const result = compactTransformer.xmlToJSON(xml);
        
        // The root element should only have children
        expect(Object.keys(result.root)).toContain('@children');
        
        // Empty collections should not be present
        expect(result.root['@cdata']).toBeUndefined();
        expect(result.root['@comments']).toBeUndefined();
        expect(result.root['@processing']).toBeUndefined();
        
        // Empty strings should be removed
        expect(result.root['@val']).toBeUndefined();
        
        // Empty element should be represented minimally
        const emptyEl = result.root['@children'][0].empty;
        expect(Object.keys(emptyEl).length).toBe(0);
        
        // Element with content should have value
        const childEl = result.root['@children'][1].child;
        expect(childEl['@val']).toBe('Content');
        
        // Transform back to XML should work
        const xmlResult = compactTransformer.jsonToXML(result);
        expect(xmlResult.includes('<empty/>')).toBe(true);
        expect(xmlResult.includes('<child>Content</child>')).toBe(true);
      });
      
      test('should handle combined compact and namespace options', () => {
        const advancedTransformer = new XMLJSONTransformer({
          preserveNamespaces: false,
          stripPrefixes: true,
          outputOptions: {
            json: {
              compact: true,
              removeEmptyStrings: true
            }
          }
        });
        
        const xml = '<ns:root xmlns:ns="http://example.com"><ns:child>Content</ns:child></ns:root>';
        
        const result = advancedTransformer.xmlToJSON(xml);
        
        // Should strip prefixes
        expect(result.root).toBeDefined();
        
        // Should have minimal properties
        expect(Object.keys(result.root).length).toBeGreaterThanOrEqual(1);
        expect(Object.keys(result.root).length).toBeLessThanOrEqual(2);
        
        // Should have children
        expect(result.root['@children']).toBeDefined();
        
        // Child should also have stripped prefix
        expect(result.root['@children'][0].child).toBeDefined();
        
        // Child should have value
        expect(result.root['@children'][0].child['@val']).toBe('Content');
        
        // Should not have namespace
        expect(result.root['@ns']).toBeUndefined();
        
        // Transform back to XML should work
        const xmlResult = advancedTransformer.jsonToXML(result);
        expect(xmlResult.includes('<root>')).toBe(true);
        expect(xmlResult.includes('<child>Content</child>')).toBe(true);
        expect(xmlResult.includes('xmlns')).toBe(false);
      });
      
      test('should compact attributes as well', () => {
        const compactTransformer = new XMLJSONTransformer({
          outputOptions: {
            json: {
              compact: true,
              removeEmptyStrings: true
            }
          }
        });
        
        const xml = '<element attr1="" attr2="value"></element>';
        
        const result = compactTransformer.xmlToJSON(xml);
        
        // Empty attribute value should be removed
        expect(result.element['@attrs'].attr1?.['@val']).toBeUndefined();
        
        // Non-empty attribute value should be preserved
        expect(result.element['@attrs'].attr2['@val']).toBe('value');
        
        // Transform back to XML should still include the empty attribute
        const xmlResult = compactTransformer.jsonToXML(result);
        expect(xmlResult.includes('attr1=""')).toBe(true);
        expect(xmlResult.includes('attr2="value"')).toBe(true);
      });
    });
  
    describe('Output formatting options', () => {
      test('should respect pretty print settings for JSON', () => {
        const prettyTransformer = new XMLJSONTransformer({
          outputOptions: {
            prettyPrint: true,
            indent: 4
          }
        });
        
        const nonPrettyTransformer = new XMLJSONTransformer({
          outputOptions: {
            prettyPrint: false
          }
        });
        
        const json = { test: { value: 'content' } };
        
        const prettyString = prettyTransformer.jsonToString(json);
        const nonPrettyString = nonPrettyTransformer.jsonToString(json);
        
        expect(prettyString).toContain('\n');
        expect(prettyString).toContain('    '); // 4 spaces
        expect(nonPrettyString).not.toContain('\n');
      });
      
      test('should respect pretty print settings for XML', () => {
        const prettyTransformer = new XMLJSONTransformer({
          outputOptions: {
            prettyPrint: true,
            indent: 4
          }
        });
        
        const nonPrettyTransformer = new XMLJSONTransformer({
          outputOptions: {
            prettyPrint: false
          }
        });
        
        const xml = '<root><child>value</child></root>';
        
        const jsonObj = transformer.xmlToJSON(xml);
        
        const prettyXml = prettyTransformer.jsonToXML(jsonObj);
        const nonPrettyXml = nonPrettyTransformer.jsonToXML(jsonObj);
        
        expect(prettyXml).toContain('\n');
        expect(prettyXml).toMatch(/\n\s{4}</); // 4 spaces indentation
        expect(nonPrettyXml).not.toContain('\n');
      });
      
      test('should use a string indent for XML', () => {
        const tabTransformer = new XMLJSONTransformer({
          outputOptions: {
            prettyPrint: true,
            indent: '\t' // Tab character
          }
        });
        
        const xml = '<root><child>value</child></root>';
        const jsonObj = transformer.xmlToJSON(xml);
        
        const result = tabTransformer.jsonToXML(jsonObj);
        
        expect(result).toContain('\n\t'); // Tab indentation
      });
      
      test('should use numeric indent for JSON', () => {
        const indentTransformer = new XMLJSONTransformer({
          outputOptions: {
            prettyPrint: true,
            indent: 6 // 6 spaces
          }
        });
        
        const json = { root: { child: { value: 'test' } } };
        
        const result = indentTransformer.jsonToString(json);
        
        expect(result).toMatch(/\n {6}/); // 6 spaces indentation
      });
    });
  
    describe('Mixed Content Handling', () => {
      test('should detect mixed content', () => {
        // This is testing an internal method, but it's important for the functionality
        const parser = new DOMParser();
        const doc = parser.parseFromString('<p>Text with <b>bold</b> content</p>', 'text/xml');
        const node = doc.documentElement;
        
        expect(transformer._hasMixedContent(node)).toBe(true);
      });
      
      test('should not detect pure text content as mixed', () => {
        const parser = new DOMParser();
        const doc = parser.parseFromString('<p>Just plain text</p>', 'text/xml');
        const node = doc.documentElement;
        
        expect(transformer._hasMixedContent(node)).toBe(false);
      });
      
      test('should not detect elements-only content as mixed', () => {
        const parser = new DOMParser();
        const doc = parser.parseFromString('<p><b>Bold</b><i>Italic</i></p>', 'text/xml');
        const node = doc.documentElement;
        
        expect(transformer._hasMixedContent(node)).toBe(false);
      });
      
      test('should handle simple mixed content in transformation', () => {
        const xml = '<paragraph>This has <bold>mixed</bold> content.</paragraph>';
        
        const result = transformer.xmlToJSON(xml);
        
        // The value should contain the entire content including markup
        expect(result.paragraph['@val']).toBe('This has <bold>mixed</bold> content.');
        
        // Children array should be empty for mixed content
        expect(result.paragraph['@children'].length).toBe(0);
        
        // Transform back to XML
        const roundTrip = transformer.jsonToXML(result);
        
        // Remove whitespace for comparison
        const normalizedOriginal = xml.replace(/\s+/g, '');
        const normalizedRoundTrip = roundTrip.replace(/\s+/g, '');
        
        expect(normalizedRoundTrip).toBe(normalizedOriginal);
      });
      
      test('should handle complex mixed content', () => {
        const xml = `
          <article>
            <p>This paragraph has <em>emphasized</em> text and <strong>strong</strong> text mixed with regular text.</p>
            <p>Another paragraph with <a href="https://example.com">a link</a> in the middle.</p>
          </article>
        `;
        
        const result = transformer.xmlToJSON(xml);
        
        // The <p> elements should be processed as mixed content
        const paragraphs = result.article['@children'];
        expect(paragraphs.length).toBe(2);
        
        const firstP = paragraphs[0].p;
        const secondP = paragraphs[1].p;
        
        // Check that the paragraphs contain the markup
        expect(firstP['@val']).toContain('<em>emphasized</em>');
        expect(firstP['@val']).toContain('<strong>strong</strong>');
        expect(secondP['@val']).toContain('<a href="https://example.com">a link</a>');
        
        // Transform back to XML
        const roundTrip = transformer.jsonToXML(result);
        
        // Verify the transformed XML contains the same elements
        expect(roundTrip).toContain('<em>emphasized</em>');
        expect(roundTrip).toContain('<strong>strong</strong>');
        expect(roundTrip).toContain('<a href="https://example.com">a link</a>');
      });
      
      test('should handle nested mixed content', () => {
        const xml = `
          <div>
            Outside text
            <p>Paragraph with <em>emphasis</em> and <span>span with <strong>nested</strong> elements</span> inside.</p>
            More outside text
          </div>
        `;
        
        const result = transformer.xmlToJSON(xml);
        
        // The div should have mixed content
        expect(result.div['@val']).toContain('Outside text');
        expect(result.div['@val']).toContain('More outside text');
        
        // The div should contain the p element with its mixed content
        expect(result.div['@val']).toContain('<p>Paragraph with');
        expect(result.div['@val']).toContain('<em>emphasis</em>');
        expect(result.div['@val']).toContain('<span>span with <strong>nested</strong> elements</span>');
        
        // Transform back to XML
        const roundTrip = transformer.jsonToXML(result);
        
        // Verify nested elements are preserved
        expect(roundTrip).toContain('<p>Paragraph with');
        expect(roundTrip).toContain('<em>emphasis</em>');
        expect(roundTrip).toContain('<span>span with <strong>nested</strong> elements</span>');
      });
      
      test('should handle mixed content with attributes', () => {
        const xml = '<content>Text with <element id="123" class="special">Element</element> having attributes.</content>';
        
        const result = transformer.xmlToJSON(xml);