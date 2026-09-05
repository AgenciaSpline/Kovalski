'use client'

import React, { useState, useTransition } from 'react'
import { createCliente, alternarStatusConta } from '@/lib/superadmin-actions'
import RenovarPlanoModal from './RenovarPlanoModal'
import EditarClienteModal from './EditarClienteModal'

export default function SuperAdminView({ contas, planos }: { contas: any[], planos: any[] }) {
  const [isPending, startTransition] = useTransition()
  const [modalAberto, setModalAberto] = useState(false)
  const [renovarContaId, setRenovarContaId] = useState<string | null>(null)
  const [editarConta, setEditarConta] = useState<any | null>(null)

  // Form
  const [nomeCampanha, setNomeCampanha] = useState('')
  const [nomeAdmin, setNomeAdmin] = useState('')
  const [emailAdmin, setEmailAdmin] = useState('')
  const [senhaAdmin, setSenhaAdmin] = useState('')
  const [planoId, setPlanoId] = useState('')
  const [diaVencimento, setDiaVencimento] = useState('10')

  const handleCriarCliente = () => {
    if (!nomeCampanha || !emailAdmin || !senhaAdmin || !planoId) {
      alert("Preencha todos os campos obrigatórios!")
      return
    }

    startTransition(async () => {
      const res = await createCliente({
        nomeCampanha,
        nomeAdmin,
        emailAdmin,
        senhaAdmin,
        planoId,
        diaVencimento: parseInt(diaVencimento)
      })

      if (res.success) {
        alert("Cliente cadastrado com sucesso!")
        setModalAberto(false)
        setNomeCampanha('')
        setNomeAdmin('')
        setEmailAdmin('')
        setSenhaAdmin('')
      } else {
        alert(res.error)
      }
    })
  }

  const handleToggleStatus = (contaId: string, statusAtual: string) => {
    if (confirm(`Deseja realmente ${statusAtual === 'ATIVO' ? 'BLOQUEAR' : 'ATIVAR'} o acesso desta conta?`)) {
      startTransition(async () => {
        await alternarStatusConta(contaId, statusAtual !== 'ATIVO')
      })
    }
  }

  return (
    <div className="space-y-6">

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg">
          <p className="text-slate-400 text-sm font-medium">Total de Clientes (Contas)</p>
          <p className="text-3xl font-bold text-white mt-2">{contas.length}</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg">
          <p className="text-slate-400 text-sm font-medium">Clientes Ativos</p>
          <p className="text-3xl font-bold text-emerald-400 mt-2">{contas.filter(c => c.status === 'ATIVO').length}</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg">
          <p className="text-slate-400 text-sm font-medium">Inadimplentes / Bloqueados</p>
          <p className="text-3xl font-bold text-red-400 mt-2">{contas.filter(c => c.status !== 'ATIVO').length}</p>
        </div>
      </div>

      {/* Lista de Contas */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
        <div className="p-5 border-b border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-lg font-bold text-white">Gerenciamento de Clientes (Tenants)</h2>
          <button
            onClick={() => setModalAberto(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition text-sm flex items-center gap-2"
          >
            <span>+</span> Novo Cliente
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 text-slate-400 text-sm uppercase tracking-wider">
                <th className="p-4 font-medium">Campanha</th>
                <th className="p-4 font-medium">Plano</th>
                <th className="p-4 font-medium text-center">Eleitores</th>
                <th className="p-4 font-medium text-center">Fatura</th>
                <th className="p-4 font-medium text-center">Status</th>
                <th className="p-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {contas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Nenhum cliente cadastrado no momento.
                  </td>
                </tr>
              ) : (
                contas.map(conta => (
                  <tr key={conta.id} className="hover:bg-slate-700/20 transition">
                    <td className="p-4">
                      <p className="font-bold text-slate-200">{conta.nome}</p>
                      <p className="text-xs text-slate-500 font-mono mt-1">ID: {conta.id.split('-')[0]}</p>
                    </td>
                    <td className="p-4">
                      <span className="bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded border border-slate-600">
                        {conta.plano}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-slate-300">{conta.eleitores}</span>
                    </td>
                    <td className="p-4 text-center">
                      <p className="text-sm text-slate-300">Dia {conta.diaVencimento}</p>
                      <p className="text-xs text-slate-400">
                        Vence em: {conta.dataProximoVencimento ? new Date(conta.dataProximoVencimento).toLocaleDateString('pt-BR') : 'N/A'}
                      </p>
                      <p className={`text-xs font-bold mt-1 ${conta.ultimoPagamentoStatus === 'PENDENTE' ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {conta.ultimoPagamentoStatus}
                      </p>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full border ${conta.status === 'ATIVO' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        {conta.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(conta.id, conta.status)}
                        disabled={isPending}
                        className={`text-sm px-3 py-1.5 rounded font-medium transition ${conta.status === 'ATIVO' ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}
                      >
                        {conta.status === 'ATIVO' ? 'Bloquear' : 'Desbloquear'}
                      </button>
                      <button onClick={() => setRenovarContaId(conta.id)} className="ml-2 text-sm px-3 py-1.5 rounded font-medium transition bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20">Renovar</button>
                      <button onClick={() => setEditarConta(conta)} className="ml-2 text-sm px-3 py-1.5 rounded font-medium transition bg-slate-500/10 text-slate-300 hover:bg-slate-500/20">Editar</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Novo Cliente */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-xl w-full max-w-lg shadow-2xl border border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Cadastrar Novo Cliente</h2>
              <button onClick={() => setModalAberto(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nome da Campanha/Tenant</label>
                <input
                  type="text"
                  value={nomeCampanha}
                  onChange={e => setNomeCampanha(e.target.value)}
                  placeholder="Ex: João Prefeito 2028"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Plano Assinado</label>
                  <select
                    value={planoId}
                    onChange={e => setPlanoId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white outline-none"
                  >
                    <option value="">Selecione...</option>
                    {planos.map(p => (
                      <option key={p.id} value={p.id}>{p.nome} - R$ {p.valor}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Dia de Vencimento Mensal</label>
                  <select
                    value={diaVencimento}
                    onChange={e => setDiaVencimento(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white outline-none"
                  >
                    {[5, 10, 15, 20, 25].map(d => (
                      <option key={d} value={d}>Dia {d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-700">
                <h3 className="text-sm font-bold text-indigo-400 mb-3 uppercase tracking-wider">Acesso do Administrador (Cliente)</h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Nome do Cliente</label>
                    <input
                      type="text"
                      value={nomeAdmin}
                      onChange={e => setNomeAdmin(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">E-mail de Login</label>
                    <input
                      type="email"
                      value={emailAdmin}
                      onChange={e => setEmailAdmin(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Senha Provisória</label>
                    <input
                      type="text"
                      value={senhaAdmin}
                      onChange={e => setSenhaAdmin(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => setModalAberto(false)}
                className="px-4 py-2 text-slate-300 hover:text-white transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleCriarCliente}
                disabled={isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50"
              >
                {isPending ? 'Criando...' : 'Criar Cliente e Liberar Acesso (30 Dias)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {renovarContaId && <RenovarPlanoModal contaId={renovarContaId} onClose={() => setRenovarContaId(null)} />}
      {editarConta && <EditarClienteModal conta={editarConta} planos={planos} onClose={() => setEditarConta(null)} />}

    </div>
  )
}
