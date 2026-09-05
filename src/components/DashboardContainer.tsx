'use client'

import React, { useState, startTransition } from 'react'
import Sidebar from './Sidebar'
import DashboardView from './DashboardView'
import EleitoresView from './EleitoresView'
import EtiquetasView from './EtiquetasView'
import LocalidadesView from './LocalidadesView'
import ListaTransmissaoView from './ListaTransmissaoView'
import FormulariosView from './FormulariosView'
import CorrespondenciaView from './CorrespondenciaView'
import UsuariosView from './UsuariosView'
import { useRouter } from 'next/navigation'

interface FunilItem {
  nome: string
  quantidade: number
  cor: string
}

interface BairroItem {
  bairro: string
  quantidade: number
}

interface DashboardData {
  totalEleitores: number
  metaVotos: number
  cargoRegiao: string
  votosPossiveis: number
  funilTemperatura: FunilItem[]
  dadosBairros: BairroItem[]
}

interface Etiqueta {
  id: string
  nome: string
  categoria: string
  cor: string
}

interface Cidade {
  id: string
  nome: string
}

interface Bairro {
  id: string
  nome: string
  cidadeId: string
  cidade?: Cidade
}

interface Eleitor {
  id: string
  nomeCompleto: string
  telefone: string
  logradouro: string | null
  numero: string | null
  bairro: string
  cidade: string
  bairroId: string
  cidadeId: string
  dataNascimento: Date | null
  temperatura: number
  etiquetas: Etiqueta[]
  isLider: boolean
  liderId: string | null
  liderNome: string | null
}

interface Disparo {
  id: string
  titulo: string
  mensagem: string
  status: string
  criadoEm: Date
  listaId: string | null
  listaNome: string
  total: number
  sucesso: number
  erro: number
}

interface Lider {
  id: string
  nomeCompleto: string
  telefone: string
}

interface Formulario {
  id: string
  titulo: string
  descricao: string | null
  cidadeId: string | null
  bairroId: string | null
  liderId: string | null
  exibirDataNascimento: boolean
  exibirEndereco: boolean
  cidade?: Cidade | null
  bairro?: Bairro | null
  lider?: Lider | null
  etiquetas: Etiqueta[]
  leadsCount: number
  criadoEm: Date
}

interface DashboardContainerProps {
  initialStats: DashboardData
  initialEleitores: Eleitor[]
  initialEtiquetas: Etiqueta[]
  initialBairros: Bairro[]
  initialCidades: Cidade[]
  initialDisparos: Disparo[]
  initialFormularios: Formulario[]
  initialListasTransmissao: any[]
  initialCorrespondenciaTemplates: any[]
  initialUsuarios: any[]
}

export default function DashboardContainer({
  initialStats,
  initialEleitores,
  initialEtiquetas,
  initialBairros,
  initialCidades,
  initialDisparos,
  initialFormularios,
  initialListasTransmissao,
  initialCorrespondenciaTemplates,
  initialUsuarios
}: DashboardContainerProps) {
  const router = useRouter()
  const [currentTab, setCurrentTab] = useState<any>('dashboard')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  // Função para recarregar dados do servidor de forma transparente e atualizar os componentes filhos
  const handleRefresh = () => {
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 text-slate-800 relative isolation-auto">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onChangeTab={setCurrentTab}
        isMobileOpen={isMobileMenuOpen}
        onToggleMobile={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
        <div>
          {currentTab === 'dashboard' && (
            <DashboardView
              stats={initialStats}
              bairros={initialBairros}
              onRefresh={handleRefresh}
            />
          )}

          {currentTab === 'eleitores' && (
            <EleitoresView
              eleitores={initialEleitores}
              etiquetas={initialEtiquetas}
              bairros={initialBairros}
              cidades={initialCidades}
              onRefresh={handleRefresh}
            />
          )}

          {currentTab === 'etiquetas' && (
            <EtiquetasView
              etiquetas={initialEtiquetas}
              onRefresh={handleRefresh}
            />
          )}

          {currentTab === 'localidades' && (
            <LocalidadesView
              cidades={initialCidades}
              bairros={initialBairros}
              onRefresh={handleRefresh}
            />
          )}

          {currentTab === 'listatransmissao' && (
            <ListaTransmissaoView
              eleitores={initialEleitores}
              etiquetas={initialEtiquetas}
              bairros={initialBairros}
              disparos={initialDisparos}
              listas={initialListasTransmissao}
              onRefresh={handleRefresh}
            />
          )}

          {currentTab === 'correspondencia' && (
            <CorrespondenciaView
              eleitores={initialEleitores}
              etiquetas={initialEtiquetas}
              bairros={initialBairros}
              templates={initialCorrespondenciaTemplates}
              onRefresh={handleRefresh}
            />
          )}

          {currentTab === 'usuarios' && (
            <UsuariosView
              usuarios={initialUsuarios}
              onRefresh={handleRefresh}
            />
          )}

          {currentTab === 'formularios' && (
            <FormulariosView
              formularios={initialFormularios}
              cidades={initialCidades}
              bairros={initialBairros}
              etiquetas={initialEtiquetas}
              lideres={initialEleitores.filter(e => e.isLider).map(e => ({
                id: e.id,
                nomeCompleto: e.nomeCompleto,
                telefone: e.telefone
              }))}
              onRefresh={handleRefresh}
            />
          )}
        </div>
      </main>
    </div>
  )
}
