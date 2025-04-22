<template>
  <fieldset>
    <legend>Property Name Mapping</legend>
    <div v-for="key in keys" :key="key">
      <label>
        {{ key }}:
        <input v-model="config.propNames[key]" />
      </label>
    </div>
  </fieldset>
</template>

<script setup>
import { useConfig } from '../composables/useConfig'
const { config } = useConfig()

const keys = [
  'namespace',
  'prefix',
  'value',
  'attributes',
  'cdata',
  'comments',
  'processing',
  'children'
]
</script>