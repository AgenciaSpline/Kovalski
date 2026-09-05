'use server'

import prisma from './prisma'
import { revalidatePath } from 'next/cache'
import * as bcrypt from 'bcryptjs'
import { getCurrentUser } from './auth'

export async function checkSuperAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'SUPERADMIN') {
    throw new Error("Acesso negado. Apenas o Super Admin pode executar esta ação.")
  }
}

export async function getPlanos() {
  try {
    await checkSuperAdmin()
    return await prisma.plano.findMany({ orderBy: { valor: 'asc' } })
  } catch (err) {
    console.error(err)
    return []
  }
}

export async function getContasMaster() {
  try {
    await checkSuperAdmin()
    const contas = await prisma.conta.findMany({
      include: {
        plano: true,
        pagamentos: {
          orderBy: { dataVencimento: 'desc' },
          take: 1
        },
        _count: {
          select: { eleitores: true, usuarios: true }
        }
      },
      orderBy: { criadoEm: 'desc' }
    })

    return contas.map(c => ({
      id: c.id,
      nome: c.nome,
      status: c.status,
      plano: c.plano ? c.plano.nome : 'Sem Plano',
      diaVencimento: c.diaVencimento,
      dataProximoVencimento: c.dataProximoVencimento,
      eleitores: c._count.eleitores,
      usuarios: c._count.usuarios,
      ultimoPagamentoStatus: c.pagamentos.length > 0 ? c.pagamentos[0].status : 'N/A',
      ultimoPagamentoVencimento: c.pagamentos.length > 0 ? c.pagamentos[0].dataVencimento : null
    }))
  } catch (err) {
    console.error(err)
    return []
  }
}

export async function createCliente(data: {
  nomeCampanha: string
  nomeAdmin: string
  emailAdmin: string
  senhaAdmin: string
  planoId: string
  diaVencimento: number
}) {
  try {
    await checkSuperAdmin()

    // Verificar se email existe
    const userExist = await prisma.usuario.findUnique({ where: { email: data.emailAdmin } })
    if (userExist) return { success: false, error: 'O E-mail escolhido para o admin deste cliente já está em uso.' }

    const hashedPassword = await bcrypt.hash(data.senhaAdmin, 10)

    // Gerar um slug seguro baseado no nome da campanha
    let slug = data.nomeCampanha.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const slugExist = await prisma.conta.findUnique({ where: { slug } })
    if (slugExist) slug += '-' + Date.now()

    // 1. Criar a Conta
    const dataVencimentoReal = new Date()
    dataVencimentoReal.setMonth(dataVencimentoReal.getMonth() + 1) // 30 dias por padrão inicialmente

    const novaConta = await prisma.conta.create({
      data: {
        nome: data.nomeCampanha,
        slug,
        status: 'ATIVO',
        planoId: data.planoId,
        diaVencimento: data.diaVencimento,
        dataProximoVencimento: dataVencimentoReal
      }
    })

    // 2. Criar o Usuário Administrador vinculado a conta
    await prisma.usuario.create({
      data: {
        nome: data.nomeAdmin,
        email: data.emailAdmin,
        senha: hashedPassword,
        role: 'ADMIN',
        contaId: novaConta.id
      }
    })

    // 3. Gerar a primeira fatura (vencendo no proximo mes)
    const proximoMes = new Date()
    proximoMes.setMonth(proximoMes.getMonth() + 1)
    proximoMes.setDate(data.diaVencimento)

    const plano = await prisma.plano.findUnique({ where: { id: data.planoId }})
    if (plano) {
      await prisma.pagamentoMensalidade.create({
        data: {
          contaId: novaConta.id,
          valor: plano.valor,
          dataVencimento: dataVencimentoReal,
          status: 'PAGO'
        }
      })
    }

    revalidatePath('/superadmin')
    return { success: true }
  } catch (error) {
    console.error('Erro ao criar cliente:', error)
    return { success: false, error: 'Falha ao criar o cliente.' }
  }
}

export async function alternarStatusConta(contaId: string, statusAtivo: boolean) {
  try {
    await checkSuperAdmin()
    await prisma.conta.update({
      where: { id: contaId },
      data: { status: statusAtivo ? 'ATIVO' : 'BLOQUEADO' }
    })
    revalidatePath('/superadmin')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Falha ao alterar status.' }
  }
}

export async function editarClienteMaster(contaId: string, data: { nome: string, planoId: string, diaVencimento: number, dataProximoVencimento: Date | null }) {
  try {
    await checkSuperAdmin()

    await prisma.conta.update({
      where: { id: contaId },
      data: {
        nome: data.nome,
        planoId: data.planoId,
        diaVencimento: data.diaVencimento,
        dataProximoVencimento: data.dataProximoVencimento
      }
    })

    revalidatePath('/superadmin')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Falha ao editar cliente.' }
  }
}
