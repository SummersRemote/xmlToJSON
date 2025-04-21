/**
 * XMLJSONTransformer Browser Demo
 */
import XMLJSONTransformer from '../dist/index.js';
import samples from './samples.js';

document.addEventListener('DOMContentLoaded', () => {
  // Keep track of added transformers
  const transformers = [];
  let transformerIdCounter = 0;
  
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
  
  // Transformer type selector logic
  const transformerTypeSelector = document.getElementById('add-transformer-type');
  const booleanOptions = document.getElementById('boolean-options');
  const numberOptions = document.getElementById('number-options');
  const customOptions = document.getElementById('custom-options');
  
  transformerTypeSelector.addEventListener('change', () => {
    const selectedType = transformerTypeSelector.value;
    // Hide all option panels
    booleanOptions.style.display = 'none';
    numberOptions.style.display = 'none';
    customOptions.style.display = 'none';
    
    // Show the selected option panel
    if (selectedType === 'boolean') {
      booleanOptions.style.display = 'block';
    } else if (selectedType === 'number') {
      numberOptions.style.display = 'block';
    } else if (selectedType === 'custom') {
      customOptions.style.display = 'block';
    }
  });
  
  // Add transformer button logic
  document.getElementById('add-transformer-btn').addEventListener('click', () => {
    const selectedType = transformerTypeSelector.value;
    const transformerId = transformerIdCounter++;
    let transformerName = '';
    let transformerConfig = null;
    
    if (selectedType === 'boolean') {
      const trueValues = document.getElementById('boolean-true-values').value.split(',').map(v => v.trim());
      const falseValues = document.getElementById('boolean-false-values').value.split(',').map(v => v.trim());
      transformerName = 'Boolean Transformer';
      transformerConfig = {
        type: 'boolean',
        options: {
          trueValues,
          falseValues
        }
      };
    } else if (selectedType === 'number') {
      transformerName = 'Number Transformer';
      transformerConfig = {
        type: 'number'
      };
    } else if (selectedType === 'custom') {
      const customCode = document.getElementById('custom-function').value.trim();
      if (!customCode) {
        showError('Please enter a custom transform function');
        return;
      }
      
      transformerName = 'Custom Transformer';
      transformerConfig = {
        type: 'custom',
        code: customCode
      };
    }
    
    // Add transformer to the list
    transformers.push({
      id: transformerId,
      name: transformerName,
      config: transformerConfig
    });
    
    // Update the UI
    updateTransformerList();
    updateCurrentConfig();
  });
  
  // Function to update the transformer list in the UI
  function updateTransformerList() {
    const transformList = document.getElementById('transform-list');
    const noTransformsMessage = document.getElementById('no-transforms-message');
    
    // Clear the list
    while (transformList.firstChild) {
      transformList.removeChild(transformList.firstChild);
    }
    
    if (transformers.length === 0) {
      // If no transformers, show the message
      transformList.appendChild(noTransformsMessage);
      return;
    }
    
    // Add each transformer to the list
    transformers.forEach((transformer, index) => {
      const transformItem = document.createElement('div');
      transformItem.className = 'transform-item';
      
      const nameSpan = document.createElement('span');
      nameSpan.textContent = `${index + 1}. ${transformer.name}`;
      
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'transform-actions';
      
      const moveUpBtn = document.createElement('button');
      moveUpBtn.textContent = '↑';
      moveUpBtn.title = 'Move Up';
      moveUpBtn.disabled = index === 0;
      moveUpBtn.addEventListener('click', () => {
        if (index > 0) {
          // Swap with the previous transformer
          [transformers[index], transformers[index - 1]] = [transformers[index - 1], transformers[index]];
          updateTransformerList();
          updateCurrentConfig();
        }
      });
      
      const moveDownBtn = document.createElement('button');
      moveDownBtn.textContent = '↓';
      moveDownBtn.title = 'Move Down';
      moveDownBtn.disabled = index === transformers.length - 1;
      moveDownBtn.addEventListener('click', () => {
        if (index < transformers.length - 1) {
          // Swap with the next transformer
          [transformers[index], transformers[index + 1]] = [transformers[index + 1], transformers[index]];
          updateTransformerList();
          updateCurrentConfig();
        }
      });
      
      const removeBtn = document.createElement('button');
      removeBtn.textContent = '✕';
      removeBtn.title = 'Remove';
      removeBtn.addEventListener('click', () => {
        transformers.splice(index, 1);
        updateTransformerList();
        updateCurrentConfig();
      });
      
      actionsDiv.appendChild(moveUpBtn);
      actionsDiv.appendChild(moveDownBtn);
      actionsDiv.appendChild(removeBtn);
      
      transformItem.appendChild(nameSpan);
      transformItem.appendChild(actionsDiv);
      
      transformList.appendChild(transformItem);
    });
  }
  
  // Sample selector event listener
  document.getElementById('sample-selector').addEventListener('change', (event) => {
    const selectedSample = event.target.value;
    if (selectedSample && samples[selectedSample]) {
      document.getElementById('xml-input').value = samples[selectedSample].xml;
      document.getElementById('json-output').value = '';
    }
  });
  
  // Create transformer instances for XMLJSONTransformer
  function createTransformerInstances() {
    return transformers.map(transformer => {
      if (transformer.config.type === 'boolean') {
        return new BooleanTransformer(transformer.config.options);
      } else if (transformer.config.type === 'number') {
        return new NumberTransformer();
      } else if (transformer.config.type === 'custom') {
        return new CustomTransformer(transformer.config.code);
      }
      return null;
    }).filter(t => t !== null);
  }
  
  // Helper class for Boolean Transformer
  class BooleanTransformer {
    constructor(options = {}) {
      this.trueValues = options.trueValues || ['true'];
      this.falseValues = options.falseValues || ['false'];
      this.trueValuesLower = this.trueValues.map(v => String(v).toLowerCase());
      this.falseValuesLower = this.falseValues.map(v => String(v).toLowerCase());
    }
    
    process(value, context = {}) {
      const direction = context.direction || 'xml-to-json';
      
      if (direction === 'xml-to-json') {
        if (typeof value !== 'string') return value;
        const valueLower = value.toLowerCase();
        
        if (this.trueValuesLower.includes(valueLower)) {
          return true;
        }
        
        if (this.falseValuesLower.includes(valueLower)) {
          return false;
        }
      } 
      else if (direction === 'json-to-xml') {
        if (typeof value !== 'boolean') return value;
        return String(value);
      }
      
      return value;
    }
  }
  
  // Helper class for Number Transformer
  class NumberTransformer {
    process(value, context = {}) {
      const direction = context.direction || 'xml-to-json';
      
      if (direction === 'xml-to-json') {
        if (typeof value !== 'string' || value === '') return value;
        
        // Clean value (remove thousands separators)
        const cleanValue = value.replace(/,(?=\d{3})/g, '');
        
        // Check if it matches number patterns
        const isNumber = 
          /^[-+]?[\d]+$/.test(cleanValue) || 
          /^[-+]?[\d]*\.[\d]+$/.test(cleanValue) || 
          /^[-+]?[\d]*\.?[\d]*[eE][-+]?[\d]+$/.test(cleanValue);
            
        if (isNumber) {
          try {
            return parseFloat(cleanValue);
          } catch (e) {
            return value;
          }
        }
      } 
      else if (direction === 'json-to-xml') {
        if (typeof value === 'number') {
          return String(value);
        }
      }
      
      return value;
    }
  }
  
  // Helper class for Custom Transformer
  class CustomTransformer {
    constructor(code) {
      try {
        this.transformFn = new Function('value', 'context', code);
      } catch (error) {
        console.error('Error creating custom transformer:', error);
        this.transformFn = (value) => value;
      }
    }
    
    process(value, context = {}) {
      try {
        return this.transformFn(value, context);
      } catch (error) {
        console.error('Error in custom transformer:', error);
        return value;
      }
    }
  }
  
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
    // Create value transforms
    const valueTransforms = createTransformerInstances();
    
    return {
      // Features to preserve
      preserveNamespaces: document.getElementById('preserve-namespaces').checked,
      preserveComments: document.getElementById('preserve-comments').checked,
      preserveProcessingInstr: document.getElementById('preserve-pis').checked,
      preserveCDATA: document.getElementById('preserve-cdata').checked,
      preserveTextNodes: document.getElementById('preserve-text-nodes').checked,
      preserveWhitespace: document.getElementById('preserve-whitespace').checked,
      
      // Value transforms
      valueTransforms: valueTransforms,
      
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
    const configCopy = { ...config };
    
    // Handle value transforms display
    if (config.valueTransforms && config.valueTransforms.length > 0) {
      configCopy.valueTransforms = transformers.map(t => {
        const { id, ...rest } = t;
        return rest;
      });
    } else {
      configCopy.valueTransforms = [];
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
  
  // Initialize transformer type selector to show first option
  transformerTypeSelector.dispatchEvent(new Event('change'));
  
  // Function to load samples from external files (if available)
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
      selector.addEventListener('change', async (event) => {
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
      });
    } catch (error) {
      console.error('Error loading external samples:', error);
      // Silently fail - user can still use built-in samples
    }
  }
  
  // Try to load external samples
  loadExternalSamples().catch(error => console.error('Error in loadExternalSamples:', error));
});