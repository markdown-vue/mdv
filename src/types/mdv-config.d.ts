export interface MDVPluginOptions {
  extension?: string        // file extension for MDV files
  cacheDir?: string         // folder to store compiled .vue files
  include?: string | string[] // glob pattern(s) to include MDV files
  exclude?: string | string[] // optional exclusions
  srcRoot?: string          // optional source root
}
