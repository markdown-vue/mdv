# Markdown-Vue (MDV) Documentation

## Overview

Markdown-Vue (MDV) lets you write Vue components directly in Markdown files. Each `.md` file can contain:

* Regular Markdown content
* Vue templates and components
* Optional YAML frontmatter for metadata
* Inline `<script>` and `<style>` blocks

This allows you to build full Vue apps, static websites, or even lightweight repo-based CMSs without leaving Markdown.

---

## Syntax

### Template

* Markdown is the base template.
* Vue components can be used inline with standard Vue syntax:

```md
# Hello {{ user.name }}

:[user.name]{ ::user-badge }
```

* `{{ }}` → Mustache syntax (works anywhere in the template).
* `:[prop]{ ::component }` → Inline binding syntax, where the default slot is bound to a prop.

---

### Loops

```md
::ul
  ::li(v-for="user in users")
    :[user.name]{ ::user-badge }
```

---

### Dynamic Tables

```md
::table
  ::tr(v-for="user in users")
    ::td{ {{ user.name }} }
    ::td{ {{ user.email }} }
  ::tr
    ::td(colspan="2"){ This is the fallback row }
```

---

### Scripts and Styles

You can write `<script>` and `<style>` blocks directly inside Markdown files.

#### Script Example

```md
<script setup>
import UserBadge from './UserBadge.vue'

const users = [
  { name: 'Alice', email: 'alice@example.com' },
  { name: 'Bob', email: 'bob@example.com' }
]
</script>
```

* `<script setup>` is supported.
* You can also use classic `<script>` if needed.
* `lang="ts"` is supported.

#### Style Example

```md
<style scoped>
h1 {
  color: red;
}
</style>
```

* `scoped` is supported.
* Works exactly like Vue SFC styles.

---

### Metadata

* YAML frontmatter is compiled into a `.meta.json` file alongside the compiled component.
* Example:

```md
---
title: Hello World
description: This is my first MDV page
---

# Hello World
```

Compiles into:

* `HelloWorld.vue`
* `HelloWorld.meta.json`

You can access metadata via the `useMeta` composable.

```ts
import { useMeta } from 'mdv'

const meta = await useMeta() // current component
const otherMeta = await useMeta('/path/to/OtherComponent')
```

In templates, `$meta` is available:

```md
# {{ $meta.title }}
```

---

## Example: Full Vue App in Markdown

```md
<v-app>
  # My Markdown-Vue App
  This is my MDV website
</v-app>
```

---

## Use Cases

* **Static websites**: MDV builds raw Markdown+Vue repos into Vue-powered static sites.
* **Repo-based CMS**: Since Markdown documents are the source of truth, your repo is the CMS.
* **Documentation & Blogs**: Alternative to VitePress, but with richer Vue integration.

Unlike VitePress, MDV projects always preserve a plain Markdown version of your content in the repo, making it easier to audit, share, and reuse.

---
