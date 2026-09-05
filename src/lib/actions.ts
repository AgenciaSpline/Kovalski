'use server'

import prisma from './prisma'
import { revalidatePath } from 'next/cache'
import fs from 'fs'
import * as bcrypt from 'bcryptjs'
import { getCurrentUser } from './auth'
import { normalizeText, findClosestMatch } from './utils'

// ==========================================
// USUARIOS ACTIONS
// ==========================================

export async function getUsuarios() {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return []

    const data = await prisma.usuario.findMany({ where: { contaId: user.contaId }, orderBy: { nome: 'asc' },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        fotoPerfil: true,
        criadoEm: true
      }
    })
    return data
  } catch (error) {
    console.error('Erro ao buscar usuários:', error)
    return []
  }
}

export async function createUsuario(data: { nome: string; email: string; senha?: string; role: string }) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return [] as any

    const existing = await prisma.usuario.findUnique({
      where: { email: data.email },
    })
    if (existing) {
      return [] as any
    }

    const hashedPassword = await bcrypt.hash(data.senha || '123456', 10)

    const usuario = await prisma.usuario.create({
      data: {
        contaId: user.contaId, nome: data.nome,
        email: data.email,
        senha: hashedPassword,
        role: data.role,
      },
    })
    revalidatePath('/')
    return { success: true, data: { id: usuario.id } }
  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    return [] as any
  }
}

export async function updateUsuario(id: string, data: { nome: string; email: string; senha?: string; role: string }) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return [] as any

    const existing = await prisma.usuario.findFirst({
      where: { email: data.email, NOT: { id } },
    })
    if (existing) {
      return [] as any
    }

    const updateData: any = {
      nome: data.nome,
      email: data.email,
      role: data.role,
    }

    if (data.senha && data.senha.trim().length > 0) {
      updateData.senha = await bcrypt.hash(data.senha, 10)
    }

    await prisma.usuario.update({
      where: { id },
      data: updateData,
    })
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error)
    return [] as any
  }
}

export async function updateFotoPerfil(userId: string, base64Image: string) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return [] as any

    const currentUser = user
    if (!currentUser || currentUser.id !== userId) {
      // Allow if SUPERADMIN or ADMIN of the same account?
      // For now let's just let the user update their own photo
      if (currentUser?.id !== userId && currentUser?.role !== 'ADMIN' && currentUser?.role !== 'SUPERADMIN') {
         return [] as any
      }
    }

    await prisma.usuario.update({
      where: { id: userId },
      data: { fotoPerfil: base64Image }
    })

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Erro ao atualizar foto de perfil:', error)
    return [] as any
  }
}

export async function deleteUsuario(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return [] as any

    await prisma.usuario.delete({
      where: { id },
    })
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Erro ao excluir usuário:', error)
    return [] as any
  }
}

// ==========================================
// ETIQUETAS ACTIONS
// ==========================================

export async function getEtiquetas() {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return []

    return await prisma.etiqueta.findMany({ where: { contaId: user.contaId, }, 
      orderBy: { nome: 'asc' },
     })
  } catch (error) {
    console.error('Erro ao buscar etiquetas:', error)
    return []
  }
}

export async function createEtiqueta(data: {
  nome: string
  categoria: string
  cor: string
}) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return [] as any

    const etiqueta = await prisma.etiqueta.create({
      data: {
        contaId: user.contaId, nome: data.nome,
        categoria: data.categoria,
        cor: data.cor,
      },
    })
    revalidatePath('/')
    return { success: true, data: etiqueta }
  } catch (error) {
    console.error('Erro ao criar etiqueta:', error)
    return [] as any
  }
}

export async function updateEtiqueta(
  id: string,
  data: { nome: string; categoria: string; cor: string }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return [] as any

    const etiqueta = await prisma.etiqueta.update({ where: { contaId: user.contaId, id },
      data: {
        nome: data.nome,
        categoria: data.categoria,
        cor: data.cor,
      },
    })
    revalidatePath('/')
    return { success: true, data: etiqueta }
  } catch (error) {
    console.error('Erro ao atualizar etiqueta:', error)
    return [] as any
  }
}

export async function deleteEtiqueta(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return [] as any

    await prisma.etiqueta.delete({ where: { contaId: user.contaId, id },
    })
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Erro ao excluir etiqueta:', error)
    return [] as any
  }
}

// ==========================================
// CIDADES ACTIONS
// ==========================================

export async function getCidades() {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return []

    return await prisma.cidade.findMany({ where: { contaId: user.contaId, },
      orderBy: { nome: 'asc' },
     })
  } catch (error) {
    console.error('Erro ao buscar cidades:', error)
    return []
  }
}

export async function createCidade(data: { nome: string }) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return [] as any

    const existing = await prisma.cidade.findFirst({
      where: { contaId: user.contaId, nome: data.nome },
    })
    if (existing) {
      return [] as any
    }
    const cidade = await prisma.cidade.create({
      data: {
        contaId: user.contaId, nome: data.nome },
    })
    revalidatePath('/')
    return { success: true, data: cidade }
  } catch (error) {
    console.error('Erro ao criar cidade:', error)
    return [] as any
  }
}

export async function updateCidade(id: string, data: { nome: string }) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return [] as any

    const existing = await prisma.cidade.findFirst({
      where: { contaId: user.contaId, nome: data.nome,
        NOT: { id },
      },
    })
    if (existing) {
      return [] as any
    }
    const cidade = await prisma.cidade.update({ where: { contaId: user.contaId, id },
      data: { nome: data.nome },
    })
    revalidatePath('/')
    return { success: true, data: cidade }
  } catch (error) {
    console.error('Erro ao atualizar cidade:', error)
    return [] as any
  }
}

export async function deleteCidade(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return [] as any

    // Verificar se há eleitores vinculados diretamente à cidade
    const eleitoresCount = await prisma.eleitor.count({
      where: { contaId: user.contaId, cidadeId: id },
    })
    if (eleitoresCount > 0) {
      return [] as any
    }

    // Verificar se há bairros vinculados à cidade
    const bairrosCount = await prisma.bairro.count({
      where: { contaId: user.contaId, cidadeId: id },
    })
    if (bairrosCount > 0) {
      return [] as any
    }

    await prisma.cidade.delete({ where: { contaId: user.contaId, id },
    })
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Erro ao excluir cidade:', error)
    return [] as any
  }
}

// ==========================================
// BAIRROS ACTIONS
// ==========================================

export async function getBairros() {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return []

    return await prisma.bairro.findMany({ where: { contaId: user.contaId, }, 
      orderBy: { nome: 'asc' },
      include: {
        cidade: true,
      },
     })
  } catch (error) {
    console.error('Erro ao buscar bairros:', error)
    return []
  }
}

export async function createBairro(data: { nome: string; cidadeId: string }) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return [] as any

    const existing = await prisma.bairro.findFirst({
      where: { contaId: user.contaId, nome: data.nome,
        cidadeId: data.cidadeId, },
    })
    if (existing) {
      return [] as any
    }
    const bairro = await prisma.bairro.create({
      data: {
        contaId: user.contaId, nome: data.nome,
        cidadeId: data.cidadeId,
      },
    })
    revalidatePath('/')
    return { success: true, data: bairro }
  } catch (error) {
    console.error('Erro ao criar bairro:', error)
    return [] as any
  }
}

export async function updateBairro(id: string, data: { nome: string; cidadeId: string }) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return [] as any

    const existing = await prisma.bairro.findFirst({
      where: { contaId: user.contaId, nome: data.nome,
        cidadeId: data.cidadeId,
        NOT: { id },
      },
    })
    if (existing) {
      return [] as any
    }
    const bairro = await prisma.bairro.update({ where: { contaId: user.contaId, id },
      data: {
        nome: data.nome,
        cidadeId: data.cidadeId,
      },
    })
    revalidatePath('/')
    return { success: true, data: bairro }
  } catch (error) {
    console.error('Erro ao atualizar bairro:', error)
    return [] as any
  }
}

export async function deleteBairro(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return { success: false, error: 'Não autorizado.' }

    const eleitoresCount = await prisma.eleitor.count({
      where: { contaId: user.contaId, bairroId: id },
    })
    if (eleitoresCount > 0) {
      return { success: false, error: 'Este bairro possui eleitores vinculados e não pode ser apagado.' }
    }

    await prisma.bairro.delete({ where: { contaId: user.contaId, id } })
    revalidatePath('/')
    return { success: true }
  } catch (error: any) {
    console.error('Erro ao excluir bairro:', error)
    if (error?.code === 'P2003') {
      return { success: false, error: 'O bairro está em uso (ex: vinculado a listas, templates ou eleitores antigos) e não pode ser excluído.' }
    }
    return { success: false, error: 'Ocorreu um erro interno ao excluir o bairro.' }
  }
}

