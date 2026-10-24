// scripts/bundle.js
// 单文件打包配置：把 src/ + 依赖（dns-packet、Buffer polyfill）打成一个可粘贴的 worker.js

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const BUNDLE_FILE = 'worker.js';

const BANNER = `/**
 * DoH Worker — 单文件版（自动生成，请勿直接编辑）
 *
 * 源码在 src/ 目录，修改后运行： npm run build
 * 用法：Cloudflare Dashboard → Workers & Pages → 选择 Worker → Edit code，
 *      删除原有内容后整份粘贴本文件，点击 Deploy。
 *
 * 已内置 dns-packet 与 Buffer polyfill，控制台无需 Node.js 兼容开关。
 */`;

/**
 * 生成 esbuild 配置
 *
 * @param {{write?: boolean, outfile?: string}} [options]
 */
export function bundleOptions({ write = true, outfile = BUNDLE_FILE } = {}) {
  return {
    absWorkingDir: root,
    entryPoints: ['src/index.js'],
    outfile,
    bundle: true,
    write,
    format: 'esm',
    platform: 'browser',
    target: 'es2022',
    mainFields: ['browser', 'module', 'main'],
    charset: 'utf8',
    define: { global: 'globalThis' },
    banner: { js: BANNER },
    legalComments: 'none',
    logLevel: 'warning',
  };
}
