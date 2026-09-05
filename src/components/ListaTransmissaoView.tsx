'use client'

import React, { useState, useTransition, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Send, MessageSquare, Users, CheckCircle2, AlertTriangle, Loader2, Filter, Info, History, Trash2, Search, Plus, ListCollapse, X, Edit2 } from 'lucide-react'
import { createListaTransmissao, updateListaTransmissao, deleteListaTransmissao, enviarMalaDireta } from '@/lib/actions'
import MultiSelect from './MultiSelect'
import { Button } from './ui/Button'
import toast, { Toaster } from 'react-hot-toast'

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
  bairro: string
  cidade: string
  temperatura: number
  etiquetas: Etiqueta[]
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

interface ListaTransmissao {
  id: string
  nome: string
  descricao: string | null
  tipo: string // "FILTRO" | "MANUAL"
  bairroId: string | null
  bairroNome: string | null
  temperatura: number | null
  etiquetas: Etiqueta[]
  eleitoresIds: string[]
  eleitoresCount: number
  criadoEm: Date
}

interface ListaTransmissaoViewProps {
  eleitores: Eleitor[]
  etiquetas: Etiqueta[]
  bairros: Bairro[]
  disparos: Disparo[]
  listas: ListaTransmissao[]
  onRefresh: () => void
}

