type EnvValue = string | undefined;

/**
 * Cross-bundler env accessor.
 *
 * - Next.js: prefer `process.env.NEXT_PUBLIC_*` (browser + server)
 * - Vite: fall back to `import.meta.env.VITE_*`
 *
 * We keep this tiny and runtime-safe (no direct `import.meta` access unless it exists).
 */
export function readEnv(key: string): EnvValue {
  // Next / Node (and Next client where `process.env.NEXT_PUBLIC_*` is inlined)
  try {
    // eslint-disable-next-line no-restricted-globals
    const v = (globalThis as any)?.process?.env?.[key] as EnvValue;
    if (typeof v === "string") return v;
  } catch {
    // ignore
  }

  // Vite / ESM bundlers with import.meta.env
  try {
    const metaEnv = (globalThis as any)?.import?.meta?.env as
      | Record<string, unknown>
      | undefined;
    const v = metaEnv?.[key];
    if (typeof v === "string") return v;
  } catch {
    // ignore
  }

  return undefined;
}

