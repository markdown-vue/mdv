<template>
  <div id="app">
    <h1>MDV Test App</h1>
    <!-- Import and use an MDV page -->
    <Example />
  </div>
</template>

<script setup lang="ts">
import Example from './examples/example.v.md'

</script>

<style scoped>
#app {
  font-family: sans-serif;
  padding: 2rem;
}
</style>