export async function deleteBairrosEmMassa(ids: string[]) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return { success: false, error: 'Não autorizado.' }

    // Encontra todos os bairros dentre os selecionados que estão sendo usados por pelo menos um eleitor
    const bairrosComEleitores = await prisma.eleitor.findMany({
      where: { contaId: user.contaId, bairroId: { in: ids } },
      select: { bairroId: true }
    })

    const bairrosBloqueadosIds = Array.from(new Set(bairrosComEleitores.map(e => e.bairroId)))
    const bairrosParaApagar = ids.filter(id => !bairrosBloqueadosIds.includes(id))

    if (bairrosParaApagar.length === 0) {
      return { success: false, error: 'Todos os bairros selecionados possuem eleitores e não podem ser apagados.' }
    }

    await prisma.bairro.deleteMany({
      where: {
        contaId: user.contaId,
        id: { in: bairrosParaApagar }
      }
    })

    revalidatePath('/')
    return {
      success: true,
      apagados: bairrosParaApagar.length,
      bloqueados: ids.length - bairrosParaApagar.length
    }
  } catch (error: any) {
    console.error('Erro ao apagar bairros em massa:', error)
    if (error?.code === 'P2003') {
      return { success: false, error: 'Alguns bairros não puderam ser excluídos pois estão em uso no sistema.' }
    }
    return { success: false, error: 'Ocorreu um erro ao excluir os bairros.' }
  }
}

// ==========================================
// ELEITORES ACTIONS
// ==========================================

function calcularTemperaturaPorTags(tagCount: number): number {
  if (tagCount === 0) return 1
  if (tagCount === 1) return 2
  if (tagCount === 2) return 3
  if (tagCount === 3) return 4
  return 5
}

async function syncTemperaturaEleitor(id: string, manualTemp?: number) {
  const user = await getCurrentUser()
  if (!user || !user.contaId) return
  const eleitor = await prisma.eleitor.findUnique({
    where: { contaId: user.contaId, id },
    include: { _count: { select: { etiquetas: true } } }
  })
  if (!eleitor) return

  const tagsCount = eleitor._count.etiquetas
  const tempCalc = calcularTemperaturaPorTags(tagsCount)

  let novaTemp = Math.max(eleitor.temperatura, tempCalc)
  if (manualTemp !== undefined) {
    novaTemp = Math.max(manualTemp, tempCalc)
  }

  if (novaTemp !== eleitor.temperatura) {
    await prisma.eleitor.update({
      where: { contaId: user.contaId, id },
      data: { temperatura: novaTemp }
    })
  }
}

export interface EleitorFilters {
  search?: string
  bairro?: string // bairroId
  temperatura?: number
  idadeMin?: number
  idadeMax?: number
  temLogradouro?: boolean | null
  temNumero?: boolean | null
  etiquetaIds?: string[]
}

export async function getEleitores(filters: EleitorFilters = {}) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return []

    const where: any = { contaId: user.contaId }

    if (filters.search) {
      where.OR = [
        { nomeCompleto: { contains: filters.search, mode: 'insensitive' } },
        { logradouro: { contains: filters.search, mode: 'insensitive' } },
        { cidade: { nome: { contains: filters.search, mode: 'insensitive' } } },
        { bairro: { nome: { contains: filters.search, mode: 'insensitive' } } }
      ]
    }

    if (filters.bairro && filters.bairro !== 'todos') {
      where.bairroId = filters.bairro
    }

    if (filters.temperatura && filters.temperatura !== 0) {
      where.temperatura = Number(filters.temperatura)
    }

    // Filtros avançados: idade
    if (typeof filters.idadeMin === 'number' || typeof filters.idadeMax === 'number') {
      const today = new Date()
      const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000

      if (typeof filters.idadeMin === 'number') {
        const maxAllowedAge = Math.min(filters.idadeMin, 150)
        const bornAfter = new Date(today.getTime() - ((maxAllowedAge + 1) * MS_PER_YEAR))
        if (where.dataNascimento) {
          where.AND = [...(where.AND || []), { dataNascimento: { gt: bornAfter } }]
        } else {
          where.dataNascimento = { gt: bornAfter }
        }
      }

      if (typeof filters.idadeMax === 'number') {
        const minAllowedAge = Math.max(filters.idadeMax, 0)
        const bornBefore = new Date(today.getTime() - (minAllowedAge * MS_PER_YEAR))
        if (where.dataNascimento && typeof where.dataNascimento === 'object' && !(where.dataNascimento instanceof Date)) {
          where.dataNascimento = { ...where.dataNascimento, lt: bornBefore }
        } else {
          where.dataNascimento = { lt: bornBefore }
        }
      }
    }

    // Filtros avançados: endereço
    if (filters.temLogradouro === true) {
      where.AND = [
        ...(where.AND || []),
        { logradouro: { not: null } },
        { logradouro: { not: '' } }
      ]
    } else if (filters.temLogradouro === false) {
      where.AND = [
        ...(where.AND || []),
        { OR: [{ logradouro: null }, { logradouro: '' }] }
      ]
    }

    if (filters.temNumero === true) {
      where.AND = [
        ...(where.AND || []),
        { numero: { not: null } },
        { numero: { not: '' } }
      ]
    } else if (filters.temNumero === false) {
      where.AND = [
        ...(where.AND || []),
        { OR: [{ numero: null }, { numero: '' }] }
      ]
    }

    // Filtros avançados: etiquetas (AND - precisa ter TODAS as etiquetas selecionadas)
    if (filters.etiquetaIds && filters.etiquetaIds.length > 0) {
      where.AND = [
        ...(where.AND || []),
        ...filters.etiquetaIds.map((etiquetaId) => ({
          etiquetas: { some: { etiquetaId } }
        }))
      ]
    }

    const data = await prisma.eleitor.findMany({ where: { ...where, contaId: user.contaId },
      include: {
        bairro: {
          include: {
            cidade: true,
          },
        },
        cidade: true,
        lider: true,
        etiquetas: {
          include: {
            etiqueta: true,
          },
        },
      },
      orderBy: { nomeCompleto: 'asc' },
          })

    // Mapear para facilitar o uso no frontend mantendo compatibilidade
    return data.map((eleitor) => ({
      ...eleitor,
      bairro: eleitor.bairro.nome,
      cidade: eleitor.cidade.nome,
      bairroId: eleitor.bairroId,
      cidadeId: eleitor.cidadeId,
      liderNome: eleitor.lider?.nomeCompleto || null,
      etiquetas: eleitor.etiquetas.map((ee) => ee.etiqueta),
    }))
  } catch (error) {
    console.error('Erro ao buscar eleitores:', error)
    return []
  }
}

export async function getHistoricosEleitor(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return [] as any
    const hist = await prisma.historicoEleitor.findMany({
      where: { eleitorId: id },
      orderBy: { criadoEm: 'desc' }
    })
    return hist
  } catch (error) {
    console.error('Erro ao buscar históricos:', error)
    return []
  }
}

export async function createEleitor(data: {
  nomeCompleto: string
  telefone: string
  logradouro?: string
  numero?: string
  bairroId: string
  cidadeId: string
  dataNascimento?: Date
  temperatura: number
  etiquetaIds: string[]
  isLider?: boolean
  liderId?: string
}) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return [] as any

    const cleanPhone = data.telefone.replace(/\D/g, '')

    // Verificar se já existe um eleitor com esse telefone
    const existing = await prisma.eleitor.findFirst({
      where: { contaId: user.contaId, telefone: cleanPhone },
    })

    if (existing) {
      // Upsert: Atualizar os dados do eleitor existente e adicionar as novas tags
      const updateData: any = {}

      // Atualizar dados básicos caso não existam no registro atual ou sejam novos inputs
      if (data.nomeCompleto && existing.nomeCompleto !== data.nomeCompleto) updateData.nomeCompleto = data.nomeCompleto
      if (data.logradouro && !existing.logradouro) updateData.logradouro = data.logradouro
      if (data.numero && !existing.numero) updateData.numero = data.numero
      if (data.bairroId && existing.bairroId !== data.bairroId) updateData.bairroId = data.bairroId
      if (data.cidadeId && existing.cidadeId !== data.cidadeId) updateData.cidadeId = data.cidadeId
      if (data.dataNascimento && !existing.dataNascimento) updateData.dataNascimento = data.dataNascimento
      if (data.temperatura && existing.temperatura !== data.temperatura) updateData.temperatura = data.temperatura
      if (data.isLider !== undefined && existing.isLider !== data.isLider) updateData.isLider = data.isLider
      if (data.liderId && !existing.liderId) updateData.liderId = data.liderId

      const eleitorAtualizado = await prisma.eleitor.update({ where: { contaId: user.contaId, id: existing.id },
        data: {
          ...updateData,
          etiquetas: {
            // Ignorará erros de constraint por duplicidade nas etiquetas (se aplicável ao DB, mas garantimos verificando depois ou upsert)
            // Para etiquetas, precisamos conectar ou criar a relação sem duplicar
            connectOrCreate: data.etiquetaIds.map(id => ({
              where: { contaId: user.contaId, eleitorId_etiquetaId: { eleitorId: existing.id, etiquetaId: id }
              },
              create: {
                etiquetaId: id
              }
            }))
          },
          historicos: {
            create: {
              tipo: 'ATUALIZACAO',
              descricao: `Cadastro unificado manualmente pelo painel.`
            }
          }
        },
      })

      await syncTemperaturaEleitor(existing.id, data.temperatura)

      revalidatePath('/')
      return { success: true, data: eleitorAtualizado }
    }

    const eleitor = await prisma.eleitor.create({ data: {
        contaId: user.contaId, nomeCompleto: data.nomeCompleto,
        telefone: cleanPhone,
        logradouro: data.logradouro,
        numero: data.numero,
        bairroId: data.bairroId,
        cidadeId: data.cidadeId,
        dataNascimento: data.dataNascimento,
        temperatura: data.temperatura,
        isLider: data.isLider ?? false,
        liderId: data.liderId || null,
        etiquetas: {
          create: data.etiquetaIds.map((id) => ({
            etiquetaId: id,
          })),
        },
        historicos: {
          create: {
            tipo: 'CRIACAO',
            descricao: `Cadastrado manualmente pelo painel.`
          }
        }
      },
    })

    await syncTemperaturaEleitor(eleitor.id, data.temperatura)

    revalidatePath('/')
    return { success: true, data: eleitor }
  } catch (error) {
    console.error('Erro ao criar eleitor:', error)
    return [] as any
  }
}

