<template>
  <div class="app-container">
    <header>
      <h1>XMLJSONTransformer Configuration</h1>
    </header>
    
    <main>
      <div class="config-editor">
        <ConfigEditor />
      </div>
      
      <div class="config-output">
        <h2>Configuration Output</h2>
        <pre>{{ formattedConfig }}</pre>
      </div>
    </main>
    
    <footer>
      <p>XMLJSONTransformer Configuration Editor</p>
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useConfig } from './composables/useConfig'
import ConfigEditor from './components/ConfigEditor.vue'

const { config } = useConfig()

// Format the configuration for display
const formattedConfig = computed(() => {
  return JSON.stringify(config, null, 2)
})
</script>

<style>
:root {
  --primary-color: #3498db;
  --secondary-color: #2c3e50;
  --success-color: #2ecc71;
  --danger-color: #e74c3c;
  --light-gray: #f5f7fa;
  --border-color: #dcdfe6;
  --text-color: #333;
  --text-secondary: #666;
}

* {
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: var(--text-color);
  background-color: var(--light-gray);
  margin: 0;
  padding: 0;
}

.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

header {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

header h1 {
  color: var(--primary-color);
  margin: 0;
}

main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 2rem;
}


.config-editor, .config-output {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
}

.config-output h2 {
  margin-top: 0;
  color: var(--secondary-color);
  font-size: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color);
}

pre {
  background-color: var(--light-gray);
  padding: 1rem;
  border-radius: 4px;
  overflow: auto;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.9rem;
  line-height: 1.4;
}

fieldset {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

legend {
  padding: 0 0.5rem;
  font-weight: 600;
  color: var(--primary-color);
}

button {
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 500;
  border: none;
  transition: background-color 0.2s;
}

input[type="text"],
input[type="number"],
select {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 0.9rem;
}

input[type="checkbox"] {
  margin-right: 0.5rem;
}

label {
  display: block;
  margin-bottom: 0.75rem;
}

footer {
  margin-top: 3rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

@media (max-width: 900px) {
  main {
    grid-template-columns: 1fr;
  }
  
  .config-output {
    margin-top: 1rem;
  }
}
</style>