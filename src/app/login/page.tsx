'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Mail, Loader2, AlertCircle } from 'lucide-react'
import { signIn } from 'next-auth/react'

const PenguinIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <mask id="penguin-salute-mask">
      <rect x="0" y="0" width="24" height="24" fill="#FFFFFF" />
      <path d="M12 4.5C9.5 4.5 8 6 8 8.5C8 10 9 11 10.5 11.5C9 12.5 8 14.5 8 17C8 19.5 9.8 20 12 20C14.2 20 16 19.5 16 17C16 14.5 15 12.5 13.5 11.5C15 11 16 10 16 8.5C16 6 14.5 4.5 12 4.5Z" fill="#000000" />
    </mask>
    <g mask="url(#penguin-salute-mask)" fill="currentColor">
      <path d="M12 2.5C8 2.5 5 5.5 5 9.5C5 12 6 15 6.5 17.5C6.5 19 8 20.5 12 20.5C16 20.5 17.5 19 17.5 17.5C18 15 19 12 19 9.5C19 5.5 16 2.5 12 2.5Z" />
      <path d="M5.5 11.5C4.2 12.5 3.5 14 3.5 15.5C3.5 16.5 4.5 17 5.5 16.5C6.5 15.8 7 14.2 7 11.5Z" />
      <path d="M9.5 20.5C9 21.5 9.5 22.5 10.5 22.5C11.5 22.5 11.5 21 11.5 20.5ZM14.5 20.5C14.5 21 14.5 22.5 15.5 22.5C16.5 22.5 17 21.5 16.5 20.5Z" />
    </g>
    <path d="M17.5 11.5C19 11.5 21 10 21 8.5C21 7.2 19.5 6 17 6C16.2 6 15 6.3 14.5 6.5C14.5 7 15 7.5 16 7.5C17.5 7.5 19 8.2 19 8.8C19 9.5 18 10 17 10Z" fill="currentColor" />
    <circle cx="10" cy="8" r="0.9" fill="currentColor" />
    <circle cx="14" cy="8" r="0.9" fill="currentColor" />
    <path d="M12 9C12.5 9 12.8 9.8 12 10.5C11.2 9.8 11.5 9 12 9Z" fill="currentColor" />
  </svg>
)

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [hasAnimated, setHasAnimated] = useState(false)
  const router = useRouter()

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setHasAnimated(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    if (!email || !senha) {
      setErrorMsg('Preencha todos os campos.')
      return
    }
    setIsLoading(true)

    try {
      const res = await signIn('credentials', {
        email,
        senha,
        redirect: false
      })

      if (res?.error) {
        setErrorMsg('Acesso negado: Credenciais inválidas.')
        setIsLoading(false)
      } else {
        router.push('/')
        router.refresh()
      }
    } catch (err) {
      console.error("Login Error:", err)
      setErrorMsg('Acesso negado: Ocorreu um erro inesperado.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-1 relative z-10 pointer-events-none select-none">
          <div className={`text-white transition-transform ${hasAnimated ? 'animate-penguin-bounce' : ''}`}>
            <PenguinIcon className="w-24 h-24" />
          </div>
        </div>
        <div className="relative pointer-events-none select-none">
          <h2 className={`text-center text-5xl font-extrabold text-white tracking-tight ${hasAnimated ? 'animate-spit-text opacity-100' : 'opacity-0'}`}>
            Kovalski
          </h2>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-20">
        <div className="bg-white py-8 px-4 shadow-2xl shadow-black/50 sm:rounded-xl sm:px-10 border border-slate-800">
          {errorMsg && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="emailInput" className="block text-sm font-bold text-slate-700 select-none cursor-pointer">
                Endereço de Email
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input id="emailInput" type="email" required className="appearance-none block w-full pl-10 px-3 py-2.5 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm font-medium" placeholder="usuario@kovalski.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>

            <div>
              <label htmlFor="senhaInput" className="block text-sm font-bold text-slate-700 select-none cursor-pointer">
                Senha
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input id="senhaInput" type="password" required className="appearance-none block w-full pl-10 px-3 py-2.5 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm font-medium" placeholder="••••••••" value={senha} onChange={(e) => setSenha(e.target.value)} />
              </div>
            </div>

            <div>
              <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors">
                {isLoading ? (<><Loader2 className="w-5 h-5 mr-2 animate-spin" />Entrando...</>) : ('Entrar no Painel')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