export async function updateEleitor(
  id: string,
  data: {
    nomeCompleto: string
    telefone: string
    logradouro?: string
    numero?: string
    bairroId: string
    cidadeId: string
    dataNascimento?: Date
    temperatura: number
    etiquetaIds: string[]
    isLider?: boolean
    liderId?: string
  }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return [] as any

    const cleanPhone = data.telefone.replace(/\D/g, '')

    // Verificar duplicidade de telefone (se mudou)
    const existing = await prisma.eleitor.findFirst({
      where: { contaId: user.contaId, telefone: cleanPhone,
        NOT: { id },
      },
    })
    if (existing) {
      return [] as any
    }

    // Atualizar dados cadastrais
    await prisma.eleitor.update({ where: { contaId: user.contaId, id },
      data: {
        nomeCompleto: data.nomeCompleto,
        telefone: cleanPhone,
        logradouro: data.logradouro,
        numero: data.numero,
        bairroId: data.bairroId,
        cidadeId: data.cidadeId,
        dataNascimento: data.dataNascimento,
        temperatura: data.temperatura,
        isLider: data.isLider ?? false,
        liderId: data.liderId || null,
        historicos: {
          create: {
            tipo: 'ATUALIZACAO',
            descricao: `Dados atualizados manualmente pelo painel.`
          }
        }
      },
    })

    // Atualizar etiquetas N:N (Excluir antigas e inserir novas)
    await prisma.eleitorEtiqueta.deleteMany({
      where: { eleitorId: id },
    })

    if (data.etiquetaIds.length > 0) {
      await prisma.eleitorEtiqueta.createMany({
        data: data.etiquetaIds.map((etiquetaId) => ({
          eleitorId: id,
          etiquetaId,
        })),
      })
    }

    await syncTemperaturaEleitor(id, data.temperatura)

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Erro ao atualizar eleitor:', error)
    return [] as any
  }
}

export async function deleteEleitor(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return [] as any

    await prisma.eleitor.delete({ where: { contaId: user.contaId, id },
    })
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Erro ao excluir eleitor:', error)
    return [] as any
  }
}

export async function deleteEleitoresEmMassa(ids: string[]) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return [] as any

    await prisma.eleitor.deleteMany({
      where: {
        id: { in: ids },
        contaId: user.contaId
      }
    })
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error(error)
    return [] as any
  }
}

export async function updateEleitoresEmMassa(
  ids: string[],
  data: {
    bairroId?: string
    cidadeId?: string
    temperatura?: number
    isLider?: boolean
    addTags?: string[]
    removeTags?: string[]
  }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return [] as any

    // Atualizações diretas de campos simples
    const updateData: any = {}
    if (data.bairroId !== undefined) updateData.bairroId = data.bairroId
    if (data.cidadeId !== undefined) updateData.cidadeId = data.cidadeId
    if (data.temperatura !== undefined) updateData.temperatura = data.temperatura
    if (data.isLider !== undefined) updateData.isLider = data.isLider

    if (Object.keys(updateData).length > 0) {
      await prisma.eleitor.updateMany({
        where: { id: { in: ids }, contaId: user.contaId },
        data: updateData
      })
    }

    // Gerenciamento de Tags (N:N)
    if ((data.addTags && data.addTags.length > 0) || (data.removeTags && data.removeTags.length > 0)) {
      if (data.removeTags && data.removeTags.length > 0) {
        await prisma.eleitorEtiqueta.deleteMany({
          where: {
            eleitorId: { in: ids },
            etiquetaId: { in: data.removeTags }
          }
        })
      }

      if (data.addTags && data.addTags.length > 0) {
        for (const eleitorId of ids) {
          for (const etiquetaId of data.addTags) {
            const existe = await prisma.eleitorEtiqueta.findUnique({
              where: { eleitorId_etiquetaId: { eleitorId, etiquetaId } }
            })
            if (!existe) {
              await prisma.eleitorEtiqueta.create({
                data: { eleitorId, etiquetaId }
              })
            }
          }
        }
      }
    }

    // Criar histórico para todos
    const historicos = ids.map(id => ({
      eleitorId: id,
      tipo: 'ATUALIZACAO',
      descricao: 'Dados atualizados em massa via painel.'
    }))
    await prisma.historicoEleitor.createMany({
      data: historicos
    })

    // Sincronizar a temperatura de todos baseada nas novas tags
    for (const eleitorId of ids) {
      await syncTemperaturaEleitor(eleitorId, data.temperatura)
    }

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error(error)
    return [] as any
  }
}

// ==========================================
// DASHBOARD ACTIONS
// ==========================================

export async function getDashboardStats(bairroFilter?: string) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return [] as any

    const where: any = { contaId: user.contaId }
    if (bairroFilter && bairroFilter !== 'todos') {
      where.bairroId = bairroFilter
    }

    // 1. Total de Eleitores (com filtro geográfico opcional)
    const totalEleitores = await prisma.eleitor.count({ where: { ...where, contaId: user.contaId } })

    // 2. Metas de Campanha
    const meta = await prisma.metaCampanha.findFirst()
    const metaVotos = meta ? meta.metaVotos : 0
    const cargoRegiao = meta ? meta.cargoRegiao : 'Não configurado'

    // 3. Contagem por nível de temperatura
    const contagemTemperatura = await prisma.eleitor.groupBy({
      by: ['temperatura'],
      where,
      _count: {
        id: true,
      },
     })

    // Mapear contagens para um array de 1 a 5 ordenado
    const contagemMap: { [key: number]: number } = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    }

    contagemTemperatura.forEach((group) => {
      contagemMap[group.temperatura] = group._count.id
    })

    // Pesos da fórmula de Projeção de Votos:
    // Temp 1 (Frio) -> Peso 0.0
    // Temp 2 (Morno) -> Peso 0.25
    // Temp 3 (Inclinado) -> Peso 0.50
    // Temp 4 (Quente) -> Peso 0.80
    // Temp 5 (Multiplicador) -> Peso 1.00
    const pesos: { [key: number]: number } = {
      1: 0.0,
      2: 0.25,
      3: 0.5,
      4: 0.8,
      5: 1.0,
    }

    let votosPossiveis = 0
    Object.keys(contagemMap).forEach((tempStr) => {
      const temp = Number(tempStr)
      const qtd = contagemMap[temp]
      const peso = pesos[temp]
      votosPossiveis += qtd * peso
    })

    // Formatar para exibição no gráfico
    const funilTemperatura = [
      { nome: '1 - Frio (0%)', quantidade: contagemMap[1], cor: '#ef4444' },
      { nome: '2 - Morno (25%)', quantidade: contagemMap[2], cor: '#f97316' },
      { nome: '3 - Inclinado (50%)', quantidade: contagemMap[3], cor: '#eab308' },
      { nome: '4 - Quente (80%)', quantidade: contagemMap[4], cor: '#3b82f6' },
      { nome: '5 - Líder (100%)', quantidade: contagemMap[5], cor: '#10b981' },
    ]

    // Estatísticas por Bairro (panorama geral, sempre global)
    const eleitoresPorBairro = await prisma.eleitor.groupBy({ where: { contaId: user.contaId }, 
      by: ['bairroId'],
      _count: {
        id: true,
      },
     })

    // Obter nomes dos bairros em cache de memória para o mapeamento
    const allBairros = await prisma.bairro.findMany()
    const bairroMap = new Map(allBairros.map((b) => [b.id, b.nome]))

    const dadosBairros = eleitoresPorBairro
      .map((eb) => ({
        bairro: bairroMap.get(eb.bairroId) || 'Desconhecido',
        quantidade: eb._count.id,
      }))
      .sort((a, b) => a.bairro.localeCompare(b.bairro))

    return {
      success: true,
      data: {
        totalEleitores,
        metaVotos,
        cargoRegiao,
        votosPossiveis: Math.round(votosPossiveis * 10) / 10, // arredondar para 1 casa decimal
        funilTemperatura,
        dadosBairros,
      },
    }
  } catch (error) {
    console.error('Erro ao carregar estatísticas do dashboard:', error)
    return {
      success: false,
      error: 'Erro interno ao carregar estatísticas.',
      data: {
        totalEleitores: 0,
        metaVotos: 0,
        cargoRegiao: 'Erro de conexão',
        votosPossiveis: 0,
        funilTemperatura: [],
        dadosBairros: [],
      },
    }
  }
}

