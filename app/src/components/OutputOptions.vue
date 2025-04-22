<template>
    <fieldset>
      <legend>Output Options</legend>
      <label><input type="checkbox" v-model="options.prettyPrint" /> Pretty Print</label>
      <label>Indent: <input type="number" v-model.number="options.indent" /></label>
  
      <h4>JSON</h4>
      <label><input type="checkbox" v-model="options.json.compact" /> Compact</label>
      <label><input type="checkbox" v-model="options.json.removeEmptyStrings" /> Remove Empty Strings</label>
  
      <h4>XML</h4>
      <label><input type="checkbox" v-model="options.xml.declaration" /> XML Declaration</label>
    </fieldset>
  </template>
  
  <script setup>
  import { useConfig } from '../composables/useConfig'
  const { config } = useConfig()
  const options = config.outputOptions
  </script>