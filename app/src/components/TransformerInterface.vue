<template>
    <div class="transformer-interface">
      <h2>XML/JSON Transformer</h2>
      
      <div class="editor-container">
        <div class="input-editor">
          <div class="editor-header">
            <h3>Input</h3>
            <div class="type-toggle">
              <button 
                @click="inputType = 'xml'" 
                :class="{ active: inputType === 'xml' }"
                class="toggle-btn"
              >XML</button>
              <button 
                @click="inputType = 'json'" 
                :class="{ active: inputType === 'json' }"
                class="toggle-btn"
              >JSON</button>
            </div>
          </div>
          
          <textarea 
            v-model="inputText" 
            :placeholder="inputPlaceholder"
            class="code-editor"
          ></textarea>
          
          <div class="editor-actions">
            <button @click="clearInput" class="action-btn clear-btn">Clear</button>
            <button @click="loadSample" class="action-btn sample-btn">Load Sample</button>
            <button @click="transform" class="action-btn transform-btn">Transform →</button>
          </div>
        </div>
        
        <div class="output-editor">
          <div class="editor-header">
            <h3>Output</h3>
            <div class="type-display">
              {{ outputType.toUpperCase() }}
            </div>
          </div>
          
          <textarea 
            v-model="outputText" 
            placeholder="Transformation output will appear here..." 
            class="code-editor" 
            readonly
          ></textarea>
          
          <div class="editor-actions">
            <button @click="copyOutput" class="action-btn copy-btn">Copy</button>
            <button @click="clearOutput" class="action-btn clear-btn">Clear</button>
            <button @click="swapContent" class="action-btn swap-btn">← Use as Input</button>
          </div>
        </div>
      </div>
      
      <div v-if="errorMessage" class="error-message">
        <p>{{ errorMessage }}</p>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue'
  import { useConfig } from '../composables/useConfig'
  // Import the XMLJSONTransformer directly as an ES module
  import XMLJSONTransformer from '../../../dist'
  
  // Reference to the config
  const { config } = useConfig()
  
  // State variables
  const inputType = ref('xml') // Default to XML input
  const inputText = ref('')
  const outputText = ref('')
  const errorMessage = ref('')
  
  // Compute the output type based on input type
  const outputType = computed(() => inputType.value === 'xml' ? 'json' : 'xml')
  
  // Compute appropriate placeholder based on input type
  const inputPlaceholder = computed(() => {
    if (inputType.value === 'xml') {
      return 'Enter XML here...\nExample: <root><child>Hello World</child></root>'
    } else {
      return 'Enter JSON here...\nMake sure it follows the XMLJSONTransformer format.'
    }
  })
  
  // Sample data for XML and JSON
  const sampleData = {
    xml: `<?xml version="1.0" encoding="UTF-8"?>
  <root>
    <!-- This is a comment -->
    <child id="123" type="example">
      <name>Sample Child</name>
      <value>42</value>
      <description>A simple test element</description>
    </child>
  </root>`,
    json: `{
    "root": {
      "@ns": "",
      "@val": "",
      "@attrs": {},
      "@comments": ["This is a comment"],
      "@children": [
        {
          "child": {
            "@ns": "",
            "@val": "",
            "@attrs": {
              "id": {
                "@val": "123",
                "@ns": ""
              },
              "type": {
                "@val": "example",
                "@ns": ""
              }
            },
            "@children": [
              {
                "name": {
                  "@ns": "",
                  "@val": "Sample Child",
                  "@attrs": {}
                }
              },
              {
                "value": {
                  "@ns": "",
                  "@val": "42",
                  "@attrs": {}
                }
              },
              {
                "description": {
                  "@ns": "",
                  "@val": "A simple test element",
                  "@attrs": {}
                }
              }
            ]
          }
        }
      ]
    }
  }`
  }
  
  // Function to transform the input
  const transform = () => {
    if (!inputText.value.trim()) {
      errorMessage.value = 'Please enter some input text to transform.'
      return
    }
    
    errorMessage.value = '' // Clear any previous errors
    
    try {
      // Create a new transformer with the current configuration
      const transformer = new XMLJSONTransformer(config)
      
      if (inputType.value === 'xml') {
        // Transform XML to JSON
        const result = transformer.xmlToJSON(inputText.value)
        outputText.value = transformer.jsonToString(result)
      } else {
        // Transform JSON to XML
        let jsonInput;
        try {
          jsonInput = JSON.parse(inputText.value)
        } catch (e) {
          errorMessage.value = 'Invalid JSON: ' + e.message
          return
        }
        outputText.value = transformer.jsonToXML(jsonInput)
      }
    } catch (error) {
      errorMessage.value = `Transformation error: ${error.message}`
      console.error(error)
    }
  }
  
  // Function to load a sample based on the current input type
  const loadSample = () => {
    inputText.value = sampleData[inputType.value]
  }
  
  // Function to clear the input
  const clearInput = () => {
    inputText.value = ''
  }
  
  // Function to clear the output
  const clearOutput = () => {
    outputText.value = ''
  }
  
  // Function to copy output to clipboard
  const copyOutput = () => {
    if (!outputText.value) return
    
    // Create a temporary textarea element
    const textarea = document.createElement('textarea')
    textarea.value = outputText.value
    document.body.appendChild(textarea)
    
    // Select and copy the text
    textarea.select()
    document.execCommand('copy')
    
    // Clean up
    document.body.removeChild(textarea)
    
    // Could add a tooltip or notification here to confirm copy
  }
  
  // Function to swap output to input
  const swapContent = () => {
    if (!outputText.value) return
    
    inputText.value = outputText.value
    outputText.value = ''
    inputType.value = outputType.value
  }
  </script>
  
  <style scoped>
  .transformer-interface {
    width: 100%;
  }
  
  h2 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    color: var(--secondary-color);
  }
  
  .editor-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-bottom: 1rem;
  }
  
  .input-editor, .output-editor {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  
  .editor-header h3 {
    margin: 0;
    color: var(--primary-color);
    font-weight: 500;
  }
  
  .type-toggle, .type-display {
    background-color: var(--light-gray);
    border-radius: 4px;
    padding: 0.25rem;
  }
  
  .type-display {
    font-weight: 600;
    color: var(--primary-color);
    padding: 0.35rem 0.75rem;
  }
  
  .toggle-btn {
    background: none;
    border: none;
    padding: 0.25rem 0.5rem;
    cursor: pointer;
    border-radius: 3px;
    font-weight: 500;
  }
  
  .toggle-btn.active {
    background-color: var(--primary-color);
    color: white;
  }
  
  .code-editor {
    flex-grow: 1;
    min-height: 400px;
    padding: 1rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-family: 'Courier New', Courier, monospace;
    font-size: 0.9rem;
    line-height: 1.4;
    resize: vertical;
  }
  
  .editor-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 1rem;
  }
  
  .action-btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .transform-btn {
    background-color: var(--primary-color);
    color: white;
  }
  
  .transform-btn:hover {
    background-color: #2980b9;
  }
  
  .clear-btn {
    background-color: var(--light-gray);
    color: var(--text-secondary);
  }
  
  .sample-btn {
    background-color: var(--light-gray);
    color: var(--text-secondary);
  }
  
  .copy-btn {
    background-color: var(--success-color);
    color: white;
  }
  
  .copy-btn:hover {
    background-color: #27ae60;
  }
  
  .swap-btn {
    background-color: var(--primary-color);
    color: white;
  }
  
  .swap-btn:hover {
    background-color: #2980b9;
  }
  
  .error-message {
    background-color: #f8d7da;
    color: #721c24;
    padding: 0.75rem 1.25rem;
    border-radius: 4px;
    margin-top: 1rem;
  }
  
  @media (max-width: 900px) {
    .editor-container {
      grid-template-columns: 1fr;
    }
    
    .code-editor {
      min-height: 300px;
    }
  }
  </style>