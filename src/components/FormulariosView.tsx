'use client'

import React, { useState, useTransition, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Edit2, Trash2, Link, Copy, Check, ClipboardList, Loader2, X, AlertTriangle, Info, ToggleLeft, ToggleRight } from 'lucide-react'
import { createFormulario, updateFormulario, deleteFormulario } from '@/lib/actions'
import MultiSelect from './MultiSelect'
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

interface Lider {
  id: string
  nomeCompleto: string
  telefone: string
}

interface Etiqueta {
  id: string
  nome: string
  categoria: string
  cor: string
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

interface FormulariosViewProps {
  formularios: Formulario[]
  cidades: Cidade[]
  bairros: Bairro[]
  etiquetas: Etiqueta[]
  lideres: Lider[]
  onRefresh: () => void
}

export default function FormulariosView({
  formularios,
  cidades,
  bairros,
  etiquetas,
  lideres,
  onRefresh
}: FormulariosViewProps) {
  const [isPending, startTransition] = useTransition()
  const [isOpenForm, setIsOpenForm] = useState(false)
  const [editingForm, setEditingForm] = useState<Formulario | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Form State
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [cidadeId, setCidadeId] = useState('')
  const [bairroId, setBairroId] = useState('')
  const [liderId, setLiderId] = useState('')
  const [exibirDataNascimento, setExibirDataNascimento] = useState(true)
  const [exibirEndereco, setExibirEndereco] = useState(true)
  const [selectedEtiquetaIds, setSelectedEtiquetaIds] = useState<string[]>([])
  const [errorMsg, setErrorMsg] = useState('')

  // Delete Confirm Modal State
  const [isOpenDeleteConfirm, setIsOpenDeleteConfirm] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState('')
  const [deleteTargetName, setDeleteTargetName] = useState('')
  const [deleteConfirmError, setDeleteConfirmError] = useState('')

  // Filtered Neighborhoods based on City selection
  const [filteredBairros, setFilteredBairros] = useState<Bairro[]>([])

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (cidadeId) {
      const newFiltered = bairros.filter(b => b.cidadeId === cidadeId)
      setFilteredBairros(newFiltered)
      // Reset bairroId only if the currently selected bairro does not belong to the selected city
      const currentBairroBelongsToCity = newFiltered.some(b => b.id === bairroId)
      if (!currentBairroBelongsToCity) {
        setBairroId('')
      }
    } else {
      setFilteredBairros([])
      setBairroId('')
    }
  }, [cidadeId, bairros])

  const handleOpenCreate = () => {
    setEditingForm(null)
    setTitulo('')
    setDescricao('')
    setCidadeId('')
    setBairroId('')
    setLiderId('')
    setExibirDataNascimento(true)
    setExibirEndereco(true)
    setSelectedEtiquetaIds([])
    setErrorMsg('')
    setIsOpenForm(true)
  }

  const handleOpenEdit = (form: Formulario) => {
    setEditingForm(form)
    setTitulo(form.titulo)
    setDescricao(form.descricao || '')
    setCidadeId(form.cidadeId || '')
    setBairroId(form.bairroId || '')
    setLiderId(form.liderId || '')
    setExibirDataNascimento(form.exibirDataNascimento)
    setExibirEndereco(form.exibirEndereco)
    setSelectedEtiquetaIds(form.etiquetas.map(t => t.id))
    setErrorMsg('')
    setIsOpenForm(true)
  }

  const handleCopyLink = (id: string) => {
    const link = `${window.location.origin}/f/${id}`
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!titulo.trim()) {
      setErrorMsg('O título do formulário é obrigatório.')
      return
    }

    startTransition(async () => {
      let res
      if (editingForm) {
        res = await updateFormulario(editingForm.id, {
          titulo: titulo.trim(),
          descricao: descricao.trim() || undefined,
          cidadeId: cidadeId || undefined,
          bairroId: bairroId || undefined,
          liderId: liderId || undefined,
          exibirDataNascimento,
          exibirEndereco,
          etiquetaIds: selectedEtiquetaIds
        })
      } else {
        res = await createFormulario({
          titulo: titulo.trim(),
          descricao: descricao.trim() || undefined,
          cidadeId: cidadeId || undefined,
          bairroId: bairroId || undefined,
          liderId: liderId || undefined,
          exibirDataNascimento,
          exibirEndereco,
          etiquetaIds: selectedEtiquetaIds
        })
      }

      if (res.success) {
        setIsOpenForm(false)
        setEditingForm(null)
        onRefresh()
      } else {
        setErrorMsg(res.error || 'Erro ao salvar formulário.')
      }
    })
  }

  const handleOpenDelete = (form: Formulario) => {
    setDeleteTargetId(form.id)
    setDeleteTargetName(form.titulo)
    setDeleteConfirmError('')
    setIsOpenDeleteConfirm(true)
  }

  const handleConfirmDelete = () => {
    if (!deleteTargetId) return

    startTransition(async () => {
      const res = await deleteFormulario(deleteTargetId)
      if (res.success) {
        setIsOpenDeleteConfirm(false)
        onRefresh()
      } else {
        setDeleteConfirmError(res.error || 'Erro ao excluir formulário.')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary-600" />
            Formulários
          </h2>
          <p className="text-slate-500 text-sm">
            Crie formulários personalizados para seus colaboradores e líderes. Todos os cadastros feitos pelo link serão vinculados automaticamente ao líder selecionado.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          variant="primary"
          className="w-full sm:w-auto whitespace-nowrap shadow-sm"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Criar Formulário
        </Button>
      </div>

      {/* Forms List */}
      {formularios.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">Nenhum formulário cadastrado</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto mt-1">
            Crie seu primeiro formulário personalizado para gerar um link público exclusivo. Compartilhe-o com seus colaboradores para rastrear os eleitores.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {formularios.map(form => (
            <div key={form.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 hover:border-slate-350 transition-all flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">{form.titulo}</h3>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Criado em: {new Date(form.criadoEm).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      onClick={() => handleOpenEdit(form)}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-primary-600 hover:bg-primary-50"
                      title="Editar Formulário"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleOpenDelete(form)}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                      title="Excluir Formulário"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {form.descricao && (
                  <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed bg-slate-50/50 p-2 rounded-lg border border-slate-100">{form.descricao}</p>
                )}

                {/* Rules / Defaults Indicators */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-650 bg-slate-50 p-3 rounded-lg border border-slate-150">
                  <div>
                    <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider">Líder Vinculado:</span>
                    <span className="font-semibold text-slate-800">
                      {form.lider ? form.lider.nomeCompleto : 'Pergunta ao eleitor'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider">Cidade / Bairro Padrão:</span>
                    <span className="font-semibold text-slate-800">
                      {form.cidade && form.bairro ? `${form.bairro.nome} - ${form.cidade.nome}` : 'Pergunta ao eleitor'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider">Captação (Eleitores):</span>
                    <span className="font-bold text-primary-600 text-sm">
                      {form.leadsCount} {form.leadsCount === 1 ? 'apoiador' : 'apoiadores'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider">Campos Adicionais:</span>
                    <span className="font-medium text-slate-600 block">
                      Endereço: {form.exibirEndereco ? 'Sim' : 'Não'}
                    </span>
                    <span className="font-medium text-slate-600 block">
                      Nascimento: {form.exibirDataNascimento ? 'Sim' : 'Não'}
                    </span>
                  </div>
                </div>

                {/* Auto-applied Tags */}
                {form.etiquetas && form.etiquetas.length > 0 && (
                  <div className="space-y-1">
                    <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider">Tags auto-aplicadas:</span>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {form.etiquetas.map(tag => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-xs"
                          style={{ backgroundColor: tag.cor }}
                        >
                          {tag.nome}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Link Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                <Button
                  onClick={() => handleCopyLink(form.id)}
                  variant="secondary"
                  className="flex-1 text-xs px-3 py-2 h-auto bg-slate-100 hover:bg-slate-200 border-slate-200 shadow-none"
                  leftIcon={copiedId === form.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                >
                  {copiedId === form.id ? 'Link Copiado!' : 'Copiar Link Público'}
                </Button>
                <a
                  href={`/f/${form.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center p-2 bg-primary-50 hover:bg-primary-100 text-primary-650 border border-primary-150 rounded-lg transition-all"
                  title="Visualizar Formulário Público"
                >
                  <Link className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Creation Modal */}
      {isMounted && isOpenForm && createPortal(
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex min-h-full items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200 space-y-4 text-left sm:my-8">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary-600" />
                {editingForm ? 'Editar Formulário' : 'Criar Novo Formulário'}
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

            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Title & Description */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Título do Formulário *</label>
                  <input
                    type="text"
                    placeholder="Ex: Formulário de Apoio - Equipe Ana Souza"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-slate-800 font-medium transition-all"
                    value={titulo}
                    onChange={e => setTitulo(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Descrição / Apresentação (Exibido no formulário público)</label>
                  <textarea
                    placeholder="Deixe uma mensagem explicando a importância do cadastro ou instruções para o apoiador..."
                    rows={3}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-slate-800 font-medium transition-all"
                    value={descricao}
                    onChange={e => setDescricao(e.target.value)}
                  />
                </div>
              </div>

              {/* Toggles for Birthday & Address fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="pr-2">
                    <span className="block text-sm font-semibold text-slate-800">Exibir Campo Endereço</span>
                    <span className="text-[10px] text-slate-400 block font-medium">Coleta Rua e Número se ativo</span>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setExibirEndereco(!exibirEndereco)}
                    variant="ghost"
                    size="icon"
                    className={`h-auto w-auto p-0 bg-transparent hover:bg-transparent transition-colors ${exibirEndereco ? 'text-primary-600 hover:text-primary-700' : 'text-slate-400 hover:text-slate-500'}`}
                  >
                    {exibirEndereco ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10" />}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="pr-2">
                    <span className="block text-sm font-semibold text-slate-800">Exibir Data de Nascimento</span>
                    <span className="text-[10px] text-slate-400 block font-medium">Coleta a data de aniversário</span>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setExibirDataNascimento(!exibirDataNascimento)}
                    variant="ghost"
                    size="icon"
                    className={`h-auto w-auto p-0 bg-transparent hover:bg-transparent transition-colors ${exibirDataNascimento ? 'text-primary-600 hover:text-primary-700' : 'text-slate-400 hover:text-slate-500'}`}
                  >
                    {exibirDataNascimento ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10" />}
                  </Button>
                </div>
              </div>

              {/* Geographic Presets Configuration */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-slate-400" />
                  Pre-configurações de Localização (Oculta campos no formulário)
                </h4>
                <p className="text-[11px] text-slate-450 leading-relaxed font-medium">
                  Se você predefinir a Cidade e o Bairro, o formulário público ocultará essas opções e salvará os novos cadastros automaticamente sob essa localidade. Deixe em branco se quiser que o próprio apoiador preencha.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-650 uppercase mb-1">Cidade Padrão</label>
                    <select
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-800 font-medium"
                      value={cidadeId}
                      onChange={e => setCidadeId(e.target.value)}
                    >
                      <option value="">-- Perguntar ao eleitor --</option>
                      {cidades.map(c => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-650 uppercase mb-1">Bairro Padrão</label>
                    <select
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-800 font-medium disabled:opacity-60"
                      value={bairroId}
                      onChange={e => setBairroId(e.target.value)}
                      disabled={!cidadeId}
                    >
                      <option value="">-- Perguntar ao eleitor --</option>
                      {filteredBairros.map(b => (
                        <option key={b.id} value={b.id}>{b.nome}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Leadership Default */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Líder / Colaborador Responsável</label>
                <p className="text-[11px] text-slate-450 mb-1.5 font-medium leading-relaxed">
                  Selecione o colaborador que receberá os créditos de indicação. O campo "Quem te indicou?" será ocultado no formulário público, pois a associação será automática.
                </p>
                <select
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-slate-800 font-medium transition-all"
                  value={liderId}
                  onChange={e => setLiderId(e.target.value)}
                >
                  <option value="">-- Perguntar ao eleitor (cadastro livre) --</option>
                  {lideres.map(l => (
                    <option key={l.id} value={l.id}>{l.nomeCompleto} ({l.telefone})</option>
                  ))}
                </select>
              </div>

              {/* Auto-applied Tags using MultiSelect */}
              <div>
                <MultiSelect
                  options={etiquetas.map(tag => ({
                    id: tag.id,
                    nome: tag.nome,
                    categoria: tag.categoria,
                    cor: tag.cor
                  }))}
                  selectedIds={selectedEtiquetaIds}
                  onChange={setSelectedEtiquetaIds}
                  placeholder="Selecione as tags que serão atribuídas automaticamente aos eleitores deste link..."
                />
              </div>

              {/* Submit Buttons */}
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
                  {editingForm ? 'Salvar Alterações' : 'Gerar Link'}
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {isMounted && isOpenDeleteConfirm && createPortal(
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex min-h-full items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xl max-w-md w-full space-y-4 animate-in zoom-in-95 duration-200 text-left sm:my-8">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-50 text-red-650 rounded-full flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="font-bold text-slate-800 text-lg">Confirmar Exclusão</h3>
                <p className="text-slate-550 text-sm leading-relaxed">
                  Deseja realmente excluir o formulário{' '}
                  <span className="font-bold text-slate-900">"{deleteTargetName}"</span>?
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-xs font-semibold leading-relaxed">
              Importante: O link público gerado para este formulário deixará de funcionar imediatamente. Os eleitores que já se cadastraram por ele não sofrerão alterações.
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
