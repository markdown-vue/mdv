<template>
    <div id="app">
        <h1>MDV Test App</h1>
        <!-- Import and use an MDV page -->
        <Example />

        <br></br>
        <!-- Example's meta -->
        <div v-if="meta">
            <h2>Example component meta</h2>
            <ul>
                <li v-for="(value, key) in meta" :key="key">
                    <b>{{ key }}</b>: {{ value }}
                </li>
            </ul>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Example from '~/examples/example.v.md';
import { useMeta } from './useMeta';
import { Meta } from './types/mdv-config';

const meta = ref<Meta>()

onMounted(async () => {
    meta.value = await useMeta('~/examples/example') // or `./examples/example.v.md` or `~/examples/example.mdv.json`
    console.log('meta', meta)
})


</script>

<style scoped>
#app {
    font-family: sans-serif;
    padding: 2rem;
}
</style>
