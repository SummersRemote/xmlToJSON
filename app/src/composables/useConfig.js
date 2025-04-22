// First, let's create the composable for managing configuration
import { reactive } from 'vue';
import XMLJSONTransformer from '../../../dist';
import BooleanTransformer from '../../../dist';
import NumberTransformer from '../../../dist';
import StringReplaceTransformer from '../../../dist';
// import DateTransformer from 'xmltojson/transformers/DateTransformer';

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
  // Use valueTransformerConfigs for UI configuration (not actual instances)
  valueTransformerConfigs: []
};

// Function to create transformer instances from configs
function createTransformerInstances(transformerConfigs) {
  return transformerConfigs.map(config => {
    switch (config.type) {
      case 'BooleanTransformer':
        return new BooleanTransformer(config.options);
      case 'NumberTransformer':
        return new NumberTransformer(config.options);
      case 'StringReplaceTransformer':
        return new StringReplaceTransformer(config.options);
      // case 'DateTransformer':
      //   return new DateTransformer(config.options);
      default:
        console.warn(`Unknown transformer type: ${config.type}`);
        return null;
    }
  }).filter(Boolean); // Remove any null values
}

// Create a reactive config object for the UI
const config = reactive({...defaultConfig});

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
    
    // Replace transformer configs with actual instances
    transformerConfig.valueTransforms = createTransformerInstances(
      config.valueTransformerConfigs
    );
    
    // Remove the UI-only property
    delete transformerConfig.valueTransformerConfigs;
    
    // Create and return the transformer
    return new XMLJSONTransformer(transformerConfig);
  };
  
  return { config, resetConfig, createTransformer };
}