import React from 'react'
import { getFormulario, getCidades, getBairros, getLideres } from '@/lib/actions'
import CustomPublicForm from '@/components/CustomPublicForm'
import { AlertCircle } from 'lucide-react'

// Stylized penguin icon matching Kovalski's brand
const PenguinIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <mask id="penguin-salute-mask-public-form">
      <rect x="0" y="0" width="24" height="24" fill="#FFFFFF" />
      <path
        d="M12 4.5C9.5 4.5 8 6 8 8.5C8 10 9 11 10.5 11.5C9 12.5 8 14.5 8 17C8 19.5 9.8 20 12 20C14.2 20 16 19.5 16 17C16 14.5 15 12.5 13.5 11.5C15 11 16 10 16 8.5C16 6 14.5 4.5 12 4.5Z"
        fill="#000000"
      />
    </mask>
    <g mask="url(#penguin-salute-mask-public-form)" fill="currentColor">
      <path d="M12 2.5C8 2.5 5 5.5 5 9.5C5 12 6 15 6.5 17.5C6.5 19 8 20.5 12 20.5C16 20.5 17.5 19 17.5 17.5C18 15 19 12 19 9.5C19 5.5 16 2.5 12 2.5Z" />
      <path d="M5.5 11.5C4.2 12.5 3.5 14 3.5 15.5C3.5 16.5 4.5 17 5.5 16.5C6.5 15.8 7 14.2 7 11.5Z" />
      <path d="M9.5 20.5C9 21.5 9.5 22.5 10.5 22.5C11.5 22.5 11.5 21 11.5 20.5ZM14.5 20.5C14.5 21 14.5 22.5 15.5 22.5C16.5 22.5 17 21.5 16.5 20.5Z" />
    </g>
    <path
      d="M17.5 11.5C19 11.5 21 10 21 8.5C21 7.2 19.5 6 17 6C16.2 6 15 6.3 14.5 6.5C14.5 7 15 7.5 16 7.5C17.5 7.5 19 8.2 19 8.8C19 9.5 18 10 17 10Z"
      fill="currentColor"
    />
    <circle cx="10" cy="8" r="0.9" fill="currentColor" />
    <circle cx="14" cy="8" r="0.9" fill="currentColor" />
    <path d="M12 9C12.5 9 12.8 9.8 12 10.5C11.2 9.8 11.5 9 12 9Z" fill="currentColor" />
  </svg>
)

export const revalidate = 0
export const dynamic = 'force-dynamic'

interface Params {
  id: string
}

export default async function PublicFormPage({ params }: { params: Params }) {
  const form = await getFormulario(params.id)

  if (!form) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-lg p-8 text-center space-y-4 animate-in fade-in duration-200">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Formulário Não Encontrado</h2>
          <p className="text-slate-500 text-sm">
            Este link pode estar incorreto, inativo ou ter sido removido pela coordenação da campanha.
          </p>
          <div className="pt-2">
            <a
              href="/cadastro"
              className="inline-flex px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition-colors"
            >
              Ir para o Cadastro Geral
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Pre-load supporting lists in parallel
  const [cidades, bairros, lideres] = await Promise.all([
    getCidades(),
    getBairros(),
    getLideres()
  ])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 py-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="text-primary-600">
          <PenguinIcon className="w-10 h-10" />
        </div>
        <div>
          <h1 className="font-extrabold text-xl tracking-wide leading-none text-slate-900">Kovalski</h1>
          <span className="text-[10px] text-slate-500 font-bold uppercase mt-0.5 block">Gestão de Campanha</span>
        </div>
      </div>
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">{form.titulo}</h2>
          {form.descricao ? (
            <p className="text-slate-500 text-sm mt-1.5 whitespace-pre-line leading-relaxed">
              {form.descricao}
            </p>
          ) : (
            <p className="text-slate-500 text-sm mt-1">
              Preencha os seus dados abaixo para apoiar o nosso projeto. É rápido e seguro!
            </p>
          )}
        </div>

        <CustomPublicForm
          form={form}
          cidades={cidades}
          bairros={bairros}
          lideres={lideres}
        />
      </div>
    </div>
  )
}
