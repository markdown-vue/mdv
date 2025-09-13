import path from "path";
import { compileMDV, generateGlobalComponentsModule } from "@mdv/parser";
import { MDVPluginOptions } from "@mdv/types/mdv-config";
import fs from "fs";
import chokidar from "chokidar";

export const Compiler = (options: MDVPluginOptions) => {
    const extension = ".v.md";
    const cacheDirName = options.cacheDir || ".mdv";
    const cacheDir = path.resolve(cacheDirName);
    const srcName = options.srcRoot || "src";
    const srcRoot = path.resolve(srcName);
    const skipCleanup = options.skipCleanup;

    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const mdvMeta = new Map<string, any>();
    const compiledTimestamps = new Map<string, number>();

    function getCachePaths(file: string) {
        const vueCachePath = path
            .join(cacheDir, path.relative(srcRoot, file))
            .replace(/\.v\.md$/, ".vue");
        return {
            vue: vueCachePath,
            json: vueCachePath.replace(/\.vue$/, ".mdv.json"),
            shiki: vueCachePath.replace(/\.vue$/, ".shiki.js"),
        };
    }

    function cleanupCacheFiles(file: string) {
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

    async function compileMDVFile(file: string, viteServer?: any) {
        if (!fs.existsSync(file)) return;
        const stats = fs.statSync(file);
        const lastModified = stats.mtimeMs;
        if (compiledTimestamps.get(file) === lastModified) return;

        console.log(`--🔨 Compiling: ${path.relative(process.cwd(), file)}`);
        const { vue, json, shiki } = getCachePaths(file);
        const vueDir = path.dirname(vue);
        if (!fs.existsSync(vueDir)) fs.mkdirSync(vueDir, { recursive: true });

        
        const componentsDir = path.join(cacheDir, "components");
        const componentsDirRelative = path.relative(path.dirname(vue), componentsDir);

        const mdContent = fs.readFileSync(file, "utf-8");
        const { content, meta, shikis } = await compileMDV(
            mdContent,
            path.relative(cacheDir, json).replace(/\\/g, "/"),
            path.relative(path.join(cacheDir, "components"), shiki).replace(/\\/g, "/"),
            componentsDirRelative.toLowerCase().replace(/\\/g, "/"),
            {
                customComponents: {},
            }
        );




        mdvMeta.set(file, meta);
        fs.writeFileSync(vue, content, "utf-8");
        fs.writeFileSync(json, JSON.stringify(meta, null, 2), "utf-8");
        if (Object.keys(shikis).length > 0)
            fs.writeFileSync(shiki, `export default ${JSON.stringify(shikis)}`);

        compiledTimestamps.set(file, lastModified);

        if (viteServer) {
            const mod = viteServer.moduleGraph.getModuleById("\0mdv:" + file);
            if (mod) viteServer.moduleGraph.invalidateModule(mod);
        }

        console.log(`--✅ Compiled: ${path.relative(process.cwd(), vue)}`);
        return content;
    }

    async function compileAllMDVFiles(dir: string = srcRoot, viteServer?: any) {
        // cleanup orphaned cache files
        const cleanOrphans = (dir: string) => {
            const files = fs.readdirSync(dir, { withFileTypes: true });
            for (const f of files) {
                const fullPath = path.join(dir, f.name);
                if (f.isDirectory()) {
                    cleanOrphans(fullPath);
                } else if (f.isFile() && f.name.endsWith(".vue")) {
                    const originalFile = path.join(
                        srcRoot,
                        path.relative(cacheDir, fullPath).replace(/\.vue$/, ".v.md"),
                    );
                    if (!fs.existsSync(originalFile)) {
                        cleanupCacheFiles(originalFile);
                    }
                }
            }
        };

        if (!skipCleanup) cleanOrphans(dir);

        // now compile everything
        const files = fs.readdirSync(dir, { withFileTypes: true });
        for (const file of files) {
            const fullPath = path.join(dir, file.name);
            if (file.isDirectory()) {
                await compileAllMDVFiles(fullPath, viteServer);
            } else if (file.isFile() && file.name.endsWith(extension)) {
                await compileMDVFile(fullPath, viteServer);
            }
        }
    }

    async function watchAll(dir: string = srcRoot, viteServer?: any) {

        console.log(`👀 Watching for changes in ${dir}...`);

        const watcher = chokidar.watch(dir);


        watcher
            .on("add", async (file) => {
                if (!file.endsWith(extension)) return;
                await compileMDVFile(file, viteServer);
            })
            .on("change", async (file) => {
                if (!file.endsWith(extension)) return;
                await compileMDVFile(file, viteServer);
            })
            .on("unlink", (file) => {
                if (!file.endsWith(extension)) return;
                cleanupCacheFiles(file);
                console.log(`--🗑️ MDV removed: ${file}`);
            });
    }

    /**
     * Scan a directory for .v.md files, generate GlobalComponents declaration, write to .mdv folder
     */
    function writeGlobalComponentsDTS(dir: string = srcRoot) {
        console.log(`--🪐 Generating global components typings...`);

        const mdvFiles = getMdvFiles(dir);

        // Get TS module string from parser
        const content = generateGlobalComponentsModule(
            mdvFiles.map((f) => `./${path.relative(srcRoot, f).replace(/\\/g, "/")}`),
        );

        // Write to .d.ts
        fs.mkdirSync(cacheDir, { recursive: true });
        const dtsPath = path.join(cacheDir, "mdv-global-components.d.ts");
        fs.writeFileSync(dtsPath, content, "utf-8");
    }

    /**
     * Copy components directory to .mdv folder
     */
    function copyComponentsDir(dir: string = srcRoot) {
        console.log(`--🪐 Copying MDV components directory...`);
        // copy components directory to cache dir
        const componentsDir = path.join(dir, "components");
        if (fs.existsSync(componentsDir)) {
            const componentsCacheDir = path.join(cacheDir, "components");
            if (!fs.existsSync(componentsCacheDir)) fs.mkdirSync(componentsCacheDir, { recursive: true });
            fs.rmSync(componentsCacheDir, { recursive: true });
            fs.cpSync(componentsDir, componentsCacheDir, { recursive: true });
        }
    }

    function getMdvFiles(dir: string = srcRoot) {
        const mdvFiles: string[] = [];

        function scanDir(d: string) {
            const entries = fs.readdirSync(d, { withFileTypes: true });
            for (const e of entries) {
                const fullPath = path.join(d, e.name);
                if (e.isDirectory()) scanDir(fullPath);
                else if (e.isFile() && e.name.endsWith(".v.md"))
                    mdvFiles.push(fullPath);
            }
        }

        scanDir(dir);

        return mdvFiles;
    }

    return {
        compileMDVFile,
        compileAllMDVFiles,
        watchAll,
        writeGlobalComponentsDTS,
        copyComponentsDir,
        extension,
        cacheDir,
        srcRoot,
        srcName,
        mdvMeta,
        compiledTimestamps,
    };
};
