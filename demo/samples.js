/**
 * XML samples for XMLJSONTransformer demo
 */
export const samples = {
    library: {
      name: "Library Catalog",
      description: "XML example with namespaces, comments, CDATA and processing instructions",
      xml: `<?xml version="1.0" encoding="UTF-8"?>
  <library xmlns:book="http://example.org/book">
    <!-- This is a library catalog -->
    <book:book id="123" available="true">
      <book:title>JavaScript: The Good Parts</book:title>
      <book:author>Douglas Crockford</book:author>
      <book:year>2008</book:year>
      <book:genre>Programming</book:genre>
      <book:description><![CDATA[This book provides a developer's view of the language, from optional semicolons to prototypes.]]></book:description>
    </book:book>
    <book:book id="456" available="false">
      <book:title>Clean Code</book:title>
      <book:author>Robert C. Martin</book:author>
      <book:year>2008</book:year>
      <book:genre>Programming</book:genre>
      <book:description><![CDATA[A handbook of agile software craftsmanship.]]></book:description>
    </book:book>
    <?xml-stylesheet type="text/css" href="style.css"?>
  </library>`
    },
    soap: {
      name: "SOAP Message",
      description: "XML example with multiple namespaces and nested elements",
      xml: `<?xml version="1.0" encoding="UTF-8"?>
  <soap:Envelope 
      xmlns:soap="http://www.w3.org/2003/05/soap-envelope" 
      xmlns:m="http://www.example.org/stock"
      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <soap:Header>
      <m:transaction xsi:type="m:Transaction" soap:mustUnderstand="true">
        <m:transactionID>1234</m:transactionID>
      </m:transaction>
    </soap:Header>
    <soap:Body>
      <m:getStockPrice>
        <m:stockName>IBM</m:stockName>
      </m:getStockPrice>
    </soap:Body>
  </soap:Envelope>`
    },
    mixed: {
      name: "Mixed Content",
      description: "XML with mixed content (text and elements mixed)",
      xml: `<article>
    <p>This paragraph has <em>emphasized</em> text and <strong>strong</strong> text mixed with regular text.</p>
    <p>Another paragraph with <a href="https://example.com">a link</a> in the middle.</p>
    <ul>
      <li>Item with <em>emphasized</em> text</li>
      <li>Plain item</li>
    </ul>
  </article>`
    },
    rss: {
      name: "RSS Feed",
      description: "Example RSS 2.0 feed",
      xml: `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0">
    <channel>
      <title>Example RSS Feed</title>
      <link>https://example.com</link>
      <description>This is an example RSS feed</description>
      <language>en-us</language>
      <lastBuildDate>Mon, 01 Jul 2023 12:00:00 GMT</lastBuildDate>
      <item>
        <title>First Article</title>
        <link>https://example.com/first-article</link>
        <description><![CDATA[This is the description of the first article with <b>bold text</b>]]></description>
        <pubDate>Mon, 01 Jul 2023 10:00:00 GMT</pubDate>
        <guid>https://example.com/first-article</guid>
      </item>
      <item>
        <title>Second Article</title>
        <link>https://example.com/second-article</link>
        <description><![CDATA[This is the description of the second article with <a href="#">a link</a>]]></description>
        <pubDate>Mon, 01 Jul 2023 11:00:00 GMT</pubDate>
        <guid>https://example.com/second-article</guid>
      </item>
    </channel>
  </rss>`
    },
    svg: {
      name: "SVG Graphic",
      description: "Scalable Vector Graphics example",
      xml: `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
    <!-- Simple SVG Example -->
    <rect x="10" y="10" width="80" height="80" fill="#3498db" stroke="#2c3e50" stroke-width="2" />
    <circle cx="50" cy="50" r="30" fill="#e74c3c" />
    <text x="50" y="50" font-family="Arial" font-size="12" text-anchor="middle" fill="white">SVG Text</text>
  </svg>`
    },
    atom: {
      name: "Atom Feed",
      description: "Example Atom 1.0 feed",
      xml: `<?xml version="1.0" encoding="UTF-8"?>
  <feed xmlns="http://www.w3.org/2005/Atom">
    <title>Example Atom Feed</title>
    <link href="https://example.com/"/>
    <updated>2023-07-01T12:00:00Z</updated>
    <author>
      <name>John Doe</name>
      <email>john@example.com</email>
    </author>
    <id>urn:uuid:60a76c80-d399-11d9-b91C-0003939e0af6</id>
    
    <entry>
      <title>First Entry</title>
      <link href="https://example.com/first-entry"/>
      <id>urn:uuid:1225c695-cfb8-4ebb-aaaa-80da344efa6a</id>
      <updated>2023-07-01T10:00:00Z</updated>
      <summary>Summary of the first entry</summary>
      <content type="html"><![CDATA[<p>This is the content of the <em>first</em> entry.</p>]]></content>
    </entry>
    
    <entry>
      <title>Second Entry</title>
      <link href="https://example.com/second-entry"/>
      <id>urn:uuid:1225c695-cfb8-4ebb-bbbb-80da344efa6a</id>
      <updated>2023-07-01T11:00:00Z</updated>
      <summary>Summary of the second entry</summary>
      <content type="html"><![CDATA[<p>This is the content of the <strong>second</strong> entry.</p>]]></content>
    </entry>
  </feed>`
    }
  };
  
  export default samples;