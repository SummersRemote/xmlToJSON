<template>
  <fieldset>
    <legend>Value Transformers</legend>
    
    <!-- List of active transformers -->
    <div v-if="config.valueTransformerConfigs.length === 0" class="no-transformers">
  No value transformers configured. Add one below.
</div>
    
<div v-for="(transformer, index) in config.valueTransformerConfigs" :key="index" class="transformer-item">
  <div class="transformer-header">
        <span class="transformer-type">{{ getTransformerTypeName(transformer) }}</span>
        <div class="transformer-controls">
          <button 
            @click="moveTransformer(index, -1)" 
            :disabled="index === 0" 
            title="Move up"
            class="control-btn"
          >↑</button>
          <button 
            @click="moveTransformer(index, 1)" 
            :disabled="index === config.valueTransforms.length - 1" 
            title="Move down"
            class="control-btn"
          >↓</button>
          <button 
            @click="removeTransformer(index)" 
            class="control-btn remove-btn" 
            title="Remove"
          >×</button>
        </div>
      </div>
      
      <component
        :is="getComponent(getTransformerTypeName(transformer))"
        v-model="transformerConfigs[index]"
        @update:modelValue="updateTransformer(index, $event)"
      />
    </div>
    
    <!-- Add new transformer section -->
    <div class="add-transformer-section">
      <h3>Add New Transformer</h3>
      
      <!-- Step 1: Select transformer type -->
      <div class="add-step">
        <label for="transformer-type">1. Select transformer type:</label>
        <select 
          id="transformer-type" 
          v-model="selectedTransformerType"
          @change="prepareNewTransformer"
        >
          <option value="">-- Select Transformer Type --</option>
          <option v-for="type in availableTransformers" :key="type.name" :value="type.name">
            {{ type.name }}
          </option>
        </select>
      </div>
      
      <!-- Step 2: Configure transformer properties -->
      <div v-if="selectedTransformerType && newTransformerConfig" class="add-step">
        <label>2. Configure transformer properties:</label>
        <div class="new-transformer-properties">
          <component
            :is="getComponent(selectedTransformerType)"
            v-model="newTransformerConfig"
          />
        </div>
      </div>
      
      <!-- Step 3: Add transformer to configuration -->
      <div class="add-step">
        <button 
          @click="addTransformer" 
          :disabled="!selectedTransformerType"
          class="add-btn"
        >
          3. Add to Configuration
        </button>
      </div>
    </div>
  </fieldset>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useConfig } from '../composables/useConfig'
import BooleanTransformerComponent from './transformers/BooleanTransformer.vue'
import NumberTransformerComponent from './transformers/NumberTransformer.vue'
import StringReplaceTransformerComponent from './transformers/StringReplaceTransformer.vue'
import DateTransformerComponent from './transformers/DateTransformer.vue'

// Import transformer classes from the library
import { 
  BooleanTransformer, 
  NumberTransformer,
  StringReplaceTransformer
  // ,
  // DateTransformer
} from '../../../dist'

const { config } = useConfig()
const selectedTransformerType = ref('')
const newTransformerConfig = ref(null)

// Store transformer configurations separately for editing
const transformerConfigs = reactive([])

// Define available transformers with their default options
const availableTransformers = [
  {
    name: 'BooleanTransformer',
    defaultOptions: {
      trueValues: ['true', 'yes', '1'],
      falseValues: ['false', 'no', '0']
    }
  },
  {
    name: 'NumberTransformer',
    defaultOptions: {}
  },
  {
    name: 'StringReplaceTransformer',
    defaultOptions: {
      pattern: '/pattern/g',
      replacement: 'replacement'
    }
  },
  {
    name: 'DateTransformer',
    defaultOptions: {
      inputFormat: 'YYYY-MM-DD',
      outputFormat: 'DD/MM/YYYY'
    }
  }
]

// Initialize transformer configs on mount
onMounted(() => {
  initializeTransformerConfigs()
})

// Get the transformer type name
function getTransformerTypeName(transformer) {
  if (transformer instanceof BooleanTransformer) return 'BooleanTransformer'
  if (transformer instanceof NumberTransformer) return 'NumberTransformer'
  if (transformer instanceof StringReplaceTransformer) return 'StringReplaceTransformer'
  if (transformer instanceof DateTransformer) return 'DateTransformer'
  return 'Unknown'
}

