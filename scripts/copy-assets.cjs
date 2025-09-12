#!/usr/bin/env node

console.log(`📦 Copying assets...`);

const fs = require("fs");
const path = require("path");

// Components
const componentsSrc = path.join(__dirname, "../src/components");
const componentsDist = path.join(__dirname, "../dist/components");
fs.cpSync(componentsSrc, componentsDist, { recursive: true });

// Types
const indexTypesSrc = path.join(__dirname, "../src/index.d.ts");
const indexTypesDist = path.join(__dirname, "../dist/index.d.ts");
fs.copyFileSync(indexTypesSrc, indexTypesDist);

const otherTypes = path.join(__dirname, "../src/types");
const otherTypesDist = path.join(__dirname, "../dist/types");
fs.cpSync(otherTypes, otherTypesDist, { recursive: true });

console.log(`✅ Copied assets to ${distDir}`);
