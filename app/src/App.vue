<template>
  <main>
    <ConfigEditor />
    <h3>Live Config Output:</h3>
    <pre>{{ JSON.stringify(config, null, 2) }}</pre>
  </main>
</template>

<script setup>
import { useConfig } from './composables/useConfig'
import ConfigEditor from './components/ConfigEditor.vue'

const { config } = useConfig()
</script>

<style scoped>
main {
  font-family: Arial, sans-serif;
  padding: 2rem;
}
</style>