// Initialize transformer configs based on existing transformers
function initializeTransformerConfigs() {
  transformerConfigs.length = 0 // Clear array
  
  // Create a configuration object for each transformer
  config.valueTransforms.forEach(transformer => {
    const type = getTransformerTypeName(transformer)
    // Extract options from the transformer instance
    const options = { ...transformer }
    
    transformerConfigs.push({
      type,
      options
    })
  })
}

// Get the component for a transformer type
function getComponent(type) {
  switch (type) {
    case 'BooleanTransformer':
      return BooleanTransformerComponent
    case 'NumberTransformer':
      return NumberTransformerComponent
    case 'StringReplaceTransformer':
      return StringReplaceTransformerComponent
    case 'DateTransformer':
      return DateTransformerComponent
    default:
      return null
  }
}

// Prepare a new transformer when type is selected
function prepareNewTransformer() {
  if (!selectedTransformerType.value) {
    newTransformerConfig.value = null
    return
  }
  
  const transformer = availableTransformers.find(t => t.name === selectedTransformerType.value)
  if (!transformer) {
    newTransformerConfig.value = null
    return
  }
  
  newTransformerConfig.value = {
    type: transformer.name,
    options: { ...transformer.defaultOptions }
  }
}

// Add the newly configured transformer
function addTransformer() {
  if (!newTransformer.value) return;
  
  // Add a copy of the configured transformer to the config
  config.valueTransformerConfigs.push({...newTransformer.value});
  
  // Reset the selection
  selectedTransformerType.value = '';
  newTransformer.value = null;
}

// Remove a transformer
function removeTransformer(index) {
  config.valueTransformerConfigs.splice(index, 1);
}

// Move a transformer up or down
function moveTransformer(index, direction) {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= config.valueTransformerConfigs.length) return;
  
  // Swap the transformers
  const transformer = config.valueTransformerConfigs[index];
  config.valueTransformerConfigs[index] = config.valueTransformerConfigs[newIndex];
  config.valueTransformerConfigs[newIndex] = transformer;
}

// Update transformer when configuration changes
function updateTransformer(index, newConfig) {
  // Create an instance of the appropriate transformer class based on the type
  let transformerInstance

  switch (newConfig.type) {
    case 'BooleanTransformer':
      transformerInstance = new BooleanTransformer(newConfig.options)
      break
    case 'NumberTransformer':
      transformerInstance = new NumberTransformer(newConfig.options)
      break
    case 'StringReplaceTransformer':
      transformerInstance = new StringReplaceTransformer(newConfig.options)
      break
    case 'DateTransformer':
      transformerInstance = new DateTransformer(newConfig.options)
      break
    default:
      console.error('Unknown transformer type:', newConfig.type)
      return
  }
  
  // Replace the transformer in the config
  config.valueTransforms[index] = transformerInstance
}
</script>

<style scoped>
.no-transformers {
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
  color: #666;
}

.transformer-item {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 1rem;
  background: #f9f9f9;
}

.transformer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
}

.transformer-type {
  font-weight: bold;
  color: #333;
}

.transformer-controls {
  display: flex;
  gap: 0.25rem;
}

.control-btn {
  width: 28px;
  height: 28px;
  padding: 0;
  margin: 0;
  background: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-btn:hover:not(:disabled) {
  background: #e0e0e0;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.remove-btn {
  color: #d9534f;
  font-weight: bold;
  background: #f9eaea;
}

.remove-btn:hover {
  background: #f5d0d0;
}

.add-transformer-section {
  margin-top: 2rem;
  padding: 1.5rem;
  border: 1px dashed #ccc;
  border-radius: 4px;
  background: #f5f7fa;
}

.add-transformer-section h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #2c3e50;
  font-size: 1.1rem;
}

.add-step {
  margin-bottom: 1.5rem;
}

.add-step:last-child {
  margin-bottom: 0;
}

.add-step label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.add-step select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.new-transformer-properties {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 1rem;
  margin-top: 0.5rem;
}

.add-btn {
  padding: 0.5rem 1rem;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  width: 100%;
}

.add-btn:hover:not(:disabled) {
  background: #218838;
}

.add-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
  opacity: 0.65;
}
</style>