/**
 * XMLJSONTransformer - Main entry point
 * 
 * Export all relevant modules for the library.
 */

// Export the main transformer class as default
export { XMLJSONTransformer as default } from './XMLJSONTransformer.js';

// Export individual components for advanced usage scenarios
export { default as ConfigurationManager } from './components/ConfigurationManager.js';
export { default as DOMEnvironment } from './components/DomEnvironment.js';
export { default as NodeProcessor } from './components/NodeProcessor.js';
export { default as XMLToJSONConverter } from './XMLToJSONConverter.js';
export { default as JSONToXMLConverter } from './components/JSONToXMLConverter.js';
export { default as PathNavigator } from './components/PathNavigator.js';
export { default as SchemaGenerator } from './components/SchemaGenerator.js';