export async function saveMetaCampanha(cargoRegiao: string, metaVotos: number) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return [] as any

    const meta = await prisma.metaCampanha.findFirst()

    if (meta) {
      await prisma.metaCampanha.update({ where: { id: meta.id },
        data: { cargoRegiao, metaVotos },
      })
    } else {
      await prisma.metaCampanha.create({
        data: {
        contaId: user.contaId, cargoRegiao, metaVotos },
      })
    }

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Erro ao salvar meta de campanha:', error)
    return [] as any
  }
}

// ==========================================
// LIDERANÇAS E MALA DIRETA ACTIONS
// ==========================================

export async function getLideres() {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return []

    const data = await prisma.eleitor.findMany({
      where: { contaId: user.contaId, isLider: true },
      orderBy: { nomeCompleto: 'asc' },
    })
    return data.map((eleitor) => ({
      id: eleitor.id,
      nomeCompleto: eleitor.nomeCompleto,
      telefone: eleitor.telefone,
    }))
  } catch (error) {
    console.error('Erro ao buscar líderes:', error)
    return []
  }
}

export async function getDisparos() {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return []

    const disparos = await prisma.disparo.findMany({ where: { contaId: user.contaId, }, 
      orderBy: { criadoEm: 'desc' },
      include: {
        logs: true,
        lista: {
          select: {
            nome: true
          }
        }
      }
     })

    return disparos.map(d => {
      const total = d.logs.length
      const sucesso = d.logs.filter(l => l.status === 'Enviado').length
      const erro = d.logs.filter(l => l.status === 'Erro').length
      return {
        id: d.id,
        titulo: d.titulo,
        mensagem: d.mensagem,
        status: d.status,
        criadoEm: d.criadoEm,
        listaNome: d.lista?.nome || 'Mala Direta Direta',
        listaId: d.listaId,
        total,
        sucesso,
        erro
      }
    })
  } catch (error) {
    console.error('Erro ao buscar disparos:', error)
    return []
  }
}

export async function createEleitorPublic(data: {
  nomeCompleto: string
  telefone: string
  logradouro?: string
  numero?: string
  bairroId: string
  cidadeId: string
  dataNascimento?: Date
  liderId?: string
}) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return [] as any

    const cleanPhone = data.telefone.replace(/\D/g, '')

    // Criar/Buscar etiqueta padrão "Cadastro Web"
    let webTag = await prisma.etiqueta.findFirst({
      where: { contaId: user.contaId, nome: 'Cadastro Web' }
    })
    if (!webTag) {
      webTag = await prisma.etiqueta.create({
        data: {
        contaId: user.contaId, nome: 'Cadastro Web',
          categoria: 'Origem',
          cor: '#f97316'
        }
      })
    }

    // Verificar se já existe um eleitor com esse telefone
    const existing = await prisma.eleitor.findFirst({
      where: { contaId: user.contaId, telefone: cleanPhone },
    })

    if (existing) {
      // Upsert: Atualiza os dados se novos
      const updateData: any = {}
      if (data.nomeCompleto && existing.nomeCompleto !== data.nomeCompleto) updateData.nomeCompleto = data.nomeCompleto
      if (data.logradouro && !existing.logradouro) updateData.logradouro = data.logradouro
      if (data.numero && !existing.numero) updateData.numero = data.numero
      if (data.bairroId && existing.bairroId !== data.bairroId) updateData.bairroId = data.bairroId
      if (data.cidadeId && existing.cidadeId !== data.cidadeId) updateData.cidadeId = data.cidadeId
      if (data.dataNascimento && !existing.dataNascimento) updateData.dataNascimento = data.dataNascimento
      if (data.liderId && !existing.liderId) updateData.liderId = data.liderId

      const eleitorAtualizado = await prisma.eleitor.update({ where: { contaId: user.contaId, id: existing.id },
        data: {
          ...updateData,
          etiquetas: {
            connectOrCreate: [{
              where: { contaId: user.contaId, eleitorId_etiquetaId: { eleitorId: existing.id, etiquetaId: webTag.id }
              },
              create: {
                etiquetaId: webTag.id
              }
            }]
          },
          historicos: {
            create: {
              tipo: 'ATUALIZACAO',
              descricao: `Cadastro unificado via Cadastro Público (Web).`
            }
          }
        }
      })

      await syncTemperaturaEleitor(existing.id)

      revalidatePath('/')
      return { success: true, data: eleitorAtualizado }
    }

    const eleitor = await prisma.eleitor.create({ data: {
        contaId: user.contaId, nomeCompleto: data.nomeCompleto,
        telefone: cleanPhone,
        logradouro: data.logradouro,
        numero: data.numero,
        bairroId: data.bairroId,
        cidadeId: data.cidadeId,
        dataNascimento: data.dataNascimento,
        temperatura: 1, // Default cold
        isLider: false,
        liderId: data.liderId || null,
        etiquetas: {
          create: [{ etiquetaId: webTag.id }]
        },
        historicos: {
          create: {
            tipo: 'CRIACAO',
            descricao: `Cadastrado via Cadastro Público (Web).`
          }
        }
      },
    })

    await syncTemperaturaEleitor(eleitor.id)

    revalidatePath('/')
    return { success: true, data: eleitor }
  } catch (error) {
    console.error('Erro ao fazer cadastro público:', error)
    return [] as any
  }
}

export async function enviarMalaDireta(data: {
  eleitorIds: string[]
  mensagemTemplate: string
  listaId?: string
}) {
  const wahaUrl = process.env.WAHA_URL
  const wahaApiKey = process.env.WAHA_API_KEY

  if (!wahaUrl || !wahaApiKey) {
    return [] as any
  }

  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return [] as any

    const disparo = await prisma.disparo.create({
      data: {
        contaId: user.contaId, titulo: `Disparo em massa - ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`,
        mensagem: data.mensagemTemplate,
        status: 'Enviando',
        listaId: data.listaId || null
      }
    })

    const eleitores = await prisma.eleitor.findMany({
      where: { contaId: user.contaId, id: { in: data.eleitorIds } }
    })

    for (const eleitor of eleitores) {
      let statusLog = 'Enviado'
      let erroLog: string | null = null

      try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return [] as any
        const formatPhone = eleitor.telefone.replace(/\D/g, '')

        let phoneWithDdi = formatPhone
        if (formatPhone.length === 11 || formatPhone.length === 10) {
          phoneWithDdi = `55${formatPhone}`
        }

        const chatId = `${phoneWithDdi}@c.us`
        const text = data.mensagemTemplate.replace(/{nome}/g, eleitor.nomeCompleto)

        const response = await fetch(`${wahaUrl}/api/sendText`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': wahaApiKey
          },
          body: JSON.stringify({
            chatId,
            text,
          })
        })

        if (!response.ok) {
          throw new Error(`WAHA HTTP ${response.status} - ${await response.text()}`)
        }
      } catch (err: any) {
        statusLog = 'Erro'
        erroLog = err.message || 'Erro desconhecido'
      }

      await prisma.disparoLog.create({
        data: {
          disparoId: disparo.id,
          eleitorId: eleitor.id,
          status: statusLog,
          erro: erroLog
        }
      })
    }

    await prisma.disparo.update({ where: { contaId: user.contaId, id: disparo.id },
      data: { status: 'Concluido' }
    })

    revalidatePath('/')
    return { success: true, disparoId: disparo.id }
  } catch (error) {
    console.error('Erro Mala Direta:', error)
    return [] as any
  }
}

// ==========================================
// FORMULARIOS ACTIONS
// ==========================================

export async function getFormularios() {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return []

    const formularios = await prisma.formulario.findMany({ where: { contaId: user.contaId, }, 
      include: {
        cidade: true,
        bairro: true,
        lider: true,
        etiquetas: {
          include: {
            etiqueta: true,
          },
        },
        _count: {
          select: {
            eleitores: true,
          },
        },
      },
      orderBy: { criadoEm: 'desc' },
     })

    return formularios.map((f) => ({
      id: f.id,
      titulo: f.titulo,
      descricao: f.descricao,
      cidadeId: f.cidadeId,
      bairroId: f.bairroId,
      liderId: f.liderId,
      cidade: f.cidade,
      bairro: f.bairro,
      lider: f.lider,
      exibirDataNascimento: f.exibirDataNascimento,
      exibirEndereco: f.exibirEndereco,
      etiquetas: f.etiquetas.map((fe) => fe.etiqueta),
      leadsCount: f._count.eleitores,
      criadoEm: f.criadoEm,
    }))
  } catch (error) {
    console.error('Erro ao buscar formulários:', error)
    return []
  }
}

export async function getFormulario(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return null

    const f = await prisma.formulario.findFirst({
      where: { contaId: user.contaId, id },
      include: {
        cidade: true,
        bairro: true,
        lider: true,
        etiquetas: {
          include: {
            etiqueta: true,
          },
        },
      },
    })
    if (!f) return null

    return {
      id: f.id,
      titulo: f.titulo,
      descricao: f.descricao,
      cidadeId: f.cidadeId,
      bairroId: f.bairroId,
      liderId: f.liderId,
      cidade: f.cidade,
      bairro: f.bairro,
      lider: f.lider,
      etiquetas: f.etiquetas.map((fe) => fe.etiqueta),
      criadoEm: f.criadoEm,
    }
  } catch (error) {
    console.error('Erro ao obter formulário:', error)
    return null
  }
}

