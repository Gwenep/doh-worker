// src/config.js
// 运行时配置：优先读取 wrangler.toml 的 [vars]，否则回退到 constants.js 的默认值

import { UPSTREAM_URL, UPSTREAM_TIMEOUT_MS, MAX_CACHE_TTL } from './constants.js';

function toInt(value, fallback, min) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= min ? parsed : fallback;
}

function toBool(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'on', 'yes'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'off', 'no'].includes(normalized)) {
    return false;
  }
  return fallback;
}

/**
 * 解析本次请求使用的配置
 *
 * @param {Object} [env] - Worker 的 env 对象（来自 wrangler.toml [vars] / secrets）
 * @returns {{upstreamUrl: string, upstreamSource: 'env'|'default', upstreamTimeoutMs: number, maxCacheTtl: number, ecsFallback: boolean}}
 */
export function resolveConfig(env) {
  const vars = env || {};
  const envUpstream = typeof vars.UPSTREAM_DOH_URL === 'string' && vars.UPSTREAM_DOH_URL
    ? vars.UPSTREAM_DOH_URL
    : null;

  return {
    upstreamUrl: envUpstream || UPSTREAM_URL,
    // 控制台 / wrangler 里配置的变量会覆盖代码默认值，诊断时需要区分来源
    upstreamSource: envUpstream ? 'env' : 'default',
    upstreamTimeoutMs: toInt(vars.UPSTREAM_TIMEOUT_MS, UPSTREAM_TIMEOUT_MS, 1),
    // 允许设为 0 表示关闭缓存
    maxCacheTtl: toInt(vars.CACHE_TTL_MAX, MAX_CACHE_TTL, 0),
    // 上游按 ECS 返回 127.0.0.1 / 0.0.0.0（区域限制等）时，是否自动改用不带 ECS 的查询
    ecsFallback: toBool(vars.ECS_FALLBACK, true),
  };
}
