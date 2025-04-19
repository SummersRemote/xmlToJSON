/**
 * XMLJSONTransformer Browser Demo
 */
import XMLJSONTransformer from '../dist/index.js';

document.addEventListener('DOMContentLoaded', () => {
  // Sample definitions
  const samples = {
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

  // Predefined transformer functions
  const transformers = {
    none: null,
    uppercase: (val, context) => {
      return typeof val === 'string' ? val.toUpperCase() : val;
    },
    lowercase: (val, context) => {
      return typeof val === 'string' ? val.toLowerCase() : val;
    },
    custom: null // Will be set from textarea
  };

  // Initialize the demo
  // Set default sample
  document.getElementById('xml-input').value = samples.library.xml;
  updateCurrentConfig();
  
  // Configuration toggle
  const configToggleBtn = document.getElementById('toggle-config');
  const configPanel = document.querySelector('.config-panel');
  
  configToggleBtn.addEventListener('click', () => {
    const isVisible = configPanel.style.display !== 'none';
    configPanel.style.display = isVisible ? 'none' : 'block';
    configToggleBtn.textContent = isVisible ? 'Show Configuration Options' : 'Hide Configuration Options';
  });
  
  // Transform function selector
  const transformSelector = document.getElementById('transform-selector');
  const customTransformContainer = document.getElementById('custom-transform-container');
  
  transformSelector.addEventListener('change', (event) => {
    const selectedTransform = event.target.value;
    if (selectedTransform === 'custom') {
      customTransformContainer.style.display = 'block';
    } else {
      customTransformContainer.style.display = 'none';
    }
    
    // Update configuration
    updateCurrentConfig(getConfig());
  });
  
  // Sample selector event listener
  document.getElementById('sample-selector').addEventListener('change', (event) => {
    const selectedSample = event.target.value;
    if (selectedSample && samples[selectedSample]) {
      document.getElementById('xml-input').value = samples[selectedSample].xml;
      document.getElementById('json-output').value = '';
    }
  });
  
  // XML to JSON conversion
  document.getElementById('xml-to-json').addEventListener('click', () => {
    try {
      const config = getConfig();
      const transformer = new XMLJSONTransformer(config);
      const xmlInput = document.getElementById('xml-input').value;
      const jsonOutput = transformer.xmlToJSON(xmlInput);
      document.getElementById('json-output').value = JSON.stringify(jsonOutput, null, 2);
      updateCurrentConfig(config);
    } catch (error) {
      showError('Error converting XML to JSON: ' + error.message);
    }
  });
  
  // JSON to XML conversion
  document.getElementById('json-to-xml').addEventListener('click', () => {
    try {
      const config = getConfig();
      const transformer = new XMLJSONTransformer(config);
      const jsonInput = document.getElementById('json-output').value;
      const jsonObj = JSON.parse(jsonInput);
      const xmlOutput = transformer.jsonToXML(jsonObj);
      document.getElementById('xml-input').value = xmlOutput;
      updateCurrentConfig(config);
    } catch (error) {
      showError('Error converting JSON to XML: ' + error.message);
    }
  });
  
  // Reset
  document.getElementById('reset').addEventListener('click', () => {
    const selectElement = document.getElementById('sample-selector');
    const selectedSample = selectElement.value;
    if (selectedSample && samples[selectedSample]) {
      document.getElementById('xml-input').value = samples[selectedSample].xml;
    } else {
      document.getElementById('xml-input').value = samples.library.xml;
      selectElement.value = 'library';
    }
    document.getElementById('json-output').value = '';
  });
  
  // Configuration checkboxes and inputs - update current config on change
  document.querySelectorAll('.config-panel input, .config-panel select, .config-panel textarea').forEach(input => {
    input.addEventListener('change', () => {
      updateCurrentConfig(getConfig());
    });
  });
  
  // Helper function to get configuration from UI
  function getConfig() {
    const transformType = document.getElementById('transform-selector').value;
    let transformFunction = transformers[transformType];
    
    // Handle custom transform function
    if (transformType === 'custom') {
      const customCode = document.getElementById('transform-function').value.trim();
      if (customCode) {
        try {
          // Use Function constructor to create a function from the string
          transformFunction = new Function('value', 'context', 'return ' + customCode);
        } catch (error) {
          showError('Error in custom transform function: ' + error.message);
          transformFunction = null;
        }
      }
    }
    
    return {
      // Features to preserve
      preserveNamespaces: document.getElementById('preserve-namespaces').checked,
      preserveComments: document.getElementById('preserve-comments').checked,
      preserveProcessingInstr: document.getElementById('preserve-pis').checked,
      preserveCDATA: document.getElementById('preserve-cdata').checked,
      preserveTextNodes: document.getElementById('preserve-text-nodes').checked,
      preserveWhitespace: document.getElementById('preserve-whitespace').checked,
      
      // Type conversion options
      grokBoolean: document.getElementById('grok-boolean').checked,
      grokNumber: document.getElementById('grok-number').checked,
      
      // Transform function
      transformFunction: transformFunction,
      
      // Element name handling
      stripPrefixes: document.getElementById('strip-prefixes').checked,
      
      // Output options
      outputOptions: {
        prettyPrint: document.getElementById('pretty-print').checked,
        indent: parseInt(document.getElementById('indent').value, 10),
        
        // JSON-specific options
        json: {
          compact: document.getElementById('compact-json').checked,
          removeEmptyStrings: document.getElementById('remove-empty-strings').checked
        },
        
        // XML-specific options
        xml: {
          declaration: document.getElementById('xml-declaration').checked
        }
      },
      
      // Property names
      propNames: {
        namespace: document.getElementById('namespace-prop').value,
        value: document.getElementById('value-prop').value,
        attributes: document.getElementById('attributes-prop').value,
        cdata: document.getElementById('cdata-prop').value,
        comments: document.getElementById('comments-prop').value,
        processing: document.getElementById('processing-prop').value,
        children: document.getElementById('children-prop').value
      }
    };
  }
  
  // Helper function to update current config display
  function updateCurrentConfig(config) {
    const configElement = document.getElementById('current-config');
    if (!config) {
      config = getConfig();
    }
    
    // Create a copy to prevent circular references when trying to stringify
    const configCopy = JSON.parse(JSON.stringify(config));
    
    // Add placeholder for transform function if it exists
    if (config.transformFunction) {
      const transformType = document.getElementById('transform-selector').value;
      if (transformType === 'custom') {
        configCopy.transformFunction = document.getElementById('transform-function').value;
      } else {
        configCopy.transformFunction = `[Function: ${transformType}]`;
      }
    }
    
    configElement.textContent = JSON.stringify(configCopy, null, 2);
  }
  
  // Helper function to show errors
  function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    document.querySelector('.container').appendChild(errorDiv);
    
    // Remove error after 5 seconds
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }
  
  // Function to load samples from external files
  async function loadExternalSamples() {
    try {
      const response = await fetch('samples/index.json');
      if (!response.ok) {
        throw new Error('Failed to load samples index');
      }
      
      const sampleIndex = await response.json();
      const selector = document.getElementById('sample-selector');
      
      // Clear existing options except the default ones
      const defaultOptions = Array.from(selector.options).slice(0, 7); // Keep the first 7 options
      selector.innerHTML = '';
      defaultOptions.forEach(option => selector.appendChild(option));
      
      // Add external samples
      for (const sample of sampleIndex.samples) {
        const option = document.createElement('option');
        option.value = `external:${sample.id}`;
        option.textContent = sample.name;
        selector.appendChild(option);
      }
      
      // Update selection handler
      selector.removeEventListener('change', selectorChangeHandler);
      selector.addEventListener('change', selectorChangeHandler);
    } catch (error) {
      console.error('Error loading external samples:', error);
      // Silently fail - user can still use built-in samples
    }
  }
  
  // Sample selector change handler (defined separately for removeEventListener)
  async function selectorChangeHandler(event) {
    const selectedValue = event.target.value;
    
    // Handle built-in samples
    if (selectedValue && !selectedValue.startsWith('external:') && samples[selectedValue]) {
      document.getElementById('xml-input').value = samples[selectedValue].xml;
      document.getElementById('json-output').value = '';
      return;
    }
    
    // Handle external samples
    if (selectedValue && selectedValue.startsWith('external:')) {
      const sampleId = selectedValue.split(':')[1];
      try {
        const sampleResponse = await fetch(`samples/${sampleId}.xml`);
        if (!sampleResponse.ok) {
          throw new Error(`Failed to load sample ${sampleId}`);
        }
        
        const sampleXml = await sampleResponse.text();
        document.getElementById('xml-input').value = sampleXml;
        document.getElementById('json-output').value = '';
      } catch (error) {
        showError(`Error loading external sample: ${error.message}`);
      }
    }
  }
  
  // Try to load external samples
  loadExternalSamples().catch(error => console.error('Error in loadExternalSamples:', error));
});