import { reactive } from 'vue'

const config = reactive({
  preserveNamespaces: true,
  preserveComments: true,
  preserveProcessingInstr: true,
  preserveCDATA: true,
  preserveTextNodes: true,
  preserveWhitespace: false,
  outputOptions: {
    prettyPrint: true,
    indent: 3,
    json: {
      compact: true,
      removeEmptyStrings: true
    },
    xml: {
      declaration: true
    }
  },
  propNames: {
    namespace: '@ns',
    prefix: '@prefix',
    value: '@val',
    attributes: '@attrs',
    cdata: '@cdata',
    comments: '@comments',
    processing: '@processing',
    children: '@children'
  },
  valueTransformers: []
})

export function useConfig() {
  return { config }
}