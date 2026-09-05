'use client'

import React, { useState, useTransition } from 'react'
import { TrendingUp, Users, Target, Award, Loader2, Save, Sparkles, MapPin, ShieldAlert, Filter } from 'lucide-react'
import { saveMetaCampanha } from '@/lib/actions'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from './ui/Button'

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

interface Bairro {
  id: string
  nome: string
  cidadeId?: string
  cidade?: { id: string; nome: string }
}

interface DashboardViewProps {
  stats: DashboardData
  bairros: Bairro[]
  onRefresh: () => void
}

export default function DashboardView({ stats, bairros, onRefresh }: DashboardViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentBairroFilter = searchParams.get('bairro') || 'todos'

  const [isPending, startTransition] = useTransition()
  const [isEditingMeta, setIsEditingMeta] = useState(false)

  // Meta form state
  const [cargoRegiao, setCargoRegiao] = useState(stats.cargoRegiao)
  const [metaVotos, setMetaVotos] = useState(stats.metaVotos)
  const [errorMsg, setErrorMsg] = useState('')

  // Encontrar o nome do bairro ativo para exibição no aviso
  const activeBairroObj = bairros.find(b => b.id === currentBairroFilter)
  const activeBairroNome = activeBairroObj ? activeBairroObj.nome : currentBairroFilter

  // Função para mudar filtro de bairro e atualizar a URL
  const handleBairroChange = (bairro: string) => {
    const params = new URLSearchParams(window.location.search)
    if (bairro === 'todos') {
      params.delete('bairro')
    } else {
      params.set('bairro', bairro)
    }

    startTransition(() => {
      router.push(`/?${params.toString()}`)
      onRefresh()
    })
  }

  // Porcentagem de atingimento da meta
  const pctAtingida = stats.metaVotos > 0 ? (stats.votosPossiveis / stats.metaVotos) * 100 : 0
  const pctAtingidaFormatada = Math.min(100, Math.round(pctAtingida * 10) / 10)

  // Encontrar o bairro mais forte
  const bairroMaisForte = stats.dadosBairros.length > 0
    ? stats.dadosBairros.reduce((prev, current) => (prev.quantidade > current.quantidade) ? prev : current)
    : null

  // Calcular número de Lideranças Ativas (temperatura = 5, que é o último item do funil)
  const liderancasAtivas = stats.funilTemperatura.find(f => f.nome.includes('5 - Líder'))?.quantidade || 0

  // Calcular Média de Engajamento ponderada
  const totalEngajamento = stats.funilTemperatura.reduce((acc, curr, index) => acc + curr.quantidade * (index + 1), 0)
  const mediaEngajamento = stats.totalEleitores > 0 ? Math.round((totalEngajamento / stats.totalEleitores) * 10) / 10 : 0

  const handleSaveMeta = (e: React.FormEvent) => {
    e.preventDefault()
    if (!cargoRegiao.trim()) {
      setErrorMsg('A região/cargo é obrigatória.')
      return
    }
    if (metaVotos <= 0) {
      setErrorMsg('A meta de votos deve ser maior que zero.')
      return
    }

    startTransition(async () => {
      const res = await saveMetaCampanha(cargoRegiao, metaVotos)
      if (res.success) {
        setIsEditingMeta(false)
        onRefresh()
      } else {
        setErrorMsg(res.error || 'Erro ao salvar meta.')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary-600" />
            Visão Executiva da Campanha
          </h2>
          <p className="text-slate-500 text-sm">
            Métricas cruciais, projeções matemáticas de viabilidade e funil de eleitores.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Dropdown de Bairro no Dashboard */}
          <div className="relative w-full sm:w-48">
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-700 font-semibold"
              value={currentBairroFilter}
              onChange={(e) => handleBairroChange(e.target.value)}
            >
              <option value="todos">Todos os Bairros (Geral)</option>
              {bairros.map(b => (
                <option key={b.id} value={b.id}>{b.nome}</option>
              ))}
            </select>
          </div>
          <Button
            onClick={() => setIsEditingMeta(!isEditingMeta)}
            variant="secondary"
            className="flex-shrink-0"
          >
            {isEditingMeta ? 'Cancelar' : 'Metas'}
          </Button>
        </div>
      </div>

      {/* Form de Configuração de Metas */}
      {isEditingMeta && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm max-w-xl animate-in fade-in slide-in-from-top-4 duration-200">
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-3">Editar Meta de Campanha</h3>
          <form onSubmit={handleSaveMeta} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100 font-medium">
                {errorMsg}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Cargo / Região</label>
                <input
                  type="text"
                  placeholder="Ex: Vereador Centro, Deputado..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                  value={cargoRegiao}
                  onChange={(e) => setCargoRegiao(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Meta de Votos (Votos Alvo)</label>
                <input
                  type="number"
                  placeholder="Ex: 5000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                  value={metaVotos}
                  onChange={(e) => setMetaVotos(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="submit"
                disabled={isPending}
                isLoading={isPending}
                variant="primary"
                size="sm"
                leftIcon={!isPending && <Save className="w-3.5 h-3.5" />}
              >
                Salvar Meta
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Filtro ativo aviso */}
      {currentBairroFilter !== 'todos' && (
        <div className="p-3 bg-primary-50 text-primary-800 text-xs rounded-xl border border-primary-100 font-semibold flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary-600" />
          Mostrando dados filtrados apenas para o bairro: <span className="underline">{activeBairroNome}</span>. A projeção de votos possíveis e o engajamento referem-se a esta região.
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Card 1: Total Eleitores */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-slate-100 rounded-xl text-slate-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Eleitores Cadastrados</span>
            <span className="text-3xl font-bold text-slate-900 mt-1 block">{stats.totalEleitores}</span>
            <span className="text-xs text-slate-400 mt-1 block">Eleitores {currentBairroFilter !== 'todos' ? 'no bairro' : 'catalogados'}</span>
          </div>
        </div>

        {/* Card 2: Meta Votos */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl text-primary-600">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Meta de Votos</span>
            <span className="text-3xl font-bold text-slate-900 mt-1 block">{stats.metaVotos}</span>
            <span className="text-xs text-primary-600 font-medium mt-1 block truncate max-w-[200px]" title={stats.cargoRegiao}>
              {stats.cargoRegiao}
            </span>
          </div>
        </div>

        {/* Card 3: Votos Possíveis */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Votos Possíveis</span>
            <span className="text-3xl font-bold text-emerald-600 mt-1 block">{stats.votosPossiveis}</span>
            <span className="text-xs text-slate-400 mt-1 block">Projeção com pesos de temperatura</span>
          </div>
        </div>
      </div>

      {/* Novos Métricas Adicionais de Gabinete */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex justify-between items-center">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase block">Lideranças Ativas (Engajamento Máximo)</span>
            <span className="text-xl font-extrabold text-slate-800 mt-1 block">{liderancasAtivas} multiplicadores</span>
          </div>
          <span className="bg-emerald-50 text-emerald-800 text-xs font-bold px-2 py-1 rounded">Nível 5</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex justify-between items-center">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase block">Média de Temperatura (Engajamento Geral)</span>
            <span className="text-xl font-extrabold text-slate-800 mt-1 block">{mediaEngajamento} / 5</span>
          </div>
          <span className="bg-amber-50 text-amber-800 text-xs font-bold px-2 py-1 rounded">Média Geral</span>
        </div>
      </div>

      {/* Seção Principal: Progresso de Viabilidade e Funil */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Termômetro de Viabilidade */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Termômetro de Viabilidade</h3>
            <p className="text-slate-400 text-xs">Comparativo entre votos projetados e meta da campanha.</p>
          </div>

          <div className="flex flex-col items-center justify-center py-6 relative">
            {/* Medidor de progresso circular simplificado usando SVG */}
            <svg className="w-40 h-40 transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="64"
                className="stroke-slate-100"
                strokeWidth="12"
                fill="transparent"
              />
              <circle
                cx="80"
                cy="80"
                r="64"
                className="stroke-emerald-500 transition-all duration-500 ease-out"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={402}
                strokeDashoffset={402 - (402 * Math.min(100, pctAtingida)) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-3xl font-extrabold text-slate-800">{pctAtingidaFormatada}%</span>
              <span className="text-[10px] font-bold text-slate-400 block uppercase mt-0.5">da Meta Atingida</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex justify-between items-center text-sm">
            <div>
              <span className="text-xs text-slate-400 block">Projetado</span>
              <span className="font-bold text-slate-700">{stats.votosPossiveis} votos</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Meta</span>
              <span className="font-bold text-slate-700">{stats.metaVotos} votos</span>
            </div>
          </div>
        </div>

        {/* Funil de Temperatura */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Funil de Intenção de Voto (Temperatura)</h3>
            <p className="text-slate-400 text-xs">Divisão de eleitores de acordo com o grau de engajamento.</p>
          </div>

          <div className="space-y-4 pt-2">
            {stats.funilTemperatura.map((item) => {
              const maxQtd = Math.max(...stats.funilTemperatura.map(f => f.quantidade))
              const pctBarra = maxQtd > 0 ? (item.quantidade / maxQtd) * 100 : 0

              return (
                <div key={item.nome} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span>{item.nome}</span>
                    <span>{item.quantidade} eleitores</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pctBarra}%`, backgroundColor: item.cor }}
                      className="h-full rounded-full transition-all duration-500 ease-out"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Métricas Geográficas (Bairros) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Densidade de Eleitores por Bairro</h3>
            <p className="text-slate-400 text-xs">Identifique onde a presença da sua campanha é mais forte.</p>
          </div>
          {bairroMaisForte && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-xs text-emerald-800 font-semibold">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Bairro Forte: {bairroMaisForte.bairro} ({bairroMaisForte.quantidade})
            </div>
          )}
        </div>

        {stats.dadosBairros.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm">Nenhum eleitor cadastrado com bairro.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {stats.dadosBairros.map((b) => (
              <div key={b.bairro} className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="font-semibold text-slate-700 text-sm">{b.bairro}</span>
                </div>
                <span className="bg-white border border-slate-200 text-slate-800 text-xs font-extrabold px-2.5 py-1 rounded-lg">
                  {b.quantidade} eleitores
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
