/**
 * XMLJSONTransformer Browser Demo
 */
import XMLJSONTransformer from '../dist/index.js';
import samples from './samples.js';

document.addEventListener('DOMContentLoaded', () => {
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
      
      // Strip prefixes option removed from configuration
      
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
        prefix: document.getElementById('prefix-prop').value,
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