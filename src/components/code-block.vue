<template>
    <pre v-if="!highlightedCode"><code>{{ raw }}</code></pre>
    <temaple v-else v-html="highlightedCode"></temaple>
</template>

<script setup lang="ts">
import { inject, onMounted, provide, ref } from 'vue';

const { highlightPath, name: key } = defineProps<{
    raw: string
    name: string,
    highlightPath: string
}>();

const highlightedCode = ref<string>();

onMounted(async () => {
    // Inject from cache
    const cache = inject<Record<string, string>>(highlightPath);
    if(cache && key in cache) {
        highlightedCode.value = cache[key];
        return;
    }

    // Import json
    const { default: json } = await import(/* @vite-ignore */highlightPath);

    if(json && key in json) {
        highlightedCode.value = json[key];
        provide(highlightPath, json);
    }

})
</script>