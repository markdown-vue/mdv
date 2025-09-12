import { Plugin } from "vite";
import fs from "fs";
import path from "path";
import { MDVPluginOptions } from "@mdv/types/mdv-config";
import { Compiler } from "@mdv/compiler";

export function mdvPlugin(options: MDVPluginOptions = {}): Plugin {
    const {
        compileMDVFile,
        compileAllMDVFiles,
        writeGlobalComponentsDTS,
        copyComponentsDir,
        extension,
        cacheDir,
        srcRoot,
        srcName,
        compiledTimestamps,
    } = Compiler(options);
    let initialized = false; // prevent double initialization

    return {
        name: "vite-plugin-mdv",
        enforce: "pre",

        async resolveId(importee, importer) {
            if (importee.endsWith(extension)) {
                if (importee.startsWith("/") || importee.startsWith("~/")) {
                    importee = path.join(srcRoot, importee.replace(/^\/|~\//, ""));
                }
                const mdPath = path.resolve(
                    importer ? path.dirname(importer) : process.cwd(),
                    importee,
                );
                const vuePath = path
                    .join(cacheDir, path.relative(srcRoot, mdPath))
                    .replace(/\.v\.md$/, ".vue");
                return vuePath;
            }
            return null;
        },

        async load(id) {
            if (!id.endsWith(".vue")) return null;
            const mdFile = id.replace(/\.vue$/, extension);
            if (!fs.existsSync(mdFile)) return null;
            return compileMDVFile(mdFile);
        },

        async handleHotUpdate({ file, server }) {
            if (!file.endsWith(extension)) return;
            await compileMDVFile(file, server);
        },

        async configureServer(server) {
            if (initialized) return;

            initialized = true; // only run once

            // Watch all MDV files
            const globPattern = path.resolve(srcRoot, `**/*.v.md`);
            server.watcher.add(globPattern);

            server.watcher.on("add", async (file) => {
                if (!file.endsWith(extension)) return;
                await compileMDVFile(file, server);
            });

            server.watcher.on("unlink", async (file) => {
                if (!file.endsWith(extension)) return;
                const vueCachePath = path
                    .join(cacheDir, path.relative(srcRoot, file))
                    .replace(/\.v\.md$/, ".vue");
                const pathsToRemove = [
                    vueCachePath,
                    vueCachePath.replace(/\.vue$/, ".v.md.ts"),
                    vueCachePath.replace(/\.vue$/, ".mdv.json"),
                ];
                for (const p of pathsToRemove) if (fs.existsSync(p)) fs.unlinkSync(p);
                compiledTimestamps.delete(file);
            });

            // Compile all existing files once
            console.log(`🔨 MDV: Compiling all .v.md files in /${srcName}`);

            const files = fs
                .readdirSync(srcRoot, { withFileTypes: true, recursive: true })
                .filter((f) => f.isFile() && f.name.endsWith(extension));
            if (files.length === 0)
                console.warn(
                    "\x1b[33m%s\x1b[36m%s\x1b[33m%s\x1b[36m%s\x1b[33m%s\x1b[0m",
                    `🚨🚨🚨 No`,
                    ` .v.md `,
                    `files found in`,
                    ` /${srcName} `,
                    `directory. Make sure you have the right extension.`,
                );

            await compileAllMDVFiles(srcRoot, server);
            await writeGlobalComponentsDTS(srcRoot);
            await copyComponentsDir(srcRoot);
            console.log(`✅ MDV: Done ✨`);
        },
    };
}