export default function ListaTransmissaoView({
  eleitores,
  etiquetas,
  bairros,
  disparos,
  listas,
  onRefresh
}: ListaTransmissaoViewProps) {
  const [isPending, startTransition] = useTransition()
  const [activeSubTab, setActiveSubTab] = useState<'listas' | 'historico'>('listas')
  const [selectedListId, setSelectedListId] = useState<string | null>(null)

  // Modais e formulários
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingList, setEditingList] = useState<ListaTransmissao | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Form de criação
  const [newNome, setNewNome] = useState('')
  const [newDescricao, setNewDescricao] = useState('')
  const [newTipo, setNewTipo] = useState<'FILTRO' | 'MANUAL'>('FILTRO')

  // Filtros da nova lista
  const [filterBairro, setFilterBairro] = useState('todos')
  const [filterTemp, setFilterTemp] = useState<number>(0)
  const [filterEtiquetas, setFilterEtiquetas] = useState<string[]>([])

  // Seleção manual de eleitores
  const [manualSearch, setManualSearch] = useState('')
  const [selectedManualEleitores, setSelectedManualEleitores] = useState<string[]>([])

  // Composer de Mensagem
  const [mensagemTemplate, setMensagemTemplate] = useState('')
  const [resultMsg, setResultMsg] = useState({ type: '', text: '' })

  // Abas internas do visualizador de lista
  const [selectedListTab, setSelectedListTab] = useState<'enviar' | 'contatos' | 'historico'>('enviar')

  const handleOpenCreate = () => {
    setEditingList(null)
    setNewNome('')
    setNewDescricao('')
    setNewTipo('FILTRO')
    setFilterBairro('todos')
    setFilterTemp(0)
    setFilterEtiquetas([])
    setSelectedManualEleitores([])
    setIsCreateOpen(true)
  }

  const handleOpenEdit = (lista: ListaTransmissao) => {
    setEditingList(lista)
    setNewNome(lista.nome)
    setNewDescricao(lista.descricao || '')
    setNewTipo(lista.tipo as 'FILTRO' | 'MANUAL')
    setFilterBairro(lista.bairroId || 'todos')
    setFilterTemp(lista.temperatura || 0)
    setFilterEtiquetas(lista.etiquetas.map(e => e.id))
    setSelectedManualEleitores(lista.eleitoresIds)
    setIsCreateOpen(true)
  }

  const selectedList = listas.find(l => l.id === selectedListId) || null

  // Calcular contagem de eleitores que combinam com os filtros no modal em tempo real
  const matchedFilterEleitores = eleitores.filter(el => {
    const matchesBairro = filterBairro === 'todos' || el.bairroId === filterBairro
    const matchesTemp = filterTemp === 0 || el.temperatura === filterTemp
    const matchesTags = filterEtiquetas.length === 0 ||
      filterEtiquetas.every(tagId => el.etiquetas.some(t => t.id === tagId))
    return matchesBairro && matchesTemp && matchesTags
  })

  // Listas filtradas pela busca
  const filteredListas = listas.filter(l =>
    l.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.descricao && l.descricao.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Disparos filtrados para a lista selecionada
  const selectedListDisparos = selectedList
    ? disparos.filter(d => d.listaId === selectedList.id)
    : []

  // Eleitores da lista selecionada (resolvidos ou manuais)
  const selectedListEleitores = selectedList
    ? eleitores.filter(el => selectedList.eleitoresIds.includes(el.id))
    : []

  const handleSaveList = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNome.trim()) {
      toast.error('Por favor, informe o nome da lista.')
      return
    }

    startTransition(async () => {
      const payload = {
        nome: newNome,
        descricao: newDescricao,
        tipo: newTipo,
        bairroId: newTipo === 'FILTRO' && filterBairro !== 'todos' ? filterBairro : null,
        temperatura: newTipo === 'FILTRO' && filterTemp !== 0 ? filterTemp : null,
        etiquetaIds: newTipo === 'FILTRO' ? filterEtiquetas : [],
        eleitorIds: newTipo === 'MANUAL' ? selectedManualEleitores : []
      }

      let res
      if (editingList) {
        res = await updateListaTransmissao(editingList.id, payload)
      } else {
        res = await createListaTransmissao(payload)
      }

      if (res.success) {
        toast.success(editingList ? 'Lista atualizada com sucesso!' : 'Lista criada com sucesso!')
        setIsCreateOpen(false)
        setNewNome('')
        setNewDescricao('')
        setNewTipo('FILTRO')
        setFilterBairro('todos')
        setFilterTemp(0)
        setFilterEtiquetas([])
        setSelectedManualEleitores([])
        if (!editingList) {
          setSelectedListId((res as any).id || null)
        }
        setEditingList(null)
        onRefresh()
      } else {
        toast.error(res.error || 'Erro ao salvar lista de transmissão.')
      }
    })
  }

  // Controle do Modal Customizado de Deleção
  const [listToDelete, setListToDelete] = useState<ListaTransmissao | null>(null)

  const confirmDeleteList = () => {
    if (!listToDelete) return

    startTransition(async () => {
      const res = await deleteListaTransmissao(listToDelete.id)
      if (res.success) {
        toast.success(`Lista "${listToDelete.nome}" excluída!`)
        if (selectedListId === listToDelete.id) {
          setSelectedListId(null)
        }
        setListToDelete(null)
        onRefresh()
      } else {
        toast.error('Erro ao excluir lista de transmissão.')
      }
    })
  }

  const [broadcastToConfirm, setBroadcastToConfirm] = useState<ListaTransmissao | null>(null)

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault()
    setResultMsg({ type: '', text: '' })

    if (!selectedList) return

    if (selectedList.eleitoresCount === 0) {
      toast.error('Esta lista não possui contatos ativos.')
      return
    }

    if (!mensagemTemplate.trim()) {
      toast.error('Por favor, escreva uma mensagem para enviar.')
      return
    }

    setBroadcastToConfirm(selectedList)
  }

  const confirmBroadcast = () => {
    if (!broadcastToConfirm || !mensagemTemplate.trim()) return

    const loadToast = toast.loading('Agendando disparo...')

    startTransition(async () => {
      const res = await enviarMalaDireta({
        eleitorIds: broadcastToConfirm.eleitoresIds,
        mensagemTemplate,
        listaId: broadcastToConfirm.id
      })

      if (res.success) {
        toast.success(`Disparo agendado para "${broadcastToConfirm.nome}" (${broadcastToConfirm.eleitoresCount} contatos)!`, { id: loadToast })
        setMensagemTemplate('')
        setBroadcastToConfirm(null)
        onRefresh()
      } else {
        toast.error(res.error || 'Erro ao processar envio.', { id: loadToast })
        setBroadcastToConfirm(null)
      }
    })
  }

  const formatarData = (data: Date) => {
    const d = new Date(data)
    return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  }

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Send className="w-6 h-6 text-primary-600" />
            Lista de Transmissão
          </h2>
          <p className="text-slate-500 text-sm">
            Crie listas de transmissão segmentadas ou manuais e envie mensagens personalizadas via WhatsApp.
          </p>
        </div>

        <div className="flex bg-slate-150 p-0.5 rounded-lg border border-slate-200">
          <Button
            onClick={() => setActiveSubTab('listas')}
            variant="ghost"
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all h-auto ${
              activeSubTab === 'listas'
                ? 'bg-white text-slate-800 shadow-sm hover:bg-white'
                : 'text-slate-550 hover:text-slate-850 hover:bg-transparent'
            }`}
          >
            Listas Salvas
          </Button>
          <Button
            onClick={() => setActiveSubTab('historico')}
            variant="ghost"
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all h-auto ${
              activeSubTab === 'historico'
                ? 'bg-white text-slate-800 shadow-sm hover:bg-white'
                : 'text-slate-550 hover:text-slate-850 hover:bg-transparent'
            }`}
          >
            Histórico Geral
          </Button>
        </div>
      </div>

      {activeSubTab === 'listas' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lado Esquerdo: Lista de Listas */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
              <div className="flex justify-between items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar lista..."
                    className="w-full pl-9 pr-3 py-2 border border-slate-250 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 bg-slate-50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleOpenCreate}
                  variant="primary"
                  size="icon"
                  className="flex-shrink-0"
                  title="Criar Nova Lista"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {filteredListas.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    Nenhuma lista de transmissão encontrada.
                  </div>
                ) : (
                  filteredListas.map(lista => {
                    const active = selectedListId === lista.id
                    return (
                      <div
                        key={lista.id}
                        onClick={() => {
                          setSelectedListId(lista.id)
                          setResultMsg({ type: '', text: '' })
                        }}
                        className={`p-3 border rounded-xl cursor-pointer transition-all flex justify-between items-start group ${
                          active
                            ? 'bg-primary-50/50 border-primary-300 ring-1 ring-primary-300'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="space-y-1.5 min-w-0 pr-2">
                          <h4 className="font-bold text-slate-800 text-sm truncate">{lista.nome}</h4>
                          {lista.descricao && (
                            <p className="text-slate-500 text-xs truncate max-w-[200px]">{lista.descricao}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                            <span className={`px-1.5 py-0.5 rounded font-extrabold ${
                              lista.tipo === 'FILTRO'
                                ? 'bg-blue-50 text-blue-700 border border-blue-150'
                                : 'bg-amber-50 text-amber-700 border border-amber-150'
                            }`}>
                              {lista.tipo === 'FILTRO' ? 'Segmentada' : 'Manual'}
                            </span>
                            <span className="text-slate-450 font-semibold">
                              • {lista.eleitoresCount} contatos
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenEdit(lista)
                            }}
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 p-1 text-slate-400 hover:text-primary-600 hover:bg-slate-100/80 flex-shrink-0"
                            title="Editar Lista"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              setListToDelete(lista)
                            }}
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 p-1 text-slate-400 hover:text-red-600 hover:bg-slate-100/80 flex-shrink-0"
                            title="Excluir Lista"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* Lado Direito: Visualização/Edição/Envio da Lista Selecionada */}
          <div className="lg:col-span-2">
            {selectedList ? (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
                {/* Header da lista selecionada */}
                <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-slate-800">{selectedList.nome}</h3>
                      <Button
                        onClick={() => handleOpenEdit(selectedList)}
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-primary-600 hover:bg-slate-100 h-7 w-7 p-1.5"
                        title="Editar Lista"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        selectedList.tipo === 'FILTRO' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {selectedList.tipo === 'FILTRO' ? 'Segmentada por Filtros' : 'Seleção Manual'}
                      </span>
                    </div>
                    {selectedList.descricao && (
                      <p className="text-slate-500 text-xs">{selectedList.descricao}</p>
                    )}

                    {/* Mostrar regras de filtros */}
                    {selectedList.tipo === 'FILTRO' && (
                      <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-slate-650">
                        {selectedList.bairroNome && (
                          <span className="bg-slate-100 px-2 py-0.5 rounded">
                            Bairro: <strong>{selectedList.bairroNome}</strong>
                          </span>
                        )}
                        {selectedList.temperatura && (
                          <span className="bg-slate-100 px-2 py-0.5 rounded">
                            Temperatura: <strong>{selectedList.temperatura}</strong>
                          </span>
                        )}
                        {selectedList.etiquetas.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <span>Tags:</span>
                            {selectedList.etiquetas.map(t => (
                              <span
                                key={t.id}
                                style={{ backgroundColor: t.cor + '15', color: t.cor }}
                                className="px-1.5 py-0.2 rounded font-bold border border-slate-200"
                              >
                                {t.nome}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Total de Destinatários</span>
                    <span className="text-2xl font-black text-slate-900 leading-none">{selectedList.eleitoresCount}</span>
                  </div>
                </div>

                {/* Sub-abas internas do visualizador */}
                <div className="flex border-b border-slate-100 text-xs font-bold">
                  <Button
                    onClick={() => setSelectedListTab('enviar')}
                    variant="ghost"
                    className={`pb-2.5 pt-2 px-4 border-b-2 rounded-none h-auto hover:bg-transparent transition-all ${
                      selectedListTab === 'enviar'
                        ? 'border-primary-600 text-primary-600 font-black'
                        : 'border-transparent text-slate-450 hover:text-slate-700'
                    }`}
                  >
                    Enviar Mensagem
                  </Button>
                  <Button
                    onClick={() => setSelectedListTab('contatos')}
                    variant="ghost"
                    className={`pb-2.5 pt-2 px-4 border-b-2 rounded-none h-auto hover:bg-transparent transition-all ${
                      selectedListTab === 'contatos'
                        ? 'border-primary-600 text-primary-600 font-black'
                        : 'border-transparent text-slate-450 hover:text-slate-700'
                    }`}
                  >
                    Eleitores Integrantes ({selectedList.eleitoresCount})
                  </Button>
                  <Button
                    onClick={() => setSelectedListTab('historico')}
                    variant="ghost"
                    className={`pb-2.5 pt-2 px-4 border-b-2 rounded-none h-auto hover:bg-transparent transition-all ${
                      selectedListTab === 'historico'
                        ? 'border-primary-600 text-primary-600 font-black'
                        : 'border-transparent text-slate-450 hover:text-slate-700'
                    }`}
                  >
                    Histórico da Lista ({selectedListDisparos.length})
                  </Button>
                </div>

                {/* Conteúdo da sub-aba */}
                <div className="pt-2">
                  {selectedListTab === 'enviar' && (
                    <form onSubmit={handleSendBroadcast} className="space-y-4">
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

                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider">
                          Escrever Mensagem do WhatsApp
                        </label>
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

                      <div className="pt-2">
                        <Button
                          type="submit"
                          disabled={isPending || selectedList.eleitoresCount === 0}
                          isLoading={isPending}
                          variant="primary"
                          fullWidth
                          size="lg"
                          leftIcon={!isPending && <Send className="w-4 h-4" />}
                        >
                          {isPending ? 'Enviando WhatsApps (Aguarde...)' : 'Enviar Mensagem para esta Lista'}
                        </Button>
                      </div>
                    </form>
                  )}

                  {selectedListTab === 'contatos' && (
                    <div className="space-y-3">
                      <div className="max-h-[350px] overflow-y-auto border border-slate-100 rounded-lg divide-y divide-slate-100">
                        {selectedListEleitores.length === 0 ? (
                          <div className="p-8 text-center text-slate-450 text-xs">
                            Nenhum contato encontrado nesta lista.
                          </div>
                        ) : (
                          selectedListEleitores.map(el => (
                            <div key={el.id} className="p-3 flex justify-between items-center text-xs hover:bg-slate-50/50">
                              <div className="min-w-0 pr-2">
                                <div className="font-bold text-slate-800 truncate">{el.nomeCompleto}</div>
                                <div className="text-slate-450 text-[10px] mt-0.5">
                                  {el.bairro} • Temp: {el.temperatura}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-mono text-slate-700 font-semibold">{el.telefone}</div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {selectedListTab === 'historico' && (
                    <div className="space-y-3">
                      <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1">
                        {selectedListDisparos.length === 0 ? (
                          <div className="p-12 text-center text-slate-400 text-xs">
                            Nenhum disparo realizado para esta lista ainda.
                          </div>
                        ) : (
                          selectedListDisparos.map(disp => {
                            const taxaEntrega = disp.total > 0 ? Math.round((disp.sucesso / disp.total) * 100) : 0
                            return (
                              <div key={disp.id} className="bg-slate-50 border border-slate-150 rounded-lg p-3 space-y-2 text-xs">
                                <div className="flex justify-between items-start">
                                  <span className="font-bold text-slate-700">{disp.titulo}</span>
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    disp.status === 'Concluido' ? 'bg-emerald-100 text-emerald-800' :
                                    disp.status === 'Enviando' ? 'bg-blue-100 text-blue-800 animate-pulse' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {disp.status}
                                  </span>
                                </div>
                                <p className="text-slate-550 p-2 bg-white border border-slate-100 rounded italic line-clamp-2">
                                  {disp.mensagem}
                                </p>
                                <div className="flex justify-between items-center text-[10px] text-slate-400">
                                  <span>{formatarData(disp.criadoEm)}</span>
                                  <span className="font-bold text-slate-600">
                                    {disp.sucesso}/{disp.total} enviados ({taxaEntrega}%)
                                  </span>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full bg-white border border-slate-200 border-dashed rounded-xl p-12 text-center flex flex-col items-center justify-center space-y-3 min-h-[350px]">
                <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center">
                  <ListCollapse className="w-6 h-6 text-primary-600" />
                </div>
                <h4 className="font-black text-slate-700">Selecione uma Lista</h4>
                <p className="text-xs text-slate-400 max-w-[280px] leading-relaxed">
                  Escolha uma lista de transmissão ao lado para visualizar os integrantes, histórico de disparos e enviar mensagens.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Aba Histórico Geral */
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="font-black text-slate-800 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
            <History className="w-4 h-4 text-primary-600" />
            Histórico Geral de Disparos
          </h3>

          {disparos.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs">
              Nenhum disparo registrado no system.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[550px] overflow-y-auto pr-1">
              {disparos.map(disp => {
                const taxaEntrega = disp.total > 0 ? Math.round((disp.sucesso / disp.total) * 100) : 0
                return (
                  <div key={disp.id} className="bg-slate-50 border border-slate-150 rounded-lg p-4 space-y-3 text-xs flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="font-bold text-slate-800 truncate max-w-[200px]">{disp.titulo}</h4>
                          <span className="text-[10px] text-slate-400 font-bold block mt-0.5 uppercase tracking-wider">
                            Lista: <strong className="text-slate-655 font-black">{disp.listaNome}</strong>
                          </span>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                          disp.status === 'Concluido' ? 'bg-emerald-100 text-emerald-800' :
                          disp.status === 'Enviando' ? 'bg-blue-100 text-blue-800 animate-pulse' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {disp.status}
                        </span>
                      </div>

                      <p className="text-slate-550 leading-relaxed bg-white border border-slate-100 p-2.5 rounded italic">
                        {disp.mensagem}
                      </p>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-450 border-t border-slate-100 pt-2 mt-1">
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
      )}

      {/* Modal de Criação de Lista */}
      {isMounted && isCreateOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex min-h-full items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200 space-y-4 text-left sm:my-8">
            {/* Header Modal */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                {editingList ? <Edit2 className="w-5 h-5 text-primary-600" /> : <Plus className="w-5 h-5 text-primary-600" />}
                {editingList ? 'Editar Lista de Transmissão' : 'Criar Lista de Transmissão'}
              </h3>
              <Button
                onClick={() => setIsCreateOpen(false)}
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveList} className="space-y-4">
              {/* Nome */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Nome da Lista *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Apoiadores do Centro - Temperatura 5"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 text-slate-700"
                  value={newNome}
                  onChange={(e) => setNewNome(e.target.value)}
                />
              </div>

              {/* Descrição */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Descrição (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Lista voltada para o comício central com apoiadores altamente engajados."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 text-slate-700"
                  value={newDescricao}
                  onChange={(e) => setNewDescricao(e.target.value)}
                />
              </div>

              {/* Tipo de Lista */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Tipo de Lista
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    onClick={() => setNewTipo('FILTRO')}
                    variant="ghost"
                    className={`py-2 px-3 border rounded-lg text-xs font-bold transition-all text-center flex flex-col items-center gap-1 h-auto ${
                      newTipo === 'FILTRO'
                        ? 'bg-primary-50 border-primary-500 text-primary-700 shadow-sm hover:bg-primary-100'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>Segmentada (Filtros)</span>
                    <span className="text-[9px] font-normal text-slate-450">Filtra contatos dinamicamente</span>
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setNewTipo('MANUAL')}
                    variant="ghost"
                    className={`py-2 px-3 border rounded-lg text-xs font-bold transition-all text-center flex flex-col items-center gap-1 h-auto ${
                      newTipo === 'MANUAL'
                        ? 'bg-primary-50 border-primary-500 text-primary-700 shadow-sm hover:bg-primary-100'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>Seleção Manual</span>
                    <span className="text-[9px] font-normal text-slate-450">Escolhe os contatos na hora</span>
                  </Button>
                </div>
              </div>

              {/* Renderização Condicional por Tipo de Lista */}
              {newTipo === 'FILTRO' ? (
                <div className="space-y-3 bg-slate-50 border border-slate-150 p-4 rounded-xl">
                  <h4 className="text-xs font-bold text-slate-750 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                    <Filter className="w-3.5 h-3.5 text-primary-600" />
                    Configuração dos Filtros
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Bairro Filter */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">
                        Bairro
                      </label>
                      <select
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        value={filterBairro}
                        onChange={(e) => setFilterBairro(e.target.value)}
                      >
                        <option value="todos">Todos os Bairros</option>
                        {bairros.map(b => (
                          <option key={b.id} value={b.id}>{b.nome}</option>
                        ))}
                      </select>
                    </div>

                    {/* Temperatura Filter */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">
                        Temperatura
                      </label>
                      <select
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        value={filterTemp}
                        onChange={(e) => setFilterTemp(Number(e.target.value))}
                      >
                        <option value="0">Todas</option>
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
                      selectedIds={filterEtiquetas}
                      onChange={setFilterEtiquetas}
                    />
                  </div>

                  {/* Prévia da contagem de filtro */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500">Destinatários estimados:</span>
                    <strong className="text-slate-800 text-sm font-extrabold">{matchedFilterEleitores.length}</strong>
                  </div>
                </div>
              ) : (
                /* Seleção Manual */
                <div className="space-y-3 bg-slate-50 border border-slate-150 p-4 rounded-xl">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-1.5 gap-2">
                    <h4 className="text-xs font-bold text-slate-750 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-primary-600" />
                      Selecionar Eleitores
                    </h4>
                    <span className="text-[10px] text-slate-500 font-bold">
                      {selectedManualEleitores.length} selecionados
                    </span>
                  </div>

                  {/* Busca Eletor */}
                  <div className="relative">
                    <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nome..."
                      className="w-full pl-8 pr-3 py-1.5 border border-slate-250 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
                      value={manualSearch}
                      onChange={(e) => setManualSearch(e.target.value)}
                    />
                  </div>

                  {/* Lista com Checkbox */}
                  <div className="max-h-[220px] overflow-y-auto border border-slate-200 rounded-lg bg-white divide-y divide-slate-100">
                    {eleitores
                      .filter(el => el.nomeCompleto.toLowerCase().includes(manualSearch.toLowerCase()))
                      .map(el => {
                        const checked = selectedManualEleitores.includes(el.id)
                        return (
                          <label key={el.id} className="p-2 flex items-center gap-2.5 text-xs hover:bg-slate-50/50 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              className="w-4 h-4 appearance-none relative checked:bg-primary-600 checked:border-primary-600 checked:after:content-['✓'] checked:after:text-white checked:after:absolute checked:after:text-[12px] checked:after:font-bold checked:after:left-[1px] checked:after:-top-[2px] bg-white border-2 border-slate-300 border-dashed rounded focus:ring-primary-500 focus:ring-offset-0 cursor-pointer transition-all"
                              checked={checked}
                              onChange={() => {
                                if (checked) {
                                  setSelectedManualEleitores(selectedManualEleitores.filter(id => id !== el.id))
                                } else {
                                  setSelectedManualEleitores([...selectedManualEleitores, el.id])
                                }
                              }}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-slate-700 truncate">{el.nomeCompleto}</div>
                              <div className="text-[9px] text-slate-400">{el.telefone} • {el.bairro}</div>
                            </div>
                          </label>
                        )
                      })}
                  </div>
                </div>
              )}

              {/* Botões do Rodapé */}
              <div className="pt-2 border-t border-slate-100 flex justify-end gap-3">
                <Button
                  onClick={() => setIsCreateOpen(false)}
                  variant="secondary"
                  size="sm"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isPending || !newNome.trim()}
                  isLoading={isPending}
                  variant="primary"
                  size="sm"
                >
                  {editingList ? 'Salvar Alterações' : 'Criar Lista'}
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ===== MODAL: Confirmar Exclusão de Lista ===== */}
      {isMounted && listToDelete && createPortal(
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex min-h-full items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xl max-w-md w-full space-y-4 animate-in zoom-in-95 duration-200 text-left sm:my-8">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-500" />
                Excluir Lista?
              </h3>
              <Button
                onClick={() => setListToDelete(null)}
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-slate-500 leading-relaxed">
                Você tem certeza que deseja excluir a lista <strong>"{listToDelete.nome}"</strong>? Os disparos anteriores desta lista continuarão registrados no histórico geral.
              </p>
            </div>
            <div className="bg-slate-50 p-4 -mx-6 -mb-6 mt-6 border-t border-slate-100 flex gap-3 rounded-b-xl">
              <Button
                onClick={() => setListToDelete(null)}
                disabled={isPending}
                variant="secondary"
                className="flex-1 rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmDeleteList}
                disabled={isPending}
                isLoading={isPending}
                variant="danger"
                className="flex-1 rounded-xl"
              >
                Sim, Excluir
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ===== MODAL: Confirmar Disparo do Envio ===== */}
      {isMounted && broadcastToConfirm && createPortal(
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex min-h-full items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xl max-w-md w-full space-y-4 animate-in zoom-in-95 duration-200 text-left sm:my-8">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-500" />
                Confirmar Disparo?
              </h3>
              <Button
                onClick={() => setBroadcastToConfirm(null)}
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-slate-500 leading-relaxed">
                Deseja enviar esta mensagem via WhatsApp para os <strong className="text-slate-800">{broadcastToConfirm.eleitoresCount}</strong> contatos da lista <strong>"{broadcastToConfirm.nome}"</strong>?
              </p>
            </div>
            <div className="bg-slate-50 p-4 -mx-6 -mb-6 mt-6 border-t border-slate-100 flex gap-3 rounded-b-xl">
              <Button
                onClick={() => setBroadcastToConfirm(null)}
                disabled={isPending}
                variant="secondary"
                className="flex-1 rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmBroadcast}
                disabled={isPending}
                isLoading={isPending}
                variant="success"
                className="flex-1 rounded-xl"
              >
                Sim, Enviar
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <Toaster position="top-right" />
    </div>
  )
}
