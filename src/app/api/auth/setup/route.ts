import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Rota pública para criar usuário de emergência que ignora NextAuth e bcryptjs para testarmos
export async function GET() {
  const email = "admin@kovalski.com"
  const senhaPlana = "admin123"

  try {
    const userExists = await prisma.usuario.findUnique({
      where: { email }
    })

    if (userExists) {
      return NextResponse.json({ success: true, message: `Usuario ${email} JÁ EXISTE no banco de dados. Senha no banco: ${userExists.senha}` })
    }

    await prisma.usuario.create({
      data: {
        nome: "Administrador Emergência",
        email: email,
        senha: senhaPlana, // Injetando em texto puro mesmo, o nosso app/api/auth agora lê texto puro se houver!
        role: "ADMIN"
      }
    })

    return NextResponse.json({ success: true, message: `Usuario ${email} CADASTRADO COM SUCESSO. Senha: ${senhaPlana}` })
  } catch(error: any) {
    return NextResponse.json({ success: false, error: error.message })
  }
}