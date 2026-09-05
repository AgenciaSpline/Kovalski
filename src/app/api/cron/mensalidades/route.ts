import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Essa rota pode ser chamada externamente por um serviço de Cron Job (como Cron-job.org ou Vercel Cron)
// TODO: Adicionar um token de segurança para evitar que qualquer um chame a rota

export async function POST() {
  try {
    const hoje = new Date()

    // 1. Encontrar todas as contas que estão ATIVAS
    const contasAtivas = await prisma.conta.findMany({
      where: { status: 'ATIVO' },
      include: { plano: true }
    })

    let processadas = 0
    let bloqueadas = 0

    for (const conta of contasAtivas) {
      if (!conta.dataProximoVencimento) continue;

      const venceuHoje = new Date(conta.dataProximoVencimento) < hoje;

      // Se a data do cronometro expirou, bloqueia a conta
      if (venceuHoje) {
        await prisma.conta.update({
          where: { id: conta.id },
          data: { status: 'INADIMPLENTE' }
        })
        bloqueadas++
      }
      processadas++
    }

    return NextResponse.json({
      success: true,
      message: 'Cron finalizado.',
      processadas,
      bloqueadas
    })
  } catch (error) {
    console.error('Erro no cron job:', error)
    return NextResponse.json({ success: false, error: 'Erro interno.' }, { status: 500 })
  }
}
