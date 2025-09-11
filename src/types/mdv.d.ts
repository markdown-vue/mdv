/// <reference types="vite/client" />

<<<<<<< HEAD
declare module '*.v.md' {
  import { DefineComponent } from 'vue'
  export interface MDVMeta {
    title?: string
    description?: string
    [key: string]: any
  }
  const component: DefineComponent<{}, {}, any> & { meta?: MDVMeta }
  export default component
}
=======
declare module "*.v.md" {
  import { DefineComponent } from "vue";
  export interface MDVMeta {
    title?: string;
    description?: string;
    [key: string]: any;
  }
  const component: DefineComponent<{}, {}, any> & { meta?: MDVMeta };
  export default component;
}
>>>>>>> 0948ef6 (feat: initialize Markdown-Vue (MDV) project with core functionality)
