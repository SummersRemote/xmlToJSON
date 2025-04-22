<template>
    <div>
      <GeneralSettings />
      <OutputOptions />
      <PropNameEditor />
      <TransformerSelector />
    </div>
  </template>
  
  <script setup>
  import GeneralSettings from './GeneralSettings.vue'
  import OutputOptions from './OutputOptions.vue'
  import PropNameEditor from './PropNameEditor.vue'
  import TransformerSelector from './TransformerSelector.vue'
  </script>