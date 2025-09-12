import path from "path";
import { compileMDV, generateGlobalComponentsModule } from "./parser.js";
import fs from "fs";
import chokidar from "chokidar";
export const Compiler = (options) => {
    const extension = ".v.md";
    const cacheDirName = options.cacheDir || ".mdv";
    const cacheDir = path.resolve(cacheDirName);
    const srcName = options.srcRoot || "src";
    const srcRoot = path.resolve(srcName);
    const skipCleanup = options.skipCleanup;
    if (!fs.existsSync(cacheDir))
        fs.mkdirSync(cacheDir, { recursive: true });
    const mdvMeta = new Map();
    const compiledTimestamps = new Map();
    function getCachePaths(file) {
        const vueCachePath = path
            .join(cacheDir, path.relative(srcRoot, file))
            .replace(/\.v\.md$/, ".vue");
        return {
            vue: vueCachePath,
            json: vueCachePath.replace(/\.vue$/, ".mdv.json"),
            shiki: vueCachePath.replace(/\.vue$/, ".shiki.ts"),
        };
    }
    function cleanupCacheFiles(file) {
        const { vue, json, shiki } = getCachePaths(file);
        [vue, json, shiki].forEach((f) => {
            if (fs.existsSync(f)) {
                fs.unlinkSync(f);
                console.log(`--🧹 Removed cache: ${path.relative(process.cwd(), f)}`);
            }
        });
        mdvMeta.delete(file);
        compiledTimestamps.delete(file);
    }
    async function compileMDVFile(file, viteServer) {
        if (!fs.existsSync(file))
            return;
        const stats = fs.statSync(file);
        const lastModified = stats.mtimeMs;
        if (compiledTimestamps.get(file) === lastModified)
            return;
        console.log(`--🔨 Compiling: ${path.relative(process.cwd(), file)}`);
        const { vue, json, shiki } = getCachePaths(file);
        const vueDir = path.dirname(vue);
        if (!fs.existsSync(vueDir))
            fs.mkdirSync(vueDir, { recursive: true });
        const mdContent = fs.readFileSync(file, "utf-8");
        const { content, meta, shikis } = await compileMDV(mdContent, path.relative(srcRoot, json).replace(/\\/g, "/"), `/${path.relative(srcRoot, shiki).toLowerCase().replace(/\\/g, "/")}`, {
            customComponents: {},
        });
        mdvMeta.set(file, meta);
        fs.writeFileSync(vue, content, "utf-8");
        fs.writeFileSync(json, JSON.stringify(meta, null, 2), "utf-8");
        if (Object.keys(shikis).length > 0)
            fs.writeFileSync(shiki, `export default ${JSON.stringify(shikis)}`);
        compiledTimestamps.set(file, lastModified);
        if (viteServer) {
            const mod = viteServer.moduleGraph.getModuleById("\0mdv:" + file);
            if (mod)
                viteServer.moduleGraph.invalidateModule(mod);
        }
        console.log(`--✅ Compiled: ${path.relative(process.cwd(), vue)}`);
        return content;
    }
    async function compileAllMDVFiles(dir = srcRoot, viteServer) {
        // cleanup orphaned cache files
        const cleanOrphans = (dir) => {
            const files = fs.readdirSync(dir, { withFileTypes: true });
            for (const f of files) {
                const fullPath = path.join(dir, f.name);
                if (f.isDirectory()) {
                    cleanOrphans(fullPath);
                }
                else if (f.isFile() && f.name.endsWith(".vue")) {
                    const originalFile = path.join(srcRoot, path.relative(cacheDir, fullPath).replace(/\.vue$/, ".v.md"));
                    if (!fs.existsSync(originalFile)) {
                        cleanupCacheFiles(originalFile);
                    }
                }
            }
        };
        if (!skipCleanup)
            cleanOrphans(dir);
        // now compile everything
        const files = fs.readdirSync(dir, { withFileTypes: true });
        for (const file of files) {
            const fullPath = path.join(dir, file.name);
            if (file.isDirectory()) {
                await compileAllMDVFiles(fullPath, viteServer);
            }
            else if (file.isFile() && file.name.endsWith(extension)) {
                await compileMDVFile(fullPath, viteServer);
            }
        }
    }
    async function watchAll(dir = srcRoot, viteServer) {
        console.log(`👀 Watching for changes in ${dir}...`);
        const watcher = chokidar.watch(dir);
        watcher
            .on("add", async (file) => {
            if (!file.endsWith(extension))
                return;
            await compileMDVFile(path.join(dir, file), viteServer);
            console.log(`--⬇ MDV added: ${file}`);
        })
            .on("change", async (file) => {
            if (!file.endsWith(extension))
                return;
            await compileMDVFile(path.join(dir, file), viteServer);
            console.log(`--🔨 MDV changed: ${file}`);
        })
            .on("unlink", (file) => {
            if (!file.endsWith(extension))
                return;
            cleanupCacheFiles(path.join(dir, file));
            console.log(`--🗑️ MDV removed: ${file}`);
        });
    }
    /**
     * Scan a directory for .v.md files, generate GlobalComponents declaration, write to .mdv folder
     */
    function writeGlobalComponentsDTS(dir = srcRoot) {
        console.log(`--🪐 Generating global components typings...`);
        const mdvFiles = [];
        function scanDir(d) {
            const entries = fs.readdirSync(d, { withFileTypes: true });
            for (const e of entries) {
                const fullPath = path.join(d, e.name);
                if (e.isDirectory())
                    scanDir(fullPath);
                else if (e.isFile() && e.name.endsWith(".v.md"))
                    mdvFiles.push(fullPath);
            }
        }
        scanDir(dir);
        // Get TS module string from parser
        const content = generateGlobalComponentsModule(mdvFiles.map((f) => `./${path.relative(srcRoot, f).replace(/\\/g, "/")}`));
        // Write to .d.ts
        fs.mkdirSync(cacheDir, { recursive: true });
        const dtsPath = path.join(cacheDir, "mdv-global-components.d.ts");
        fs.writeFileSync(dtsPath, content, "utf-8");
        console.log(`--✅ Generated typings: ${path.relative(process.cwd(), dtsPath)} 🎇`);
    }
    return {
        compileMDVFile,
        compileAllMDVFiles,
        watchAll,
        writeGlobalComponentsDTS,
        extension,
        cacheDir,
        srcRoot,
        srcName,
        mdvMeta,
        compiledTimestamps,
    };
};
