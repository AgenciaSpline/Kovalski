'use server'

import prisma from './prisma'
import { revalidatePath } from 'next/cache'
import { checkSuperAdmin } from './superadmin-actions'

export async function renovarPlanoConta(contaId: string, meses: number) {
  try {
    await checkSuperAdmin()
    const conta = await prisma.conta.findUnique({ where: { id: contaId } })
    if (!conta) return { success: false, error: 'Conta não encontrada.' }

    // Calcula a nova data de vencimento com base no plano escolhido
    // Se a conta já estava atrasada, conta a partir de hoje
    // Se a conta tem crédito, soma os meses à data atual
    let baseDate = conta.dataProximoVencimento ? new Date(conta.dataProximoVencimento) : new Date()
    const hoje = new Date()

    if (baseDate < hoje) {
      baseDate = hoje // Resetando caso estivesse muito atrasado
    }

    baseDate.setMonth(baseDate.getMonth() + meses)

    await prisma.conta.update({
      where: { id: contaId },
      data: {
        dataProximoVencimento: baseDate,
        status: 'ATIVO' // Se estava bloqueado por falta de pagamento, libera o acesso
      }
    })

    // Update existing pending payments to PAGO
    await prisma.pagamentoMensalidade.updateMany({
      where: { contaId, status: 'PENDENTE' },
      data: {
        status: 'PAGO',
        dataPagamento: new Date()
      }
    })

    // (Opcional) Gerar um log de pagamento/fatura aqui se necessário no futuro

    revalidatePath('/superadmin')
    return { success: true, novaData: baseDate }
  } catch (error) {
    console.error('Erro ao renovar plano:', error)
    return { success: false, error: 'Falha ao renovar o plano da conta.' }
  }
}
