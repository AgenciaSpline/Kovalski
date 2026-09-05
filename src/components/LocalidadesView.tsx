'use client'

import React, { useState, useTransition, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Edit2, Trash2, MapPin, Building2, Loader2, X, AlertTriangle, Check, ArrowRight, FileSearch, RefreshCw } from 'lucide-react'
import { createCidade, updateCidade, deleteCidade, createBairro, updateBairro, deleteBairro, deleteBairrosEmMassa, previewBairrosImport, confirmarImportBairros, previewCidadesImport, confirmarImportCidades } from '@/lib/actions'
import { Button } from './ui/Button'

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

interface LocalidadesViewProps {
  cidades: Cidade[]
  bairros: Bairro[]
  onRefresh: () => void
}

export default function LocalidadesView({ cidades, bairros, onRefresh }: LocalidadesViewProps) {
  const [isPending, startTransition] = useTransition()

  // Modais de Cidade
  const [isOpenCidadeForm, setIsOpenCidadeForm] = useState(false)
  const [editingCidadeId, setEditingCidadeId] = useState<string | null>(null)
  const [cidadeNome, setCidadeNome] = useState('')
  const [cidadeError, setCidadeError] = useState('')

  // Modais de Bairro
  const [isOpenBairroForm, setIsOpenBairroForm] = useState(false)
  const [editingBairroId, setEditingBairroId] = useState<string | null>(null)
  const [bairroNome, setBairroNome] = useState('')
  const [bairroCidadeId, setBairroCidadeId] = useState('')
  const [bairroError, setBairroError] = useState('')
  const [isOpenImportForm, setIsOpenImportForm] = useState(false)
  const [importTexto, setImportTexto] = useState('')
  const [importCidadeId, setImportCidadeId] = useState('')

  // Estados da conciliação
  const [importStep, setImportStep] = useState<'input' | 'review'>('input')
  const [previewResult, setPreviewResult] = useState<{
    exatos: { nomeOriginal: string; nomeExistente: string; id: string }[]
    similares: { nomeOriginal: string; sugestao: { id: string; nome: string; distancia: number } }[]
    novos: string[]
  } | null>(null)
  // Decisões do usuário: chave = nomeOriginal da planilha
  const [reconciliacoes, setReconciliacoes] = useState<Map<string, { acao: 'usar_existente' | 'criar_novo' | 'ignorar', mapearPara?: string }>>(new Map())

  // Importação de Cidades
  const [isOpenImportCidadeForm, setIsOpenImportCidadeForm] = useState(false)
  const [importCidadeTexto, setImportCidadeTexto] = useState('')
  const [importCidadeStep, setImportCidadeStep] = useState<'input' | 'review'>('input')
  const [previewCidadeResult, setPreviewCidadeResult] = useState<{
    exatos: { nomeOriginal: string; nomeExistente: string; id: string }[]
    similares: { nomeOriginal: string; sugestao: { id: string; nome: string; distancia: number } }[]
    novos: string[]
  } | null>(null)
  const [reconciliacoesCidade, setReconciliacoesCidade] = useState<Map<string, { acao: 'usar_existente' | 'criar_novo' | 'ignorar', mapearPara?: string }>>(new Map())
  const [cidadeImportError, setCidadeImportError] = useState('')

  // Modal de Confirmação de Exclusão (Cidade/Bairro)
  const [isOpenDeleteConfirm, setIsOpenDeleteConfirm] = useState(false)
  const [deleteConfirmType, setDeleteConfirmType] = useState<'cidade' | 'bairro' | 'bairros_massa'>('cidade')
  const [deleteTargetId, setDeleteTargetId] = useState('')
  const [deleteTargetName, setDeleteTargetName] = useState('')
  const [deleteConfirmError, setDeleteConfirmError] = useState('')

  // Seleção em Massa de Bairros
  const [selectedBairros, setSelectedBairros] = useState<string[]>([])

  const handleToggleSelectBairro = (id: string) => {
    setSelectedBairros(prev =>
      prev.includes(id) ? prev.filter(bId => bId !== id) : [...prev, id]
    )
  }

  const handleToggleSelectAllBairros = () => {
    if (selectedBairros.length === bairros.length) {
      setSelectedBairros([])
    } else {
      setSelectedBairros(bairros.map(b => b.id))
    }
  }

  const handleOpenDeleteBairrosMassa = () => {
    if (selectedBairros.length === 0) return;
    setDeleteConfirmType('bairros_massa')
    setDeleteTargetName(`${selectedBairros.length} bairro(s) selecionado(s)`)
    setDeleteConfirmError('')
    setIsOpenDeleteConfirm(true)
  }

  // Handlers para Cidade
  const handleOpenCreateCidade = () => {
    setEditingCidadeId(null)
    setCidadeNome('')
    setCidadeError('')
    setIsOpenCidadeForm(true)
  }

  const handleOpenEditCidade = (cidade: Cidade) => {
    setEditingCidadeId(cidade.id)
    setCidadeNome(cidade.nome)
    setCidadeError('')
    setIsOpenCidadeForm(true)
  }

  const handleSubmitCidade = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cidadeNome.trim()) {
      setCidadeError('O nome da cidade é obrigatório.')
      return
    }

    startTransition(async () => {
      let res
      if (editingCidadeId) {
        res = await updateCidade(editingCidadeId, { nome: cidadeNome })
      } else {
        res = await createCidade({ nome: cidadeNome })
      }

      if (res.success) {
        setIsOpenCidadeForm(false)
        onRefresh()
      } else {
        setCidadeError(res.error || 'Erro ao processar cidade.')
      }
    })
  }

  const handleOpenDeleteCidade = (cidade: Cidade) => {
    setDeleteConfirmType('cidade')
    setDeleteTargetId(cidade.id)
    setDeleteTargetName(cidade.nome)
    setDeleteConfirmError('')
    setIsOpenDeleteConfirm(true)
  }

  // Handlers para Bairro
  const handleOpenCreateBairro = () => {
    setEditingBairroId(null)
    setBairroNome('')
    setBairroCidadeId(cidades[0]?.id || '')
    setBairroError('')
    setIsOpenBairroForm(true)
  }

  const handleOpenEditBairro = (bairro: Bairro) => {
    setEditingBairroId(bairro.id)
    setBairroNome(bairro.nome)
    setBairroCidadeId(bairro.cidadeId)
    setBairroError('')
    setIsOpenBairroForm(true)
  }

  const handleImportBairros = () => {
    // Esta função não é mais chamada diretamente
  }

  const handleAnalyzeBairros = () => {
    if (!importCidadeId) {
      setBairroError('Selecione uma cidade para importar.')
      return
    }
    if (!importTexto.trim()) {
      setBairroError('O campo de texto está vazio.')
      return
    }
    setBairroError('')
    startTransition(async () => {
      const nomes = importTexto.split('\n').map(l => l.trim()).filter(l => l.length > 0)
      const res = await previewBairrosImport(importCidadeId, nomes)
      if (res.success && res.exatos && res.similares && res.novos) {
        setPreviewResult({ exatos: res.exatos, similares: res.similares, novos: res.novos })

        // Inicializa decisões: similares → usar_existente (sugestão), novos → criar_novo, exatos → ignorar
        const init = new Map<string, { acao: 'usar_existente' | 'criar_novo' | 'ignorar', mapearPara?: string }>()
        for (const s of res.similares) {
          init.set(s.nomeOriginal, { acao: 'usar_existente', mapearPara: s.sugestao.id })
        }
        for (const n of res.novos) {
          init.set(n, { acao: 'criar_novo' })
        }
        setReconciliacoes(init)
        setImportStep('review')
      } else {
        setBairroError(res.error || 'Erro ao analisar bairros.')
      }
    })
  }

  const handleConfirmImport = () => {
    if (!previewResult) return

    startTransition(async () => {
      const paraConfirmar: { nome: string; cidadeId: string; mapearPara?: string }[] = []

      // Processa bairros similares e novos conforme decisões do usuário
      for (const nome of [...previewResult.similares.map(s => s.nomeOriginal), ...previewResult.novos]) {
        const decisao = reconciliacoes.get(nome)
        if (!decisao || decisao.acao === 'ignorar') continue

        paraConfirmar.push({
          nome,
          cidadeId: importCidadeId,
          mapearPara: decisao.acao === 'usar_existente' ? decisao.mapearPara : undefined
        })
      }

      const res = await confirmarImportBairros(paraConfirmar)
      if (res.success) {
        alert(`Importação concluída!\n\n${res.inseridos} bairros novos cadastrados.\n${res.mapeados} bairros mapeados para existentes.\n${previewResult.exatos.length} bairros já existiam (ignorados).`)
        resetImportModal()
        onRefresh()
      } else {
        setBairroError(res.error || 'Erro ao confirmar importação.')
      }
    })
  }

  const handleAnalyzeCidades = () => {
    if (!importCidadeTexto.trim()) {
      setCidadeImportError('O campo de texto está vazio.')
      return
    }
    setCidadeImportError('')
    startTransition(async () => {
      const nomes = importCidadeTexto.split('\n').map(l => l.trim()).filter(l => l.length > 0)
      const res = await previewCidadesImport(nomes)
      if (res.success && res.exatos && res.similares && res.novos) {
        setPreviewCidadeResult({ exatos: res.exatos, similares: res.similares, novos: res.novos })
        const init = new Map<string, { acao: 'usar_existente' | 'criar_novo' | 'ignorar', mapearPara?: string }>()
        for (const s of res.similares) {
          init.set(s.nomeOriginal, { acao: 'usar_existente', mapearPara: s.sugestao.id })
        }
        for (const n of res.novos) {
          init.set(n, { acao: 'criar_novo' })
        }
        setReconciliacoesCidade(init)
        setImportCidadeStep('review')
      } else {
        setCidadeImportError(res.error || 'Erro ao analisar cidades.')
      }
    })
  }

  const handleConfirmImportCidades = () => {
    if (!previewCidadeResult) return
    startTransition(async () => {
      const paraConfirmar: { nome: string; mapearPara?: string }[] = []

      for (const novo of previewCidadeResult.novos) {
        const dec = reconciliacoesCidade.get(novo)
        if (dec?.acao === 'criar_novo') {
          paraConfirmar.push({ nome: novo })
        }
      }

      for (const sim of previewCidadeResult.similares) {
        const dec = reconciliacoesCidade.get(sim.nomeOriginal)
        if (dec?.acao === 'criar_novo') {
          paraConfirmar.push({ nome: sim.nomeOriginal })
        } else if (dec?.acao === 'usar_existente' && dec.mapearPara) {
          paraConfirmar.push({ nome: sim.nomeOriginal, mapearPara: dec.mapearPara })
        }
      }

      if (paraConfirmar.length === 0) {
        alert('Nenhuma cidade selecionada para importar.')
        resetImportCidadeModal()
        return
      }

      const res = await confirmarImportCidades(paraConfirmar)
      if (res.success) {
        alert(`Importação concluída!\n\n${res.inseridos} cidades novas cadastradas.\n${res.mapeados} cidades mapeadas para existentes.\n${previewCidadeResult.exatos.length} cidades já existiam (ignoradas).`)
        resetImportCidadeModal()
      } else {
        setCidadeImportError(res.error || 'Erro ao confirmar importação.')
      }
    })
  }

  const resetImportCidadeModal = () => {
    setIsOpenImportCidadeForm(false)
    setImportCidadeTexto('')
    setImportCidadeStep('input')
    setPreviewCidadeResult(null)
    setReconciliacoesCidade(new Map())
    setCidadeImportError('')
  }

  const resetImportModal = () => {
    setIsOpenImportForm(false)
    setImportTexto('')
    setImportCidadeId('')
    setImportStep('input')
    setPreviewResult(null)
    setReconciliacoes(new Map())
  }

  const handleSubmitBairro = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bairroNome.trim()) {
      setBairroError('O nome do bairro é obrigatório.')
      return
    }
    if (!bairroCidadeId) {
      setBairroError('A cidade é obrigatória.')
      return
    }

    startTransition(async () => {
      let res
      if (editingBairroId) {
        res = await updateBairro(editingBairroId, { nome: bairroNome, cidadeId: bairroCidadeId })
      } else {
        res = await createBairro({ nome: bairroNome, cidadeId: bairroCidadeId })
      }

      if (res.success) {
        setIsOpenBairroForm(false)
        onRefresh()
      } else {
        setBairroError(res.error || 'Erro ao processar bairro.')
      }
    })
  }

  const handleOpenDeleteBairro = (bairro: Bairro) => {
    setDeleteConfirmType('bairro')
    setDeleteTargetId(bairro.id)
    setDeleteTargetName(bairro.nome)
    setDeleteConfirmError('')
    setIsOpenDeleteConfirm(true)
  }

  const handleConfirmDelete = async () => {
    startTransition(async () => {
      let res
      if (deleteConfirmType === 'cidade') {
        res = await deleteCidade(deleteTargetId)
      } else if (deleteConfirmType === 'bairros_massa') {
        res = await deleteBairrosEmMassa(selectedBairros)
      } else {
        res = await deleteBairro(deleteTargetId)
      }

      if (res.success) {
        setIsOpenDeleteConfirm(false)
        if (deleteConfirmType === 'bairros_massa') setSelectedBairros([])
        onRefresh()
      } else {
        setDeleteConfirmError(res.error || `Erro ao excluir ${deleteConfirmType}.`)
      }
    })
  }

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-primary-600" />
          Gestão de Localidades
        </h2>
        <p className="text-slate-500 text-sm">
          Gerencie as cidades e bairros que ficam disponíveis para o cadastro de eleitores.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Painel de Cidades */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-700 text-base flex items-center gap-2">
              <Building2 className="w-5 h-5 text-slate-400" />
              Cidades ({cidades.length})
            </h3>
            <Button
              onClick={handleOpenCreateCidade}
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Nova Cidade
            </Button>
            <Button onClick={() => setIsOpenImportCidadeForm(true)} variant="secondary" size="sm" className="bg-white hover:bg-slate-50 text-slate-700 border-slate-200">
              <FileSearch className="w-4 h-4 mr-2 text-slate-500" />
              Importar Lote
            </Button>
          </div>

          {cidades.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">Nenhuma cidade cadastrada.</div>
          ) : (
            <div className="divide-y divide-slate-150 max-h-[60vh] overflow-y-auto pr-1">
              {cidades.map((cidade) => (
                <div key={cidade.id} className="flex justify-between items-center py-3 group">
                  <span className="font-medium text-slate-800 text-sm">{cidade.nome}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      onClick={() => handleOpenEditCidade(cidade)}
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 p-1"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                    </Button>
                    <Button
                      onClick={() => handleOpenDeleteCidade(cidade)}
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 p-1 hover:bg-red-50"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Painel de Bairros */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 flex-wrap gap-2">
            <h3 className="font-bold text-slate-700 text-base flex items-center gap-2">
              <MapPin className="w-5 h-5 text-slate-400" />
              Bairros ({bairros.length})
            </h3>
            <div className="flex gap-2 items-center">
              {selectedBairros.length > 0 && (
                <Button
                  onClick={handleOpenDeleteBairrosMassa}
                  variant="danger"
                  size="sm"
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                >
                  Excluir Selecionados ({selectedBairros.length})
                </Button>
              )}
              <Button
                onClick={() => {
                  setBairroError('')
                  setImportTexto('')
                  setImportCidadeId(cidades.length > 0 ? cidades[0].id : '')
                  setImportStep('input')
                  setPreviewResult(null)
                  setReconciliacoes(new Map())
                  setIsOpenImportForm(true)
                }}
                variant="outline"
                size="sm"
              >
                Importar Lote
              </Button>
              <Button
                onClick={handleOpenCreateBairro}
                disabled={cidades.length === 0}
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Novo Bairro
              </Button>
            </div>
          </div>

          {bairros.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              {cidades.length === 0 ? 'Cadastre uma cidade primeiro para poder cadastrar bairros.' : 'Nenhum bairro cadastrado.'}
            </div>
          ) : (
            <div className="divide-y divide-slate-150 max-h-[60vh] overflow-y-auto pr-1">
              <div className="py-2.5 px-3 flex gap-3 items-center border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
                <input
                  type="checkbox"
                  className="w-4 h-4 appearance-none relative checked:bg-primary-600 checked:border-primary-600 checked:after:content-['✓'] checked:after:text-white checked:after:absolute checked:after:text-[12px] checked:after:font-bold checked:after:left-[1px] checked:after:-top-[2px] bg-white border-2 border-slate-300 border-dashed rounded focus:ring-primary-500 focus:ring-offset-0 cursor-pointer transition-all"
                  checked={selectedBairros.length === bairros.length && bairros.length > 0}
                  onChange={handleToggleSelectAllBairros}
                />
                <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Selecionar Todos</span>
              </div>
              {bairros.map((bairro) => (
                <div key={bairro.id} className={`flex justify-between items-center py-2.5 px-3 group transition-colors ${selectedBairros.includes(bairro.id) ? 'bg-slate-50/80' : 'hover:bg-slate-50/40'}`}>
                  <div className="flex gap-3 items-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 appearance-none relative checked:bg-primary-600 checked:border-primary-600 checked:after:content-['✓'] checked:after:text-white checked:after:absolute checked:after:text-[12px] checked:after:font-bold checked:after:left-[1px] checked:after:-top-[2px] bg-white border-2 border-slate-300 border-dashed rounded focus:ring-primary-500 focus:ring-offset-0 cursor-pointer transition-all"
                      checked={selectedBairros.includes(bairro.id)}
                      onChange={() => handleToggleSelectBairro(bairro.id)}
                    />
                    <div>
                      <span className={`text-sm block transition-colors ${selectedBairros.includes(bairro.id) ? 'text-slate-800 font-semibold' : 'text-slate-700 font-medium'}`}>{bairro.nome}</span>
                      {bairro.cidade && (
                        <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">{bairro.cidade.nome}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      onClick={() => handleOpenEditBairro(bairro)}
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 p-1"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                    </Button>
                    <Button
                      onClick={() => handleOpenDeleteBairro(bairro)}
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 p-1 hover:bg-red-50"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Importação em Massa de Cidades */}
      {isMounted && isOpenImportCidadeForm && createPortal(
        <div className="fixed inset-0 z-[100] flex min-h-full items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className={`bg-white border border-slate-200 rounded-xl p-6 shadow-xl relative space-y-4 animate-in zoom-in-95 duration-200 text-left sm:my-8 ${importCidadeStep === 'review' ? 'max-w-2xl w-full' : 'max-w-lg w-full'}`}>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {importCidadeStep === 'review' && (
                  <button
                    onClick={() => { setImportCidadeStep('input'); setPreviewCidadeResult(null); setReconciliacoesCidade(new Map()); setCidadeImportError(''); }}
                    className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Voltar"
                  >
                    <ArrowRight className="w-4 h-4 text-slate-500 rotate-180" />
                  </button>
                )}
                <h3 className="font-bold text-slate-800 text-lg">
                  {importCidadeStep === 'input' ? 'Importar Cidades em Lote' : 'Revisar Cidades'}
                </h3>
              </div>
              <Button onClick={resetImportCidadeModal} variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 hover:bg-slate-50">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Etapa 1: Inserir texto */}
            {importCidadeStep === 'input' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Lista de Cidades (1 por linha) *</label>
                  <textarea
                    value={importCidadeTexto}
                    onChange={(e) => setImportCidadeTexto(e.target.value)}
                    placeholder={"São Paulo\nRio de Janeiro\nCampinas"}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[160px] font-mono"
                    disabled={isPending}
                  />
                  <p className="text-[11px] text-slate-400">Copie do Excel e cole acima. O sistema vai analisar antes de importar.</p>
                </div>
              </div>
            )}

            {/* Etapa 2: Conciliação */}
            {importCidadeStep === 'review' && previewCidadeResult && (
              <div className="space-y-4">
                {cidadeImportError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                    <p className="text-xs text-red-700 font-medium leading-tight">{cidadeImportError}</p>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex gap-4 text-sm mb-4">
                  <div className="flex flex-col">
                    <span className="text-blue-900 font-semibold">{previewCidadeResult.exatos.length}</span>
                    <span className="text-blue-700 text-xs">Exatos (Ignorados)</span>
                  </div>
                  <div className="w-px bg-blue-200"></div>
                  <div className="flex flex-col">
                    <span className="text-amber-700 font-semibold">{previewCidadeResult.similares.length}</span>
                    <span className="text-amber-600 text-xs">Similares (Revisão)</span>
                  </div>
                  <div className="w-px bg-blue-200"></div>
                  <div className="flex flex-col">
                    <span className="text-green-700 font-semibold">{previewCidadeResult.novos.length}</span>
                    <span className="text-green-600 text-xs">Novos (Criar)</span>
                  </div>
                </div>

                <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-6">
                  {/* NOVOS */}
                  {previewCidadeResult.novos.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        Novas Cidades ({previewCidadeResult.novos.length})
                      </h4>
                      {previewCidadeResult.novos.map((novo, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                          <span className="font-medium text-slate-700">{novo}</span>
                          <select
                            className="bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-primary-500"
                            value={reconciliacoesCidade.get(novo)?.acao || 'criar_novo'}
                            onChange={e => {
                              const val = e.target.value as any
                              const newMap = new Map(reconciliacoesCidade)
                              if (val === 'ignorar') newMap.set(novo, { acao: 'ignorar' })
                              else newMap.set(novo, { acao: 'criar_novo' })
                              setReconciliacoesCidade(newMap)
                            }}
                          >
                            <option value="criar_novo">Criar Novo</option>
                            <option value="ignorar">Ignorar (Não importar)</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* SIMILARES */}
                  {previewCidadeResult.similares.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        Cidades Similares Encontradas ({previewCidadeResult.similares.length})
                      </h4>
                      {previewCidadeResult.similares.map((sim, i) => {
                        const decisao = reconciliacoesCidade.get(sim.nomeOriginal)
                        return (
                          <div key={i} className="p-3 bg-amber-50/50 border border-amber-100 rounded-lg text-sm space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-slate-800">{sim.nomeOriginal}</span>
                              <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                                Sugestão: {sim.sugestao.nome}
                              </span>
                            </div>
                            <select
                              className="w-full bg-white border border-amber-200 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-amber-500"
                              value={decisao?.acao === 'usar_existente' ? decisao.mapearPara : decisao?.acao}
                              onChange={e => {
                                const val = e.target.value
                                const newMap = new Map(reconciliacoesCidade)
                                if (val === 'criar_novo') newMap.set(sim.nomeOriginal, { acao: 'criar_novo' })
                                else if (val === 'ignorar') newMap.set(sim.nomeOriginal, { acao: 'ignorar' })
                                else newMap.set(sim.nomeOriginal, { acao: 'usar_existente', mapearPara: val })
                                setReconciliacoesCidade(newMap)
                              }}
                            >
                              <option value={sim.sugestao.id}>✓ Mapear para: {sim.sugestao.nome}</option>
                              {cidades.filter(c => c.id !== sim.sugestao.id).map(c => (
                                <option key={c.id} value={c.id}>Mapear para: {c.nome}</option>
                              ))}
                              <option value="criar_novo">+ Criar como nova cidade</option>
                              <option value="ignorar">✕ Ignorar (Não importar)</option>
                            </select>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Botões */}
            <div className="pt-2 flex justify-end gap-3">
              <Button onClick={resetImportCidadeModal} variant="secondary" size="sm" disabled={isPending}>
                Cancelar
              </Button>
              {importCidadeStep === 'input' ? (
                <Button onClick={handleAnalyzeCidades} variant="primary" size="sm" disabled={isPending || !importCidadeTexto}>
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileSearch className="w-4 h-4 mr-2" />}
                  {isPending ? 'Analisando...' : 'Analisar'}
                </Button>
              ) : (
                <Button onClick={handleConfirmImportCidades} variant="primary" size="sm" disabled={isPending}>
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                  {isPending ? 'Importando...' : 'Confirmar Importação'}
                </Button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Importação em Massa */}
      {isMounted && isOpenImportForm && createPortal(
        <div className="fixed inset-0 z-[100] flex min-h-full items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className={`bg-white border border-slate-200 rounded-xl p-6 shadow-xl relative space-y-4 animate-in zoom-in-95 duration-200 text-left sm:my-8 ${importStep === 'review' ? 'max-w-2xl w-full' : 'max-w-lg w-full'}`}>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {importStep === 'review' && (
                  <button
                    onClick={() => { setImportStep('input'); setPreviewResult(null); setReconciliacoes(new Map()); setBairroError(''); }}
                    className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Voltar"
                  >
                    <ArrowRight className="w-4 h-4 text-slate-500 rotate-180" />
                  </button>
                )}
                <h3 className="font-bold text-slate-800 text-lg">
                  {importStep === 'input' ? 'Importar Bairros em Lote' : 'Revisar Bairros'}
                </h3>
              </div>
              <Button onClick={resetImportModal} variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 hover:bg-slate-50">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Etapa 1: Entrada de dados */}
            {importStep === 'input' && (
              <div className="space-y-4">
                {bairroError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                    <p className="text-xs text-red-700 font-medium leading-tight">{bairroError}</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Selecione a Cidade *</label>
                  <select
                    value={importCidadeId}
                    onChange={e => setImportCidadeId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={isPending}
                  >
                    <option value="">Selecione...</option>
                    {cidades.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Lista de Bairros (1 por linha) *</label>
                  <textarea
                    value={importTexto}
                    onChange={(e) => setImportTexto(e.target.value)}
                    placeholder={"Centro\nJardim América\nZona Sul"}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[160px] font-mono"
                    disabled={isPending}
                  />
                  <p className="text-[11px] text-slate-400">Copie do Excel e cole acima. O sistema vai analisar antes de importar.</p>
                </div>
              </div>
            )}

            {/* Etapa 2: Conciliação */}
            {importStep === 'review' && previewResult && (
              <div className="space-y-4">
                {bairroError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                    <p className="text-xs text-red-700 font-medium leading-tight">{bairroError}</p>
                  </div>
                )}

                {/* Resumo */}
                <div className="flex gap-3 flex-wrap">
                  {previewResult.exatos.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold border border-green-200">
                      <Check className="w-3.5 h-3.5" />
                      {previewResult.exatos.length} já existe{previewResult.exatos.length > 1 ? 'm' : ''}
                    </span>
                  )}
                  {previewResult.similares.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold border border-amber-200">
                      <RefreshCw className="w-3.5 h-3.5" />
                      {previewResult.similares.length} similar{previewResult.similares.length > 1 ? 'es' : ''}
                    </span>
                  )}
                  {previewResult.novos.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-200">
                      <Plus className="w-3.5 h-3.5" />
                      {previewResult.novos.length} novo{previewResult.novos.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Lista de bairros */}
                <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-[50vh] overflow-y-auto">
                  {/* Bairros com match exato */}
                  {previewResult.exatos.map((item) => (
                    <div key={item.nomeOriginal} className="flex items-center gap-3 px-4 py-3 bg-green-50/50">
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-slate-800">{item.nomeOriginal}</span>
                        <span className="text-xs text-green-600 ml-2">→ {item.nomeExistente} (já existe)</span>
                      </div>
                    </div>
                  ))}

                  {/* Bairros similares */}
                  {previewResult.similares.map((item) => {
                    const decisao = reconciliacoes.get(item.nomeOriginal)
                    const usandoExistente = decisao?.acao === 'usar_existente'
                    return (
                      <div key={item.nomeOriginal} className="flex items-center gap-3 px-4 py-3 bg-amber-50/50">
                        <RefreshCw className="w-4 h-4 text-amber-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-slate-800">{item.nomeOriginal}</span>
                          <span className="text-xs text-amber-600 ml-2">(similar)</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            value={usandoExistente ? item.sugestao.id : '__novo__'}
                            onChange={(e) => {
                              const next = new Map(reconciliacoes)
                              if (e.target.value === '__novo__') {
                                next.set(item.nomeOriginal, { acao: 'criar_novo' })
                              } else {
                                next.set(item.nomeOriginal, { acao: 'usar_existente', mapearPara: e.target.value })
                              }
                              setReconciliacoes(next)
                            }}
                            className="px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 max-w-[200px]"
                            disabled={isPending}
                          >
                            <option value="__novo__">Cadastrar como novo bairro</option>
                            {bairros.filter(b => b.cidadeId === importCidadeId).map(b => (
                              <option key={b.id} value={b.id}>{b.nome}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )
                  })}

                  {/* Bairros novos */}
                  {previewResult.novos.map((nome) => {
                    const decisao = reconciliacoes.get(nome)
                    const vaiCadastrar = decisao?.acao === 'criar_novo'
                    return (
                      <div key={nome} className="flex items-center gap-3 px-4 py-3">
                        <Plus className="w-4 h-4 text-blue-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-slate-800">{nome}</span>
                          <span className="text-xs text-blue-600 ml-2">(novo bairro)</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            value={vaiCadastrar ? '__novo__' : '__ignorar__'}
                            onChange={(e) => {
                              const next = new Map(reconciliacoes)
                              if (e.target.value === '__ignorar__') {
                                next.set(nome, { acao: 'ignorar' })
                              } else {
                                next.set(nome, { acao: 'criar_novo' })
                              }
                              setReconciliacoes(next)
                            }}
                            className="px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                            disabled={isPending}
                          >
                            <option value="__novo__">Cadastrar como novo bairro</option>
                            <option value="__ignorar__">Ignorar este bairro</option>
                          </select>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Botões */}
            <div className="pt-2 flex justify-end gap-3">
              <Button onClick={resetImportModal} variant="secondary" size="sm" disabled={isPending}>
                Cancelar
              </Button>
              {importStep === 'input' ? (
                <Button onClick={handleAnalyzeBairros} variant="primary" size="sm" disabled={isPending || !importCidadeId || !importTexto}>
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileSearch className="w-4 h-4 mr-2" />}
                  {isPending ? 'Analisando...' : 'Analisar'}
                </Button>
              ) : (
                <Button onClick={handleConfirmImport} variant="primary" size="sm" disabled={isPending}>
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                  {isPending ? 'Importando...' : 'Confirmar Importação'}
                </Button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Cidade */}
      {isMounted && isOpenCidadeForm && createPortal(
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex min-h-full items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto relative space-y-4 animate-in zoom-in-95 duration-200 text-left sm:my-8">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg">
                {editingCidadeId ? 'Editar Cidade' : 'Cadastrar Nova Cidade'}
              </h3>
              <Button
                onClick={() => setIsOpenCidadeForm(false)}
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <form onSubmit={handleSubmitCidade} className="space-y-4">
              {cidadeError && <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-100 font-medium">{cidadeError}</div>}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nome da Cidade</label>
                <input
                  type="text"
                  placeholder="Ex: São Paulo"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={cidadeNome}
                  onChange={(e) => setCidadeNome(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  onClick={() => setIsOpenCidadeForm(false)}
                  variant="secondary"
                  size="sm"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  isLoading={isPending}
                  variant="primary"
                  size="sm"
                >
                  Salvar
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Bairro */}
      {isMounted && isOpenBairroForm && createPortal(
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex min-h-full items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto relative space-y-4 animate-in zoom-in-95 duration-200 text-left sm:my-8">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg">
                {editingBairroId ? 'Editar Bairro' : 'Cadastrar Novo Bairro'}
              </h3>
              <Button
                onClick={() => setIsOpenBairroForm(false)}
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <form onSubmit={handleSubmitBairro} className="space-y-4">
              {bairroError && <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-100 font-medium">{bairroError}</div>}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Cidade</label>
                <select
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-700 font-semibold"
                  value={bairroCidadeId}
                  onChange={(e) => setBairroCidadeId(e.target.value)}
                >
                  {cidades.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nome do Bairro</label>
                <input
                  type="text"
                  placeholder="Ex: Centro"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={bairroNome}
                  onChange={(e) => setBairroNome(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  onClick={() => setIsOpenBairroForm(false)}
                  variant="secondary"
                  size="sm"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  isLoading={isPending}
                  variant="primary"
                  size="sm"
                >
                  Salvar
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Confirmação de Exclusão */}
      {isMounted && isOpenDeleteConfirm && createPortal(
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex min-h-full items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xl max-w-md w-full space-y-4 animate-in zoom-in-95 duration-200 text-left sm:my-8">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-full flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="font-bold text-slate-800 text-lg">
                  Confirmar Exclusão
                </h3>
                <p className="text-slate-500 text-sm">
                  Deseja realmente excluir {deleteConfirmType === 'cidade' ? 'a cidade' : deleteConfirmType === 'bairros_massa' ? 'os bairros selecionados' : 'o bairro'}{' '}
                  <span className="font-bold text-slate-900">"{deleteTargetName}"</span>?
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-xs font-semibold leading-relaxed">
              Aviso: Esta ação é irreversível e falhará {deleteConfirmType === 'bairros_massa' ? 'para os bairros que possuírem' : 'imediatamente se houver algum'} eleitor vinculado a este local.
            </div>

            {deleteConfirmError && (
              <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100 font-bold leading-relaxed">
                {deleteConfirmError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <Button
                onClick={() => setIsOpenDeleteConfirm(false)}
                disabled={isPending}
                variant="secondary"
                size="sm"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmDelete}
                disabled={isPending}
                isLoading={isPending}
                variant="danger"
                size="sm"
              >
                Confirmar Exclusão
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