export async function createFormulario(data: {
  titulo: string
  descricao?: string
  cidadeId?: string
  bairroId?: string
  liderId?: string
  exibirDataNascimento: boolean
  exibirEndereco: boolean
  etiquetaIds?: string[]
}) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return [] as any

    if (!data.titulo.trim()) {
      return [] as any
    }

    const formulario = await prisma.formulario.create({
      data: {
        contaId: user.contaId, titulo: data.titulo,
        descricao: data.descricao || null,
        cidadeId: data.cidadeId || null,
        bairroId: data.bairroId || null,
        liderId: data.liderId || null,
        exibirDataNascimento: data.exibirDataNascimento,
        exibirEndereco: data.exibirEndereco,
        etiquetas: {
          create: data.etiquetaIds?.map((id) => ({
            etiquetaId: id,
          })) || [],
        },
      },
    })

    revalidatePath('/')
    return { success: true, data: formulario }
  } catch (error) {
    console.error('Erro ao criar formulário:', error)
    return [] as any
  }
}

export async function deleteFormulario(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return [] as any

    await prisma.formulario.delete({ where: { contaId: user.contaId, id },
    })
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Erro ao excluir formulário:', error)
    return [] as any
  }
}

export async function updateFormulario(
  id: string,
  data: {
    titulo: string
    descricao?: string
    cidadeId?: string
    bairroId?: string
    liderId?: string
    exibirDataNascimento: boolean
    exibirEndereco: boolean
    etiquetaIds?: string[]
  }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return [] as any

    if (!data.titulo.trim()) {
      return [] as any
    }

    await prisma.formulario.update({ where: { contaId: user.contaId, id },
      data: {
        titulo: data.titulo,
        descricao: data.descricao || null,
        cidadeId: data.cidadeId || null,
        bairroId: data.bairroId || null,
        liderId: data.liderId || null,
        exibirDataNascimento: data.exibirDataNascimento,
        exibirEndereco: data.exibirEndereco,
      },
    })

    // Atualizar relação N:N de etiquetas
    await prisma.formularioEtiqueta.deleteMany({
      where: { formularioId: id },
    })

    if (data.etiquetaIds && data.etiquetaIds.length > 0) {
      await prisma.formularioEtiqueta.createMany({
        data: data.etiquetaIds.map((etiquetaId) => ({
          formularioId: id,
          etiquetaId,
        })),
      })
    }

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Erro ao atualizar formulário:', error)
    return [] as any
  }
}

/**
 * Preview de conciliação: categoriza bairros da planilha como exatos, similares ou novos.
 */
export async function previewBairrosImport(cidadeId: string, bairrosNomes: string[]) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return [] as any

    // Filtra nomes válidos e remove duplicatas internas da lista
    const nomes = bairrosNomes
      .map(n => n.trim())
      .filter(n => n.length > 0)

    if (nomes.length === 0) return [] as any

    // Busca bairros existentes da cidade
    const existentes = await prisma.bairro.findMany({
      where: { contaId: user.contaId, cidadeId }
    })

    const exatos: { nomeOriginal: string; nomeExistente: string; id: string }[] = []
    const similares: { nomeOriginal: string; sugestao: { id: string; nome: string; distancia: number } }[] = []
    const novos: string[] = []

    // Já processados — evita mostrar o mesmo bairro duas vezes na lista
    const processados = new Set<string>()

    for (const nome of nomes) {
      const normalizado = normalizeText(nome)
      if (processados.has(normalizado)) continue
      processados.add(normalizado)

      // 1. Match exato (após normalização)
      const matchExato = existentes.find(b => normalizeText(b.nome) === normalizado)
      if (matchExato) {
        exatos.push({ nomeOriginal: nome, nomeExistente: matchExato.nome, id: matchExato.id })
        continue
      }

      // 2. Match similar (Levenshtein ≤ 3)
      const matchSimilar = findClosestMatch(nome, existentes, 3)
      if (matchSimilar) {
        similares.push({
          nomeOriginal: nome,
          sugestao: {
            id: matchSimilar.item.id,
            nome: matchSimilar.item.nome,
            distancia: matchSimilar.distance
          }
        })
        continue
      }

      // 3. Novo bairro
      novos.push(nome)
    }

    return { success: true, exatos, similares, novos }
  } catch (error) {
    console.error('Erro ao pré-visualizar bairros:', error)
    return [] as any
  }
}

/**
 * Confirma a importação de bairros após o usuário revisar a conciliação.
 * Cria novos bairros ou mapeia para existentes.
 */
export async function confirmarImportBairros(
  bairrosParaConfirmar: { nome: string; cidadeId: string; mapearPara?: string }[]
) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return [] as any

    let inseridos = 0
    let mapeados = 0

    for (const bairro of bairrosParaConfirmar) {
      if (bairro.mapearPara) {
        // Mapear para bairro existente — não cria nada, apenas conta como mapeado
        mapeados++
        continue
      }

      // Criar novo bairro
      const normalizado = normalizeText(bairro.nome)
      const existentes = await prisma.bairro.findMany({
        where: { contaId: user.contaId, cidadeId: bairro.cidadeId }
      })

      // Verificar se já existe (após normalização) — pode ter sido criado em iteração anterior
      const jaExiste = existentes.some(b => normalizeText(b.nome) === normalizado)
      if (jaExiste) continue

      await prisma.bairro.create({
        data: {
        contaId: user.contaId, cidadeId: bairro.cidadeId,
          nome: bairro.nome.trim()
        }
      })
      inseridos++
    }

    revalidatePath('/')
    return { success: true, inseridos, mapeados }
  } catch (error) {
    console.error('Erro ao confirmar importação de bairros:', error)
    return [] as any
  }
}

export async function previewCidadesImport(cidadesNomes: string[]) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return { success: false, error: 'Usuário não autenticado' }
    const nomes = cidadesNomes.map(n => n.trim()).filter(n => n.length > 0)
    if (nomes.length === 0) return { success: false, error: 'Nenhuma cidade fornecida' }
    const existentes = await prisma.cidade.findMany({ where: { contaId: user.contaId } })
    const exatos: { nomeOriginal: string; nomeExistente: string; id: string }[] = []
    const similares: { nomeOriginal: string; sugestao: { id: string; nome: string; distancia: number } }[] = []
    const novos: string[] = []
    const processados = new Set<string>()
    for (const nome of nomes) {
      const normalizado = normalizeText(nome)
      if (processados.has(normalizado)) continue
      processados.add(normalizado)
      const matchExato = existentes.find(c => normalizeText(c.nome) === normalizado)
      if (matchExato) {
        exatos.push({ nomeOriginal: nome, nomeExistente: matchExato.nome, id: matchExato.id })
        continue
      }
      const matchSimilar = findClosestMatch(nome, existentes, 3)
      if (matchSimilar) {
        similares.push({
          nomeOriginal: nome,
          sugestao: {
            id: matchSimilar.item.id,
            nome: matchSimilar.item.nome,
            distancia: matchSimilar.distance
          }
        })
      } else {
        novos.push(nome)
      }
    }
    return { success: true, exatos, similares, novos }
  } catch (error) {
    return { success: false, error: 'Erro interno ao analisar cidades' }
  }
}

export async function confirmarImportCidades(cidadesParaConfirmar: { nome: string; mapearPara?: string }[]) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return { success: false, error: 'Usuário não autenticado' }
    let inseridos = 0
    let mapeados = 0
    for (const cidade of cidadesParaConfirmar) {
      if (cidade.mapearPara) {
        mapeados++
        continue
      }
      const normalizado = normalizeText(cidade.nome)
      const existentes = await prisma.cidade.findMany({ where: { contaId: user.contaId } })
      const jaExiste = existentes.some(c => normalizeText(c.nome) === normalizado)
      if (jaExiste) continue
      await prisma.cidade.create({ data: { contaId: user.contaId, nome: cidade.nome.trim() } })
      inseridos++
    }
    revalidatePath('/')
    return { success: true, inseridos, mapeados }
  } catch (error) {
    return { success: false, error: 'Erro ao importar cidades' }
  }
}
export async function importBairrosEmMassa(cidadeId: string, bairrosTexto: string) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return [] as any

    // Divide por quebras de linha, remove espaços extras e ignora linhas vazias
    const nomes = bairrosTexto
      .split('\n')
      .map(linha => linha.trim())
      .filter(linha => linha.length > 0)

    if (nomes.length === 0) return [] as any

    // Busca os bairros que já existem para essa cidade, nesta conta
    const existentes = await prisma.bairro.findMany({
      where: { contaId: user.contaId, cidadeId }
    })
    const nomesExistentes = new Set(existentes.map(b => normalizeText(b.nome)))

    let inseridos = 0
    let ignorados = 0

    // Insere os que não existem
    for (const nome of nomes) {
      if (nomesExistentes.has(normalizeText(nome))) {
        ignorados++
      } else {
        await prisma.bairro.create({
          data: {
        contaId: user.contaId, cidadeId,
            nome
          }
        })
        nomesExistentes.add(normalizeText(nome)) // Para evitar duplicação na mesma lista
        inseridos++
      }
    }

    revalidatePath('/')
    return { success: true, inseridos, ignorados }
  } catch (error) {
    console.error('Erro ao importar bairros:', error)
    return [] as any
  }
}

