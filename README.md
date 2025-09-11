# Markdown-Vue (MDV) Documentation (Updated)

## Overview

Markdown-Vue (MDV) lets you write Vue-style components directly inside Markdown files. Each `.md` file can contain:

- Regular Markdown content
- Vue-style templates and components (standard HTML/Vue tags)
- YAML frontmatter for metadata
- Inline `<script>` and `<style>` blocks
- A small inline component shorthand for short components

This keeps the source human-readable while enabling Vue integration.

---

## Core principles

- **Template-first:** Markdown is the base template; sprinkle Vue/HTML where needed.
- **Standard HTML / Vue tags:** Use normal HTML elements and Vue component tags (`<div>`, `<section>`, `<UserBadge>`, etc.). MDV follows standard Vue/HTML semantics.
- **Inline component shorthand:** MDV provides a concise inline shorthand for simple, content-driven components.

---

## Syntax reference

### Block elements

Use standard HTML elements and Vue component tags. Attributes follow Vue syntax (`v-for`, `v-if`, `:prop`, `@click`, etc.).

Example:

```md
<div class="card">
  # Title inside the card
  <p>This paragraph lives inside the div</p>
</div>
```

### Interpolation

Mustache interpolation (`{{ }}`) works anywhere in the template.

```md
Hello, {{ user.name }}
```

### Inline component syntax

MDV supports a compact inline component shorthand in two forms:

- Slot content:

```md
[text]{ ::ComponentName }
```

- Dynamic/default-slot expression:

```md
:[user.name]{ ::UserBadge }
```

Props, directives, and bindings are passed inside the braces:

```md
[Click me]{ ::Button :to="user.url" @click="onClick(user)" v-if="user.active" }
```

Notes:

- The inline shorthand forms `[text]{ ::Component ... }` and `:[expr]{ ::Component }` are the only MDV-specific shorthands.
- For multiple named slots or complex layouts prefer full component tags (`<MyComponent>...</MyComponent>`).

---

### Loops

Use Vue's `v-for` on any element or component. Always include `:key`.

Example with HTML tags:

```md
<ul>
  <li v-for="(user, i) in users" :key="user.id || i">
    <UserBadge>{{ user.name }}</UserBadge>
  </li>
</ul>
```

Inline shorthand in loops:

```md
:[item]{ v-for="item in items" :key="item.id || itemIndex" }
```

The `:` inline form places the evaluated expression into the default slot for the inline component.

Notes:

- Use `:key` with every `v-for`.
- Prefer inline loops for small, simple items.

---

### Dynamic tables

MDV supports dynamic rows inside standard Markdown tables using a `{ rows }` placeholder. Header is normal Markdown; rows are injected where `{ rows }` appears. A fallback row is optional.

Example:

```md
| id            | name | action |
| ------------- | ---- | ------ |
| No item found |

{ rows }
```

How it works:

- `{ rows }` is replaced by rendered rows generated from your data source.
- If the data is empty and you provided a fallback row (like `| No item found |`), that row is shown.
- Rows may contain inline components or full HTML/Vue tags.

Simple conceptual example:

```md
<!-- body -->

| id            | name | action |
| ------------- | ---- | ------ |
| No item found |

{ rows }

<script setup>
const rows = items.map(item => `| ${item.id} | ${item.name} | [Edit]{ ::EditButton :id="${item.id}" } |`).join('\\n')
</script>
```

Notes:

- Fallback row is optional.
- Keep header as normal Markdown.

---

### Scripts and Styles

You may include `<script>` and `<style>` blocks inside `.md` files. Prefer `<script setup>`.

Script example:

```md
<script setup lang="ts">
import UserBadge from './UserBadge.vue'
import { ref } from 'vue'

const users = ref([
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' }
])
</script>
```

Style example:

```md
<style scoped>
h1 { font-weight: 700 }
</style>
```

---

### Metadata (YAML frontmatter)

MDV supports YAML frontmatter, compiled into a `.meta.json` file alongside the component.

Example frontmatter:

```md
---
title: Hello World
description: This is my first MDV page
---

# {{ $meta.title }}
```

Emitted files:

- `HelloWorld.vue` (compiled component)
- `HelloWorld.meta.json` (metadata)

Accessing metadata:

- From script: `useMeta()` **always returns a Promise** and should be `await`ed.

```ts
import { useMeta } from "mdv";
const meta = await useMeta();
const otherMeta = await useMeta("/path/to/other");
```

- From templates: `$meta` is available (`{{ $meta.title }}`).

---

## Example: Full Vue App in Markdown

```md
<v-app>
  # My Markdown-Vue App

This is an MDV page with components and markdown.

  <section>
    <h2>Users</h2>
    <ul>
      <li v-for="(u, i) in users" :key="u.id || i">
        <UserBadge :user="u" />
      </li>
    </ul>
  </section>
</v-app>

<script setup>
import UserBadge from './UserBadge.vue'
import { ref } from 'vue'

const users = ref([
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' }
])
</script>
```

---

## Use cases

- Static websites
- Repo-based CMS
- Documentation & Blogs with interactive components

---

## Notes & best practices

- Prefer Vue-style attributes (`v-...` and `:`) and include `:key` on `v-for` lists.
- Use the inline shorthand forms only:
  - `[text]{ ::ComponentName ...props ...directives }`
  - `:[expression]{ ::ComponentName }`

- Use full HTML/Vue tags for multiple named slots or complex layouts.
- Keep scripts/styles in-file for small pages; split out for complexity.

---
