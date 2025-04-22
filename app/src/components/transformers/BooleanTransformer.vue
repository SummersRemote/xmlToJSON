<template>
  <div class="transformer-form">
    <div class="form-group">
      <label>True Values:</label>
      <input type="text" v-model="trueValues" placeholder="true, yes, 1" />
      <small>Values that will be converted to true (comma-separated)</small>
    </div>
    <div class="form-group">
      <label>False Values:</label>
      <input type="text" v-model="falseValues" placeholder="false, no, 0" />
      <small>Values that will be converted to false (comma-separated)</small>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps(['modelValue'])
const emit = defineEmits(['update:modelValue'])

const trueValues = computed({
  get: () => props.modelValue.options.trueValues.join(', '),
  set: (val) => emit('update:modelValue', {
    ...props.modelValue,
    options: {
      ...props.modelValue.options,
      trueValues: val.split(',').map(v => v.trim())
    }
  })
})

const falseValues = computed({
  get: () => props.modelValue.options.falseValues.join(', '),
  set: (val) => emit('update:modelValue', {
    ...props.modelValue,
    options: {
      ...props.modelValue.options,
      falseValues: val.split(',').map(v => v.trim())
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
</style>