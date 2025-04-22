// src/composables/useConfig.js
import { reactive } from 'vue';
import XMLJSONTransformer from '../../../dist';

// Import transformers correctly
// Note: You may need to adjust these import paths based on your actual project structure
import BooleanTransformer from '../../../src/core/transformers/BooleanTransformer.js';
import NumberTransformer from '../../../src/core/transformers/NumberTransformer.js';
import StringReplaceTransformer from '../../../src/core/transformers/StringReplaceTransformer.js';

// Default configuration with UI-friendly transformer configs
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
  // This is the UI configuration for transformers
  valueTransformerConfigs: []
};

// Create a reactive config object for the UI
const config = reactive({...defaultConfig});

// Function to create transformer instances from configs
function createTransformerInstances(transformerConfigs) {
  if (!transformerConfigs || !Array.isArray(transformerConfigs)) {
    console.warn('No transformer configs provided or invalid format');
    return [];
  }
  
  return transformerConfigs
    .map(config => {
      // Ensure config has the expected structure
      if (!config || !config.type || !config.options) {
        console.error("Invalid transformer config:", config);
        return null;
      }
      
      try {
        // Create the appropriate transformer instance
        switch (config.type) {
          case 'BooleanTransformer':
            return new BooleanTransformer(config.options);
          case 'NumberTransformer':
            return new NumberTransformer(config.options);
          case 'StringReplaceTransformer':
            return new StringReplaceTransformer(config.options);
          default:
            console.warn(`Unknown transformer type: ${config.type}`);
            return null;
        }
      } catch (error) {
        console.error(`Error creating transformer (${config.type}):`, error);
        return null;
      }
    })
    .filter(Boolean); // Remove any null values
}

export function useConfig() {
  // Function to reset config to defaults
  const resetConfig = () => {
    // Clear all properties
    Object.keys(config).forEach(key => {
      delete config[key];
    });
    
    // Copy the defaults back in
    Object.entries(defaultConfig).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        config[key] = JSON.parse(JSON.stringify(value)); // Deep copy
      } else {
        config[key] = value;
      }
    });
  };
  
  // Function to create an XMLJSONTransformer with the current config
  const createTransformer = () => {
    // Create a copy of the config without the UI-specific parts
    const transformerConfig = { ...config };
    
    // Create actual transformer instances from the configs
    const transformerInstances = createTransformerInstances(config.valueTransformerConfigs);
    console.log('Created transformer instances:', transformerInstances);
    
    // Set the valueTransforms property
    transformerConfig.valueTransforms = transformerInstances;
    
    // Remove the UI-only property
    delete transformerConfig.valueTransformerConfigs;
    
    // Create and return the transformer
    return new XMLJSONTransformer(transformerConfig);
  };
  
  return { config, resetConfig, createTransformer };
}