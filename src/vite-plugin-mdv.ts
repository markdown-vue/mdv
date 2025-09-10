import { Plugin } from 'vite'
import fs from 'fs'
import path from 'path'
import { compileMDV, createShim } from './parser'
import { MDVPluginOptions } from './types/mdv-config'

export function mdvPlugin(options: MDVPluginOptions = {}): Plugin {
    const extension = '.v.md'
    const cacheDirName = options.cacheDir || '.mdv';
    const cacheDir = path.resolve(cacheDirName)
    const srcName = options.srcRoot || 'src'
    const srcRoot = path.resolve(srcName)

    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true })

    const mdvMeta = new Map<string, any>()
    const compiledTimestamps = new Map<string, number>()
    let initialized = false // prevent double initialization

    async function compileMDVFile(file: string, server?: any) {
        if (!fs.existsSync(file)) return
        const stats = fs.statSync(file)
        const lastModified = stats.mtimeMs
        if (compiledTimestamps.get(file) === lastModified) return

        console.log(`--🔨 Compiling: ${path.relative(process.cwd(), file)}`)
        const vueCachePath = path.join(cacheDir, path.relative(srcRoot, file)).replace(/\.v\.md$/, '.vue')
        const vueDir = path.dirname(vueCachePath)
        if (!fs.existsSync(vueDir)) fs.mkdirSync(vueDir, { recursive: true })

        const mdContent = fs.readFileSync(file, 'utf-8')
        const { content, meta, shikis } = await compileMDV(
            mdContent,
            path.relative(srcRoot, vueCachePath.replace(/\.vue$/, '.mdv.json')).replace(/\\/g, "/"),
            `/${path.relative(srcRoot, vueCachePath.replace(/\.vue$/, '.shiki.ts')).toLowerCase().replace(/\\/g, "/")}`,
            {
                customComponents: {
                },
            }
        )

        mdvMeta.set(file, meta)
        fs.writeFileSync(vueCachePath, content, 'utf-8')
        fs.writeFileSync(vueCachePath.replace(/\.vue$/, '.mdv.json'), JSON.stringify(meta, null, 2), 'utf-8')
        fs.writeFileSync(vueCachePath.replace(/\.vue$/, '.v.md.ts'), createShim(`./${path.basename(vueCachePath)}`), 'utf-8')
        if(Object.keys(shikis).length > 0) 
            fs.writeFileSync(vueCachePath.replace(/\.vue$/, '.shiki.ts'), `export default ${JSON.stringify(shikis)}`)

        compiledTimestamps.set(file, lastModified)

        if (server) {
            const mod = server.moduleGraph.getModuleById('\0mdv:' + file)
            if (mod) server.moduleGraph.invalidateModule(mod)
        }

        console.log(`--✅ Compiled: ${(path.relative(process.cwd(), vueCachePath))}`)
        return content
    }

    async function compileAllMDVFiles(dir: string, server?: any) {
        const files = fs.readdirSync(dir, { withFileTypes: true })

        for (const file of files) {
            const fullPath = path.join(dir, file.name)
            if (file.isDirectory()) {
                await compileAllMDVFiles(fullPath, server)
            } else if (file.isFile() && file.name.endsWith(extension)) {
                await compileMDVFile(fullPath, server)
            }
        }
    }

    return {
        name: 'vite-plugin-mdv',
        enforce: 'pre',

        async resolveId(importee, importer) {
            if (importee.endsWith(extension)) {
                if (importee.startsWith('/') || importee.startsWith('~/')) {
                    importee = path.join(srcRoot, importee.replace(/^\/|~\//, ''))
                }
                const mdPath = path.resolve(importer ? path.dirname(importer) : process.cwd(), importee)
                const vuePath = path.join(cacheDir, path.relative(srcRoot, mdPath)).replace(/\.v\.md$/, '.vue')
                return vuePath
            }
            return null
        },

        async load(id) {
            if (!id.endsWith('.vue')) return null
            const mdFile = id.replace(/\.vue$/, extension)
            if (!fs.existsSync(mdFile)) return null
            return compileMDVFile(mdFile)
        },

        async handleHotUpdate({ file, server }) {
            if (!file.endsWith(extension)) return
            await compileMDVFile(file, server)
        },

        async configureServer(server) {
            if (initialized) return
            initialized = true // only run once

            // Watch all MDV files
            const globPattern = path.resolve(srcRoot, `**/*.v.md`)
            server.watcher.add(globPattern)

            server.watcher.on('add', async (file) => {
                if (!file.endsWith(extension)) return
                await compileMDVFile(file, server)
            })

            server.watcher.on('unlink', async (file) => {
                if (!file.endsWith(extension)) return
                const vueCachePath = path.join(cacheDir, path.relative(srcRoot, file)).replace(/\.v\.md$/, '.vue')
                const pathsToRemove = [
                    vueCachePath,
                    vueCachePath.replace(/\.vue$/, '.v.md.ts'),
                    vueCachePath.replace(/\.vue$/, '.mdv.json')
                ]
                for (const p of pathsToRemove) if (fs.existsSync(p)) fs.unlinkSync(p)
                compiledTimestamps.delete(file)
            })

            // Compile all existing files once
            console.log(`🔨 MDV: Compiling all .v.md files in /${srcName}`)

            const files = fs.readdirSync(srcRoot, { withFileTypes: true, recursive: true }).filter(f => f.isFile() && f.name.endsWith(extension))
            if (files.length === 0) console.warn('\x1b[33m%s\x1b[36m%s\x1b[33m%s\x1b[36m%s\x1b[33m%s\x1b[0m', `🚨🚨🚨 No`, ` .v.md `, `files found in`, ` /${srcName} `, `directory. Make sure you have the right extension.`)

            await compileAllMDVFiles(srcRoot, server)
            console.log(`✅ MDV: Done ✨`)
        }
    }
}
