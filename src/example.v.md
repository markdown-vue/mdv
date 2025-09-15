---
title: Example
description: Example description
---

# {{ $meta.title }}

{{ $meta.description }}

Code Block:

```js
const x = 1;
```

<!-- everythin after this is ignored -->

this is [inline]{ ::inlineComponent } component

this is a simple line

[

this is a blocked component
with multiple lines

[link](https://example.com)

<!-- dummy comment. dummy []{ ::component } -->

another paragraph with :[dynamic]{ ::dynamicComponent } inline component

]{ ::containerComponent }

asd
