<template>
  <div class="transformer-form">
    <div class="form-group">
      <label>Pattern:</label>
      <input type="text" v-model="pattern" placeholder="/pattern/g" />
      <small>Regular expression pattern (use /pattern/flags format)</small>
    </div>
    <div class="form-group">
      <label>Replacement:</label>
      <input type="text" v-model="replacement" placeholder="replacement text" />
      <small>Text to replace matches with</small>
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
      type: 'StringReplaceTransformer',
      options: {
        pattern: '/pattern/g',
        replacement: 'replacement'
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
        pattern: '/pattern/g',
        replacement: 'replacement'
      }
    }
  }
  return props.modelValue
}

const pattern = computed({
  get: () => {
    const model = ensureOptions()
    return model.options.pattern || '/pattern/g'
  },
  set: (val) => {
    const model = ensureOptions()
    emit('update:modelValue', {
      ...model,
      options: {
        ...model.options,
        pattern: val
      }
    })
  }
})

const replacement = computed({
  get: () => {
    const model = ensureOptions()
    return model.options.replacement || 'replacement'
  },
  set: (val) => {
    const model = ensureOptions()
    emit('update:modelValue', {
      ...model,
      options: {
        ...model.options,
        replacement: val
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