import { NextResponse } from 'next/server'
import { prisma } from '@estateiq/database'
import bcrypt from 'bcryptjs'
import { logger } from '@/lib/logger'
import { rateLimit } from '@/lib/rateLimit'
import { getPasswordPolicyErrorMessage, passwordMeetsPolicy } from '@/lib/passwordPolicy'

export async function POST(req: Request) {

  const limited = rateLimit(req as any, { limit: 5, windowMs: 60 * 1000 })
  if (limited) return limited

  try {
    const { name, email, password, consent, plan } = await req.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (!consent) {
      return NextResponse.json(
        { error: 'You must agree to the Terms of Service and Privacy Policy' },
        { status: 400 }
      )
    }

    if (!passwordMeetsPolicy(password)) {
      return NextResponse.json({ error: getPasswordPolicyErrorMessage() }, { status: 400 })
    }

    const existing = await prisma.authUser.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.authUser.create({
      data: {
        name,
        email,
        passwordHash,
        consentGiven:   true,
        consentGivenAt: new Date(),
      },
    })

    return NextResponse.json({ id: user.id, email: user.email, plan: plan ?? 'STARTER' }, { status: 201 })
  } catch (err: any) {
    logger.error('[POST /api/auth/register]', { message: err.message, stack: err.stack })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}