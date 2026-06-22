#!/usr/bin/env node
// Regenerate processed Tailwind CSS for design-sync.
// Run before the converter on every re-sync (set as cfg.buildCmd).
import { default as postcss } from '../node_modules/postcss/lib/postcss.js';
import { default as tailwindcss } from '../node_modules/@tailwindcss/postcss/dist/index.mjs';
import { readFileSync, writeFileSync } from 'node:fs';

const css = readFileSync('./src/app/globals.css', 'utf8');
const result = await postcss([tailwindcss]).process(css, {
  from: './src/app/globals.css',
  to: './src/design-sync-tokens.css',
});
writeFileSync('./src/design-sync-tokens.css', result.css);
console.log(`design-sync: wrote src/design-sync-tokens.css (${result.css.length} bytes)`);
