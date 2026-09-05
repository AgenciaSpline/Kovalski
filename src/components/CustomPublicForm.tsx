'use client'

import React, { useState, useTransition, useEffect } from 'react'
import { createEleitorPublicComForm } from '@/lib/actions'
import { Loader2, CheckCircle2, User, Phone, Calendar, MapPin, Award } from 'lucide-react'
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

interface FormConfig {
  id: string
  titulo: string
  descricao: string | null
  cidadeId: string | null
  bairroId: string | null
  liderId: string | null
}

interface CustomPublicFormProps {
  form: FormConfig
  cidades: Cidade[]
  bairros: Bairro[]
  lideres: Lider[]
}

export default function CustomPublicForm({
  form,
  cidades,
  bairros,
  lideres
}: CustomPublicFormProps) {
  const [isPending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Form Fields State
  const [nomeCompleto, setNomeCompleto] = useState('')
  const [telefone, setTelefone] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [logradouro, setLogradouro] = useState('')
  const [numero, setNumero] = useState('')

  // Defaults check
  const [cidadeId, setCidadeId] = useState(form.cidadeId || '')
  const [bairroId, setBairroId] = useState(form.bairroId || '')
  const [liderId, setLiderId] = useState(form.liderId || '')

  // Filtered Bairros for cascading select (only if not pre-configured)
  const [filteredBairros, setFilteredBairros] = useState<Bairro[]>([])

  // Cascade select of Bairros based on Cidade selection
  useEffect(() => {
    if (!form.cidadeId && cidadeId) {
      setFilteredBairros(bairros.filter(b => b.cidadeId === cidadeId))
      if (!form.bairroId) {
        setBairroId('')
      }
    } else {
      setFilteredBairros([])
    }
  }, [cidadeId, bairros, form.cidadeId, form.bairroId])

  // Simple auto-formatting of phone field: (XX) XXXXX-XXXX
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '')
    let formatted = rawVal
    if (rawVal.length > 0) {
      if (rawVal.length <= 2) {
        formatted = `(${rawVal}`
      } else if (rawVal.length <= 6) {
        formatted = `(${rawVal.slice(0, 2)}) ${rawVal.slice(2)}`
      } else if (rawVal.length <= 10) {
        formatted = `(${rawVal.slice(0, 2)}) ${rawVal.slice(2, 6)}-${rawVal.slice(6)}`
      } else {
        formatted = `(${rawVal.slice(0, 2)}) ${rawVal.slice(2, 7)}-${rawVal.slice(7, 11)}`
      }
    }
    setTelefone(formatted)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!nomeCompleto.trim()) {
      setErrorMsg('Por favor, informe seu nome completo.')
      return
    }

    const cleanPhone = telefone.replace(/\D/g, '')
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      setErrorMsg('Por favor, informe um número de telefone/WhatsApp válido com DDD.')
      return
    }

    const finalCidadeId = form.cidadeId || cidadeId
    const finalBairroId = form.bairroId || bairroId

    if (!finalCidadeId) {
      setErrorMsg('Por favor, selecione sua cidade.')
      return
    }

    if (!finalBairroId) {
      setErrorMsg('Por favor, selecione seu bairro.')
      return
    }

    startTransition(async () => {
      const payload = {
        nomeCompleto: nomeCompleto.trim(),
        telefone: cleanPhone,
        logradouro: logradouro.trim() || undefined,
        numero: numero.trim() || undefined,
        cidadeId: finalCidadeId,
        bairroId: finalBairroId,
        dataNascimento: dataNascimento ? new Date(dataNascimento) : undefined,
        liderId: form.liderId || liderId || undefined
      }

      const res = await createEleitorPublicComForm(form.id, payload)

      if (res.success) {
        setSubmitted(true)
      } else {
        setErrorMsg(res.error || 'Erro ao realizar o cadastro. Tente novamente.')
      }
    })
  }

  if (submitted) {
    return (
      <div className="text-center py-10 space-y-4 animate-in fade-in duration-300">
        <div className="flex justify-center text-emerald-500">
          <CheckCircle2 className="w-16 h-16 animate-bounce" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">Apoio Confirmado com Sucesso!</h3>
        <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
          Obrigado por preencher seus dados e caminhar com a gente. Seu apoio é fundamental!
        </p>
        <div className="pt-4">
          <Button
            onClick={() => {
              setSubmitted(false)
              setNomeCompleto('')
              setTelefone('')
              setDataNascimento('')
              setLogradouro('')
              setNumero('')
              if (!form.cidadeId) setCidadeId('')
              if (!form.bairroId) setBairroId('')
              if (!form.liderId) setLiderId('')
            }}
            variant="primary"
          >
            Fazer Novo Cadastro
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-300">
      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 font-medium">
          {errorMsg}
        </div>
      )}

      {/* Nome Completo */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
          <User className="w-4 h-4 text-slate-400" />
          Nome Completo *
        </label>
        <input
          type="text"
          placeholder="Digite seu nome completo"
          className="w-full px-3.5 py-2.5 border border-slate-350 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-medium text-slate-800"
          value={nomeCompleto}
          onChange={(e) => setNomeCompleto(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Telefone/WhatsApp */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Phone className="w-4 h-4 text-slate-400" />
            Telefone / WhatsApp *
          </label>
          <input
            type="tel"
            placeholder="(11) 99999-9999"
            className="w-full px-3.5 py-2.5 border border-slate-350 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-medium text-slate-800"
            value={telefone}
            onChange={handlePhoneChange}
            maxLength={15}
            required
          />
        </div>

        {/* Data de Nascimento */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            Data de Nascimento
          </label>
          <input
            type="date"
            className="w-full px-3.5 py-2.5 border border-slate-350 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-slate-800"
            value={dataNascimento}
            onChange={(e) => setDataNascimento(e.target.value)}
          />
        </div>
      </div>

      {/* Conditionally visible Geographical Fields */}
      {(!form.cidadeId || !form.bairroId) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Cidade Select */}
          {!form.cidadeId && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                Cidade *
              </label>
              <select
                className="w-full px-3.5 py-2.5 border border-slate-350 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-slate-800"
                value={cidadeId}
                onChange={(e) => setCidadeId(e.target.value)}
                required
              >
                <option value="">Selecione sua cidade</option>
                {cidades.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
          )}

          {/* Bairro Select */}
          {!form.bairroId && (
            <div className={form.cidadeId ? 'sm:col-span-2' : ''}>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                Bairro *
              </label>
              <select
                className="w-full px-3.5 py-2.5 border border-slate-350 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-slate-800 disabled:opacity-60"
                value={bairroId}
                onChange={(e) => setBairroId(e.target.value)}
                disabled={!cidadeId && !form.cidadeId}
                required
              >
                <option value="">Selecione seu bairro</option>
                {(form.cidadeId ? bairros.filter(b => b.cidadeId === form.cidadeId) : filteredBairros).map(b => (
                  <option key={b.id} value={b.id}>{b.nome}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Address Fields */}
      <div className="grid grid-cols-3 gap-4">
        {/* Logradouro */}
        <div className="col-span-2">
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Endereço (Rua/Av)
          </label>
          <input
            type="text"
            placeholder="Rua da Esperança"
            className="w-full px-3.5 py-2.5 border border-slate-350 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-medium text-slate-800"
            value={logradouro}
            onChange={(e) => setLogradouro(e.target.value)}
          />
        </div>

        {/* Número */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Número
          </label>
          <input
            type="text"
            placeholder="123"
            className="w-full px-3.5 py-2.5 border border-slate-350 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-medium text-slate-800"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
          />
        </div>
      </div>

      {/* Conditionally visible Leadership (Indicado por) field */}
      {!form.liderId && (
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-slate-400" />
            Quem te indicou? (Opcional)
          </label>
          <select
            className="w-full px-3.5 py-2.5 border border-slate-350 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-slate-800"
            value={liderId}
            onChange={(e) => setLiderId(e.target.value)}
          >
            <option value="">Ninguém / Indireto</option>
            {lideres.map(l => (
              <option key={l.id} value={l.id}>{l.nomeCompleto} ({l.telefone})</option>
            ))}
          </select>
        </div>
      )}

      <div className="pt-2">
        <Button
          type="submit"
          disabled={isPending}
          isLoading={isPending}
          variant="primary"
          fullWidth
          size="lg"
        >
          Confirmar Meu Cadastro
        </Button>
      </div>
    </form>
  )
}
