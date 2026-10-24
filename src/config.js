// src/config.js
// 运行时配置：优先读取 wrangler.toml 的 [vars]，否则回退到 constants.js 的默认值

import { UPSTREAM_URL, UPSTREAM_TIMEOUT_MS, MAX_CACHE_TTL } from './constants.js';

function toInt(value, fallback, min) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= min ? parsed : fallback;
}

/**
 * 解析本次请求使用的配置
 *
 * @param {Object} [env] - Worker 的 env 对象（来自 wrangler.toml [vars] / secrets）
 * @returns {{upstreamUrl: string, upstreamTimeoutMs: number, maxCacheTtl: number}}
 */
export function resolveConfig(env) {
  const vars = env || {};

  return {
    upstreamUrl: typeof vars.UPSTREAM_DOH_URL === 'string' && vars.UPSTREAM_DOH_URL
      ? vars.UPSTREAM_DOH_URL
      : UPSTREAM_URL,
    upstreamTimeoutMs: toInt(vars.UPSTREAM_TIMEOUT_MS, UPSTREAM_TIMEOUT_MS, 1),
    // 允许设为 0 表示关闭缓存
    maxCacheTtl: toInt(vars.CACHE_TTL_MAX, MAX_CACHE_TTL, 0),
  };
}
