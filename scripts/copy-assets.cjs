#!/usr/bin/env node

console.log(`📦 Copying assets...`);

const fs = require("fs");
const path = require("path");

// Components
const componentsSrc = path.join(__dirname, "../src/components");
const componentsDist = path.join(__dirname, "../dist/components");


fs.rmSync(componentsDist, { recursive: true, force: true });
fs.cpSync(componentsSrc, componentsDist, { recursive: true });

console.log(`✅ Copied assets to ./dist/cjs/ and ./dist/esm/`);
