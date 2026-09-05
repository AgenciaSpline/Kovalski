import React from 'react'
import { LogoutButton } from '@/components/LogoutButton'
import { getDashboardStats, getEleitores, getEtiquetas, getBairros, getCidades, getDisparos, getFormularios, getListasTransmissao, getCorrespondenciaTemplates, getUsuarios } from '@/lib/actions'
import DashboardContainer from '@/components/DashboardContainer'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function Home({
  searchParams
}: {
  searchParams: { bairro?: string }
}) {
  const activeBairro = searchParams?.bairro || 'todos'
  const user = await getCurrentUser()

  if (user && user.contaId) {
    const conta = await prisma.conta.findUnique({ where: { id: user.contaId } })
    if (conta && conta.status !== 'ATIVO') {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 max-w-md w-full text-center shadow-2xl">
            <div className="text-5xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold text-white mb-2">Acesso Bloqueado</h1>
            <p className="text-slate-400 mb-6">
              A conta da sua campanha ({conta.nome}) encontra-se bloqueada ou com pendências financeiras.
            </p>
            <p className="text-sm text-slate-500 mb-6">Por favor, entre em contato com o administrador do sistema para regularizar o acesso.</p>
            <LogoutButton className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-bold transition w-full inline-block text-center" />
          </div>
        </div>
      )
    }
  }

  // Buscar todas as informações necessárias no banco de dados em paralelo usando Server Actions locais
  let statsRes, eleitores, etiquetas, bairros, cidades, disparos, formularios, listas, correspondenciaTemplates, usuarios;
  try {
    const results = await Promise.all([
      getDashboardStats(activeBairro).catch(e => { console.error('Erro STATS:', e); return { success: false } }),
      getEleitores().catch(e => { console.error('Erro ELEITORES:', e); return [] }),
      getEtiquetas().catch(e => { console.error('Erro ETIQUETAS:', e); return [] }),
      getBairros().catch(e => { console.error('Erro BAIRROS:', e); return [] }),
      getCidades().catch(e => { console.error('Erro CIDADES:', e); return [] }),
      getDisparos().catch(e => { console.error('Erro DISPAROS:', e); return [] }),
      getFormularios().catch(e => { console.error('Erro FORMULARIOS:', e); return [] }),
      getListasTransmissao().catch(e => { console.error('Erro LISTAS:', e); return [] }),
      getCorrespondenciaTemplates().catch(e => { console.error('Erro TEMPLATES:', e); return [] }),
      getUsuarios().catch(e => { console.error('Erro USUARIOS:', e); return [] }),
    ])
    statsRes = results[0] || { success: false }
    eleitores = results[1] || []
    etiquetas = results[2] || []
    bairros = results[3] || []
    cidades = results[4] || []
    disparos = results[5] || []
    formularios = results[6] || []
    listas = results[7] || []
    correspondenciaTemplates = results[8] || []
    usuarios = results[9] || []
  } catch (error) {
    console.error('Falha fatal no promise.all da Dashboard:', error)
    statsRes = { success: false }
    eleitores = []
    etiquetas = []
    bairros = []
    cidades = []
    disparos = []
    formularios = []
    listas = []
    correspondenciaTemplates = []
    usuarios = []
  }

  // Dados padrão do Dashboard caso ocorra alguma falha na conexão do banco
  const defaultStats = {
    totalEleitores: 0,
    metaVotos: 0,
    cargoRegiao: 'Sem Conexão',
    votosPossiveis: 0,
    funilTemperatura: [],
    dadosBairros: []
  }

  const stats = statsRes.success && statsRes.data ? statsRes.data : defaultStats

  return (
    <DashboardContainer
      initialStats={stats}
      initialEleitores={eleitores}
      initialEtiquetas={etiquetas}
      initialBairros={bairros}
      initialCidades={cidades}
      initialDisparos={disparos}
      initialFormularios={formularios}
      initialListasTransmissao={listas}
      initialCorrespondenciaTemplates={correspondenciaTemplates}
      initialUsuarios={usuarios}
    />
  )
}
