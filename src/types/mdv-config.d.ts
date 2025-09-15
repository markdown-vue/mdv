export interface MDVPluginOptions {
    cacheDir?: string; // folder to store compiled .vue files
    srcRoot?: string; // optional source root
    skipCleanup?: boolean; // skip cleanup of orphaned cache files
}

export interface CompileMDVOptions {
    scriptSetupProps?: string; // e.g., 'setup lang="ts"'
    scriptProps?: string; // e.g., 'lang="ts"'
    styleProps?: string; // e.g., 'scoped'
    customComponents?: Record<string, string>; // custom components e.g., { 'h1': '~/src/components/MyComponent.vue' }
}

export type Meta = Record<string, any>;

/**
 * MDVNode
 *
 * @typedef {Object} MDVNode
 * @property {string} type - Node type
 * @property {string} value - Node value
 * @property {MDVNode[]} children - Child nodes
 */
export type MDVNode = {
    type: string;
    value?: string;
    children?: MDVNode[];
    headers?: string[]; // for table
    propsLine?: string; // for table
    placeholder?: string; // for table
    tableHeadersScript?: string[];
    tag?: string;
    shiki?: { key: string; code: string };
};


export default interface MDVConfigTypes {
    MDVPluginOptions,
    CompileMDVOptions,
    Meta,
    MDVNode
}