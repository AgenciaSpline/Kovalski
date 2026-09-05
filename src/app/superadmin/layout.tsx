import React from 'react'
import { LogoutButton } from '@/components/LogoutButton'

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <header className="bg-slate-800 border-b border-slate-700 py-4 px-6 flex justify-between items-center shadow-md">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-indigo-400">⚡</span> Master Panel
          </h1>
          <p className="text-sm text-slate-400">Controle Global de Clientes (Micro SaaS)</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30">
            Acesso SUPER ADMIN
          </span>
          <LogoutButton className="text-sm text-slate-300 hover:text-white px-3 py-2 rounded-md hover:bg-slate-700 transition" />
        </div>
      </header>
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
