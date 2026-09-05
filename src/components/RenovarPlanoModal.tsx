'use client'

import React, { useState, useTransition } from 'react'
import { renovarPlanoConta } from '@/lib/superadmin-finance-actions'

export default function RenovarPlanoModal({ contaId, onClose }: { contaId: string, onClose: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [meses, setMeses] = useState<number>(1)

  const handleRenovar = () => {
    startTransition(async () => {
      const res = await renovarPlanoConta(contaId, meses)
      if (res.success) {
        alert('Plano renovado com sucesso! Acesso garantido até ' + new Date(res.novaData!).toLocaleDateString('pt-BR'))
        onClose()
      } else {
        alert(res.error)
      }
    })
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-xl w-full max-w-sm shadow-2xl border border-slate-700 overflow-hidden">
        <div className="p-5 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Renovar Assinatura</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-300">Escolha por quanto tempo deseja renovar ou estender a assinatura deste cliente:</p>

          <select
            value={meses}
            onChange={e => setMeses(Number(e.target.value))}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white outline-none"
          >
            <option value={1}>1 Mês (Mensal)</option>
            <option value={3}>3 Meses (Trimestral)</option>
            <option value={6}>6 Meses (Semestral)</option>
            <option value={12}>12 Meses (Anual)</option>
          </select>
        </div>
        <div className="p-5 border-t border-slate-700 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white transition">Cancelar</button>
          <button
            onClick={handleRenovar}
            disabled={isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50"
          >
            {isPending ? 'Processando...' : 'Confirmar Pagamento'}
          </button>
        </div>
      </div>
    </div>
  )
}
