export interface MDVPluginOptions {
    cacheDir?: string         // folder to store compiled .vue files
    srcRoot?: string          // optional source root
}

export interface CompileMDVOptions {
    scriptSetupProps?: string // e.g., 'setup lang="ts"'
    scriptProps?: string      // e.g., 'lang="ts"'
    styleProps?: string       // e.g., 'scoped'
    customComponents?: Record<string, string> // custom components e.g., { 'h1': '~/src/components/MyComponent.vue' }
}

export type Meta = Record<string, any>

