'use client'

import React, { useState, useTransition } from 'react'
import { Send, MessageSquare, Users, CheckCircle2, AlertTriangle, Loader2, Filter, Info, History } from 'lucide-react'
import { enviarMalaDireta } from '@/lib/actions'
import MultiSelect from './MultiSelect'
import { Button } from './ui/Button'

interface Etiqueta {
  id: string
  nome: string
  categoria: string
  cor: string
}

interface Bairro {
  id: string
  nome: string
  cidadeId: string
  cidade?: { id: string; nome: string }
}

interface Eleitor {
  id: string
  nomeCompleto: string
  telefone: string
  bairroId: string
  temperatura: number
  etiquetas: Etiqueta[]
}

interface Disparo {
  id: string
  titulo: string
  mensagem: string
  status: string
  criadoEm: Date
  total: number
  sucesso: number
  erro: number
}

interface MalaDiretaViewProps {
  eleitores: Eleitor[]
  etiquetas: Etiqueta[]
  bairros: Bairro[]
  disparos: Disparo[]
  onRefresh: () => void
}

export default function MalaDiretaView({
  eleitores,
  etiquetas,
  bairros,
  disparos,
  onRefresh
}: MalaDiretaViewProps) {
  const [isPending, startTransition] = useTransition()

  // Broadcast Filter States
  const [selectedBairro, setSelectedBairro] = useState('todos')
  const [selectedTemp, setSelectedTemp] = useState<number>(0)
  const [selectedEtiquetas, setSelectedEtiquetas] = useState<string[]>([])

  // Message Composer States
  const [mensagemTemplate, setMensagemTemplate] = useState('')
  const [resultMsg, setResultMsg] = useState({ type: '', text: '' })

  // Filter Electors in Memory
  const targetEleitores = eleitores.filter(el => {
    // Filter by Bairro
    const matchesBairro = selectedBairro === 'todos' || el.bairroId === selectedBairro
    // Filter by Temperatura
    const matchesTemp = selectedTemp === 0 || el.temperatura === selectedTemp
    // Filter by Etiquetas (must match all selected tags, if any)
    const matchesTags = selectedEtiquetas.length === 0 ||
      selectedEtiquetas.every(tagId => el.etiquetas.some(t => t.id === tagId))

    return matchesBairro && matchesTemp && matchesTags
  })

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault()
    setResultMsg({ type: '', text: '' })

    if (targetEleitores.length === 0) {
      setResultMsg({ type: 'error', text: 'Nenhum destinatário selecionado com os filtros atuais.' })
      return
    }

    if (!mensagemTemplate.trim()) {
      setResultMsg({ type: 'error', text: 'Por favor, escreva uma mensagem para enviar.' })
      return
    }

    if (!confirm(`Deseja realmente enviar esta mensagem para ${targetEleitores.length} eleitor(es) via WhatsApp?`)) {
      return
    }

    startTransition(async () => {
      const payload = {
        eleitorIds: targetEleitores.map(el => el.id),
        mensagemTemplate
      }

      const res = await enviarMalaDireta(payload)

      if (res.success) {
        setResultMsg({ type: 'success', text: `Mala direta agendada e enviada com sucesso para ${targetEleitores.length} eleitor(es)!` })
        setMensagemTemplate('')
        onRefresh()
      } else {
        setResultMsg({ type: 'error', text: res.error || 'Erro ao processar Mala Direta.' })
      }
    })
  }

  const formatarData = (data: Date) => {
    const d = new Date(data)
    return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Send className="w-6 h-6 text-primary-600" />
          Mala Direta (WhatsApp Massivo)
        </h2>
        <p className="text-slate-500 text-sm">
          Filtre eleitores e envie mensagens personalizadas no WhatsApp via servidor integrado.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Lado Esquerdo: Filtros e Mensagem */}
        <div className="lg:col-span-2 space-y-6">

          <form onSubmit={handleSendBroadcast} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
              <Filter className="w-4 h-4 text-primary-600" />
              1. Filtrar Destinatários
            </h3>

            {resultMsg.text && (
              <div className={`p-4 rounded-lg border text-sm font-medium leading-relaxed flex items-start gap-2.5 ${
                resultMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                  : 'bg-red-50 text-red-800 border-red-100'
              }`}>
                {resultMsg.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <span>{resultMsg.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Bairro Filter */}
              <div>
                <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider mb-1.5">
                  Bairro Destino
                </label>
                <select
                  className="w-full px-3 py-2 border border-slate-350 rounded-lg text-xs bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  value={selectedBairro}
                  onChange={(e) => setSelectedBairro(e.target.value)}
                >
                  <option value="todos">Todos os Bairros</option>
                  {bairros.map(b => (
                    <option key={b.id} value={b.id}>{b.nome}</option>
                  ))}
                </select>
              </div>

              {/* Temperatura Filter */}
              <div>
                <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider mb-1.5">
                  Temperatura
                </label>
                <select
                  className="w-full px-3 py-2 border border-slate-355 rounded-lg text-xs bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  value={selectedTemp}
                  onChange={(e) => setSelectedTemp(Number(e.target.value))}
                >
                  <option value="0">Todas as Temperaturas</option>
                  <option value="1">1 - Frio (0%)</option>
                  <option value="2">2 - Morno (25%)</option>
                  <option value="3">3 - Inclinado (50%)</option>
                  <option value="4">4 - Quente (80%)</option>
                  <option value="5">5 - Líder (100%)</option>
                </select>
              </div>
            </div>

            {/* Etiquetas Filter */}
            <div>
              <MultiSelect
                options={etiquetas}
                selectedIds={selectedEtiquetas}
                onChange={setSelectedEtiquetas}
              />
            </div>

            {/* Contador de destinatários */}
            <div className="bg-slate-50 border border-slate-150 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-600 text-xs font-bold uppercase tracking-wider">
                <Users className="w-4 h-4 text-primary-600" />
                Destinatários Selecionados:
              </div>
              <span className="text-lg font-black text-slate-900">{targetEleitores.length}</span>
            </div>

            {/* Message Composer */}
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 pt-2 pb-2 border-b border-slate-100">
              <MessageSquare className="w-4 h-4 text-primary-600" />
              2. Escrever Mensagem do WhatsApp
            </h3>

            <div className="space-y-2">
              <textarea
                rows={6}
                placeholder="Olá, {nome}! Gostaríamos de convidar você..."
                className="w-full p-3 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-slate-700"
                value={mensagemTemplate}
                onChange={(e) => setMensagemTemplate(e.target.value)}
              />

              {/* Info Tip Placeholders */}
              <div className="bg-blue-50 border border-blue-150 rounded-lg p-3 text-xs text-blue-800 flex items-start gap-2 leading-relaxed">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  Dica: Utilize o marcador <span className="font-mono bg-blue-100 text-blue-900 px-1 py-0.5 rounded font-bold">{`{nome}`}</span> em qualquer parte da mensagem. Ele será substituído automaticamente pelo nome completo de cada eleitor cadastrado ao realizar o disparo.
                </div>
              </div>
            </div>

            {/* Ação de Disparo */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={isPending || targetEleitores.length === 0}
                isLoading={isPending}
                variant="primary"
                fullWidth
                size="lg"
                leftIcon={!isPending && <Send className="w-4 h-4" />}
              >
                {isPending ? 'Enviando WhatsApps (Aguarde...)' : 'Realizar Disparo de Mala Direta'}
              </Button>
            </div>
          </form>

        </div>

        {/* Lado Direito: Histórico de Disparos */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 min-h-[400px]">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
              <History className="w-4 h-4 text-primary-600" />
              Histórico de Disparos
            </h3>

            {disparos.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Nenhum disparo registrado.
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {disparos.map(disp => {
                  const taxaEntrega = disp.total > 0 ? Math.round((disp.sucesso / disp.total) * 100) : 0
                  return (
                    <div key={disp.id} className="bg-slate-50 border border-slate-150 rounded-lg p-3 space-y-2 text-xs">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-700 truncate max-w-[130px]">{disp.titulo}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          disp.status === 'Concluido' ? 'bg-emerald-100 text-emerald-800' :
                          disp.status === 'Enviando' ? 'bg-blue-100 text-blue-800 animate-pulse' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {disp.status}
                        </span>
                      </div>

                      <p className="text-slate-500 line-clamp-2 leading-relaxed bg-white border border-slate-100 p-2 rounded italic">
                        {disp.mensagem}
                      </p>

                      <div className="flex justify-between items-center text-[10px] text-slate-450 pt-1">
                        <span>{formatarData(disp.criadoEm)}</span>
                        <span className="font-bold text-slate-700">
                          {disp.sucesso}/{disp.total} enviados ({taxaEntrega}%)
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
