import cliJS from "./cli.js";
import { Compiler as CompilerJS } from "./compiler.js";
import { defineMdvConfig as defineMdvConfigJS } from "./defineMdvConfig.js";
import highlighterJS from "./highlighter.js";
import parserJS from "./parser.js";
import { useMeta as useMetaJS } from "./useMeta.js";
import { mdvPlugin as mdvPluginJS } from "./vite-plugin-mdv.js";
import CodeBlockJS from "./components/code-block.vue";

export const cli: typeof cliJS;
export const Compiler: typeof CompilerJS;
export const defineMdvConfig: typeof defineMdvConfigJS;
export const highlighter: typeof highlighterJS;
export const parser: typeof parserJS;
export const useMeta: typeof useMetaJS;
export const mdvPlugin: typeof mdvPluginJS;
export const CodeBlock: typeof CodeBlockJS;
