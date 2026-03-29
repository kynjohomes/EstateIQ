import { NextResponse } from 'next/server'
import { prisma } from '@estateiq/database'
import { sendPasswordResetEmail } from '@/lib/email'
import { logger } from '@/lib/logger'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const authUser = await prisma.authUser.findUnique({
      where: { email: email.trim().toLowerCase() },
    })

    // Always return success even if email not found — prevents user enumeration
    if (!authUser) {
      return NextResponse.json({ success: true })
    }

    // Expire any existing reset tokens
    await prisma.inviteToken.updateMany({
      where: { email: authUser.email, usedAt: null },
      data:  { expiresAt: new Date() },
    })

    const token     = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour only

    await prisma.inviteToken.create({
      data: {
        token,
        email:      authUser.email,
        estateId:   'password-reset', // sentinel value
        residentId: 'password-reset',
        expiresAt,
      },
    })

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`
    await sendPasswordResetEmail({
      to:       authUser.email,
      name:     authUser.name ?? 'User',
      resetUrl,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    logger.error('[POST /api/auth/forgot-password]', { message: err.message, stack: err.stack })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
