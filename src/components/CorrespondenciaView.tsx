'use client'

import React, { useState, useTransition, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Mail, Plus, Edit2, Trash2, Search, FileText, Printer, Eye, X, Copy, Users, Filter, Loader2, ChevronDown, Tag, BookTemplate, UploadCloud, DownloadCloud, Check, type LucideIcon } from 'lucide-react'
import { createCorrespondenciaTemplate, updateCorrespondenciaTemplate, deleteCorrespondenciaTemplate } from '@/lib/actions'
import { generateWordMailMerge } from '@/lib/wordMailMerge'
import { PDFDocument, StandardFonts, rgb, PageSizes } from 'pdf-lib'
import toast, { Toaster } from 'react-hot-toast'
import { Button } from './ui/Button'

// ==========================================
// INTERFACES
// ==========================================

interface Etiqueta {
  id: string
  nome: string
  categoria: string
  cor: string
}

interface Bairro {
  id: string
  nome: string
  cidadeId: string
  cidade?: { id: string; nome: string }
}

interface Eleitor {
  id: string
  nomeCompleto: string
  telefone: string
  logradouro: string | null
  numero: string | null
  bairro: string
  cidade: string
  bairroId: string
  cidadeId: string
  dataNascimento: Date | null
  temperatura: number
  etiquetas: Etiqueta[]
  isLider: boolean
  liderId: string | null
  liderNome: string | null
}

interface CorrespondenciaTemplate {
  id: string
  titulo: string
  categoria: string
  tipo: string
  conteudo: string | null
  cabecalho: string | null
  rodape: string | null
  arquivoNome: string | null
  arquivoBase64: string | null
  criadoEm: Date
}

interface CorrespondenciaViewProps {
  eleitores: Eleitor[]
  etiquetas: Etiqueta[]
  bairros: Bairro[]
  templates: CorrespondenciaTemplate[]
  onRefresh: () => void
}

// ==========================================
// CONSTANTES
// ==========================================

const MARCADORES = [
  { tag: '{primeiro_nome}', label: 'Primeiro Nome', desc: 'Apenas o primeiro nome' },
  { tag: '{nome}', label: 'Nome Completo', desc: 'Nome completo do eleitor' },
  { tag: '{telefone}', label: 'Telefone', desc: 'Telefone/WhatsApp' },
  { tag: '{endereco}', label: 'Endereço Completo', desc: 'Rua + Número' },
  { tag: '{rua}', label: 'Rua/Logradouro', desc: 'Apenas a rua' },
  { tag: '{numero}', label: 'Número', desc: 'Apenas o número da casa' },
  { tag: '{bairro}', label: 'Bairro', desc: 'Nome do bairro' },
  { tag: '{cidade}', label: 'Cidade', desc: 'Nome da cidade' },
  { tag: '{data_nascimento}', label: 'Nascimento', desc: 'Data de nascimento' },
  { tag: '{data_hoje}', label: 'Data Atual', desc: 'Data de hoje' },
]

const CATEGORIAS = ['Geral', 'Aniversário', 'Informativo', 'Convite', 'Comemorativa']

