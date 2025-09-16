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
this is :[   dynamic   ]{ ::dynamicComponent } inline component with binded expression
this is only a :[ binded ] inline expression. it will act same as `{{ binded }}`.

this is a simple line

[

    this is a blocked component
    with multiple lines

    [link](https://example.com)

    <!-- dummy comment. dummy []{ ::component } -->

    another paragraph with :[dynamic]{ ::dynamicComponent } inline component
] { 
    ::containerComponent 
    #id
    .class-1
    .class-2
}

asd
