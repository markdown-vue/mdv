#!/usr/bin/env node

console.log(`📦 Copying assets...`);

const fs = require("fs");
const path = require("path");

// Components
const componentsSrc = path.join(__dirname, "../src/components");
const componentsDistCjs = path.join(__dirname, "../dist/cjs/components");
const componentsDistEsm = path.join(__dirname, "../dist/esm/components");


fs.rmSync(componentsDistCjs, { recursive: true, force: true });
fs.rmSync(componentsDistEsm, { recursive: true, force: true });

fs.cpSync(componentsSrc, componentsDistCjs, { recursive: true });
fs.cpSync(componentsSrc, componentsDistEsm, { recursive: true });


// Types index.d.ts
const typesSrc = path.join(__dirname, "../src/index.d.ts");
const typesDistCjs = path.join(__dirname, "../dist/cjs/index.d.ts");
const typesDistEsm = path.join(__dirname, "../dist/esm/index.d.ts");

// Correcting index.d.ts imports
const indexDts = fs.readFileSync(typesSrc, "utf-8");
const indexDtsFixed = indexDts.replace(/import (.*?) from '.\/(.*)'/g, "import $1 from '../../src/$2';");


fs.writeFileSync(typesDistCjs, indexDtsFixed);
fs.writeFileSync(typesDistEsm, indexDtsFixed);

console.log(`✅ Copied assets to ./dist/cjs/ and ./dist/esm/`);
