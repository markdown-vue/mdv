<template>
<<<<<<< HEAD
    <pre v-if="!highlightedCode"><code>{{ raw }}</code></pre>
    <temaple v-else v-html="highlightedCode"></temaple>
</template>

<script setup lang="ts">
import { inject, onMounted, provide, ref } from 'vue';

const { highlightPath, name: key } = defineProps<{
    raw: string
    name: string,
    highlightPath: string
=======
  <pre v-if="!highlightedCode"><code>{{ raw }}</code></pre>
  <temaple v-else v-html="highlightedCode"></temaple>
</template>

<script setup lang="ts">
import { inject, onMounted, provide, ref } from "vue";

const { highlightPath, name: key } = defineProps<{
  raw: string;
  name: string;
  highlightPath: string;
>>>>>>> 0948ef6 (feat: initialize Markdown-Vue (MDV) project with core functionality)
}>();

const highlightedCode = ref<string>();

onMounted(async () => {
<<<<<<< HEAD
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
=======
  // Inject from cache
  const cache = inject<Record<string, string>>(highlightPath);
  if (cache && key in cache) {
    highlightedCode.value = cache[key];
    return;
  }

  // Import json
  const { default: json } = await import(/* @vite-ignore */ highlightPath);

  if (json && key in json) {
    highlightedCode.value = json[key];
    provide(highlightPath, json);
  }
});
</script>
>>>>>>> 0948ef6 (feat: initialize Markdown-Vue (MDV) project with core functionality)
