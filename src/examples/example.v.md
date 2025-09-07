---
title: Example MDV Component
description: This is an example MDV component.
---

# {{ $meta.title }}
{{ $meta.description }}

## Usage

```vue
<Example />
```

**MDV** Components :[user.name]{ style="color:red" }
*Markdown-Vue* Component
This is an example MDV component.  

```vue
<Button :to="user.url" @click="onClick(user)" v-if="user.active" >Click me</Button>
```

|id|name|action|
|--|----|------|
|No item found |
{ :data-source="rows" }



<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMeta } from '../../src/useMeta'

console.log('meta', useMeta())

onMounted(async () => {
    
}) 

const rows = ref([
    { id: 1, name: { value: 'John Doe' } },
    { id: 2, name: { value: 'Smith John' } },
])


const user = ref({
    id: 1,
    name: 'John Doe',
})
/**
 * MDV Component Setup
 * You can write your Vue setup here.
 * e.g. import UserBadge from './UserBadge.vue'
 * const user = useUser()
 */
</script> 
 
<style scoped>
/* MDV Component Styles */
h1, h2, h3, h4, h5, h6 {
    font-weight: bold;
    font-family: monospace;
    margin: 1rem 0;
}

p {
    margin: 1rem 0;
    line-height: 1.5;
}
</style>
