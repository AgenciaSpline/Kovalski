'use client'

import React, { useState, useTransition, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Edit2, Trash2, Tag, Loader2, Sparkles, X, AlertTriangle } from 'lucide-react'
import { createEtiqueta, updateEtiqueta, deleteEtiqueta, importEtiquetasEmMassa } from '@/lib/actions'
import { Button } from './ui/Button'

interface Etiqueta {
  id: string
  nome: string
  categoria: string
  cor: string
}

interface EtiquetasViewProps {
  etiquetas: Etiqueta[]
  onRefresh: () => void
}

const PALETA_CORES = [
  { nome: 'Azul', hex: '#3b82f6' },
  { nome: 'Esmeralda', hex: '#10b981' },
  { nome: 'Violeta', hex: '#8b5cf6' },
  { nome: 'Laranja', hex: '#f97316' },
  { nome: 'Vermelho', hex: '#ef4444' },
  { nome: 'Rosa', hex: '#ec4899' },
  { nome: 'Ciano', hex: '#06b6d4' },
  { nome: 'Amber', hex: '#f59e0b' },
  { nome: 'Slate', hex: '#64748b' }
]

export default function EtiquetasView({ etiquetas, onRefresh }: EtiquetasViewProps) {
  const [isPending, startTransition] = useTransition()
  const [isOpenForm, setIsOpenForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form State
  const [nome, setNome] = useState('')
  const [categoria, setCategoria] = useState('Evento')
  const [cor, setCor] = useState(PALETA_CORES[0].hex)
  const [errorMsg, setErrorMsg] = useState('')

  const [isOpenImportForm, setIsOpenImportForm] = useState(false)
  const [importTexto, setImportTexto] = useState('')
  const [importCategoria, setImportCategoria] = useState('Evento')
  const [importCor, setImportCor] = useState(PALETA_CORES[0].hex)

  const handleImportEtiquetas = () => {
    if (!importTexto.trim()) {
      setErrorMsg('O campo de texto está vazio.')
      return
    }
    setErrorMsg('')
    startTransition(async () => {
      const res = await importEtiquetasEmMassa(importCategoria, importTexto)
      if (res.success) {
        alert(`Importação concluída!\n\n${res.inseridos} etiquetas novas cadastradas.\n${res.ignorados} ignoradas (já existiam).`)
        setIsOpenImportForm(false)
        setImportTexto('')
        onRefresh()
      } else {
        setErrorMsg(res.error || 'Erro ao importar.')
      }
    })
  }

  // Modal de Confirmação de Exclusão
  const [isOpenDeleteConfirm, setIsOpenDeleteConfirm] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState('')
  const [deleteTargetName, setDeleteTargetName] = useState('')
  const [deleteConfirmError, setDeleteConfirmError] = useState('')

  const handleOpenCreate = () => {
    setEditingId(null)
    setNome('')
    setCategoria('Evento')
    setCor(PALETA_CORES[0].hex)
    setErrorMsg('')
    setIsOpenForm(true)
  }

  const handleOpenEdit = (etiqueta: Etiqueta) => {
    setEditingId(etiqueta.id)
    setNome(etiqueta.nome)
    setCategoria(etiqueta.categoria)
    setCor(etiqueta.cor)
    setErrorMsg('')
    setIsOpenForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) {
      setErrorMsg('O nome da etiqueta é obrigatório.')
      return
    }

    startTransition(async () => {
      let res
      if (editingId) {
        res = await updateEtiqueta(editingId, { nome, categoria, cor })
      } else {
        res = await createEtiqueta({ nome, categoria, cor })
      }

      if (res.success) {
        setIsOpenForm(false)
        onRefresh()
      } else {
        setErrorMsg(res.error || 'Erro ao processar requisição.')
      }
    })
  }

  const handleOpenDelete = (etiqueta: Etiqueta) => {
    setDeleteTargetId(etiqueta.id)
    setDeleteTargetName(etiqueta.nome)
    setDeleteConfirmError('')
    setIsOpenDeleteConfirm(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return

    startTransition(async () => {
      const res = await deleteEtiqueta(deleteTargetId)
      if (res.success) {
        setIsOpenDeleteConfirm(false)
        onRefresh()
      } else {
        setDeleteConfirmError(res.error || 'Erro ao excluir etiqueta.')
      }
    })
  }

  // Agrupar etiquetas por categoria para melhor navegação visual
  const categoriasUnicas = Array.from(new Set(etiquetas.map(e => e.categoria)))

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Tag className="w-6 h-6 text-primary-600" />
              Gestão de Etiquetas
            </h2>
            <p className="text-slate-500 text-sm">
              Gerencie tags, eventos e categorias de agrupamento de eleitores.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => { setErrorMsg(''); setImportTexto(''); setIsOpenImportForm(true); }}
              variant="outline"
              className="bg-slate-700 hover:bg-slate-800 text-white border-0 w-full sm:w-auto shadow-sm"
            >
              Importar Lote
            </Button>
            <Button
              onClick={handleOpenCreate}
              variant="primary"
              className="w-full sm:w-auto shadow-sm"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Nova Etiqueta
            </Button>
          </div>
        </div>

        {categoriasUnicas.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
            <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-700">Nenhuma etiqueta cadastrada</h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto mt-1">
              Cadastre etiquetas para organizar e catalogar os eleitores por interesses, eventos ou influência política.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {categoriasUnicas.map(catName => {
              const etiquetasDaCat = etiquetas.filter(e => e.categoria === catName)
              return (
                <div key={catName} className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider">
                    Categoria: {catName}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {etiquetasDaCat.map(etiqueta => (
                      <div
                        key={etiqueta.id}
                        className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between hover:border-slate-300 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: etiqueta.cor }}
                          />
                          <div>
                            <h4 className="font-semibold text-slate-800 text-sm">{etiqueta.nome}</h4>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <Button
                            onClick={() => handleOpenEdit(etiqueta)}
                            variant="ghost"
                            size="icon"
                            className="text-slate-500 hover:text-slate-700"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleOpenDelete(etiqueta)}
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal de Importação em Massa */}
      {isMounted && isOpenImportForm && createPortal(
        <div className="fixed inset-0 z-[100] flex min-h-full items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xl max-w-lg w-full relative space-y-4 animate-in zoom-in-95 duration-200 text-left sm:my-8">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg">Importar Etiquetas em Lote</h3>
              <Button onClick={() => setIsOpenImportForm(false)} variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 hover:bg-slate-50">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-100 rounded flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-xs text-red-700 font-medium leading-tight">{errorMsg}</p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Categoria *</label>
                  <select
                    value={importCategoria}
                    onChange={e => setImportCategoria(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={isPending}
                  >
                    <option value="Bairro">Bairro</option>
                    <option value="Evento">Evento</option>
                    <option value="Profissão">Profissão</option>
                    <option value="Interesse">Interesse</option>
                    <option value="Origem">Origem</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Lista de Etiquetas (1 por linha) *</label>
                <textarea
                  value={importTexto}
                  onChange={(e) => setImportTexto(e.target.value)}
                  placeholder="Encontro no Centro\nReunião de Lideranças\nVoluntários da Saúde"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[160px] font-mono"
                  disabled={isPending}
                />
                <p className="text-[11px] text-slate-400">Copie do Excel e cole acima. Nomes já cadastrados serão ignorados.</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <Button onClick={() => setIsOpenImportForm(false)} variant="secondary" size="sm" disabled={isPending}>
                Cancelar
              </Button>
              <Button onClick={handleImportEtiquetas} variant="primary" size="sm" disabled={isPending || !importTexto}>
                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isPending ? 'Importando...' : 'Iniciar Importação'}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Formulário Popup / Modal Centralizado */}
      {isMounted && isOpenForm && createPortal(
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex min-h-full items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200 space-y-4 text-left sm:my-8">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg">
                {editingId ? 'Editar Etiqueta' : 'Cadastrar Nova Etiqueta'}
              </h3>
              <Button
                onClick={() => setIsOpenForm(false)}
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 font-medium">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nome da Etiqueta
                </label>
                <input
                  type="text"
                  placeholder="Ex: Reunião de Bairro, Liderança Jovem..."
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-medium text-slate-800"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Categoria
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-slate-800"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                  >
                    <option value="Evento">Evento / Comício</option>
                    <option value="Liderança">Liderança Política</option>
                    <option value="Interesse">Área de Interesse</option>
                    <option value="Perfil">Perfil de Eleitor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Cor da Tag
                  </label>
                  <div className="grid grid-cols-5 gap-1.5 p-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                    {PALETA_CORES.map(c => (
                      <Button
                        key={c.hex}
                        type="button"
                        onClick={() => setCor(c.hex)}
                        style={{ backgroundColor: c.hex }}
                        variant="ghost"
                        className={`w-7 h-7 rounded-full p-0 min-w-0 transition-transform focus:outline-none ${
                          cor === c.hex ? 'scale-110 ring-2 ring-offset-2 ring-primary-500' : 'hover:scale-105 opacity-80 hover:opacity-100'
                        }`}
                        title={c.nome}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  onClick={() => setIsOpenForm(false)}
                  variant="secondary"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  isLoading={isPending}
                  variant="primary"
                >
                  Salvar
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Confirmação de Exclusão de Etiqueta */}
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
                  Deseja realmente excluir a etiqueta{' '}
                  <span className="font-bold text-slate-900">"{deleteTargetName}"</span>?
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-xs font-semibold leading-relaxed">
              Aviso: Ela será removida permanentemente do sistema e de todos os eleitores cadastrados que a possuíam atribuída.
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
    </>
  )
}
