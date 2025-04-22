<template>
    <div class="transformer-form">
      <div class="form-group">
        <label>Input Format:</label>
        <input type="text" v-model="inputFormat" placeholder="YYYY-MM-DD" />
        <small>Format pattern for parsing dates (uses dayjs format)</small>
      </div>
      <div class="form-group">
        <label>Output Format:</label>
        <input type="text" v-model="outputFormat" placeholder="DD/MM/YYYY" />
        <small>Format pattern for outputting dates (leave empty for ISO 8601)</small>
      </div>
      <div class="format-guide">
        <h4>Format tokens guide:</h4>
        <ul>
          <li><code>YYYY</code> - 4-digit year (2023)</li>
          <li><code>MM</code> - 2-digit month (01-12)</li>
          <li><code>DD</code> - 2-digit day (01-31)</li>
          <li><code>HH</code> - 2-digit hour, 24-hour clock (00-23)</li>
          <li><code>mm</code> - 2-digit minute (00-59)</li>
          <li><code>ss</code> - 2-digit second (00-59)</li>
          <li><code>Z</code> - UTC offset (e.g., +01:00)</li>
        </ul>
      </div>
    </div>
  </template>
  
  <script setup>
  import { computed } from 'vue'
  
  const props = defineProps(['modelValue'])
  const emit = defineEmits(['update:modelValue'])
  
  const inputFormat = computed({
    get: () => props.modelValue.options.inputFormat || '',
    set: (val) => emit('update:modelValue', {
      ...props.modelValue,
      options: {
        ...props.modelValue.options,
        inputFormat: val
      }
    })
  })
  
  const outputFormat = computed({
    get: () => props.modelValue.options.outputFormat || '',
    set: (val) => emit('update:modelValue', {
      ...props.modelValue,
      options: {
        ...props.modelValue.options,
        outputFormat: val
      }
    })
  })
  </script>
  
  <style scoped>
  .transformer-form {
    margin-top: 1rem;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.25rem;
    font-weight: 500;
  }
  
  .form-group small {
    display: block;
    margin-top: 0.25rem;
    color: #666;
    font-size: 0.85rem;
  }
  
  input[type="text"] {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  
  .format-guide {
    background-color: #f5f5f5;
    padding: 0.75rem;
    border-radius: 4px;
    margin-top: 1rem;
  }
  
  .format-guide h4 {
    margin-top: 0;
    margin-bottom: 0.5rem;
  }
  
  .format-guide ul {
    margin: 0;
    padding-left: 1.5rem;
  }
  
  .format-guide code {
    background-color: #e0e0e0;
    padding: 0.1rem 0.3rem;
    border-radius: 3px;
    font-family: monospace;
  }
  </style>