const TEMP_LABELS: Record<number, string> = {
  1: 'Frio (0%)',
  2: 'Morno (25%)',
  3: 'Inclinado (50%)',
  4: 'Quente (80%)',
  5: 'Líder (100%)',
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function CorrespondenciaView({
  eleitores,
  etiquetas,
  bairros,
  templates,
  onRefresh,
}: CorrespondenciaViewProps) {
  const [isPending, startTransition] = useTransition()
  const [isGenerating, setIsGenerating] = useState(false)

  // Template selecionado na sidebar
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Editor do template
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<CorrespondenciaTemplate | null>(null)
  const [formTitulo, setFormTitulo] = useState('')
  const [formCategoria, setFormCategoria] = useState('Geral')
  const [formTipo, setFormTipo] = useState('PDF')
  const [formCabecalho, setFormCabecalho] = useState('')
  const [formConteudo, setFormConteudo] = useState('')
  const [formRodape, setFormRodape] = useState('')
  const [formArquivoNome, setFormArquivoNome] = useState('')
  const [formArquivoBase64, setFormArquivoBase64] = useState('')
  const conteudoRef = useRef<HTMLTextAreaElement>(null)
  const uploadInputRef = useRef<HTMLInputElement>(null)

  // Painel de geração
  const [showGeneratePanel, setShowGeneratePanel] = useState(false)
  const [filterCidades, setFilterCidades] = useState<string[]>([])
  const [filterBairrosMulti, setFilterBairrosMulti] = useState<string[]>([])

  const [showBairroDropdown, setShowBairroDropdown] = useState(false)
  const [showCidadeDropdown, setShowCidadeDropdown] = useState(false)

  const [filterTemp, setFilterTemp] = useState<number>(0)

  // Advanced filters
  const [filterRua, setFilterRua] = useState<'todos' | 'com_rua' | 'sem_rua'>('todos')
  const [filterNumero, setFilterNumero] = useState<'todos' | 'com_numero' | 'sem_numero'>('todos')

  // Word Mail Merge
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isGeneratingWord, setIsGeneratingWord] = useState(false)
  const [activeAction, setActiveAction] = useState<string | null>(null)

  // Preview
  const [showPreview, setShowPreview] = useState(false)

  // Custom Delete Modal
  const [templateToDelete, setTemplateToDelete] = useState<CorrespondenciaTemplate | null>(null)

  // ==========================================
  // DERIVED STATE
  // ==========================================

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId) || null

  const filteredTemplates = templates.filter(t =>
    t.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.categoria.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Extrair Cidades Únicas dos Eleitores para o Filtro
  const cidadesUnicas = Array.from(new Set(eleitores.filter(e => e.cidade).map(e => e.cidade))).sort()

  // Filtrar Bairros pela Cidade (se houver cidade selecionada)
  // Utilizando cruzamento com eleitores para garantir que a ligação de nomes não falhe
  const bairrosDisponiveis = bairros
    .filter(b => {
      if (filterCidades.length === 0) return true

      // Checa se o bairro pertence a alguma das cidades selecionadas
      // usando as entidades bairro/cidade nativas ou os eleitores que tem esse bairroId
      const cidadeDoBairroObj = b.cidade?.nome
      if (cidadeDoBairroObj && filterCidades.includes(cidadeDoBairroObj)) return true

      const eleitorDoBairro = eleitores.find(e => e.bairroId === b.id)
      return eleitorDoBairro && filterCidades.includes(eleitorDoBairro.cidade)
    })
    .sort((a, b) => a.nome.localeCompare(b.nome))

  const destinatarios = eleitores.filter(el => {
    // Filtro de Cidade (múltipla escolha)
    const matchesCidade = filterCidades.length === 0 || (el.cidade && filterCidades.includes(el.cidade))

    // Filtro de Bairro (múltipla escolha)
    const matchesBairro = filterBairrosMulti.length === 0 || filterBairrosMulti.includes(el.bairroId)

    const matchesTemp = filterTemp === 0 || el.temperatura === filterTemp

    // Filtro de Endereço (Logradouro/Rua)
    const matchesRua = filterRua === 'todos' ||
                       (filterRua === 'com_rua' ? el.logradouro && el.logradouro.trim() !== '' : !el.logradouro || el.logradouro.trim() === '')

    // Filtro de Endereço (Número)
    const matchesNumero = filterNumero === 'todos' ||
                          (filterNumero === 'com_numero' ? el.numero && el.numero.trim() !== '' : !el.numero || el.numero.trim() === '')

    return matchesCidade && matchesBairro && matchesTemp && matchesRua && matchesNumero
  }).sort((a, b) => {
    // 1. Ordenar por Bairro (Ordem Alfabética)
    const bairroA = (a.bairro || '').toLowerCase()
    const bairroB = (b.bairro || '').toLowerCase()
    if (bairroA < bairroB) return -1
    if (bairroA > bairroB) return 1

    // 2. Ordenar por Logradouro / Rua (Ordem Alfabética)
    const ruaA = (a.logradouro || '').toLowerCase()
    const ruaB = (b.logradouro || '').toLowerCase()
    if (ruaA < ruaB) return -1
    if (ruaA > ruaB) return 1

    // 3. Ordenar por Número (Ordem Numérica)
    const numStrA = (a.numero || '')
    const numStrB = (b.numero || '')
    const numA = parseInt(numStrA.replace(/\D/g, ''), 10) || 0
    const numB = parseInt(numStrB.replace(/\D/g, ''), 10) || 0

    if (numA !== numB) {
      return numA - numB
    }

    // Desempate para letras/complementos no número (ex: 123A vs 123B ou S/N)
    return numStrA.localeCompare(numStrB)
  })

  // ==========================================
  // HANDLERS - TEMPLATE CRUD
  // ==========================================

  const handleOpenCreate = () => {
    setEditingTemplate(null)
    setFormTitulo('')
    setFormCategoria('Geral')
    setFormTipo('PDF')
    setFormCabecalho('')
    setFormConteudo('Prezado(a) {nome},\n\n')
    setFormRodape('')
    setFormArquivoNome('')
    setFormArquivoBase64('')
    setIsEditorOpen(true)
  }

  const handleOpenEdit = (template: CorrespondenciaTemplate) => {
    setEditingTemplate(template)
    setFormTitulo(template.titulo)
    setFormCategoria(template.categoria)
    setFormTipo(template.tipo || 'PDF')
    setFormCabecalho(template.cabecalho || '')
    setFormConteudo(template.conteudo || '')
    setFormRodape(template.rodape || '')
    setFormArquivoNome(template.arquivoNome || '')
    setFormArquivoBase64(template.arquivoBase64 || '')
    setIsEditorOpen(true)
  }

  const handleDuplicate = (template: CorrespondenciaTemplate) => {
    setEditingTemplate(null)
    setFormTitulo(template.titulo + ' (Cópia)')
    setFormCategoria(template.categoria)
    setFormTipo(template.tipo || 'PDF')
    setFormCabecalho(template.cabecalho || '')
    setFormConteudo(template.conteudo || '')
    setFormRodape(template.rodape || '')
    setFormArquivoNome(template.arquivoNome || '')
    setFormArquivoBase64(template.arquivoBase64 || '')
    setIsEditorOpen(true)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFormArquivoNome(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      // Pega a string base64 sem o prefixo data:mime/type;base64,
      const result = event.target?.result as string
      setFormArquivoBase64(result)
    }
    reader.readAsDataURL(file)
  }

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitulo.trim()) {
      toast.error('O título do modelo é obrigatório.')
      return
    }

    if (formTipo === 'PDF' && !formConteudo.trim()) {
      toast.error('O conteúdo da carta é obrigatório para templates PDF.')
      return
    }

    if (formTipo === 'WORD' && !formArquivoBase64) {
      toast.error('Faça o upload do arquivo Word como modelo.')
      return
    }

    startTransition(async () => {
      const payload = {
        titulo: formTitulo,
        categoria: formCategoria,
        tipo: formTipo,
        conteudo: formTipo === 'PDF' ? formConteudo : undefined,
        cabecalho: formTipo === 'PDF' ? (formCabecalho || undefined) : undefined,
        rodape: formTipo === 'PDF' ? (formRodape || undefined) : undefined,
        arquivoNome: formTipo === 'WORD' ? (formArquivoNome || undefined) : undefined,
        arquivoBase64: formTipo === 'WORD' ? (formArquivoBase64 || undefined) : undefined,
      }

      let res
      if (editingTemplate) {
        res = await updateCorrespondenciaTemplate(editingTemplate.id, payload)
      } else {
        res = await createCorrespondenciaTemplate(payload)
      }

      if (res.success) {
        toast.success(`Modelo "${formTitulo}" salvo com sucesso!`)
        setIsEditorOpen(false)
        onRefresh()
      } else {
        toast.error(res.error || 'Erro ao salvar modelo.')
      }
    })
  }

  const confirmDelete = () => {
    if (!templateToDelete) return

    startTransition(async () => {
      const res = await deleteCorrespondenciaTemplate(templateToDelete.id)
      if (res.success) {
        toast.success(`Modelo "${templateToDelete.titulo}" excluído!`)
        if (selectedTemplateId === templateToDelete.id) setSelectedTemplateId(null)
        setTemplateToDelete(null)
        onRefresh()
      } else {
        toast.error('Erro ao excluir modelo.')
      }
    })
  }

  // ==========================================
  // INSERÇÃO DE MARCADORES
  // ==========================================

  const insertMarcador = (tag: string) => {
    const textarea = conteudoRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const before = formConteudo.substring(0, start)
    const after = formConteudo.substring(end)
    const newContent = before + tag + after
    setFormConteudo(newContent)

    // Reposicionar o cursor após o marcador
    setTimeout(() => {
      textarea.focus()
      textarea.selectionStart = textarea.selectionEnd = start + tag.length
    }, 0)
  }

  // ==========================================
  // SUBSTITUIÇÃO DE MARCADORES
  // ==========================================

  const substituirMarcadores = (texto: string | null, eleitor: Eleitor): string => {
    if (!texto) return ''

    const endereco = eleitor.logradouro
      ? `${eleitor.logradouro}${eleitor.numero ? `, ${eleitor.numero}` : ''}`
      : 'Sem endereço'

    const dataNasc = eleitor.dataNascimento
      ? new Date(eleitor.dataNascimento).toLocaleDateString('pt-BR')
      : ''

    const hoje = new Date().toLocaleDateString('pt-BR')
    const primeiroNome = eleitor.nomeCompleto.split(' ')[0]

    return texto
      .replace(/{primeiro_nome}/g, primeiroNome)
      .replace(/{nome}/g, eleitor.nomeCompleto)
      .replace(/{telefone}/g, eleitor.telefone)
      .replace(/{endereco}/g, endereco)
      .replace(/{rua}/g, eleitor.logradouro || 'Sem rua')
      .replace(/{numero}/g, eleitor.numero || 'S/N')
      .replace(/{bairro}/g, eleitor.bairro)
      .replace(/{cidade}/g, eleitor.cidade)
      .replace(/{data_nascimento}/g, dataNasc)
      .replace(/{data_hoje}/g, hoje)
  }

  // ==========================================
  // GERAÇÃO DO WORD A PARTIR DO BANCO
  // ==========================================

  const handleGenerateWord = async (mode: 'zip' | 'single') => {
    if (!selectedTemplate || !selectedTemplate.arquivoBase64 || !selectedTemplate.arquivoNome) {
      toast.error('Arquivo Word não encontrado neste modelo.')
      return
    }

    if (destinatarios.length === 0) {
      toast.error('Nenhum destinatário encontrado com os filtros selecionados.')
      return
    }

    setIsGeneratingWord(true)
    setActiveAction(mode)
    const loadToast = toast.loading('Processando arquivos do Word...')
    try {
      await generateWordMailMerge({
        base64: selectedTemplate.arquivoBase64,
        fileName: selectedTemplate.arquivoNome
      }, destinatarios, mode)
      toast.success('Mala Direta baixada com sucesso!', { id: loadToast })
    } catch (error: any) {
      console.error(error)
      toast.error(`Erro ao processar o arquivo Word: ${error?.message || 'Verifique o formato'}`, { id: loadToast })
    } finally {
      setIsGeneratingWord(false)
      setActiveAction(null)
    }
  }

  // ==========================================
  // GERAÇÃO DO PDF (TEMPLATE INTERNO)
  // ==========================================

  const generatePDF = async () => {
    if (!selectedTemplate) return
    if (destinatarios.length === 0) {
      toast.error('Nenhum destinatário encontrado com os filtros selecionados.')
      return
    }

    setIsGenerating(true)
    const loadToast = toast.loading('Gerando PDF...')

    try {
      const pdfDoc = await PDFDocument.create()
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

      const fontSize = 11
      const lineHeight = fontSize * 1.6
      const margin = 60
      const pageWidth = PageSizes.A4[0]
      const pageHeight = PageSizes.A4[1]
      const contentWidth = pageWidth - margin * 2

      for (const eleitor of destinatarios) {
        const page = pdfDoc.addPage(PageSizes.A4)

        let y = pageHeight - margin

        // --- CABEÇALHO ---
        if (selectedTemplate.cabecalho) {
          const cabText = substituirMarcadores(selectedTemplate.cabecalho, eleitor)
          const cabLines = cabText.split('\n')
          for (const line of cabLines) {
            const textWidth = fontBold.widthOfTextAtSize(line, 13)
            page.drawText(line, {
              x: (pageWidth - textWidth) / 2,
              y,
              size: 13,
              font: fontBold,
              color: rgb(0.15, 0.15, 0.15),
            })
            y -= 13 * 1.5
          }
          // Linha separadora
          y -= 5
          page.drawLine({
            start: { x: margin, y },
            end: { x: pageWidth - margin, y },
            thickness: 0.5,
            color: rgb(0.7, 0.7, 0.7),
          })
          y -= 25
        }

        // --- CONTEÚDO ---
        const conteudoTexto = substituirMarcadores(selectedTemplate.conteudo || '', eleitor)
        const paragraphs = conteudoTexto.split('\n')

        for (const para of paragraphs) {
          if (para.trim() === '') {
            y -= lineHeight * 0.6
            continue
          }

          // Word wrap simples
          const words = para.split(' ')
          let currentLine = ''

          for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word
            const testWidth = font.widthOfTextAtSize(testLine, fontSize)

            if (testWidth > contentWidth && currentLine) {
              page.drawText(currentLine, {
                x: margin,
                y,
                size: fontSize,
                font,
                color: rgb(0.1, 0.1, 0.1),
              })
              y -= lineHeight
              currentLine = word
            } else {
              currentLine = testLine
            }
          }

          if (currentLine) {
            page.drawText(currentLine, {
              x: margin,
              y,
              size: fontSize,
              font,
              color: rgb(0.1, 0.1, 0.1),
            })
            y -= lineHeight
          }
        }

        // --- RODAPÉ ---
        if (selectedTemplate.rodape) {
          const rodapeText = substituirMarcadores(selectedTemplate.rodape, eleitor)
          const rodapeLines = rodapeText.split('\n')
          let rodapeY = margin + (rodapeLines.length * 10 * 1.4)

          // Linha separadora do rodapé
          page.drawLine({
            start: { x: margin, y: rodapeY + 10 },
            end: { x: pageWidth - margin, y: rodapeY + 10 },
            thickness: 0.5,
            color: rgb(0.7, 0.7, 0.7),
          })

          for (const line of rodapeLines) {
            const textWidth = font.widthOfTextAtSize(line, 9)
            page.drawText(line, {
              x: (pageWidth - textWidth) / 2,
              y: rodapeY,
              size: 9,
              font,
              color: rgb(0.4, 0.4, 0.4),
            })
            rodapeY -= 10 * 1.4
          }
        }
      }

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `correspondencia-${selectedTemplate.titulo.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`
      link.click()
      URL.revokeObjectURL(url)

      toast.success(`PDF gerado com sucesso! ${destinatarios.length} carta(s) prontas para impressão.`, { id: loadToast })
    } catch (err: any) {
      console.error('Erro ao gerar PDF:', err)
      toast.error('Erro ao gerar PDF: ' + (err.message || err), { id: loadToast })
    } finally {
      setIsGenerating(false)
    }
  }

  // ==========================================
  // FORMATAÇÃO
  // ==========================================

  const formatarData = (data: Date) => {
    const d = new Date(data)
    return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  }

  const getCategoriaColor = (cat: string) => {
    switch (cat) {
      case 'Aniversário': return 'bg-pink-50 text-pink-700 border-pink-150'
      case 'Informativo': return 'bg-blue-50 text-blue-700 border-blue-150'
      case 'Convite': return 'bg-emerald-50 text-emerald-700 border-emerald-150'
      case 'Comemorativa': return 'bg-amber-50 text-amber-700 border-amber-150'
      default: return 'bg-slate-50 text-slate-700 border-slate-200'
    }
  }

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // ==========================================
  // PREVIEW
  // ==========================================

  const previewEleitor: Eleitor = eleitores[0] || {
    id: 'preview',
    nomeCompleto: 'João da Silva',
    telefone: '11999999999',
    logradouro: 'Rua das Flores',
    numero: '123',
    bairro: 'Centro',
    cidade: 'São Paulo',
    bairroId: '',
    cidadeId: '',
    dataNascimento: new Date('1985-08-15'),
    temperatura: 4,
    etiquetas: [],
    isLider: false,
    liderId: null,
    liderNome: null,
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Mail className="w-6 h-6 text-primary-600" />
            Mala Direta
          </h2>
          <p className="text-slate-500 text-sm">
            Crie modelos de carta e gere PDFs personalizados para impressão em massa.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ===== SIDEBAR: Lista de Templates ===== */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
            <div className="flex justify-between items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar modelo..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-250 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 bg-slate-50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                onClick={handleOpenCreate}
                variant="primary"
                size="icon"
                className="flex-shrink-0"
                title="Criar Novo Modelo"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs space-y-2">
                  <FileText className="w-8 h-8 mx-auto text-slate-300" />
                  <p>Nenhum modelo de correspondência criado.</p>
                  <Button
                    onClick={handleOpenCreate}
                    variant="ghost"
                    size="sm"
                    className="text-primary-600 hover:text-primary-700 font-bold underline bg-transparent hover:bg-transparent h-auto p-0"
                  >
                    Criar o primeiro modelo
                  </Button>
                </div>
              ) : (
                filteredTemplates.map(template => {
                  const active = selectedTemplateId === template.id
                  return (
                    <div
                      key={template.id}
                      onClick={() => {
                        setSelectedTemplateId(template.id)
                        setShowGeneratePanel(false)
                      }}
                      className={`p-3 border rounded-xl cursor-pointer transition-all flex justify-between items-start group ${
                        active
                          ? 'bg-primary-50/50 border-primary-300 ring-1 ring-primary-300'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-1.5 min-w-0 pr-2">
                        <h4 className="font-bold text-slate-800 text-sm truncate">{template.titulo}</h4>
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                          <span className={`px-1.5 py-0.5 rounded font-extrabold border ${getCategoriaColor(template.categoria)}`}>
                            {template.categoria}
                          </span>
                          <span className="text-slate-400 font-semibold">
                            {formatarData(template.criadoEm)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDuplicate(template)
                          }}
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100/80 flex-shrink-0"
                          title="Duplicar Modelo"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenEdit(template)
                          }}
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-1 text-slate-400 hover:text-primary-600 hover:bg-slate-100/80 flex-shrink-0"
                          title="Editar Modelo"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            setTemplateToDelete(template)
                          }}
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-1 text-slate-400 hover:text-red-600 hover:bg-slate-100/80 flex-shrink-0"
                          title="Excluir Modelo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* ===== MAIN CONTENT: Preview + Geração ===== */}
        <div className="lg:col-span-2">
          {selectedTemplate ? (
            <div className="space-y-5">
              {/* Header do Template Selecionado */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-slate-800">{selectedTemplate.titulo}</h3>
                      <Button
                        onClick={() => handleOpenEdit(selectedTemplate)}
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 p-1 text-slate-400 hover:text-primary-600 hover:bg-slate-100"
                        title="Editar Modelo"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${getCategoriaColor(selectedTemplate.categoria)}`}>
                        {selectedTemplate.categoria}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {selectedTemplate.tipo === 'PDF' && (
                      <Button
                        onClick={() => setShowPreview(!showPreview)}
                        variant="secondary"
                        size="sm"
                        className={showPreview ? 'bg-primary-50 text-primary-700 border-primary-300 shadow-none' : 'shadow-none'}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Preview
                      </Button>
                    )}
                    <Button
                      onClick={() => setShowGeneratePanel(!showGeneratePanel)}
                      variant={showGeneratePanel ? 'secondary' : 'success'}
                      size="sm"
                      className={showGeneratePanel ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-none' : ''}
                      leftIcon={selectedTemplate.tipo === 'WORD' ? <DownloadCloud className="w-3.5 h-3.5" /> : <Printer className="w-3.5 h-3.5" />}
                    >
                      {selectedTemplate.tipo === 'WORD' ? 'Gerar Mala Direta' : 'Gerar PDF'}
                    </Button>
                  </div>
                </div>

                {/* Preview da Carta */}
                {showPreview && selectedTemplate.tipo === 'PDF' && (
                  <div className="bg-white border-2 border-slate-200 rounded-xl p-8 shadow-inner max-w-[600px] mx-auto space-y-4" style={{ fontFamily: 'Georgia, serif' }}>
                    {selectedTemplate.cabecalho && (
                      <>
                        <div className="text-center space-y-1">
                          {substituirMarcadores(selectedTemplate.cabecalho, previewEleitor).split('\n').map((line, i) => (
                            <p key={i} className="text-sm font-bold text-slate-800">{line}</p>
                          ))}
                        </div>
                        <hr className="border-slate-200" />
                      </>
                    )}

                    <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {substituirMarcadores(selectedTemplate.conteudo || '', previewEleitor)}
                    </div>

                    {selectedTemplate.rodape && (
                      <>
                        <hr className="border-slate-200" />
                        <div className="text-center space-y-0.5">
                          {substituirMarcadores(selectedTemplate.rodape, previewEleitor).split('\n').map((line, i) => (
                            <p key={i} className="text-[10px] text-slate-400">{line}</p>
                          ))}
                        </div>
                      </>
                    )}

                    <div className="text-[9px] text-slate-300 text-center pt-2 border-t border-dashed border-slate-150">
                      Preview com dados de: <strong>{previewEleitor.nomeCompleto}</strong>
                    </div>
                  </div>
                )}

                {/* Conteúdo bruto (quando preview está fechado) */}
                {!showPreview && selectedTemplate.tipo === 'PDF' && (
                  <div className="space-y-3">
                    {selectedTemplate.cabecalho && (
                      <div className="bg-slate-50 border border-slate-150 rounded-lg p-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Cabeçalho</span>
                        <p className="text-xs text-slate-700 whitespace-pre-wrap">{selectedTemplate.cabecalho}</p>
                      </div>
                    )}
                    <div className="bg-slate-50 border border-slate-150 rounded-lg p-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Corpo da Carta</span>
                      <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{selectedTemplate.conteudo}</p>
                    </div>
                    {selectedTemplate.rodape && (
                      <div className="bg-slate-50 border border-slate-150 rounded-lg p-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Rodapé</span>
                        <p className="text-xs text-slate-700 whitespace-pre-wrap">{selectedTemplate.rodape}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Info do Word (quando selecionado um WORD) */}
                {!showPreview && selectedTemplate.tipo === 'WORD' && (
                  <div className="bg-blue-50 border border-blue-150 rounded-lg p-6 flex flex-col items-center justify-center space-y-3 text-center">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-900 text-sm">{selectedTemplate.arquivoNome}</h4>
                      <p className="text-xs text-blue-700 mt-1">Este modelo usa um arquivo Word (.docx) armazenado no sistema.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Painel de Geração */}
              {showGeneratePanel && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                  <h4 className="font-black text-slate-800 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
                    {selectedTemplate.tipo === 'WORD' ? <DownloadCloud className="w-4 h-4 text-emerald-600" /> : <Printer className="w-4 h-4 text-emerald-600" />}
                    {selectedTemplate.tipo === 'WORD' ? 'Gerar Mala Direta em Lote' : 'Gerar PDF para Impressão'}
                  </h4>

                  {/* Filtros de Destinatários */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {/* Filtro Múltiplo de Cidades */}
                    <div className="relative">
                      <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">
                        Cidades
                      </label>
                      <div
                        className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 cursor-pointer flex justify-between items-center"
                        onClick={() => {
                          setShowCidadeDropdown(!showCidadeDropdown)
                          setShowBairroDropdown(false)
                        }}
                      >
                        <span className="truncate">
                          {filterCidades.length === 0 ? 'Todas as Cidades' : `${filterCidades.length} selecionada(s)`}
                        </span>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </div>

                      {showCidadeDropdown && (
                        <div className="absolute z-10 mt-1 w-full sm:w-64 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-auto">
                          <div
                            className="p-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 flex items-center gap-2"
                            onClick={() => {
                              setFilterCidades([])
                              setFilterBairrosMulti([]) // Reseta bairros também
                            }}
                          >
                            <div className={`w-4 h-4 border rounded flex items-center justify-center ${filterCidades.length === 0 ? 'bg-primary-500 border-primary-500 text-white' : 'border-slate-300'}`}>
                              {filterCidades.length === 0 && <Check className="w-3 h-3" />}
                            </div>
                            <span className="text-xs font-semibold text-slate-700">Todas as Cidades</span>
                          </div>
                          {cidadesUnicas.map(c => (
                            <div
                              key={c}
                              className="p-2 hover:bg-slate-50 cursor-pointer flex items-center gap-2"
                              onClick={() => {
                                setFilterCidades(prev => {
                                  const novo = prev.includes(c) ? prev.filter(item => item !== c) : [...prev, c]
                                  setFilterBairrosMulti([]) // Sempre que mudar a cidade, limpa os bairros
                                  return novo
                                })
                              }}
                            >
                              <div className={`w-4 h-4 border rounded flex items-center justify-center ${filterCidades.includes(c) ? 'bg-primary-500 border-primary-500 text-white' : 'border-slate-300'}`}>
                                {filterCidades.includes(c) && <Check className="w-3 h-3" />}
                              </div>
                              <span className="text-xs text-slate-700">{c}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Filtro Múltiplo de Bairros */}
                    <div className="relative">
                      <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">
                        Bairros
                      </label>
                      <div
                        className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 cursor-pointer flex justify-between items-center"
                        onClick={() => {
                          setShowBairroDropdown(!showBairroDropdown)
                          setShowCidadeDropdown(false)
                        }}
                      >
                        <span className="truncate">
                          {filterBairrosMulti.length === 0 ? 'Todos os Bairros' : `${filterBairrosMulti.length} selecionado(s)`}
                        </span>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </div>

                      {showBairroDropdown && (
                        <div className="absolute z-10 mt-1 w-full sm:w-64 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-auto">
                          <div
                            className="p-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 flex items-center gap-2"
                            onClick={() => setFilterBairrosMulti([])}
                          >
                            <div className={`w-4 h-4 border rounded flex items-center justify-center ${filterBairrosMulti.length === 0 ? 'bg-primary-500 border-primary-500 text-white' : 'border-slate-300'}`}>
                              {filterBairrosMulti.length === 0 && <Check className="w-3 h-3" />}
                            </div>
                            <span className="text-xs font-semibold text-slate-700">Todos os Bairros</span>
                          </div>
                          {bairrosDisponiveis.map(b => (
                            <div
                              key={b.id}
                              className="p-2 hover:bg-slate-50 cursor-pointer flex items-center gap-2"
                              onClick={() => {
                                setFilterBairrosMulti(prev =>
                                  prev.includes(b.id) ? prev.filter(item => item !== b.id) : [...prev, b.id]
                                )
                              }}
                            >
                              <div className={`w-4 h-4 border rounded flex items-center justify-center ${filterBairrosMulti.includes(b.id) ? 'bg-primary-500 border-primary-500 text-white' : 'border-slate-300'}`}>
                                {filterBairrosMulti.includes(b.id) && <Check className="w-3 h-3" />}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs text-slate-700">{b.nome}</span>
                                {filterCidades.length !== 1 && b.cidade && (
                                  <span className="text-[9px] text-slate-400">{b.cidade.nome}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1 truncate" title="Temperatura">
                        Temperatura
                      </label>
                      <select
                        className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        value={filterTemp}
                        onChange={(e) => setFilterTemp(Number(e.target.value))}
                      >
                        <option value="0">Todas as Temperaturas</option>
                        <option value="1">1 - Frio (0%)</option>
                        <option value="2">2 - Morno (25%)</option>
                        <option value="3">3 - Inclinado (50%)</option>
                        <option value="4">4 - Quente (80%)</option>
                        <option value="5">5 - Líder (100%)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1 truncate" title="Logradouro / Rua">
                        Logradouro / Rua
                      </label>
                      <select
                        className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        value={filterRua}
                        onChange={(e) => setFilterRua(e.target.value as any)}
                      >
                        <option value="todos">Todos</option>
                        <option value="com_rua">Possui Endereço</option>
                        <option value="sem_rua">Sem Endereço</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">
                        Número
                      </label>
                      <select
                        className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        value={filterNumero}
                        onChange={(e) => setFilterNumero(e.target.value as any)}
                      >
                        <option value="todos">Todos</option>
                        <option value="com_numero">Possui Número</option>
                        <option value="sem_numero">Sem Número</option>
                      </select>
                    </div>
                  </div>

                  {/* Resumo + Botão de Geração */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <div className="text-sm text-slate-600">
                        <Users className="w-5 h-5 inline mr-2 text-primary-600" />
                        <strong className="text-slate-800 text-base">{destinatarios.length}</strong> destinatário(s) selecionados
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {selectedTemplate.tipo === 'PDF' && (
                        <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between hover:border-emerald-300 transition-colors group">
                          <div className="space-y-2 mb-4">
                            <h5 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                              <FileText className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                              Gerar PDF Simples
                            </h5>
                            <p className="text-[10px] text-slate-500 leading-relaxed">
                              Utiliza o layout básico configurado na tela anterior. Ideal para cartas simples. O sistema gerará um arquivo com {destinatarios.length} páginas.
                            </p>
                          </div>
                          <Button
                            onClick={generatePDF}
                            disabled={isGenerating || destinatarios.length === 0}
                            isLoading={isGenerating}
                            variant="success"
                            fullWidth
                            leftIcon={!isGenerating && <Printer className="w-4 h-4" />}
                          >
                            {isGenerating ? 'Gerando...' : 'Baixar PDF'}
                          </Button>
                        </div>
                      )}

                      {selectedTemplate.tipo === 'WORD' && (
                        <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between hover:border-blue-300 transition-colors group">
                          <div className="space-y-2 mb-4">
                            <h5 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                              <UploadCloud className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                              Exportar Arquivo Word ({selectedTemplate.arquivoNome})
                            </h5>
                            <p className="text-[10px] text-slate-500 leading-relaxed">
                              Escolha como deseja baixar sua mala direta:
                            </p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Button
                              onClick={() => handleGenerateWord('single')}
                              disabled={isGeneratingWord || destinatarios.length === 0}
                              isLoading={isGeneratingWord && activeAction === 'single'}
                              variant="primary"
                              fullWidth
                              leftIcon={!(isGeneratingWord && activeAction === 'single') ? <FileText className="w-3.5 h-3.5" /> : undefined}
                            >
                              {isGeneratingWord && activeAction === 'single' ? 'Processando...' : 'Arquivo Único (.docx)'}
                            </Button>
                            <Button
                              onClick={() => handleGenerateWord('zip')}
                              disabled={isGeneratingWord || destinatarios.length === 0}
                              isLoading={isGeneratingWord && activeAction === 'zip'}
                              variant="secondary"
                              className="bg-slate-700 text-white hover:bg-slate-800"
                              fullWidth
                              leftIcon={!(isGeneratingWord && activeAction === 'zip') ? <DownloadCloud className="w-3.5 h-3.5" /> : undefined}
                            >
                              {isGeneratingWord && activeAction === 'zip' ? 'Processando...' : 'Arquivos Separados (.zip)'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full bg-white border border-slate-200 border-dashed rounded-xl p-12 text-center flex flex-col items-center justify-center space-y-3 min-h-[350px]">
              <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center">
                <Mail className="w-6 h-6 text-primary-600" />
              </div>
              <h4 className="font-black text-slate-700">Selecione um Modelo</h4>
              <p className="text-xs text-slate-400 max-w-[300px] leading-relaxed">
                Escolha um modelo de correspondência ao lado para visualizar o preview, editar ou gerar o PDF com dados dos eleitores.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ===== MODAL: Editor de Template ===== */}
      {isMounted && isEditorOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex min-h-full items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200 space-y-4 text-left sm:my-8">
            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-150">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                {editingTemplate ? <Edit2 className="w-4 h-4 text-primary-600" /> : <Plus className="w-4 h-4 text-primary-600" />}
                {editingTemplate ? 'Editar Modelo de Carta' : 'Criar Modelo de Carta'}
              </h3>
              <Button
                onClick={() => setIsEditorOpen(false)}
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-slate-655"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-4">
              {/* Tipo de Documento */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Formato da Mala Direta *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`relative flex items-center justify-between p-3 border-2 rounded-xl cursor-pointer transition-all ${
                      formTipo === 'PDF'
                        ? 'border-emerald-500 bg-emerald-50/50'
                        : 'border-slate-200 bg-white hover:border-emerald-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipoModelo"
                      value="PDF"
                      checked={formTipo === 'PDF'}
                      onChange={(e) => setFormTipo(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${formTipo === 'PDF' ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                        <FileText className={`w-5 h-5 ${formTipo === 'PDF' ? 'text-emerald-600' : 'text-slate-400'}`} />
                      </div>
                      <div className="space-y-0.5">
                        <span className={`block text-sm font-bold ${formTipo === 'PDF' ? 'text-emerald-800' : 'text-slate-700'}`}>
                          PDF Simples
                        </span>
                        <span className="block text-[10px] text-slate-500 font-medium">Editor interno de texto</span>
                      </div>
                    </div>
                    {formTipo === 'PDF' && (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    )}
                  </label>

                  <label
                    className={`relative flex items-center justify-between p-3 border-2 rounded-xl cursor-pointer transition-all ${
                      formTipo === 'WORD'
                        ? 'border-blue-500 bg-blue-50/50'
                        : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipoModelo"
                      value="WORD"
                      checked={formTipo === 'WORD'}
                      onChange={(e) => setFormTipo(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${formTipo === 'WORD' ? 'bg-blue-100' : 'bg-slate-100'}`}>
                        <UploadCloud className={`w-5 h-5 ${formTipo === 'WORD' ? 'text-blue-600' : 'text-slate-400'}`} />
                      </div>
                      <div className="space-y-0.5">
                        <span className={`block text-sm font-bold ${formTipo === 'WORD' ? 'text-blue-800' : 'text-slate-700'}`}>
                          Arquivo Word (.docx)
                        </span>
                        <span className="block text-[10px] text-slate-500 font-medium">Importar documento com tags</span>
                      </div>
                    </div>
                    {formTipo === 'WORD' && (
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Título + Categoria */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Título do Modelo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carta de Aniversário, Convite de Reunião..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 text-slate-700"
                    value={formTitulo}
                    onChange={(e) => setFormTitulo(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Categoria
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    value={formCategoria}
                    onChange={(e) => setFormCategoria(e.target.value)}
                  >
                    {CATEGORIAS.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Conditional Form: PDF vs WORD */}
              {formTipo === 'PDF' && (
                <>
                  {/* Cabeçalho */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Cabeçalho (Opcional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ex: GABINETE DO VEREADOR FULANO DE TAL&#10;Câmara Municipal de São Paulo"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 text-slate-700"
                      value={formCabecalho}
                      onChange={(e) => setFormCabecalho(e.target.value)}
                    />
                  </div>

                  {/* Marcadores Clicáveis */}
                  <div className="bg-blue-50 border border-blue-150 rounded-lg p-3 space-y-2">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                      Inserir Marcador (clique para adicionar ao corpo da carta):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {MARCADORES.map(m => (
                        <Button
                          key={m.tag}
                          type="button"
                          onClick={() => insertMarcador(m.tag)}
                          variant="secondary"
                          size="sm"
                          className="px-2 py-1 h-auto bg-white border-blue-200 text-[11px] font-bold text-blue-700 hover:bg-blue-100 hover:border-blue-300 shadow-none cursor-pointer"
                          title={m.desc}
                          leftIcon={<Tag className="w-3 h-3" />}
                        >
                          {m.tag}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Corpo da Carta */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Corpo da Carta *
                    </label>
                    <textarea
                      ref={conteudoRef}
                      rows={10}
                      required={formTipo === 'PDF'}
                      placeholder={"Prezado(a) {nome},\n\nÉ com grande satisfação que entramos em contato para...\n\nAtenciosamente,\nEquipe de Campanha"}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 text-slate-700 font-mono leading-relaxed"
                      value={formConteudo}
                      onChange={(e) => setFormConteudo(e.target.value)}
                    />
                  </div>

                  {/* Rodapé */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Rodapé (Opcional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ex: Tel: (11) 9999-9999 | email@campanha.com.br&#10;www.campanha.com.br"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 text-slate-700"
                      value={formRodape}
                      onChange={(e) => setFormRodape(e.target.value)}
                    />
                  </div>
                </>
              )}

              {formTipo === 'WORD' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-150 rounded-lg p-4 space-y-3">
                    <p className="text-xs text-blue-800 font-semibold leading-relaxed">
                      Faça o upload do seu arquivo modelo Word (.docx) que já contém as tags. O sistema irá salvá-mo no banco de dados e ele ficará pronto para uso!
                    </p>
                    <div className="text-[10px] text-blue-700 space-y-1">
                      <strong>Tags disponíveis no seu Word:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {MARCADORES.map(m => (
                          <span key={m.tag} className="px-1.5 py-0.5 bg-white border border-blue-200 rounded font-mono font-bold">{m.tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Selecione o Arquivo Word (.docx) *
                    </label>

                    <div
                      className={`w-full border-2 border-dashed rounded-xl p-8 text-center transition-colors ${formArquivoNome ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400'}`}
                      onClick={() => uploadInputRef.current?.click()}
                    >
                      <input
                        type="file"
                        accept=".docx"
                        className="hidden"
                        ref={uploadInputRef}
                        onChange={handleFileUpload}
                      />

                      {formArquivoNome ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-emerald-600" />
                          </div>
                          <p className="text-sm font-bold text-emerald-700">{formArquivoNome}</p>
                          <Button type="button" variant="ghost" size="sm" className="text-xs text-emerald-600 underline hover:bg-transparent" onClick={(e) => { e.stopPropagation(); uploadInputRef.current?.click(); }}>Trocar arquivo</Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 cursor-pointer">
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                            <UploadCloud className="w-5 h-5 text-slate-500" />
                          </div>
                          <p className="text-sm font-bold text-slate-700">Clique para selecionar um documento Word</p>
                          <p className="text-xs text-slate-400">Apenas arquivos .docx são suportados</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Botões */}
              <div className="pt-2 border-t border-slate-100 flex justify-end gap-3">
                <Button
                  onClick={() => setIsEditorOpen(false)}
                  variant="secondary"
                  size="sm"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isPending || !formTitulo.trim() || (formTipo === 'PDF' && !formConteudo?.trim()) || (formTipo === 'WORD' && !formArquivoBase64)}
                  isLoading={isPending}
                  variant="primary"
                  size="sm"
                >
                  {editingTemplate ? 'Salvar Alterações' : 'Criar Modelo'}
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ===== MODAL: Confirmar Exclusão ===== */}
      {isMounted && templateToDelete && createPortal(
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex min-h-full items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xl max-w-md w-full space-y-4 animate-in zoom-in-95 duration-200 text-left sm:my-8">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-500" />
                Excluir Modelo?
              </h3>
              <Button
                onClick={() => setTemplateToDelete(null)}
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-slate-500 leading-relaxed">
                Você tem certeza que deseja excluir o modelo <strong>"{templateToDelete.titulo}"</strong>? Esta ação não pode ser desfeita e você perderá a formatação/arquivos associados.
              </p>
            </div>
            <div className="bg-slate-50 p-4 -mx-6 -mb-6 mt-6 border-t border-slate-100 flex gap-3 rounded-b-xl">
              <Button
                onClick={() => setTemplateToDelete(null)}
                disabled={isPending}
                variant="secondary"
                className="flex-1 rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmDelete}
                disabled={isPending}
                isLoading={isPending}
                variant="danger"
                className="flex-1 rounded-xl"
              >
                Sim, Excluir
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Toast Notifications */}
      <Toaster position="top-right" />
    </div>
  )
}
