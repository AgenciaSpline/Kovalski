import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const email = 'admin@kovalski.com'

    let user = await prisma.usuario.findUnique({ where: { email } })
    if (user) {
      await prisma.usuario.update({
        where: { email },
        data: { role: 'SUPERADMIN' }
      })
    } else {
      const pwd = await bcrypt.hash('admin123', 10)
      await prisma.usuario.create({
        data: {
          nome: 'Super Admin Jonatas',
          email,
          senha: pwd,
          role: 'SUPERADMIN',
        }
      })
    }

    // Verificar se há planos iniciais
    const count = await prisma.plano.count()
    if (count === 0) {
      await prisma.plano.createMany({
        data: [
          { nome: 'Básico', valor: 97.0, limiteEleitores: 1000, limiteUsuarios: 3 },
          { nome: 'Pro', valor: 197.0, limiteEleitores: 5000, limiteUsuarios: 10 },
          { nome: 'Ilimitado', valor: 497.0, limiteEleitores: 999999, limiteUsuarios: 99 }
        ]
      })
    }

    return NextResponse.json({ success: true, message: 'Super Admin criado e configurado com sucesso.' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message })
  }
}
