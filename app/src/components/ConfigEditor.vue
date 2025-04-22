<template>
  <div class="config-editor-container">
    <div class="editor-header">
      <h2>Configuration Settings</h2>
      <button @click="handleReset" class="reset-button">
        Reset to Defaults
      </button>
    </div>
    
    <div class="tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="{ active: activeTab === tab.id }"
        class="tab-button"
      >
        {{ tab.name }}
      </button>
    </div>
    
    <div class="tab-content">
      <div v-show="activeTab === 'general'">
        <GeneralSettings />
      </div>
      
      <div v-show="activeTab === 'output'">
        <OutputOptions />
      </div>
      
      <div v-show="activeTab === 'properties'">
        <PropNameEditor />
      </div>
      
      <div v-show="activeTab === 'transformers'">
        <TransformerSelector />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import GeneralSettings from './GeneralSettings.vue'
import OutputOptions from './OutputOptions.vue'
import PropNameEditor from './PropNameEditor.vue'
import TransformerSelector from './ValueTransformerSelector.vue'
import { useConfig } from '../composables/useConfig'

// Get config and resetConfig function
const { resetConfig } = useConfig()

// Define available tabs
const tabs = [
  { id: 'general', name: 'General Settings' },
  { id: 'output', name: 'Output Options' },
  { id: 'properties', name: 'Property Names' },
  { id: 'transformers', name: 'Value Transformers' }
]

// Track active tab
const activeTab = ref('general')

// Handle reset with confirmation
const handleReset = () => {
  if (confirm('Are you sure you want to reset all settings to their defaults?')) {
    resetConfig()
  }
}
</script>

<style scoped>
.config-editor-container {
  height: 100%;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

h2 {
  margin: 0;
  color: var(--secondary-color);
  font-size: 1.5rem;
}

.reset-button {
  background-color: var(--danger-color);
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.reset-button:hover {
  background-color: #c0392b;
}

.tabs {
  display: flex;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 1.5rem;
  gap: 0.25rem;
}

.tab-button {
  padding: 0.75rem 1.25rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  font-weight: 500;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.tab-button:hover {
  color: var(--primary-color);
}

.tab-button.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
}

.tab-content {
  padding: 0.5rem;
}
</style>