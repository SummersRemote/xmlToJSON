<template>
  <div>
    <label>FOO Values:
      <input v-model="fooValues" placeholder="foo, yes, 1" />
    </label>
    <label>BAR Values:
      <input v-model="barValues" placeholder="bar, no, 0" />
    </label>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps(['modelValue'])
const emit = defineEmits(['update:modelValue'])

const fooValues = computed({
  get: () => props.modelValue.options.fooValues.join(', '),
  set: (val) => emit('update:modelValue', {
    ...props.modelValue,
    options: {
      ...props.modelValue.options,
      fooValues: val.split(',').map(v => v.trim())
    }
  })
})

const barValues = computed({
  get: () => props.modelValue.options.barValues.join(', '),
  set: (val) => emit('update:modelValue', {
    ...props.modelValue,
    options: {
      ...props.modelValue.options,
      barValues: val.split(',').map(v => v.trim())
    }
  })
})
</script>