<template>
  <div class="transformer-form">
    <p class="transformer-description">
      Converts string values that look like numbers to actual number types.
      No additional configuration required.
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
    default: () => ({
      type: 'NumberTransformer',
      options: {}
    })
  }
})

const emit = defineEmits(['update:modelValue'])

// Ensure the modelValue has the expected structure
const ensureModelStructure = () => {
  if (!props.modelValue || !props.modelValue.type) {
    emit('update:modelValue', {
      type: 'NumberTransformer',
      options: {}
    })
  } else if (!props.modelValue.options) {
    emit('update:modelValue', {
      ...props.modelValue,
      options: {}
    })
  }
}

// Call the structure check once when the component is created
ensureModelStructure()
</script>

<style scoped>
.transformer-form {
  margin-top: 1rem;
}

.transformer-description {
  padding: 0.5rem;
  background-color: #f5f5f5;
  border-radius: 4px;
  border-left: 4px solid #2196f3;
  margin: 0;
}
</style>