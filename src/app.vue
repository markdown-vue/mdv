<template>
  <div id="app">
    <h1>MDV Test App</h1>
    <!-- Import and use an MDV page -->
    <Example />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import Example from '~/examples/example.v.md';
import { useMeta } from './useMeta';

onMounted(async () => {
    const meta = await useMeta('~/examples/example')
    console.log('meta', meta)
})


</script>

<style scoped>
#app {
  font-family: sans-serif;
  padding: 2rem;
}
</style>
