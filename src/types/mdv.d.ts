/// <reference types="vite/client" />

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
