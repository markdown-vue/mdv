# Markdown Vue (MDV) Documentation

## 1. Introduction

MDV is a reactive markdown format built on top of Vue. It allows developers to write markdown documents with **Vue components, loops, conditionals, and scoped scripts/styles**. It is designed to work in any Vue environment, making it suitable for **repo-based CMSs, static sites, and full Vue apps**.

---

## 2. Inline Component Syntax

Inline components allow embedding Vue components inside markdown content. The syntax is:

```md
[Text]{ ::component ...directives ...props }
```

* `::component`: the component name.
* `...directives`: Vue directives such as `v-for`, `v-if`, `v-else`.
* `...props`: props passed to the component.

**Example:**

```md
[User Badge]{ ::user-badge v-for="user in users" v-if="user.active" @click="selectUser(user)" }
```

### Mustache Syntax

* You can use `{{ }}` anywhere in templates for dynamic content binding.

### Inline Binding Syntax

* Bind slot content to component props using `:[propName]`.

```md
:[user.name]{ ::user-badge }
```

### `$meta` Variable

* Inside MDV templates, `$meta` is automatically available and contains the current component's meta object.

---

## 3. Tables with Dynamic Rows

MDV supports markdown-style tables with dynamic row rendering:

```md
| id | name | action |
|----|------|--------|
{ rows }
```

* `rows` is an array of objects `{ value: any, component?: string, ...props }`.
* Each object can specify a component and bind props.
* Supports loops and conditionals through inline component syntax.
* Fallback row (optional) should be placed **before** `{ rows }`:

```md
| No users found |
{ rows }
```

---

## 4. Scripts and Styles

MDV uses **HTML-like tags** for scripts and styles, similar to Vue SFCs:

```md
::script{ setup }
import UsersTable from '~/components/UsersTable'
const users = await fetch('/api/users')
::

::style
users-table { color: black; }
::
```

* Scripts can use `setup` or standard script behavior.
* Styles are scoped and safe.
* Scripts and styles are isolated per component.

---

## 5. YAML Frontmatter (Optional)

* YAML frontmatter is optional and can define metadata.
* MDV generates a **separate JSON file** for meta, e.g., `MyPage.meta.json`.
* Example:

```md
---
title: My Page
description: Example page
server: true
---
```

* Developers can access meta for any purpose, including search, filtering, or head management.

---

## 6. Accessing Meta

MDV provides a `useMeta` composable for accessing component meta.

### Features

* Defaults to the **current component**.
* Optional argument to load meta from another component path.
* Always returns a **Promise**.

### Implementation

```ts
import { getCurrentInstance } from 'vue'

export function useMeta(metaPath?: string): Promise<any> {
  if (metaPath) {
    return import(`${metaPath}.meta.json`).then(m => m.default || m)
  } else {
    const instance = getCurrentInstance()
    const meta = instance?.proxy?.metaData || null
    return Promise.resolve(meta)
  }
}
```

### Usage Examples

**Current component:**

```ts
const meta = await useMeta()
console.log(meta.title) // or access via $meta inside MDV template
```

**Another component:**

```ts
const otherMeta = await useMeta('/pages/OtherPage')
console.log(otherMeta.title)
```

* Use with `useHead` for dynamic head tags:

```ts
import { useHead } from '@vueuse/head'
const meta = await useMeta()
useHead({
  title: meta?.title,
  meta: [
    { name: 'description', content: meta?.description }
  ]
})
```

* Inside MDV templates, you can reference `$meta` directly:

```md
# {{ $meta.title }}
```

---

## 7. Full Vue App Example

MDV can be used to build full Vue applications in a markdown repo-based structure:

```md
<v-app>
  # My Markdown-Vue App
  Welcome to my MDV site.

  | id | name | action |
  |----|------|--------|
  { users }
</v-app>
```

* Components, loops, and dynamic tables work seamlessly.
* Scripts and styles can be scoped per component.
* Metadata is accessible via JSON or `$meta` for head management or other purposes.

---

## 8. Philosophy

* **Vue-centric:** MDV leverages Vue’s reactivity and SFC philosophy.
* **Repo-based CMS friendly:** Each component is a standalone file with optional meta JSON.
* **Static or dynamic:** Supports static site generation or fully reactive apps.
* **Lightweight:** Components are small; meta and assets are separate.
* **Markdown-first:** Maintains readable, markdown-style content with advanced reactive features.

---

*End of MDV Documentation*