export async function importEtiquetasEmMassa(categoria: string, etiquetasTexto: string) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return [] as any

    // Divide por quebras de linha, remove espaços extras e ignora linhas vazias
    const nomes = etiquetasTexto
      .split('\n')
      .map(linha => linha.trim())
      .filter(linha => linha.length > 0)

    if (nomes.length === 0) return [] as any

    // Busca as etiquetas que já existem
    const existentes = await prisma.etiqueta.findMany({
      where: { contaId: user.contaId, }
    })
    const nomesExistentes = new Set(existentes.map(e => e.nome.toLowerCase()))

    const PALETA_CORES = [
      '#3b82f6', // Azul
      '#10b981', // Esmeralda
      '#8b5cf6', // Violeta
      '#f97316', // Laranja
      '#ef4444', // Vermelho
      '#ec4899', // Rosa
      '#06b6d4', // Ciano
      '#f59e0b', // Amber
      '#64748b'  // Slate
    ]

    let inseridos = 0
    let ignorados = 0

    // Insere os que não existem
    for (const nome of nomes) {
      if (nomesExistentes.has(nome.toLowerCase())) {
        ignorados++
      } else {
        // Selecionar cor sortida baseada em inseridos (garante distribuição)
        const cor = PALETA_CORES[inseridos % PALETA_CORES.length]

        await prisma.etiqueta.create({
          data: {
        contaId: user.contaId, nome,
            categoria,
            cor
          }
        })
        nomesExistentes.add(nome.toLowerCase())
        inseridos++
      }
    }

    revalidatePath('/')
    return { success: true, inseridos, ignorados }
  } catch (error) {
    console.error('Erro ao importar etiquetas:', error)
    return [] as any
  }
}

export async function createEleitorPublicComForm(
  formId: string,
  data: {
    nomeCompleto: string
    telefone: string
    logradouro?: string
    numero?: string
    cidadeId?: string
    bairroId?: string
    dataNascimento?: Date
    liderId?: string
  }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return [] as any

    // 1. Buscar formulário
    const form = await prisma.formulario.findFirst({
      where: { contaId: user.contaId, id: formId },
      include: {
        etiquetas: true,
      },
    })

    if (!form) {
      return [] as any
    }

    const contaId = form.contaId

    // 2. Limpar número de telefone
    const cleanPhone = data.telefone.replace(/\D/g, '')
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      return [] as any
    }

    // 3. Resolver presets/dados finais
    const finalCidadeId = form.cidadeId || data.cidadeId
    const finalBairroId = form.bairroId || data.bairroId
    const finalLiderId = form.liderId || data.liderId || null

    if (!finalCidadeId) {
      return [] as any
    }
    if (!finalBairroId) {
      return [] as any
    }

    // 4. Garantir etiqueta de origem "Cadastro Web"
    let webTag = await prisma.etiqueta.findFirst({
      where: { contaId: user.contaId, nome: 'Cadastro Web' },
    })
    if (!webTag) {
      webTag = await prisma.etiqueta.create({
        data: {
        contaId: user.contaId,
          nome: 'Cadastro Web',
          categoria: 'Origem',
          cor: '#f97316',
        },
      })
    }

    const formTags = form.etiquetas.map((fe) => fe.etiquetaId)
    const uniqueTagIds = Array.from(new Set([webTag.id, ...formTags]))

    // 5. Verificar duplicidade de telefone
    const existing = await prisma.eleitor.findFirst({
      where: { contaId: user.contaId, telefone: cleanPhone },
    })

    if (existing) {
      // Upsert: Atualizar os dados do eleitor existente
      const updateData: any = {}
      if (data.nomeCompleto && existing.nomeCompleto !== data.nomeCompleto) updateData.nomeCompleto = data.nomeCompleto
      if (data.logradouro && !existing.logradouro) updateData.logradouro = data.logradouro
      if (data.numero && !existing.numero) updateData.numero = data.numero
      if (finalBairroId && existing.bairroId !== finalBairroId) updateData.bairroId = finalBairroId
      if (finalCidadeId && existing.cidadeId !== finalCidadeId) updateData.cidadeId = finalCidadeId
      if (data.dataNascimento && !existing.dataNascimento) updateData.dataNascimento = data.dataNascimento
      if (finalLiderId && !existing.liderId) updateData.liderId = finalLiderId

      const eleitorAtualizado = await prisma.eleitor.update({ where: { contaId: user.contaId, id: existing.id },
        data: {
          ...updateData,
          etiquetas: {
            connectOrCreate: uniqueTagIds.map(id => ({
              where: { contaId: user.contaId, eleitorId_etiquetaId: { eleitorId: existing.id, etiquetaId: id }
              },
              create: {
                etiquetaId: id
              }
            }))
          },
          historicos: {
            create: {
              tipo: 'ATUALIZACAO',
              descricao: `Atualizado pelo formulário: ${form.titulo}.`
            }
          }
        },
      })

      await syncTemperaturaEleitor(existing.id)

      revalidatePath('/')
      return { success: true, data: eleitorAtualizado }
    }

    // 6. Cadastrar o eleitor (caso não exista)
    const eleitor = await prisma.eleitor.create({ data: {
        contaId: user.contaId, nomeCompleto: data.nomeCompleto,
        telefone: cleanPhone,
        logradouro: data.logradouro || null,
        numero: data.numero || null,
        cidadeId: finalCidadeId,
        bairroId: finalBairroId,
        dataNascimento: data.dataNascimento || null,
        temperatura: 1, // Frio por padrão ao se cadastrar publicamente
        isLider: false,
        liderId: finalLiderId,
        formularioId: formId,
        etiquetas: {
          create: uniqueTagIds.map((id) => ({
            etiquetaId: id,
          })),
        },
        historicos: {
          create: {
            tipo: 'CRIACAO',
            descricao: `Cadastrado pelo formulário: ${form.titulo}.`
          }
        }
      },
    })

    await syncTemperaturaEleitor(eleitor.id)

    revalidatePath('/')
    return { success: true, data: eleitor }
  } catch (error) {
    console.error('Erro ao salvar cadastro público por formulário:', error)
    return [] as any
  }
}

// ==========================================
// LISTAS DE TRANSMISSÃO ACTIONS
// ==========================================

export async function getListasTransmissao() {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return []

    const listas = await prisma.listaTransmissao.findMany({ where: { contaId: user.contaId, }, 
      orderBy: { criadoEm: 'desc' },
      include: {
        bairro: true,
        etiquetas: {
          include: {
            etiqueta: true,
          },
        },
        eleitores: {
          include: {
            eleitor: true,
          },
        },
      },
     })

    const listasComContador = await Promise.all(
      listas.map(async (lista) => {
        let count = 0
        let resolvedIds: string[] = []

        if (lista.tipo === 'FILTRO') {
          const whereClause: any = { contaId: user.contaId }
          if (lista.bairroId) {
            whereClause.bairroId = lista.bairroId
          }
          if (lista.temperatura !== null && lista.temperatura !== undefined) {
            whereClause.temperatura = lista.temperatura
          }
          if (lista.etiquetas.length > 0) {
            const tagIds = lista.etiquetas.map((e) => e.etiquetaId)
            whereClause.etiquetas = {
              some: {
                etiquetaId: { in: tagIds },
              },
            }
          }

          let eleitores = await prisma.eleitor.findMany({
            where: whereClause,
            include: {
              etiquetas: true,
            },
          })

          // Filtro AND de tags (se o contato possuir TODAS as tags selecionadas)
          if (lista.etiquetas.length > 0) {
            const tagIds = lista.etiquetas.map((e) => e.etiquetaId)
            eleitores = eleitores.filter((el) =>
              tagIds.every((tagId) => el.etiquetas.some((e) => e.etiquetaId === tagId))
            )
          }

          count = eleitores.length
          resolvedIds = eleitores.map((el) => el.id)
        } else {
          count = lista.eleitores.length
          resolvedIds = lista.eleitores.map((e) => e.eleitorId)
        }

        return {
          id: lista.id,
          nome: lista.nome,
          descricao: lista.descricao,
          tipo: lista.tipo,
          bairroId: lista.bairroId,
          bairroNome: lista.bairro?.nome || null,
          temperatura: lista.temperatura,
          etiquetas: lista.etiquetas.map((e) => e.etiqueta),
          eleitoresIds: resolvedIds,
          eleitoresCount: count,
          criadoEm: lista.criadoEm,
        }
      })
    )

    return listasComContador
  } catch (error) {
    console.error('Erro ao buscar listas de transmissão:', error)
    return []
  }
}

