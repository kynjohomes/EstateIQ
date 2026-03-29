import { PrismaClient } from './src/generated/prisma'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Next.js may inline `process.env.DATABASE_URL` at build time. If it was missing during
 * `next build`, the bundle gets `undefined` and Prisma falls back to `localhost:5432`.
 * Dynamic property access reads the real value at runtime (e.g. Netlify Functions).
 */
function readDatabaseUrlFromEnv(): string | undefined {
  const url = process.env['DATABASE' + '_' + 'URL'] as string | undefined
  if (typeof url === 'string' && url.trim().length > 0) return url.trim()
  return undefined
}

/**
 * Railway / many cloud Postgres hosts require TLS when connecting from outside their network
 * (e.g. Netlify Functions). Append sslmode=require if not already present.
 */
function resolveDatabaseUrl(): string | undefined {
  const url = readDatabaseUrlFromEnv()
  if (!url) return undefined
  if (/[?&]sslmode=/.test(url)) return url
  if (url.includes('rlwy.net') || url.includes('railway.app')) {
    const sep = url.includes('?') ? '&' : '?'
    return `${url}${sep}sslmode=require`
  }
  return url
}

function prismaClientOptions(): ConstructorParameters<typeof PrismaClient>[0] {
  const resolved = resolveDatabaseUrl()
  const base: ConstructorParameters<typeof PrismaClient>[0] = {
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  }
  // Never pass `url: undefined` — it overrides schema env("DATABASE_URL") and breaks the client.
  if (resolved) {
    base.datasources = { db: { url: resolved } }
  }
  return base
}

const prismaClient =
  globalForPrisma.prisma ?? new PrismaClient(prismaClientOptions())

/** For health checks / diagnostics — whether a non-empty DATABASE_URL is visible at runtime. */
export function isDatabaseUrlConfigured(): boolean {
  return Boolean(readDatabaseUrlFromEnv())
}

/** True if DATABASE_URL points at this machine (wrong for Netlify — use hosted DB URL). */
export function isDatabaseUrlLocalhost(): boolean {
  const u = readDatabaseUrlFromEnv()
  if (!u) return false
  return /localhost|127\.0\.0\.1/i.test(u)
}

// One client per serverless instance (warm container); same pattern as dev HMR.
globalForPrisma.prisma = prismaClient

export const prisma = prismaClient

export * from './src/generated/prisma'