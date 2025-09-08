import { Plugin } from 'vite'
import fs from 'fs'
import path from 'path'
import { compileMDV, createTSDeclare } from './parser'
import { MDVPluginOptions } from './types/mdv-config'

export function mdvPlugin(options: MDVPluginOptions = {}): Plugin {
    const extension = options.extension || '.v.md'
    const metaExtension = '.mdv.json'
    const cacheDir = path.resolve(options.cacheDir || '.mdv-cache')
    const srcRoot = path.resolve(options.srcRoot || 'src')

    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true })

    const mdvMeta = new Map<string, any>()

    return {
        name: 'vite-plugin-mdv',
        enforce: 'pre',

        // Resolve .v.md or extension-less import
        async resolveId(importee, importer) {
            if (importee.endsWith(extension)) {
                if(importee.startsWith('/') || importee.startsWith('~/')) {
                    importee = path.join(srcRoot, importee.replace(/^\/|~\//, ''))
                }

                const mdPath = path.resolve(importer ? path.dirname(importer) : process.cwd(), importee)
                const vuePath = path.join(cacheDir, path.relative(srcRoot, mdPath)).replace(/\.v\.md$/, '.vue')

                return vuePath // <- looks like a .vue file now
            }

            return null
        },

        async load(id) {
            if (!id.endsWith('.vue')) return null

            const mdFile = id.replace(/\.vue$/, extension)
            if (!fs.existsSync(mdFile)) return null

            const mdContent = fs.readFileSync(mdFile, 'utf-8')
            const { content, meta } = await compileMDV(mdContent, id.replace(/\.vue$/, '.mdv.json').replace(/\\$/, "/"))

            mdvMeta.set(mdFile, meta)

            // ensure directory
            const vueDir = path.dirname(id)
            if (!fs.existsSync(vueDir)) fs.mkdirSync(vueDir, { recursive: true })

            fs.writeFileSync(id, content, 'utf-8')
            fs.writeFileSync(id.replace(/\.vue$/, '.mdv.json'), JSON.stringify(meta, null, 2), 'utf-8')

            // create declaration
            const declaration = createTSDeclare(mdFile, id);
            fs.writeFileSync(id.replace(/\.vue$/, '.d.ts'), declaration, 'utf-8')

            return content // <- valid SFC string
        },

        async handleHotUpdate({ file, server }) {
            if (!file.endsWith(extension)) return

            const vueCachePath = path.join(cacheDir, path.relative(srcRoot, file)).replace(/\.v\.md$/, '.vue')
            const vueDir = path.dirname(vueCachePath)

            const mdContent = fs.readFileSync(file, 'utf-8')
            const { content, meta } = await compileMDV(mdContent, path.relative(srcRoot, vueCachePath.replace(/\.vue$/, '.mdv.json')).replace(/\\/g, "/"))
            mdvMeta.set(file, meta)
            
            if (!fs.existsSync(vueDir)) fs.mkdirSync(vueDir, { recursive: true })
            fs.writeFileSync(vueCachePath, content, 'utf-8')
            fs.writeFileSync(vueCachePath.replace(/\.vue$/, '.mdv.json'), JSON.stringify(meta, null, 2), 'utf-8')

            // create declaration
            const declaration = createTSDeclare(`~/${path.relative(srcRoot, file).replace(/\\/g, "/")}`, `./${path.basename(vueCachePath)}`);
            fs.writeFileSync(vueCachePath.replace(/\.vue$/, '.d.ts'), declaration, 'utf-8')

            const mod = server.moduleGraph.getModuleById('\0mdv:' + file)
            if (mod) server.moduleGraph.invalidateModule(mod)
        }

    }
}