export async function createListaTransmissao(data: {
  nome: string
  descricao?: string
  tipo: string // "FILTRO" | "MANUAL"
  bairroId?: string | null
  temperatura?: number | null
  etiquetaIds?: string[]
  eleitorIds?: string[]
}) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return [] as any

    const list = await prisma.listaTransmissao.create({
      data: {
        contaId: user.contaId, nome: data.nome,
        descricao: data.descricao || null,
        tipo: data.tipo,
        bairroId: data.bairroId || null,
        temperatura: data.temperatura !== undefined ? data.temperatura : null,
      },
    })

    if (data.tipo === 'FILTRO' && data.etiquetaIds && data.etiquetaIds.length > 0) {
      await prisma.listaTransmissaoEtiqueta.createMany({
        data: data.etiquetaIds.map((etiquetaId) => ({
          listaId: list.id,
          etiquetaId,
        })),
      })
    } else if (data.tipo === 'MANUAL' && data.eleitorIds && data.eleitorIds.length > 0) {
      await prisma.listaTransmissaoEleitor.createMany({
        data: data.eleitorIds.map((eleitorId) => ({
          listaId: list.id,
          eleitorId,
        })),
      })
    }

    revalidatePath('/')
    return { success: true, id: list.id }
  } catch (error: any) {
    console.error('Erro ao criar lista de transmissão:', error)
    try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return [] as any
      fs.writeFileSync('/root/projeto/crm-eleitoral/error.log', JSON.stringify({
        message: error.message,
        stack: error.stack,
        errorObj: error
      }, null, 2))
    } catch (fsErr) {
      console.error('Erro ao salvar error.log:', fsErr)
    }
    return { success: false, error: `Erro ao salvar a lista de transmissão: ${error.message || error}` }
  }
}

export async function deleteListaTransmissao(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return [] as any

    await prisma.listaTransmissao.delete({ where: { contaId: user.contaId, id },
    })
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Erro ao excluir lista de transmissão:', error)
    return [] as any
  }
}

export async function updateListaTransmissao(
  id: string,
  data: {
    nome: string
    descricao?: string
    tipo: string // "FILTRO" | "MANUAL"
    bairroId?: string | null
    temperatura?: number | null
    etiquetaIds?: string[]
    eleitorIds?: string[]
  }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return [] as any

    // Verificar duplicidade de nome em outras listas
    const existing = await prisma.listaTransmissao.findFirst({
      where: { contaId: user.contaId, nome: data.nome,
        NOT: { id },
      },
    })
    if (existing) {
      return [] as any
    }

    await prisma.listaTransmissao.update({ where: { contaId: user.contaId, id },
      data: {
        nome: data.nome,
        descricao: data.descricao || null,
        tipo: data.tipo,
        bairroId: data.bairroId || null,
        temperatura: data.temperatura !== undefined ? data.temperatura : null,
      },
    })

    // Limpar relações antigas
    await prisma.listaTransmissaoEtiqueta.deleteMany({
      where: { listaId: id },
    })
    await prisma.listaTransmissaoEleitor.deleteMany({
      where: { listaId: id },
    })

    if (data.tipo === 'FILTRO' && data.etiquetaIds && data.etiquetaIds.length > 0) {
      await prisma.listaTransmissaoEtiqueta.createMany({
        data: data.etiquetaIds.map((etiquetaId) => ({
          listaId: id,
          etiquetaId,
        })),
      })
    } else if (data.tipo === 'MANUAL' && data.eleitorIds && data.eleitorIds.length > 0) {
      await prisma.listaTransmissaoEleitor.createMany({
        data: data.eleitorIds.map((eleitorId) => ({
          listaId: id,
          eleitorId,
        })),
      })
    }

    revalidatePath('/')
    return { success: true, id }
  } catch (error: any) {
    console.error('Erro ao atualizar lista de transmissão:', error)
    return { success: false, error: `Erro ao atualizar a lista de transmissão: ${error.message || error}` }
  }
}

export async function importEleitores(rows: {
  nome: string
  telefone: string
  logradouro?: string | null
  numero?: string | null
  bairro?: string | null
  cidade?: string | null
  dataNascimento?: string | null
  temperatura?: number | null
  isLider?: boolean
  etiquetas?: string[]
}[]) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return [] as any

    let criados = 0
    let atualizados = 0

    // Buscar todas as cidades, bairros e etiquetas existentes para reduzir consultas no banco
    const existingCidades = await prisma.cidade.findMany({ where: { contaId: user.contaId, }})
    const existingBairros = await prisma.bairro.findMany({ where: { contaId: user.contaId, }})
    const existingEtiquetas = await prisma.etiqueta.findMany({ where: { contaId: user.contaId, }})

    // Mapas em memória para correspondência rápida por nome normalizado (lowercase e trim)
    const cidadeMap = new Map(existingCidades.map(c => [normalizeText(c.nome), c.id]))
    const bairroMap = new Map(existingBairros.map(b => [`${normalizeText(b.nome)}_${b.cidadeId}`, b.id]))
    const etiquetaMap = new Map(existingEtiquetas.map(e => [normalizeText(e.nome), e.id]))

    // Obter ou criar uma cidade padrão para fallback (ex: a primeira encontrada, ou "São Paulo")
    let defaultCidadeId = existingCidades[0]?.id
    if (!defaultCidadeId) {
      const defaultCidade = await prisma.cidade.create({
        data: {
        contaId: user.contaId, nome: 'São Paulo' }
      })
      defaultCidadeId = defaultCidade.id
      cidadeMap.set('são paulo', defaultCidade.id)
    }

    // Processar cada linha de eleitor
    for (const row of rows) {
      const cleanPhone = row.telefone.replace(/\D/g, '')
      if (!cleanPhone || !row.nome) continue

      // 1. Resolver Cidade ID
      let rowCidadeId = defaultCidadeId
      if (row.cidade) {
        const key = normalizeText(row.cidade)
        if (cidadeMap.has(key)) {
          rowCidadeId = cidadeMap.get(key)!
        } else {
          // Criar nova cidade
          const newCity = await prisma.cidade.create({
            data: {
        contaId: user.contaId, nome: row.cidade }
          })
          rowCidadeId = newCity.id
          cidadeMap.set(key, newCity.id)
        }
      }

      // 2. Resolver Bairro ID
      let rowBairroId: string
      let bairroName = row.bairro?.trim() || 'Centro'
      const bairroKey = `${normalizeText(bairroName)}_${rowCidadeId}`
      if (bairroMap.has(bairroKey)) {
        rowBairroId = bairroMap.get(bairroKey)!
      } else {
        // Criar novo bairro
        const newBairro = await prisma.bairro.create({
          data: {
        contaId: user.contaId, nome: bairroName,
            cidadeId: rowCidadeId
          }
        })
        rowBairroId = newBairro.id
        bairroMap.set(bairroKey, newBairro.id)
      }

      // 3. Resolver Data de Nascimento
      let parsedDate: Date | null = null
      if (row.dataNascimento) {
        const rawDate = String(row.dataNascimento).trim()

        // Tentar parsing do formato brasileiro DD/MM/AAAA ou DD-MM-AAAA
        const cleanDateStr = rawDate.replace(/-/g, '/')
        const parts = cleanDateStr.split('/')
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10)
          const month = parseInt(parts[1], 10) - 1
          const year = parseInt(parts[2], 10)
          if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            parsedDate = new Date(year, month, day)
          }
        } else {
          // Verificar se é número serial do Excel (ex: 35909)
          const num = Number(rawDate)
          if (!isNaN(num) && num > 10000 && num < 100000) {
            // Excel converte 1900-01-01 como 1. 25569 = 1970-01-01
            // Usamos UTC para evitar que timezone jogue um dia para trás
            parsedDate = new Date(Date.UTC(1899, 11, 30) + (num * 86400 * 1000))
          } else {
            // Fallback para parsing padrão
            const d = new Date(rawDate)
            if (!isNaN(d.getTime())) {
              parsedDate = d
            }
          }
        }

        // Garantir que o ano está num intervalo aceitável para o banco de dados
        if (parsedDate) {
          const y = parsedDate.getFullYear();
          if (y < 1900 || y > 2100) {
            parsedDate = null;
          }
        }
      }

      // 4. Resolver Temperatura (1 a 5, padrão 1)
      let temp = 1
      if (row.temperatura !== null && row.temperatura !== undefined) {
        const val = Number(row.temperatura)
        if (val >= 1 && val <= 5) {
          temp = val
        }
      }

      // 5. Resolver Etiquetas (Tags)
      const tagIds: string[] = []
      if (row.etiquetas && row.etiquetas.length > 0) {
        for (const tagName of row.etiquetas) {
          const key = normalizeText(tagName)
          if (etiquetaMap.has(key)) {
            tagIds.push(etiquetaMap.get(key)!)
          } else {
            // Criar etiqueta padrão do tipo "Outros"
            const newTag = await prisma.etiqueta.create({
              data: {
        contaId: user.contaId, nome: tagName.trim(),
                categoria: 'Importado',
                cor: '#64748b' // Slate por padrão
              }
            })
            tagIds.push(newTag.id)
            etiquetaMap.set(key, newTag.id)
          }
        }
      }

      // 6. Verificar se o eleitor com este telefone já existe
      const existingEleitor = await prisma.eleitor.findFirst({
        where: { contaId: user.contaId, telefone: cleanPhone }
      })

      if (existingEleitor) {
        // Atualizar eleitor existente
        await prisma.eleitor.update({ where: { contaId: user.contaId, id: existingEleitor.id },
          data: {
            nomeCompleto: row.nome,
            logradouro: row.logradouro || existingEleitor.logradouro,
            numero: row.numero || existingEleitor.numero,
            bairroId: rowBairroId,
            cidadeId: rowCidadeId,
            dataNascimento: parsedDate || existingEleitor.dataNascimento,
            temperatura: temp,
            isLider: row.isLider ?? existingEleitor.isLider,
            historicos: {
              create: {
                tipo: 'ATUALIZACAO',
                descricao: 'Dados atualizados via importação de planilha.'
              }
            }
          }
        })

        // Atualizar etiquetas N:N (adicionar novas sem apagar as antigas)
        if (tagIds.length > 0) {
          for (const etiquetaId of tagIds) {
            const hasTag = await prisma.eleitorEtiqueta.findUnique({
              where: { eleitorId_etiquetaId: { eleitorId: existingEleitor.id, etiquetaId } }
            })
            if (!hasTag) {
              await prisma.eleitorEtiqueta.create({
                data: { eleitorId: existingEleitor.id, etiquetaId }
              })
            }
          }
        }

        await syncTemperaturaEleitor(existingEleitor.id, temp)

        atualizados++
      } else {
        // Criar novo eleitor
        const newEleitor = await prisma.eleitor.create({ data: {
        contaId: user.contaId, nomeCompleto: row.nome,
            telefone: cleanPhone,
            logradouro: row.logradouro,
            numero: row.numero,
            bairroId: rowBairroId,
            cidadeId: rowCidadeId,
            dataNascimento: parsedDate,
            temperatura: temp,
            isLider: row.isLider ?? false,
            etiquetas: {
              create: tagIds.map(etiquetaId => ({
                etiquetaId
              }))
            },
            historicos: {
              create: {
                tipo: 'CRIACAO',
                descricao: 'Eleitor cadastrado via importação de planilha.'
              }
            }
          }
        })

        await syncTemperaturaEleitor(newEleitor.id, temp)

        criados++
      }
    }

    revalidatePath('/')
    return { success: true, criados, atualizados }
  } catch (error: any) {
    console.error('Erro ao importar eleitores:', error)
    return { success: false, error: `Falha ao importar planilha: ${error.message}` }
  }
}

