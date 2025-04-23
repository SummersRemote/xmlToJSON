// In src/index.js

/**
 * XMLJSONTransformer - Main entry point
 * 
 * Export all relevant modules for the library.
 */

// Export the main transformer class as default
export { XMLJSONTransformer as default } from './core/XMLJSONTransformer.js';

// Export error handling utilities
export { TransformerError } from './core/errors/TransformerError.js';
export { ErrorCodes } from './core/errors/ErrorCodes.js';

// Export individual components for advanced usage scenarios
export { default as ConfigurationManager } from './core/components/ConfigurationManager.js';
export { default as DOMEnvironment } from './core/components/DomEnvironment.js';
export { default as NodeProcessor } from './core/components/NodeProcessor.js';
export { default as XMLToJSONConverter } from './core/components/XMLToJSONConverter.js';
export { default as JSONToXMLConverter } from './core/components/JSONToXMLConverter.js';
export { default as PathNavigator } from './core/components/PathNavigator.js';
export { default as SchemaGenerator } from './core/components/SchemaGenerator.js';