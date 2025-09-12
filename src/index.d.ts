import { Compiler as CompilerJS } from "@mdv/compiler";
import { defineMdvConfig as defineMdvConfigJS } from "@mdv/defineMdvConfig";
import highlighterJS from "@mdv/highlighter";
import parserJS from "@mdv/parser";
import { useMeta as useMetaJS } from "@mdv/useMeta";
import { mdvPlugin as mdvPluginJS } from "@mdv/vite-plugin-mdv";
import CodeBlockJS from "@mdv/components/code-block.vue";

export const Compiler: typeof CompilerJS;
export const defineMdvConfig: typeof defineMdvConfigJS;
export const highlighter: typeof highlighterJS;
export const parser: typeof parserJS;
export const useMeta: typeof useMetaJS;
export const mdvPlugin: typeof mdvPluginJS;
export const CodeBlock: typeof CodeBlockJS;
