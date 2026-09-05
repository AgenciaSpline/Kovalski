import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { checkSuperAdmin } from '@/lib/superadmin-actions'

export async function GET() {
  return NextResponse.json({ ok: true })
}
