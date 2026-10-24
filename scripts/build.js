// scripts/build.js
// 生成单文件版 worker.js

import { build } from 'esbuild';
import { bundleOptions, BUNDLE_FILE } from './bundle.js';

await build(bundleOptions());

console.log(`已生成 ${BUNDLE_FILE}，可直接粘贴到 Cloudflare Dashboard 的在线编辑器。`);
