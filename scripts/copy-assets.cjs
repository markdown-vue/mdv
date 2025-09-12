#!/usr/bin/env node
// Copy components of './src/components' to './dist/components'

console.log(`📦 Copying assets...`);

const fs = require("fs");
const path = require("path");

const srcDir = path.join(__dirname, "../src/components");
const distDir = path.join(__dirname, "../dist/components");
fs.cpSync(srcDir, distDir, { recursive: true });

console.log(`✅ Copied assets to ${distDir}`);
