'use client'

import { useSession } from "next-auth/react"

export default function TestAuth() {
  const { data: session, status } = useSession()

  return (
    <div className="p-8 bg-slate-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Teste de Sessão</h1>
      <pre className="bg-slate-800 p-4 rounded text-sm overflow-auto">
        {JSON.stringify({ status, session }, null, 2)}
      </pre>
    </div>
  )
}
