#!/usr/bin/env node
import { Command } from "commander";
import { Compiler } from "./compiler.js";
import path from "path";
import fs from "fs";
import { pathToFileURL } from "url";

async function loadConfig(configPath?: string) {
  // load mdv.config.ts if path is not passed but file exists
  let resolvedConfig: any = {};
  const fullPath = configPath
    ? path.resolve(process.cwd(), configPath)
    : path.resolve(process.cwd(), "mdv.config.ts");

  if (fs.existsSync(fullPath)) {
    const fileUrl = pathToFileURL(fullPath).href;
    const mod = await import(fileUrl);
    resolvedConfig = mod?.default ?? {};
  }
  return resolvedConfig;
}

const program = new Command();

program.name("mdv").description("Markdown-Vue CLI").version("0.1.0");

program
  .command("build")
  .option("-c, --config <path>", "Path to config file")
  .option("--srcRoot <path>", "Source root for .v.md files")
  .option("--cacheDir <path>", "Cache directory")
  .option("--skipCleanup", "Skip cleanup of cache files")
  .action(async (options) => {
    const fileConfig = await loadConfig(options.config);
    const config = {
      srcRoot: options.srcRoot || fileConfig.srcRoot || "src",
      cacheDir: options.cacheDir || fileConfig.cacheDir || ".mdv",
    };
    const { compileAllMDVFiles } = Compiler(config);
    await compileAllMDVFiles();
  });

program
  .command("watch")
  .option("-c, --config <path>", "Path to config file")
  .option("--srcRoot <path>", "Source root for .v.md files")
  .option("--cacheDir <path>", "Cache directory")
  .action(async (options) => {
    const fileConfig = await loadConfig(options.config);
    const config = {
      srcRoot: options.srcRoot || fileConfig.srcRoot || "src",
      cacheDir: options.cacheDir || fileConfig.cacheDir || ".mdv",
    };
    const { watchAll } = Compiler(config);
    await watchAll(config.srcRoot);
  });

program.parse();