// ==========================================
// CORRESPONDÊNCIA (MAIL MERGE) ACTIONS
// ==========================================

export async function getCorrespondenciaTemplates() {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return []

    return await prisma.correspondenciaTemplate.findMany({ where: { contaId: user.contaId, },
      orderBy: { criadoEm: 'desc' },
     })
  } catch (error) {
    console.error('Erro ao buscar templates de correspondência:', error)
    return []
  }
}

export async function createCorrespondenciaTemplate(data: {
  titulo: string
  categoria: string
  tipo: string
  conteudo?: string
  cabecalho?: string
  rodape?: string
  arquivoNome?: string
  arquivoBase64?: string
}) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return [] as any

    if (!data.titulo.trim()) {
      return [] as any
    }
    const template = await prisma.correspondenciaTemplate.create({
      data: {
        contaId: user.contaId, titulo: data.titulo,
        categoria: data.categoria || 'Geral',
        tipo: data.tipo || 'PDF',
        conteudo: data.conteudo || null,
        cabecalho: data.cabecalho || null,
        rodape: data.rodape || null,
        arquivoNome: data.arquivoNome || null,
        arquivoBase64: data.arquivoBase64 || null,
      },
    })
    revalidatePath('/')
    return { success: true, data: template }
  } catch (error) {
    console.error('Erro ao criar template de correspondência:', error)
    return [] as any
  }
}

export async function updateCorrespondenciaTemplate(
  id: string,
  data: {
    titulo: string
    categoria: string
    tipo: string
    conteudo?: string
    cabecalho?: string
    rodape?: string
    arquivoNome?: string
    arquivoBase64?: string
  }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return [] as any

    if (!data.titulo.trim()) {
      return [] as any
    }
    await prisma.correspondenciaTemplate.update({ where: { contaId: user.contaId, id },
      data: {
        titulo: data.titulo,
        categoria: data.categoria || 'Geral',
        tipo: data.tipo || 'PDF',
        conteudo: data.conteudo || null,
        cabecalho: data.cabecalho || null,
        rodape: data.rodape || null,
        arquivoNome: data.arquivoNome || null,
        arquivoBase64: data.arquivoBase64 || null,
      },
    })
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Erro ao atualizar template de correspondência:', error)
    return [] as any
  }
}

export async function deleteCorrespondenciaTemplate(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return [] as any

    await prisma.correspondenciaTemplate.delete({ where: { contaId: user.contaId, id },
    })
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Erro ao excluir template de correspondência:', error)
    return [] as any
  }
}

export async function mergeDuplicatasAutomatico() {
  try {
    const user = await getCurrentUser()
    if (!user || !user.contaId) return [] as any

    // Buscar todos os eleitores
    const todos = await prisma.eleitor.findMany({
      where: { contaId: user.contaId, },
      include: {
        etiquetas: true,
      }
    })

    // Agrupar por nome (normalizado)
    const grupos: Record<string, typeof todos> = {}
    for (const el of todos) {
      const nomeKey = el.nomeCompleto.trim().toLowerCase()
      if (!grupos[nomeKey]) grupos[nomeKey] = []
      grupos[nomeKey].push(el)
    }

    let mergedCount = 0

    // Processar cada grupo
    for (const [nome, lista] of Object.entries(grupos)) {
      if (lista.length <= 1) continue

      const processed = new Set<string>()

      for (let i = 0; i < lista.length; i++) {
        if (processed.has(lista[i].id)) continue

        const master = lista[i]
        const duplicatesToMerge = []

        for (let j = i + 1; j < lista.length; j++) {
          if (processed.has(lista[j].id)) continue
          const candidate = lista[j]

          const isSameBairro = master.bairroId === candidate.bairroId
          const isSameNasc = master.dataNascimento && candidate.dataNascimento &&
                             master.dataNascimento.getTime() === candidate.dataNascimento.getTime()

          if (isSameBairro || isSameNasc) {
            duplicatesToMerge.push(candidate)
            processed.add(candidate.id)
          }
        }

        if (duplicatesToMerge.length > 0) {
          const updateData: any = {}
          for (const dup of duplicatesToMerge) {
            if (!master.logradouro && dup.logradouro) updateData.logradouro = dup.logradouro
            if (!master.numero && dup.numero) updateData.numero = dup.numero
            if (!master.dataNascimento && dup.dataNascimento) updateData.dataNascimento = dup.dataNascimento
            if (!master.isLider && dup.isLider) updateData.isLider = true
            if (master.temperatura === 1 && dup.temperatura > 1) updateData.temperatura = dup.temperatura
            if (dup.telefone && dup.telefone !== master.telefone) {
              updateData.telefone = dup.telefone
              // Liberar o telefone do registro duplicado (que será apagado) para evitar erro de Unique Constraint
              await prisma.eleitor.update({
                where: { contaId: user.contaId, id: dup.id },
                data: { telefone: dup.telefone + '_dup_' + dup.id.substring(0, 4) }
              })
            }
          }

          if (Object.keys(updateData).length > 0) {
            await prisma.eleitor.update({
              where: { contaId: user.contaId, id: master.id },
              data: updateData
            })
          }

          for (const dup of duplicatesToMerge) {
            for (const etiq of dup.etiquetas) {
              const hasTag = await prisma.eleitorEtiqueta.findUnique({
                where: { eleitorId_etiquetaId: { eleitorId: master.id, etiquetaId: etiq.etiquetaId } }
              })
              if (!hasTag) {
                await prisma.eleitorEtiqueta.create({
                  data: { eleitorId: master.id, etiquetaId: etiq.etiquetaId }
                })
              }
            }
          }

          await syncTemperaturaEleitor(master.id)

          for (const dup of duplicatesToMerge) {
            await prisma.historicoEleitor.updateMany({
              where: { eleitorId: dup.id },
              data: { eleitorId: master.id }
            })

            const listas = await prisma.listaTransmissaoEleitor.findMany({ where: { eleitorId: dup.id } })
            for (const lst of listas) {
              const hasLst = await prisma.listaTransmissaoEleitor.findUnique({
                where: { listaId_eleitorId: { eleitorId: master.id, listaId: lst.listaId } }
              })
              if (!hasLst) {
                await prisma.listaTransmissaoEleitor.delete({
                  where: { listaId_eleitorId: { eleitorId: dup.id, listaId: lst.listaId } }
                })
                await prisma.listaTransmissaoEleitor.create({
                  data: { eleitorId: master.id, listaId: lst.listaId }
                })
              } else {
                await prisma.listaTransmissaoEleitor.delete({
                  where: { listaId_eleitorId: { eleitorId: dup.id, listaId: lst.listaId } }
                })
              }
            }
          }

          await prisma.historicoEleitor.create({
            data: {
              eleitorId: master.id,
              tipo: 'ATUALIZACAO',
              descricao: 'Mesclado automaticamente com ' + duplicatesToMerge.length + ' cadastro(s) duplicado(s).'
            }
          })

          for (const dup of duplicatesToMerge) {
            await prisma.eleitorEtiqueta.deleteMany({ where: { eleitorId: dup.id } })
            await prisma.eleitor.delete({ where: { contaId: user.contaId, id: dup.id } })
            mergedCount++
          }
        }
      }
    }

    revalidatePath('/')
    return { success: true, count: mergedCount }
  } catch (error: any) {
    console.error('Erro ao fundir duplicatas:', error)
    return { success: false, error: 'Erro ao mesclar contatos: ' + (error.message || String(error)) }
  }
}

