import { NextResponse } from 'next/server'
import { prisma, Prisma, isDatabaseUrlConfigured } from '@estateiq/database'
import { sendNewsletterSignupEmail } from '@/lib/contactMailer'
import { sanitizeEmail } from '@/lib/sanitize'

export const runtime = 'nodejs'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function sanitizeSource(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined
  const s = raw.trim().slice(0, 64)
  if (s === 'footer' || s === 'contact') return s
  return undefined
}

export async function POST(req: Request) {
  let body: { email?: string; source?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const email = sanitizeEmail(body.email ?? '')
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })
  }

  const source = sanitizeSource(body.source)

  let isNewSubscriber = false
  try {
    await prisma.subscriber.create({
      data: { email, source: source ?? null },
    })
    isNewSubscriber = true
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)

    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') {
        return NextResponse.json({ ok: true, alreadySubscribed: true })
      }
      // P2021 = table does not exist (migration not applied)
      if (e.code === 'P2021') {
        console.error('[api/newsletter] Subscriber table missing — run db migration', e.meta)
        return NextResponse.json(
          {
            error:
              process.env.NODE_ENV === 'development'
                ? 'Subscriber table is missing. In apps/web run: npm run db:migrate (loads DATABASE_URL from .env.local).'
                : 'Could not save subscription. Please try again later.',
          },
          { status: 503 }
        )
      }
    }

    const initErr =
      e instanceof Prisma.PrismaClientInitializationError ? e : null
    const dbUnreachable =
      Boolean(initErr) ||
      (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P1001') ||
      /Can't reach database server|connection (closed|reset)|ConnectionReset|ECONNREFUSED|ETIMEDOUT/i.test(
        message
      )

    if (dbUnreachable) {
      const urlReadable = isDatabaseUrlConfigured()
      const prismaStillUsingLocalhost =
        /localhost:5432|127\.0\.0\.1:5432/i.test(message)

      if (!urlReadable || prismaStillUsingLocalhost) {
        console.error('[api/newsletter] DATABASE_URL not visible or points at localhost')
        return NextResponse.json(
          {
            error:
              process.env.NODE_ENV === 'development'
                ? 'DATABASE_URL is not set or not visible. Add it to apps/web/.env.local and restart the dev server (production: set DATABASE_URL on your host and redeploy).'
                : 'Service temporarily unavailable. Please try again later.',
            code: 'DATABASE_URL_MISSING',
          },
          { status: 503 }
        )
      }

      console.error('[api/newsletter] db unreachable', message)
      return NextResponse.json(
        {
          error:
            process.env.NODE_ENV === 'development'
              ? 'Could not reach Postgres. Check DATABASE_URL, that the database is running, and network/SSL settings.'
              : 'Could not save subscription right now. Please try again in a moment.',
          code: 'DATABASE_CONNECTION_FAILED',
        },
        { status: 503 }
      )
    }

    if (/DATABASE_URL is not set/i.test(message)) {
      console.error('[api/newsletter] DATABASE_URL not configured')
      return NextResponse.json(
        {
          error:
            process.env.NODE_ENV === 'development'
              ? 'DATABASE_URL is not set. Add it to apps/web/.env.local and restart.'
              : 'Service temporarily unavailable. Please try again later.',
          code: 'DATABASE_URL_MISSING',
        },
        { status: 503 }
      )
    }

    console.error('[api/newsletter] db', e)
    return NextResponse.json({ error: 'Could not save subscription. Please try again later.' }, { status: 500 })
  }

  if (isNewSubscriber) {
    try {
      await sendNewsletterSignupEmail(email)
    } catch (e) {
      const code = (e as Error & { code?: string }).code
      if (code !== 'MAILER_UNCONFIGURED') {
        console.error('[api/newsletter] email', e)
      }
      // Subscriber is already persisted
    }
  }

  return NextResponse.json({ ok: true })
}
