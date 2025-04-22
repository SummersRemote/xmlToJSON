<template>
  <div class="transformer-form">
    <div class="form-group">
      <label>True Values:</label>
      <input type="text" v-model="trueValuesString" placeholder="true, yes, 1" />
      <small>Values that will be converted to true (comma-separated)</small>
    </div>
    <div class="form-group">
      <label>False Values:</label>
      <input type="text" v-model="falseValuesString" placeholder="false, no, 0" />
      <small>Values that will be converted to false (comma-separated)</small>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
    default: () => ({
      type: 'BooleanTransformer',
      options: {
        trueValues: ['true', 'yes', '1'],
        falseValues: ['false', 'no', '0']
      }
    })
  }
})

const emit = defineEmits(['update:modelValue'])

// Ensure the options object exists
const ensureOptions = () => {
  if (!props.modelValue.options) {
    return {
      ...props.modelValue,
      options: {
        trueValues: ['true', 'yes', '1'],
        falseValues: ['false', 'no', '0']
      }
    }
  }
  return props.modelValue
}

// Convert array to comma-separated string for the input
const trueValuesString = computed({
  get: () => {
    const model = ensureOptions()
    return Array.isArray(model.options.trueValues) 
      ? model.options.trueValues.join(', ')
      : 'true, yes, 1'
  },
  set: (val) => {
    const model = ensureOptions()
    emit('update:modelValue', {
      ...model,
      options: {
        ...model.options,
        trueValues: val.split(',').map(v => v.trim())
      }
    })
  }
})

// Convert array to comma-separated string for the input
const falseValuesString = computed({
  get: () => {
    const model = ensureOptions()
    return Array.isArray(model.options.falseValues) 
      ? model.options.falseValues.join(', ')
      : 'false, no, 0'
  },
  set: (val) => {
    const model = ensureOptions()
    emit('update:modelValue', {
      ...model,
      options: {
        ...model.options,
        falseValues: val.split(',').map(v => v.trim())
      }
    })
  }
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
</style>