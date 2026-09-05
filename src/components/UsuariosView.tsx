'use client'

import React, { useState, useTransition, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Edit2, Trash2, ShieldAlert, User, X, AlertTriangle, Key } from 'lucide-react'
import { Button } from './ui/Button'
import { createUsuario, updateUsuario, deleteUsuario } from '@/lib/actions'

interface Usuario {
  id: string
  nome: string
  email: string
  role: string
  criadoEm: Date
}

interface UsuariosViewProps {
  usuarios: Usuario[]
  onRefresh: () => void
}

export default function UsuariosView({ usuarios, onRefresh }: UsuariosViewProps) {
  const [isPending, startTransition] = useTransition()
  const [isOpenForm, setIsOpenForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form State
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('') // Em edição, vazio significa não alterar
  const [role, setRole] = useState('ASSISTENTE')
  const [errorMsg, setErrorMsg] = useState('')

  // Modal Delete
  const [isOpenDeleteConfirm, setIsOpenDeleteConfirm] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState('')
  const [deleteTargetName, setDeleteTargetName] = useState('')
  const [deleteConfirmError, setDeleteConfirmError] = useState('')

  const handleOpenCreate = () => {
    setEditingId(null)
    setNome('')
    setEmail('')
    setSenha('')
    setRole('ASSISTENTE')
    setErrorMsg('')
    setIsOpenForm(true)
  }

  const handleOpenEdit = (user: Usuario) => {
    setEditingId(user.id)
    setNome(user.nome)
    setEmail(user.email)
    setSenha('') // Deixa em branco para que o usuário saiba que não precisa trocar se não quiser
    setRole(user.role)
    setErrorMsg('')
    setIsOpenForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim() || !email.trim()) {
      setErrorMsg('Nome e E-mail são obrigatórios.')
      return
    }

    if (!editingId && !senha.trim()) {
      setErrorMsg('A senha é obrigatória para criar um novo usuário.')
      return
    }

    startTransition(async () => {
      let res
      if (editingId) {
        res = await updateUsuario(editingId, { nome, email, senha, role })
      } else {
        res = await createUsuario({ nome, email, senha, role })
      }

      if (res.success) {
        setIsOpenForm(false)
        onRefresh()
      } else {
        setErrorMsg(res.error || 'Erro ao processar requisição.')
      }
    })
  }

  const handleOpenDelete = (user: Usuario) => {
    setDeleteTargetId(user.id)
    setDeleteTargetName(user.nome)
    setDeleteConfirmError('')
    setIsOpenDeleteConfirm(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return

    startTransition(async () => {
      const res = await deleteUsuario(deleteTargetId)
      if (res.success) {
        setIsOpenDeleteConfirm(false)
        onRefresh()
      } else {
        setDeleteConfirmError(res.error || 'Erro ao excluir usuário.')
      }
    })
  }

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
              <ShieldAlert className="w-6 h-6 text-primary-600" />
              Acessos e Equipe
            </h2>
            <p className="text-slate-500 text-sm">
              Gerencie quem tem acesso ao painel do CRM Eleitoral e seus níveis de permissão.
            </p>
          </div>
          <Button
            onClick={handleOpenCreate}
            variant="primary"
            className="w-full sm:w-auto shadow-sm"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Novo Usuário
          </Button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-500">
                <tr>
                  <th className="px-6 py-4">Usuário</th>
                  <th className="px-6 py-4">Permissão</th>
                  <th className="px-6 py-4">Data de Criação</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuarios.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold shrink-0">
                          {user.nome.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{user.nome}</div>
                          <div className="text-xs text-slate-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        user.role === 'ADMIN' ? 'bg-primary-100 text-primary-800 border border-primary-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(user.criadoEm).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          onClick={() => handleOpenEdit(user)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-slate-700"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleOpenDelete(user)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Formulário Popup / Modal Centralizado */}
      {isMounted && isOpenForm && createPortal(
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex min-h-full items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200 space-y-4 text-left sm:my-8">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg">
                {editingId ? 'Editar Usuário' : 'Cadastrar Novo Usuário'}
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
                  Nome Completo
                </label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Silva"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-medium text-slate-800"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Endereço de E-mail
                </label>
                <input
                  type="email"
                  placeholder="carlos@campanha.com.br"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-medium text-slate-800"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Senha {editingId && <span className="text-slate-400 font-normal text-xs">(Deixe em branco para manter a atual)</span>}
                </label>
                <input
                  type="password"
                  placeholder={editingId ? '••••••••' : 'Sua senha segura'}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-medium text-slate-800"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nível de Acesso (Permissão)
                </label>
                <select
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-bold text-slate-800"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="ASSISTENTE">ASSISTENTE (Pode ver/gerenciar eleitores mas não altera usuários)</option>
                  <option value="ADMIN">ADMINISTRADOR (Acesso total)</option>
                </select>
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
                  Deseja remover o acesso de{' '}
                  <span className="font-bold text-slate-900">"{deleteTargetName}"</span>?
                </p>
              </div>
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