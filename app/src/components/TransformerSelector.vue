<template>
  <div>
    <h2>Value Transformers</h2>
    <div v-for="(transformer, index) in config.valueTransformers" :key="index">
      <select v-model="transformer.type">
        <option value="BooleanTransformer">BooleanTransformer</option>
        <option value="FOOTransformer">FOOTransformer</option>
      </select>

      <component
        :is="getComponent(transformer.type)"
        v-model="config.valueTransformers[index]"
      />
      <button @click="removeTransformer(index)">Remove</button>
    </div>

    <button @click="addTransformer">Add Transformer</button>
  </div>
</template>

<script setup>
import { useConfig } from '../composables/useConfig'
import BooleanTransformer from './BooleanTransformer.vue'
import FOOTransformer from './FOOTransformer.vue'

const { config } = useConfig()

const getComponent = (type) => {
  switch (type) {
    case 'BooleanTransformer':
      return BooleanTransformer
    case 'FOOTransformer' :
      return FOOTransformer
    default:
      return null
  }
}

function addTransformer() {
  config.valueTransformers.push({
    type: 'BooleanTransformer',
    options: {
      trueValues: ['true'],
      falseValues: ['false']
    }
  })
}

function removeTransformer(index) {
  config.valueTransformers.splice(index, 1)
}
</script>