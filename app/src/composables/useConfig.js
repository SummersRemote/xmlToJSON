import { reactive } from 'vue'

// Default configuration to use for resets
const defaultConfig = {
  preserveNamespaces: true,
  preserveComments: true,
  preserveProcessingInstr: true,
  preserveCDATA: true,
  preserveTextNodes: true,
  preserveWhitespace: false,
  outputOptions: {
    prettyPrint: true,
    indent: 3,
    json: {
      compact: true,
      removeEmptyStrings: true
    },
    xml: {
      declaration: true
    }
  },
  propNames: {
    namespace: '@ns',
    prefix: '@prefix',
    value: '@val',
    attributes: '@attrs',
    cdata: '@cdata',
    comments: '@comments',
    processing: '@processing',
    children: '@children'
  },
  valueTransformers: []
}

// Create a reactive config object
const config = reactive({...defaultConfig})

export function useConfig() {
  // Function to reset config to defaults
  const resetConfig = () => {
    // Clear all properties
    Object.keys(config).forEach(key => {
      delete config[key]
    })
    
    // Copy the defaults back in
    Object.entries(defaultConfig).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        config[key] = JSON.parse(JSON.stringify(value)) // Deep copy
      } else {
        config[key] = value
      }
    })
  }
  
  return { config, resetConfig }
}