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
}

export type Meta = Record<string, any>