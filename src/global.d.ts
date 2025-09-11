declare module "vue" {
  export function getCurrentInstance(): any;
}

declare module "vite" {
  interface Plugin {
    name: string;
    enforce?: "pre" | "post";
    transform?: (code: string, id: string) => any;
    transformIndexHtml?: (html: string) => any;
    configureServer?: (server: {
      watcher: {
        on(hook: string, callback: (file: string) => void): void;
        add;
      };
    }) => any;
    configurePreviewServer?: (server: ViteDevServer) => any;
    resolveId?: (id: string, importer: string) => any;
    load?: (id: string) => any;
    handleHotUpdate?: ({
      file,
      server,
    }: {
      file: string;
      server: ViteDevServer;
    }) => any;
  }

  export const Plugin: Plugin;
}

declare module "*.vue" {
  import { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
