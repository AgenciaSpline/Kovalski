'use client'
import { signOut } from 'next-auth/react'

export function LogoutButton({ className }: { className?: string }) {
  return (
    <button
      onClick={() => {
        // Ao omitir o callbackUrl explícito com caminho absoluto ou '/login', o NextAuth tenta inferir.
        // Como o NextAuth por trás do Cloudflare Tunnel às vezes perde o "Host" correto,
        // a forma mais segura é passar o location.origin atual + /login
        const url = typeof window !== 'undefined' ? `${window.location.origin}/login` : '/login';
        signOut({ callbackUrl: url })
      }}
      className={className}
    >
      Sair do Sistema
    </button>
  )
}
