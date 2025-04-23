import { defineStore } from 'pinia';
import XMLJSONTransformer from '../../../dist';

// Import transformers
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

export const useConfigStore = defineStore('config', {
  // State
  state: () => ({
    config: JSON.parse(JSON.stringify(defaultConfig))
  }),
  
  // Actions
  actions: {
    resetConfig() {
      this.config = JSON.parse(JSON.stringify(defaultConfig));
    },
    
    // Function to create transformer instances from configs
    createTransformerInstances(transformerConfigs) {
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
    },
    
    // Function to create an XMLJSONTransformer with the current config
    createTransformer() {
      // Create a copy of the config without the UI-specific parts
      const transformerConfig = { ...this.config };
      
      // Create actual transformer instances from the configs
      const transformerInstances = this.createTransformerInstances(this.config.valueTransformerConfigs);
      
      // Set the valueTransforms property
      transformerConfig.valueTransforms = transformerInstances;
      
      // Remove the UI-only property
      delete transformerConfig.valueTransformerConfigs;
      
      // Create and return the transformer
      return new XMLJSONTransformer(transformerConfig);
    }
  }
});