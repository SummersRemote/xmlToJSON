import { useConfigStore } from '../stores/configStore';

export function useConfig() {
  const configStore = useConfigStore();
  
  return {
    config: configStore.config,
    resetConfig: configStore.resetConfig,
    createTransformer: () => configStore.createTransformer()
  };
}