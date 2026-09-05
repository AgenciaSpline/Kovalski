'use client'

import React, { useState, useTransition, useEffect } from 'react'
import { editarClienteMaster } from '@/lib/superadmin-actions'

export default function EditarClienteModal({
  conta, planos, onClose
}: {
  conta: any,
  planos: any[],
  onClose: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [nomeCampanha, setNomeCampanha] = useState(conta.nome || '')
  const [planoId, setPlanoId] = useState(conta.planoId || '')
  const [diaVencimento, setDiaVencimento] = useState(conta.diaVencimento?.toString() || '10')
  const [dataProximoVencimento, setDataProximoVencimento] = useState(
    conta.dataProximoVencimento ? new Date(conta.dataProximoVencimento).toISOString().split('T')[0] : ''
  )

  useEffect(() => {
    // Tenta encontrar o ID do plano atual se tiver recebido apenas o nome
    if (!conta.planoId && conta.plano) {
      const p = planos.find(pl => pl.nome === conta.plano)
      if (p) setPlanoId(p.id)
    }
  }, [conta, planos])

  const handleEditar = () => {
    startTransition(async () => {
      const res = await editarClienteMaster(conta.id, {
        nome: nomeCampanha,
        planoId: planoId,
        diaVencimento: parseInt(diaVencimento),
        dataProximoVencimento: dataProximoVencimento ? new Date(dataProximoVencimento + 'T12:00:00Z') : null
      })

      if (res.success) {
        alert("Cliente atualizado com sucesso!")
        onClose()
      } else {
        alert(res.error)
      }
    })
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-xl w-full max-w-lg shadow-2xl border border-slate-700 overflow-hidden">
        <div className="p-5 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Editar Dados do Cliente</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Nome da Campanha/Tenant</label>
            <input
              type="text"
              value={nomeCampanha}
              onChange={e => setNomeCampanha(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Plano Atual</label>
              <select
                value={planoId}
                onChange={e => setPlanoId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white outline-none"
              >
                <option value="">Selecione...</option>
                {planos.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Dia Fatura (Preferência)</label>
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

          <div>
            <label className="block text-sm font-medium text-amber-400 mb-1">Alterar Vencimento Manualmente (Cronômetro)</label>
            <input
              type="date"
              value={dataProximoVencimento}
              onChange={e => setDataProximoVencimento(e.target.value)}
              className="w-full bg-slate-900 border border-amber-500/50 rounded-lg p-2.5 text-white outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">Isso alterará a data exata de corte do acesso deste cliente.</p>
          </div>
        </div>

        <div className="p-5 border-t border-slate-700 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white transition">Cancelar</button>
          <button
            onClick={handleEditar}
            disabled={isPending}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50"
          >
            {isPending ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  )
}
