<template>
  <div>
    <label>True Values:
      <input v-model="trueValues" placeholder="true, yes, 1" />
    </label>
    <label>False Values:
      <input v-model="falseValues" placeholder="false, no, 0" />
    </label>
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