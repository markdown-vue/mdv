export interface MDVPluginOptions {
  extension?: string        // file extension for MDV files
  cacheDir?: string         // folder to store compiled .vue files
  include?: string | string[] // glob pattern(s) to include MDV files
  exclude?: string | string[] // optional exclusions
  srcRoot?: string          // optional source root
}

export interface CompileMDVOptions {
    scriptSetupProps?: string // e.g., 'setup lang="ts"'
    scriptProps?: string      // e.g., 'lang="ts"'
    styleProps?: string       // e.g., 'scoped'
    customComponents?: Record<string, string> // custom components e.g., { 'h1': '~/src/components/MyComponent.vue' }
}

export type Meta = Record<string, any>

