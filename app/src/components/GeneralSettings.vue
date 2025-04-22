<template>
    <fieldset>
      <legend>General Settings</legend>
      <label v-for="key in keys" :key="key">
        <input type="checkbox" v-model="config[key]" />
        {{ key }}
      </label>
    </fieldset>
  </template>
  
  <script setup>
  import { useConfig } from '../composables/useConfig'
  const { config } = useConfig()
  
  const keys = [
    'preserveNamespaces',
    'preserveComments',
    'preserveProcessingInstr',
    'preserveCDATA',
    'preserveTextNodes',
    'preserveWhitespace'
  ]
  </script>