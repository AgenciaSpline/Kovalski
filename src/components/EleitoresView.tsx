'use client'

import React, { useState, useTransition, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Edit2, Trash2, Search, Filter, Phone, MapPin, User, Loader2, Thermometer, ArrowRight, MessageSquare, Send, X, Cake, Calendar, AlertTriangle, Upload, Download, History, Sparkles } from 'lucide-react'
import { createEleitor, updateEleitor, deleteEleitor, importEleitores, updateEleitoresEmMassa, deleteEleitoresEmMassa, mergeDuplicatasAutomatico, getHistoricosEleitor, getEleitores } from '@/lib/actions'
import MultiSelect from './MultiSelect'
import { Button } from './ui/Button'
import * as XLSX from 'xlsx'

interface Etiqueta {
  id: string
  nome: string
  categoria: string
  cor: string
}

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

interface HistoricoEleitor {
  id: string
  tipo: string
  descricao: string
  criadoEm: Date
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
  historicos?: HistoricoEleitor[]
}

interface EleitoresViewProps {
  eleitores: Eleitor[]
  etiquetas: Etiqueta[]
  bairros: Bairro[]
  cidades: Cidade[]
  onRefresh: () => void
}

const TEMPERATURAS = [
  { valor: 1, label: '1 - Frio (0%)', corText: 'text-red-500', corBg: 'bg-red-50', corBadge: 'bg-red-100 text-red-800' },
  { valor: 2, label: '2 - Morno (25%)', corText: 'text-orange-500', corBg: 'bg-orange-50', corBadge: 'bg-orange-100 text-orange-800' },
  { valor: 3, label: '3 - Inclinado (50%)', corText: 'text-yellow-600', corBg: 'bg-yellow-50', corBadge: 'bg-yellow-100 text-yellow-800' },
  { valor: 4, label: '4 - Quente (80%)', corText: 'text-blue-500', corBg: 'bg-blue-50', corBadge: 'bg-blue-100 text-blue-800' },
  { valor: 5, label: '5 - Líder (100%)', corText: 'text-emerald-500', corBg: 'bg-emerald-50', corBadge: 'bg-emerald-100 text-emerald-800' },
]

export default function EleitoresView({
  eleitores,
  etiquetas,
  bairros,
  cidades,
  onRefresh
}: EleitoresViewProps) {
  const [isPending, startTransition] = useTransition()
  const [isMerging, setIsMerging] = useState(false)

  // Filtros
  const [search, setSearch] = useState('')
  const [selectedBairro, setSelectedBairro] = useState('todos')
  const [selectedTemp, setSelectedTemp] = useState<number>(0)

  // Filtros Avançados
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [idadeMin, setIdadeMin] = useState<string>('')
  const [idadeMax, setIdadeMax] = useState<string>('')
  const [temLogradouro, setTemLogradouro] = useState<boolean | null>(null)
  const [temNumero, setTemNumero] = useState<boolean | null>(null)
  const [filtroEtiquetas, setFiltroEtiquetas] = useState<string[]>([])
  const [eleitoresFiltrados, setEleitoresFiltrados] = useState<Eleitor[] | null>(null)
  const [buscandoFiltros, setBuscandoFiltros] = useState(false)

  // Seleção em Massa
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isOpenBulkEdit, setIsOpenBulkEdit] = useState(false)
  const [isOpenBulkDelete, setIsOpenBulkDelete] = useState(false)
  const [bulkEditData, setBulkEditData] = useState({
    bairroId: '',
    cidadeId: '',
    temperatura: 0,
    addTags: [] as string[]
  })

  // Modais de Importação e Mesclagem
  const [importModal, setImportModal] = useState<{
    isOpen: boolean;
    step: 'reconciliation' | 'confirm' | 'importing' | 'success' | 'error';
    validRows: any[];
    message: string;
    stats?: { criados: number; atualizados: number };
    unmappedBairros?: string[];
    unmappedCidades?: string[];
  }>({ isOpen: false, step: 'confirm', validRows: [], message: '' })

  const [bairroMapping, setBairroMapping] = useState<Record<string, string>>({})
  const [cidadeMapping, setCidadeMapping] = useState<Record<string, string>>({})

  const [mergeModal, setMergeModal] = useState<{
    isOpen: boolean;
    step: 'confirm' | 'merging' | 'success' | 'error';
    message: string;
    count?: number;
  }>({ isOpen: false, step: 'confirm', message: '' })

  // Modais / Form
  const [isOpenForm, setIsOpenForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  // Modal de Confirmação de Exclusão de Eleitor
  const [isOpenDeleteConfirm, setIsOpenDeleteConfirm] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState('')
  const [deleteTargetName, setDeleteTargetName] = useState('')
  const [deleteConfirmError, setDeleteConfirmError] = useState('')

  // Menu de Mais Opções
  const [isMoreOptionsOpen, setIsMoreOptionsOpen] = useState(false)

  // Modal WhatsApp Rápido
  const [whatsappEleitor, setWhatsappEleitor] = useState<Eleitor | null>(null)
  const [mensagemPersonalizada, setMensagemPersonalizada] = useState('')

  // Modal Histórico e Detalhes
  const [historicoEleitor, setHistoricoEleitor] = useState<Eleitor | null>(null)
  const [historicosLoad, setHistoricosLoad] = useState<any[] | null>(null)
  const [activeTab, setActiveTab] = useState<'perfil' | 'historico'>('perfil')

  // Form Fields
  const [nomeCompleto, setNomeCompleto] = useState('')
  const [telefone, setTelefone] = useState('')
  const [logradouro, setLogradouro] = useState('')
  const [numero, setNumero] = useState('')
  const [bairroId, setBairroId] = useState('')
  const [cidadeId, setCidadeId] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [temperatura, setTemperatura] = useState<number>(1)
  const [selectedEtiquetas, setSelectedEtiquetas] = useState<string[]>([])
  const [isLider, setIsLider] = useState(false)
  const [liderId, setLiderId] = useState('')

  const calcularIdade = (dataNasc: Date | null) => {
    if (!dataNasc) return null
    const hoje = new Date()
    const nasc = new Date(dataNasc)
    let idade = hoje.getFullYear() - nasc.getFullYear()
    const m = hoje.getMonth() - nasc.getMonth()
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
      idade--
    }
    return idade
  }

  const ehAniversarianteHoje = (dataNasc: Date | null) => {
    if (!dataNasc) return false
    const hoje = new Date()
    const nasc = new Date(dataNasc)
    return hoje.getDate() === nasc.getDate() && hoje.getMonth() === nasc.getMonth()
  }

  const formatarData = (dataNasc: Date | null) => {
    if (!dataNasc) return ''
    const nasc = new Date(dataNasc)
    const dd = String(nasc.getDate()).padStart(2, '0')
    const mm = String(nasc.getMonth() + 1).padStart(2, '0')
    const yyyy = nasc.getFullYear()
    return `${dd}/${mm}/${yyyy}`
  }

  const handleOpenWhatsappModal = (el: Eleitor) => {
    setWhatsappEleitor(el)
    setMensagemPersonalizada(`Olá, ${el.nomeCompleto}! Tudo bem? Passando para mandar um abraço e me colocar à disposição.`)
  }

  const aplicarTemplate = (tipo: 'agradecimento' | 'reuniao' | 'apoio') => {
    if (!whatsappEleitor) return
    let txt = ''
    if (tipo === 'agradecimento') {
      txt = `Olá, ${whatsappEleitor.nomeCompleto}! Aqui é da equipe de campanha. Passando para agradecer o nosso bate-papo recente. É muito importante contar com sua simpatia e apoio. Um grande abraço!`
    } else if (tipo === 'reuniao') {
      txt = `Olá, ${whatsappEleitor.nomeCompleto}! Lembramos que hoje teremos nosso encontro de apoiadores para discutir melhorias para o bairro ${whatsappEleitor.bairro}. Sua presença é muito especial para nós! Nos vemos lá.`
    } else if (tipo === 'apoio') {
      txt = `Olá, ${whatsappEleitor.nomeCompleto}! Como você é uma das nossas principais lideranças no bairro ${whatsappEleitor.bairro}, gostaríamos de pedir sua ajuda para convidar amigos e familiares para nosso projeto. Vamos juntos multiplicar nossa força!`
    }
    setMensagemPersonalizada(txt)
  }

  const enviarWhatsApp = () => {
    if (!whatsappEleitor) return
    const cleanPhone = whatsappEleitor.telefone.replace(/\D/g, '')
    const textEncoded = encodeURIComponent(mensagemPersonalizada)
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${textEncoded}`
    window.open(url, '_blank')
    setWhatsappEleitor(null)
  }

  // --- Excel Import, Export & Template Functions ---
  const handleDownloadTemplate = () => {
    const wsData = [
      {
        "Nome Completo": "João da Silva",
        "Telefone (com DDD)": "11999999999",
        "Rua/Logradouro": "Avenida Paulista",
        "Número": "1000",
        "Bairro": "Bela Vista",
        "Cidade": "São Paulo",
        "Data de Nascimento (DD/MM/AAAA)": "15/08/1985",
        "Temperatura (1 a 5)": "4",
        "Líder? (Sim/Não)": "Não",
        "Etiquetas (separadas por vírgula)": "Apoio Saúde, Líder de Bairro"
      },
      {
        "Nome Completo": "Maria Oliveira",
        "Telefone (com DDD)": "11988888888",
        "Rua/Logradouro": "Rua Augusta",
        "Número": "500",
        "Bairro": "Consolação",
        "Cidade": "São Paulo",
        "Data de Nascimento (DD/MM/AAAA)": "22/11/1990",
        "Temperatura (1 a 5)": "5",
        "Líder? (Sim/Não)": "Sim",
        "Etiquetas (separadas por vírgula)": "Apoio Educação, Reunião Centro"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modelo de Importação");

    ws['!cols'] = [
      { wch: 25 }, // Nome
      { wch: 20 }, // Telefone
      { wch: 25 }, // Rua
      { wch: 10 }, // Número
      { wch: 15 }, // Bairro
      { wch: 15 }, // Cidade
      { wch: 25 }, // Data de Nascimento
      { wch: 20 }, // Temperatura
      { wch: 15 }, // Líder
      { wch: 30 }  // Etiquetas
    ];

    XLSX.writeFile(wb, "modelo-importacao-eleitores.xlsx");
  };

  const handleExportExcel = () => {
    if (filteredEleitores.length === 0) {
      alert("Nenhum eleitor disponível para exportar com os filtros atuais.");
      return;
    }

    const wsData = filteredEleitores.map(el => {
      const dataNascStr = el.dataNascimento ? new Date(el.dataNascimento).toLocaleDateString('pt-BR') : '';
      return {
        "Nome Completo": el.nomeCompleto,
        "Telefone": el.telefone,
        "Rua/Logradouro": el.logradouro || '',
        "Número": el.numero || '',
        "Bairro": el.bairro,
        "Cidade": el.cidade,
        "Data de Nascimento": dataNascStr,
        "Temperatura": el.temperatura,
        "Líder": el.isLider ? "Sim" : "Não",
        "Indicado por": el.liderNome || '',
        "Etiquetas": el.etiquetas.map(t => t.nome).join(', ')
      };
    });

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Eleitores");

    ws['!cols'] = [
      { wch: 25 }, { wch: 15 }, { wch: 25 }, { wch: 10 }, { wch: 15 },
      { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 35 }
    ];

    XLSX.writeFile(wb, `eleitores-exportados-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws);

        if (data.length === 0) {
          setImportModal({ isOpen: true, step: 'error', validRows: [], message: 'A planilha está vazia.' });
          return;
        }

        const capitalizeName = (name: any) => {
          if (!name) return '';
          const lower = name.toString().trim().toLowerCase();
          const exceptions = ['da', 'de', 'do', 'das', 'dos', 'e'];
          return lower.split(/\s+/).map((word: string, index: number) => {
            if (index > 0 && exceptions.includes(word)) return word;
            return word.charAt(0).toUpperCase() + word.slice(1);
          }).join(' ');
        };

        // Map and normalize keys dynamically
        const parsedRows = data.map(row => {
          const getVal = (possibleKeys: string[]) => {
            const foundKey = Object.keys(row).find(k => possibleKeys.includes(k.trim().toLowerCase()));
            return foundKey ? row[foundKey] : undefined;
          };

          const nome = getVal(['nome completo', 'nome', 'nome_completo']);
          const telefone = getVal(['telefone', 'telefone (com ddd)', 'celular', 'whatsapp', 'fone']);
          const rua = getVal(['rua/logradouro', 'rua', 'logradouro', 'endereco', 'endereço']);
          const numero = getVal(['número', 'numero']);
          const bairro = getVal(['bairro']);
          const cidade = getVal(['cidade']);
          const dataNasc = getVal(['data de nascimento (dd/mm/aaaa)', 'data de nascimento', 'data_nascimento', 'nascimento', 'nasc']);
          const temp = getVal(['temperatura (1 a 5)', 'temperatura', 'temp', 'escala']);
          const lider = getVal(['líder? (sim/não)', 'lider?', 'lider', 'líder', 'is_lider']);
          const tags = getVal(['etiquetas (separadas por vírgula)', 'etiquetas', 'tags']);

          let cleanPhone = telefone?.toString().replace(/\D/g, '') || '';
          if (cleanPhone.length === 10 || cleanPhone.length === 11) {
            cleanPhone = '55' + cleanPhone;
          }

          return {
            nome: capitalizeName(nome),
            telefone: cleanPhone,
            logradouro: rua?.toString().trim() || null,
            numero: numero?.toString().trim() || null,
            bairro: bairro?.toString().trim() || null,
            cidade: cidade?.toString().trim() || null,
            dataNascimento: dataNasc ? dataNasc.toString().trim() : null,
            temperatura: temp ? parseInt(temp.toString()) : null,
            isLider: lider?.toString().toLowerCase().startsWith('s') || lider?.toString().toLowerCase() === 'true' || lider?.toString() === '1',
            etiquetas: tags?.toString().split(',').map((t: string) => t.trim()).filter(Boolean) || []
          };
        });

        // Filtrar linhas que possuem nome e telefone válidos
        const validRows = parsedRows.filter(row => row.nome && row.telefone);
        if (validRows.length === 0) {
          setImportModal({ isOpen: true, step: 'error', validRows: [], message: 'Nenhum registro válido encontrado. Certifique-se de que a planilha possui as colunas "Nome Completo" e "Telefone" preenchidas.' });
          return;
        }

        // Identificar cidades e bairros desconhecidos para a fase de Reconciliação
        const cidadesPlanilha = Array.from(new Set(validRows.map(r => r.cidade).filter(Boolean))) as string[];
        const normalizedCidadesSistema = cidades.map(c => c.nome.toLowerCase().trim());
        const cidadesDesconhecidas = cidadesPlanilha.filter(
          cp => !normalizedCidadesSistema.includes(cp.toLowerCase().trim())
        );

        const bairrosPlanilha = Array.from(new Set(validRows.map(r => r.bairro).filter(Boolean))) as string[];
        const normalizedBairrosSistema = bairros.map(b => b.nome.toLowerCase().trim());
        const bairrosDesconhecidos = bairrosPlanilha.filter(
          bp => !normalizedBairrosSistema.includes(bp.toLowerCase().trim())
        );

        if (bairrosDesconhecidos.length > 0 || cidadesDesconhecidas.length > 0) {
          // Inicializa o mapping padrão como 'CREATE_NEW'
          const initialBairroMapping: Record<string, string> = {};
          bairrosDesconhecidos.forEach(b => initialBairroMapping[b] = 'CREATE_NEW');
          setBairroMapping(initialBairroMapping);

          const initialCidadeMapping: Record<string, string> = {};
          cidadesDesconhecidas.forEach(c => initialCidadeMapping[c] = 'CREATE_NEW');
          setCidadeMapping(initialCidadeMapping);

          let message = 'Identificamos ';
          if (cidadesDesconhecidas.length > 0) message += `${cidadesDesconhecidas.length} cidade(s)`;
          if (cidadesDesconhecidas.length > 0 && bairrosDesconhecidos.length > 0) message += ' e ';
          if (bairrosDesconhecidos.length > 0) message += `${bairrosDesconhecidos.length} bairro(s)`;
          message += ' na sua planilha que não existem no banco de dados com esses exatos nomes.';

          setImportModal({
            isOpen: true,
            step: 'reconciliation',
            validRows,
            unmappedBairros: bairrosDesconhecidos,
            unmappedCidades: cidadesDesconhecidas,
            message
          });
        } else {
          setImportModal({
            isOpen: true,
            step: 'confirm',
            validRows,
            message: `Foram encontrados ${validRows.length} eleitores válidos na planilha. Contatos com mesmo telefone serão atualizados.`
          });
        }

      } catch (err: any) {
        console.error(err);
        setImportModal({ isOpen: true, step: 'error', validRows: [], message: 'Erro ao processar o arquivo Excel: ' + (err.message || err) });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; // Reset input to allow importing same file again
  };

  const handleConfirmReconciliation = () => {
    const reconciledRows = importModal.validRows.map(row => {
      let mappedBairro = row.bairro;
      let mappedCidade = row.cidade;

      if (row.cidade && cidadeMapping[row.cidade] && cidadeMapping[row.cidade] !== 'CREATE_NEW') {
        const cidadeSelecionada = cidades.find(c => c.id === cidadeMapping[row.cidade]);
        if (cidadeSelecionada) {
          mappedCidade = cidadeSelecionada.nome;
        }
      }

      if (row.bairro && bairroMapping[row.bairro] && bairroMapping[row.bairro] !== 'CREATE_NEW') {
        const bairroSelecionado = bairros.find(b => b.id === bairroMapping[row.bairro]);
        if (bairroSelecionado) {
          mappedBairro = bairroSelecionado.nome;
          mappedCidade = bairroSelecionado.cidade?.nome || mappedCidade;
        }
      }

      return { ...row, bairro: mappedBairro, cidade: mappedCidade };
    });

    setImportModal({
      isOpen: true,
      step: 'confirm',
      validRows: reconciledRows,
      message: `Revisão concluída! Foram encontrados ${reconciledRows.length} eleitores válidos na planilha. Contatos com mesmo telefone serão atualizados.`
    });
  };

  const confirmImport = () => {
    setImportModal(prev => ({ ...prev, step: 'importing' }));
    startTransition(async () => {
      const res = await importEleitores(importModal.validRows);
      if (res.success) {
        setImportModal(prev => ({
          ...prev,
          step: 'success',
          stats: { criados: res.criados || 0, atualizados: res.atualizados || 0 }
        }));
        onRefresh();
      } else {
        setImportModal(prev => ({ ...prev, step: 'error', message: res.error || 'Erro ao importar eleitores.' }));
      }
    });
  };

  // Paginação Client-Side
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 30

  useEffect(() => {
    setCurrentPage(1)
  }, [search, selectedBairro, selectedTemp])

  const clearAdvancedFilters = () => {
    setIdadeMin('')
    setIdadeMax('')
    setTemLogradouro(null)
    setTemNumero(null)
    setFiltroEtiquetas([])
    setEleitoresFiltrados(null)
  }

  const hasActiveAdvancedFilters = idadeMin !== '' || idadeMax !== '' || temLogradouro !== null || temNumero !== null || filtroEtiquetas.length > 0

  // Filtrar dados na memória (frontend) para rapidez
  const filteredEleitores = eleitoresFiltrados !== null
    ? eleitoresFiltrados.filter(el => {
        const matchesSearch = !search ||
          el.nomeCompleto.toLowerCase().includes(search.toLowerCase()) ||
          el.telefone.includes(search) ||
          (el.logradouro && el.logradouro.toLowerCase().includes(search.toLowerCase())) ||
          (el.cidade && el.cidade.toLowerCase().includes(search.toLowerCase()))

        const matchesBairro = selectedBairro === 'todos' || el.bairroId === selectedBairro
        const matchesTemp = selectedTemp === 0 || el.temperatura === selectedTemp

        return matchesSearch && matchesBairro && matchesTemp
      })
    : eleitores.filter(el => {
        const matchesSearch = el.nomeCompleto.toLowerCase().includes(search.toLowerCase()) ||
          el.telefone.includes(search) ||
          (el.logradouro && el.logradouro.toLowerCase().includes(search.toLowerCase())) ||
          (el.cidade && el.cidade.toLowerCase().includes(search.toLowerCase()))

        const matchesBairro = selectedBairro === 'todos' || el.bairroId === selectedBairro
        const matchesTemp = selectedTemp === 0 || el.temperatura === selectedTemp

        return matchesSearch && matchesBairro && matchesTemp
      })

  const totalPages = Math.ceil(filteredEleitores.length / ITEMS_PER_PAGE)
  const paginatedEleitores = filteredEleitores.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredEleitores.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredEleitores.map(el => el.id))
    }
  }

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const handleBulkDelete = () => {
    setDeleteConfirmError('')
    startTransition(async () => {
      const res = await deleteEleitoresEmMassa(selectedIds)
      if (res.success) {
        setIsOpenBulkDelete(false)
        setSelectedIds([])
        onRefresh()
      } else {
        setDeleteConfirmError(res.error || 'Erro ao excluir em massa.')
      }
    })
  }

  const handleBulkEdit = () => {
    setErrorMsg('')
    startTransition(async () => {
      const payload: any = {}
      if (bulkEditData.cidadeId) payload.cidadeId = bulkEditData.cidadeId
      if (bulkEditData.bairroId) payload.bairroId = bulkEditData.bairroId
      if (bulkEditData.temperatura > 0) payload.temperatura = bulkEditData.temperatura
      if (bulkEditData.addTags.length > 0) payload.addTags = bulkEditData.addTags

      if (Object.keys(payload).length === 0) {
        setIsOpenBulkEdit(false)
        return
      }

      const res = await updateEleitoresEmMassa(selectedIds, payload)
      if (res.success) {
        setIsOpenBulkEdit(false)
        setSelectedIds([])
        onRefresh()
      } else {
        setErrorMsg(res.error || 'Erro ao editar em massa.')
      }
    })
  }

  const handleMergeDuplicates = async () => {
    setMergeModal({ isOpen: true, step: 'confirm', message: 'Deseja iniciar a Limpeza Automática de Duplicatas? O sistema identificará cadastros com o mesmo Nome e (mesmo Bairro ou mesma Data de Nascimento), fundirá seus dados e removerá a duplicidade extra.' })
  }

  const confirmMerge = () => {
    setMergeModal(prev => ({ ...prev, step: 'merging' }))
    startTransition(async () => {
      const res = await mergeDuplicatasAutomatico()
      if (res.success) {
        setMergeModal({
          isOpen: true,
          step: 'success',
          message: res.count === 0 ? 'Nenhuma duplicata exata foi encontrada. A base de dados já está limpa.' : 'Limpeza concluída com sucesso!',
          count: res.count
        })
        if (res.count && res.count > 0) onRefresh()
      } else {
        setMergeModal({ isOpen: true, step: 'error', message: res.error || 'Erro ao mesclar duplicatas.' })
      }
    })
  }

  const handleOpenCreate = () => {
    setEditingId(null)
    setNomeCompleto('')
    setTelefone('')
    setLogradouro('')
    setNumero('')

    const defaultCidadeId = cidades[0]?.id || ''
    setCidadeId(defaultCidadeId)
    const firstCityBairros = bairros.filter(b => b.cidadeId === defaultCidadeId)
    setBairroId(firstCityBairros[0]?.id || '')

    setDataNascimento('')
    setTemperatura(1)
    setSelectedEtiquetas([])
    setIsLider(false)
    setLiderId('')
    setErrorMsg('')
    setIsOpenForm(true)
  }

  const handleOpenEdit = (el: Eleitor) => {
    setEditingId(el.id)
    setNomeCompleto(el.nomeCompleto)
    setTelefone(el.telefone)
    setLogradouro(el.logradouro || '')
    setNumero(el.numero || '')
    setCidadeId(el.cidadeId)
    setBairroId(el.bairroId)

    if (el.dataNascimento) {
      const dateObj = new Date(el.dataNascimento)
      const yyyy = dateObj.getFullYear()
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0')
      const dd = String(dateObj.getDate()).padStart(2, '0')
      setDataNascimento(`${yyyy}-${mm}-${dd}`)
    } else {
      setDataNascimento('')
    }

    setTemperatura(el.temperatura)
    setSelectedEtiquetas(el.etiquetas.map(t => t.id))
    setIsLider(el.isLider || false)
    setLiderId(el.liderId || '')
    setErrorMsg('')
    setIsOpenForm(true)
  }

  const handleCidadeChange = (newCidadeId: string) => {
    setCidadeId(newCidadeId)
    const cityBairros = bairros.filter(b => b.cidadeId === newCidadeId)
    setBairroId(cityBairros[0]?.id || '')
  }

  const handleOpenHistorico = async (el: Eleitor) => {
    setHistoricoEleitor(el)
    setActiveTab('perfil')
    setHistoricosLoad(null)
    const hist = await getHistoricosEleitor(el.id)
    setHistoricosLoad(Array.isArray(hist) ? hist : [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nomeCompleto.trim()) {
      setErrorMsg('Nome completo é obrigatório.')
      return
    }
    if (!telefone.trim()) {
      setErrorMsg('Telefone é obrigatório.')
      return
    }
    if (!bairroId) {
      setErrorMsg('Bairro é obrigatório.')
      return
    }
    if (!cidadeId) {
      setErrorMsg('Cidade é obrigatória.')
      return
    }

    startTransition(async () => {
      let res
      const payload = {
        nomeCompleto,
        telefone: telefone.replace(/\D/g, ''), // limpar caracteres não numéricos
        logradouro: logradouro || undefined,
        numero: numero || undefined,
        bairroId,
        cidadeId,
        dataNascimento: dataNascimento ? new Date(dataNascimento) : undefined,
        temperatura,
        etiquetaIds: selectedEtiquetas,
        isLider,
        liderId: liderId || undefined,
      }

      if (editingId) {
        res = await updateEleitor(editingId, payload)
      } else {
        res = await createEleitor(payload)
      }

      if (res.success) {
        setIsOpenForm(false)
        onRefresh()
      } else {
        setErrorMsg(res.error || 'Erro ao processar formulário.')
      }
    })
  }

  const handleOpenDelete = (eleitor: Eleitor) => {
    setDeleteTargetId(eleitor.id)
    setDeleteTargetName(eleitor.nomeCompleto)
    setDeleteConfirmError('')
    setIsOpenDeleteConfirm(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return

    startTransition(async () => {
      const res = await deleteEleitor(deleteTargetId)
      if (res.success) {
        setIsOpenDeleteConfirm(false)
        onRefresh()
      } else {
        setDeleteConfirmError(res.error || 'Erro ao excluir eleitor.')
      }
    })
  }

  const getTempDetails = (val: number) => {
    return TEMPERATURAS.find(t => t.valor === val) || TEMPERATURAS[0]
  }

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const hasAdvanced = idadeMin !== '' || idadeMax !== '' || temLogradouro !== null || temNumero !== null || filtroEtiquetas.length > 0
    if (!hasAdvanced) {
      setEleitoresFiltrados(null)
      return
    }

    let cancelled = false
    setBuscandoFiltros(true)

    getEleitores({
      search,
      bairro: selectedBairro !== 'todos' ? selectedBairro : undefined,
      temperatura: selectedTemp || undefined,
      idadeMin: idadeMin ? Number(idadeMin) : undefined,
      idadeMax: idadeMax ? Number(idadeMax) : undefined,
      temLogradouro,
      temNumero,
      etiquetaIds: filtroEtiquetas.length > 0 ? filtroEtiquetas : undefined,
    }).then((result) => {
      if (!cancelled) setEleitoresFiltrados(result as any)
    }).catch((error) => {
      console.error('Erro ao aplicar filtros:', error)
      if (!cancelled) setEleitoresFiltrados([])
    }).finally(() => {
      if (!cancelled) setBuscandoFiltros(false)
    })

    return () => { cancelled = true }
  }, [idadeMin, idadeMax, temLogradouro, temNumero, filtroEtiquetas, search, selectedBairro, selectedTemp])

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <User className="w-6 h-6 text-primary-600" />
              Gestão de Eleitores
            </h2>
            <p className="text-slate-500 text-sm">
              Adicione e gerencie contatos locais de eleitores com seu nível de proximidade.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto">
            {/* Mais Opções (Dropdown) */}
            <div className="relative">
              <Button
                onClick={() => setIsMoreOptionsOpen(!isMoreOptionsOpen)}
                variant="secondary"
                className="shrink-0"
                leftIcon={<Sparkles className="w-3.5 h-3.5 text-slate-600" />}
              >
                Extras
              </Button>

              {isMoreOptionsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsMoreOptionsOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 z-50 py-2 flex flex-col gap-1 px-2 animate-in fade-in slide-in-from-top-2">
                    <label className="flex items-center gap-2 bg-transparent hover:bg-slate-50 text-slate-700 font-bold px-3 py-2 rounded-lg transition-colors text-xs cursor-pointer select-none">
                      <Upload className="w-4 h-4 text-blue-600" />
                      Importar Planilha
                      <input
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        className="hidden"
                        onChange={(e) => {
                          setIsMoreOptionsOpen(false)
                          handleImportFile(e)
                        }}
                        disabled={isPending}
                      />
                    </label>

                    <button
                      onClick={() => {
                        setIsMoreOptionsOpen(false)
                        handleMergeDuplicates()
                      }}
                      className="flex items-center gap-2 bg-transparent hover:bg-orange-50 text-orange-600 font-bold px-3 py-2 rounded-lg transition-colors text-xs text-left w-full disabled:opacity-50"
                      disabled={isPending}
                    >
                      <Sparkles className="w-4 h-4" />
                      Limpar Duplicatas
                    </button>

                    <div className="h-px bg-slate-100 my-1 mx-2" />

                    <button
                      onClick={() => {
                        setIsMoreOptionsOpen(false)
                        handleExportExcel()
                      }}
                      className="flex items-center gap-2 bg-transparent hover:bg-slate-50 text-slate-700 font-bold px-3 py-2 rounded-lg transition-colors text-xs text-left w-full"
                    >
                      <Download className="w-4 h-4 text-emerald-600" />
                      Exportar Excel
                    </button>

                    <button
                      onClick={() => {
                        setIsMoreOptionsOpen(false)
                        handleDownloadTemplate()
                      }}
                      className="flex items-center gap-2 bg-transparent hover:bg-slate-50 text-slate-700 font-bold px-3 py-2 rounded-lg transition-colors text-xs text-left w-full"
                    >
                      <Download className="w-4 h-4 text-primary-600" />
                      Modelo Planilha
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Cadastrar Eleitor */}
            <Button
              onClick={handleOpenCreate}
              variant="primary"
              className="shrink-0 flex-1 lg:flex-none"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Cadastrar Eleitor
            </Button>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou fone..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch sm:items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="text-xs font-bold text-slate-400 uppercase">Filtros:</span>
            </div>

            {/* Filtro Bairro */}
            <select
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={selectedBairro}
              onChange={(e) => setSelectedBairro(e.target.value)}
            >
              <option value="todos">Todos os Bairros</option>
              {bairros.map(b => (
                <option key={b.id} value={b.id}>{b.nome}{b.cidade ? ` (${b.cidade.nome})` : ''}</option>
              ))}
            </select>

            {/* Filtro Temperatura */}
            <select
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={selectedTemp}
              onChange={(e) => setSelectedTemp(Number(e.target.value))}
            >
              <option value="0">Todas as Temperaturas</option>
              {TEMPERATURAS.map(t => (
                <option key={t.valor} value={t.valor}>{t.label}</option>
              ))}
            </select>

            {/* Botão Filtros Avançados */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                showAdvanced || hasActiveAdvancedFilters
                  ? 'bg-primary-100 text-primary-700 border border-primary-300'
                  : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              Avançado
              {hasActiveAdvancedFilters && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 ml-1" />
              )}
            </button>
          </div>
        </div>

        {/* Painel de Filtros Avançados */}
        {showAdvanced && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary-500" />
                Filtros Avançados
              </h4>
              <div className="flex items-center gap-2">
                {buscandoFiltros && (
                  <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
                )}
                <button
                  onClick={clearAdvancedFilters}
                  className="text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors"
                >
                  Limpar tudo
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Idade */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Idade</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={150}
                    placeholder="Mín"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                    value={idadeMin}
                    onChange={(e) => setIdadeMin(e.target.value)}
                  />
                  <span className="text-slate-300 font-bold">até</span>
                  <input
                    type="number"
                    min={0}
                    max={150}
                    placeholder="Máx"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                    value={idadeMax}
                    onChange={(e) => setIdadeMax(e.target.value)}
                  />
                </div>
              </div>

              {/* Condição: Tem nome de rua */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rua / Logradouro</label>
                <select
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  value={temLogradouro === null ? '' : temLogradouro ? 'sim' : 'nao'}
                  onChange={(e) => {
                    const v = e.target.value
                    setTemLogradouro(v === '' ? null : v === 'sim')
                  }}
                >
                  <option value="">Todos</option>
                  <option value="sim">Tem rua cadastrada</option>
                  <option value="nao">Não tem rua</option>
                </select>
              </div>

              {/* Condição: Tem número */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Número</label>
                <select
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  value={temNumero === null ? '' : temNumero ? 'sim' : 'nao'}
                  onChange={(e) => {
                    const v = e.target.value
                    setTemNumero(v === '' ? null : v === 'sim')
                  }}
                >
                  <option value="">Todos</option>
                  <option value="sim">Tem número cadastrado</option>
                  <option value="nao">Não tem número</option>
                </select>
              </div>

              {/* Etiquetas */}
              <div className="sm:col-span-2 lg:col-span-3">
                <MultiSelect
                  options={etiquetas}
                  selectedIds={filtroEtiquetas}
                  onChange={setFiltroEtiquetas}
                  placeholder="Filtrar por etiquetas específicas..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Lista / Tabela */}
        {filteredEleitores.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-700">Nenhum eleitor encontrado</h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto mt-1">
              Tente mudar os filtros ou adicione novos cadastros clicando no botão acima.
            </p>
          </div>
        ) : (
          <>
            {/* Barra de Ações em Lote */}
            {selectedIds.length > 0 && (
              <div className="bg-primary-50 border border-primary-200 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-4 z-40 shadow-sm animate-in slide-in-from-top-4">
                <div className="flex items-center gap-3">
                  <span className="bg-primary-600 text-white font-bold px-2.5 py-1 rounded-md text-sm">
                    {selectedIds.length} selecionados
                  </span>
                  <span className="text-primary-800 text-sm font-medium">O que deseja fazer com estes contatos?</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => setIsOpenBulkEdit(true)} variant="primary" size="sm" leftIcon={<Edit2 className="w-4 h-4" />}>
                    Editar em Lote
                  </Button>
                  <Button onClick={() => setIsOpenBulkDelete(true)} variant="danger" size="sm" leftIcon={<Trash2 className="w-4 h-4" />}>
                    Excluir em Lote
                  </Button>
                  <Button onClick={() => setSelectedIds([])} variant="ghost" size="sm" className="text-slate-500">
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-4 py-4 w-12 text-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 appearance-none relative checked:bg-primary-600 checked:border-primary-600 checked:after:content-['✓'] checked:after:text-white checked:after:absolute checked:after:text-[12px] checked:after:font-bold checked:after:left-[1px] checked:after:-top-[2px] bg-slate-50 border-2 border-slate-300 border-dashed rounded focus:ring-primary-500 focus:ring-offset-0 cursor-pointer transition-all"
                        checked={selectedIds.length === filteredEleitores.length && filteredEleitores.length > 0}
                        onChange={handleToggleSelectAll}
                      />
                    </th>
                    <th className="px-6 py-4">Eleitor</th>
                    <th className="px-6 py-4">Bairro / Endereço</th>
                    <th className="px-6 py-4">Temperatura</th>
                    <th className="px-6 py-4">Etiquetas</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {paginatedEleitores.map(el => {
                    const tDetails = getTempDetails(el.temperatura)
                    const isSelected = selectedIds.includes(el.id)
                    return (
                      <tr key={el.id} className={`transition-colors ${isSelected ? 'bg-primary-50/50' : 'hover:bg-slate-50/50'}`}>
                        <td className="px-4 py-4 w-12 text-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 appearance-none relative checked:bg-primary-600 checked:border-primary-600 checked:after:content-['✓'] checked:after:text-white checked:after:absolute checked:after:text-[12px] checked:after:font-bold checked:after:left-[1px] checked:after:-top-[2px] bg-white border-2 border-slate-300 border-dashed rounded focus:ring-primary-500 focus:ring-offset-0 cursor-pointer transition-all"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(el.id)}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5 flex-wrap">
                            <span>{el.nomeCompleto}</span>
                            {el.isLider && (
                              <span className="inline-flex items-center px-1.5 py-0.5 bg-orange-105 text-primary-700 text-[10px] font-extrabold rounded border border-orange-200">
                                Líder
                              </span>
                            )}
                            {calcularIdade(el.dataNascimento) !== null && (
                              <span className="text-xs text-slate-400 font-normal">({calcularIdade(el.dataNascimento)} anos)</span>
                            )}
                            {ehAniversarianteHoje(el.dataNascimento) && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-pink-100 text-pink-700 text-[10px] font-bold rounded-md animate-pulse" title="Aniversariante de Hoje!">
                                <Cake className="w-3 h-3" />
                                Níver!
                              </span>
                            )}
                          </div>
                          {el.liderNome && (
                            <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                              Indicado por: {el.liderNome}
                            </div>
                          )}
                          <Button
                            onClick={() => handleOpenWhatsappModal(el)}
                            variant="ghost"
                            className="text-xs text-slate-450 hover:text-primary-600 p-0 h-auto mt-0.5 font-medium cursor-pointer justify-start"
                            leftIcon={<Phone className="w-3 h-3 text-emerald-500" />}
                          >
                            {el.telefone}
                          </Button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-700">{el.bairro}</div>
                          <div className="text-xs text-slate-400 truncate max-w-xs" title={el.logradouro ? `${el.logradouro}${el.numero ? `, ${el.numero}` : ''} - ${el.cidade}` : ''}>
                            {el.logradouro ? `${el.logradouro}${el.numero ? `, ${el.numero}` : ''} - ${el.cidade}` : 'Sem endereço'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${tDetails.corBadge}`}>
                            {tDetails.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {el.etiquetas.length === 0 ? (
                              <span className="text-xs text-slate-400 italic">Nenhuma</span>
                            ) : (
                              el.etiquetas.map(tag => (
                                <span
                                  key={tag.id}
                                  style={{ backgroundColor: tag.cor + '15', color: tag.cor, borderColor: tag.cor }}
                                  className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                                >
                                  {tag.nome}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              onClick={() => handleOpenHistorico(el)}
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                              title="Ver Detalhes"
                            >
                              <User className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => handleOpenEdit(el)}
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-500 hover:text-slate-700"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => handleOpenDelete(el)}
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border-2 border-slate-200 border-dashed">
                <input
                  type="checkbox"
                  className="w-4 h-4 appearance-none relative checked:bg-primary-600 checked:border-primary-600 checked:after:content-['✓'] checked:after:text-white checked:after:absolute checked:after:text-[12px] checked:after:font-bold checked:after:left-[1px] checked:after:-top-[2px] bg-white border-2 border-slate-300 border-dashed rounded focus:ring-primary-500 focus:ring-offset-0 cursor-pointer transition-all"
                  checked={selectedIds.length === filteredEleitores.length && filteredEleitores.length > 0}
                  onChange={handleToggleSelectAll}
                />
                <span className="text-xs font-bold text-slate-500 uppercase">Selecionar Todos</span>
              </div>
              {paginatedEleitores.map(el => {
                const tDetails = getTempDetails(el.temperatura)
                const isSelected = selectedIds.includes(el.id)
                return (
                  <div key={el.id} className={`border rounded-xl p-4 shadow-sm space-y-3 transition-colors ${isSelected ? 'bg-primary-50/50 border-primary-200' : 'bg-white border-slate-200'}`}>
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex gap-3 items-start">
                        <input
                          type="checkbox"
                          className="w-4 h-4 mt-1 appearance-none relative checked:bg-primary-600 checked:border-primary-600 checked:after:content-['✓'] checked:after:text-white checked:after:absolute checked:after:text-[12px] checked:after:font-bold checked:after:left-[1px] checked:after:-top-[2px] bg-white border-2 border-slate-300 border-dashed rounded focus:ring-primary-500 focus:ring-offset-0 cursor-pointer transition-all"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(el.id)}
                        />
                        <div>
                          <h4 className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                          <span>{el.nomeCompleto}</span>
                          {el.isLider && (
                            <span className="inline-flex items-center px-1.5 py-0.5 bg-orange-100 text-primary-700 text-[9px] font-extrabold rounded border border-orange-200">
                              Líder
                            </span>
                          )}
                          {calcularIdade(el.dataNascimento) !== null && (
                            <span className="text-xs text-slate-400 font-normal">({calcularIdade(el.dataNascimento)}a)</span>
                          )}
                          {ehAniversarianteHoje(el.dataNascimento) && (
                            <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-pink-100 text-pink-700 text-[9px] font-extrabold rounded-md animate-pulse">
                              <Cake className="w-2.5 h-2.5" />
                              Níver!
                            </span>
                          )}
                        </h4>
                        {el.liderNome && (
                          <div className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">
                            Indicado por: {el.liderNome}
                          </div>
                        )}
                        <Button
                          onClick={() => handleOpenWhatsappModal(el)}
                          variant="ghost"
                          className="text-xs text-slate-500 hover:text-primary-600 p-0 h-auto font-medium justify-start"
                          leftIcon={<Phone className="w-3.5 h-3.5 text-emerald-500" />}
                        >
                          {el.telefone}
                        </Button>
                      </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${tDetails.corBadge}`}>
                        {tDetails.label.split(' - ')[1]}
                      </span>
                    </div>

                    <div className="flex gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg p-2">
                      <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div>
                        <span className="font-bold">{el.bairro} - {el.cidade}</span>
                        {el.logradouro && (
                          <span className="block text-[11px] text-slate-400">
                            {el.logradouro}{el.numero ? `, nº ${el.numero}` : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {el.etiquetas.map(tag => (
                        <span
                          key={tag.id}
                          style={{ backgroundColor: tag.cor + '15', color: tag.cor, borderColor: tag.cor }}
                          className="px-2 py-0.5 rounded-full text-[9px] font-bold border"
                        >
                          {tag.nome}
                        </span>
                      ))}
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <Button
                        onClick={() => handleOpenHistorico(el)}
                        variant="secondary"
                        size="sm"
                        className="text-xs py-1 h-auto text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        leftIcon={<User className="w-3 h-3" />}
                      >
                        Detalhes
                      </Button>
                      <Button
                        onClick={() => handleOpenEdit(el)}
                        variant="secondary"
                        size="sm"
                        className="text-xs py-1 h-auto"
                        leftIcon={<Edit2 className="w-3 h-3" />}
                      >
                        Editar
                      </Button>
                      <Button
                        onClick={() => handleOpenDelete(el)}
                        variant="danger"
                        size="sm"
                        className="text-xs py-1 h-auto bg-transparent border-red-200 text-red-600 hover:bg-red-50 hover:text-red-800"
                        leftIcon={<Trash2 className="w-3 h-3" />}
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between py-4 px-2 border-t border-slate-200 mt-4">
                <div className="text-sm text-slate-500">
                  Mostrando <span className="font-medium text-slate-700">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> a{' '}
                  <span className="font-medium text-slate-700">{Math.min(currentPage * ITEMS_PER_PAGE, filteredEleitores.length)}</span> de{' '}
                  <span className="font-medium text-slate-700">{filteredEleitores.length}</span> eleitores
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                    className="h-8"
                  >
                    Anterior
                  </Button>
                  <div className="text-sm font-medium text-slate-700 px-3">
                    Página {currentPage} de {totalPages}
                  </div>
                  <Button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                    className="h-8"
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Formulário Popup / Modal Centralizado */}
      {isMounted && isOpenForm && createPortal(
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex min-h-full items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200 space-y-4 text-left sm:my-8">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg">
                {editingId ? 'Editar Cadastro de Eleitor' : 'Cadastrar Novo Eleitor'}
              </h3>
              <Button
                onClick={() => setIsOpenForm(false)}
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: João da Silva"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-medium text-slate-800"
                    value={nomeCompleto}
                    onChange={(e) => setNomeCompleto(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Telefone (WhatsApp)
                  </label>
                  <input
                    type="tel"
                    placeholder="Ex: 11999999999"
                    inputMode="numeric"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-slate-800"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-slate-800"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Rua / Logradouro
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Rua das Flores, Av. Paulista..."
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-slate-800"
                    value={logradouro}
                    onChange={(e) => setLogradouro(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Número
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 123, Ap 42"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-slate-800"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Cidade
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-slate-800 font-semibold"
                    value={cidadeId}
                    onChange={(e) => handleCidadeChange(e.target.value)}
                  >
                    <option value="" disabled>Selecione a cidade...</option>
                    {cidades.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Bairro
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-slate-800 font-semibold"
                    value={bairroId}
                    onChange={(e) => setBairroId(e.target.value)}
                    disabled={!cidadeId}
                  >
                    <option value="" disabled>Selecione o bairro...</option>
                    {bairros
                      .filter(b => b.cidadeId === cidadeId)
                      .map(b => (
                        <option key={b.id} value={b.id}>{b.nome}</option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Liderança Checkbox e Select */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center gap-2.5 h-full pt-1.5">
                  <input
                    type="checkbox"
                    id="isLider"
                    className="w-4 h-4 appearance-none relative checked:bg-primary-600 checked:border-primary-600 checked:after:content-['✓'] checked:after:text-white checked:after:absolute checked:after:text-[12px] checked:after:font-bold checked:after:left-[1px] checked:after:-top-[2px] bg-white border-2 border-slate-300 border-dashed rounded focus:ring-primary-500 focus:ring-offset-0 cursor-pointer transition-all"
                    checked={isLider}
                    onChange={(e) => {
                      setIsLider(e.target.checked)
                      if (e.target.checked) {
                        setLiderId('') // Um líder não pode ser indicado por outro para evitar loops simples (ou simplificar regra)
                      }
                    }}
                  />
                  <label htmlFor="isLider" className="text-sm font-semibold text-slate-700 select-none cursor-pointer">
                    Registrar como Liderança (Líder)
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Indicado por (Líder)
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 border border-slate-350 rounded-lg text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-semibold disabled:opacity-60"
                    value={liderId}
                    onChange={(e) => setLiderId(e.target.value)}
                    disabled={isLider}
                  >
                    <option value="">Ninguém / Indireto</option>
                    {eleitores
                      .filter(lead => lead.isLider && lead.id !== editingId)
                      .map(l => (
                        <option key={l.id} value={l.id}>{l.nomeCompleto} ({l.telefone})</option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Temperatura (Intenção de Voto) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Temperatura do Eleitor (Proximidade / Confirmação do Voto)
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {TEMPERATURAS.map(t => {
                    const active = temperatura === t.valor
                    return (
                      <Button
                        key={t.valor}
                        type="button"
                        onClick={() => setTemperatura(t.valor)}
                        variant="ghost"
                        className={`p-3 rounded-lg border text-center transition-all h-auto flex flex-col items-center gap-1 ${
                          active
                            ? 'border-primary-600 bg-primary-50 shadow-sm ring-1 ring-primary-500 hover:bg-primary-100'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-500'
                        }`}
                      >
                        <Thermometer className={`w-5 h-5 mx-auto mb-1 flex-shrink-0 ${active ? t.corText : 'text-slate-400'}`} />
                        <span className="text-[10px] font-bold block sm:hidden">Nível {t.valor}</span>
                        <span className="text-xs font-bold hidden sm:block">{t.label.split(' - ')[1]}</span>
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* MultiSelect de Etiquetas */}
              <div>
                <MultiSelect
                  options={etiquetas}
                  selectedIds={selectedEtiquetas}
                  onChange={setSelectedEtiquetas}
                />
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  onClick={() => setIsOpenForm(false)}
                  variant="secondary"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  isLoading={isPending}
                  variant="primary"
                >
                  {editingId ? 'Salvar Alterações' : 'Cadastrar'}
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal WhatsApp Rápido (Gaveta de Templates) */}
      {isMounted && whatsappEleitor && createPortal(
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex min-h-full items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200 space-y-4 text-left sm:my-8">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-500" />
                  Mensagem Rápida WhatsApp
                </h3>
                <p className="text-xs text-slate-400">Enviar texto pré-configurado para o eleitor.</p>
              </div>
              <Button
                onClick={() => setWhatsappEleitor(null)}
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Ficha Rápida do Eleitor */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="font-bold text-slate-800 text-sm">{whatsappEleitor.nomeCompleto}</span>
                <span className="bg-slate-200/60 font-bold px-2 py-0.5 rounded text-[10px] text-slate-700">{whatsappEleitor.bairro}</span>
              </div>
              <div>Fone: <span className="font-semibold text-slate-700">{whatsappEleitor.telefone}</span></div>
            </div>

            {/* Seleção de Templates */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider">Selecione um Modelo de Mensagem:</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button
                  type="button"
                  onClick={() => aplicarTemplate('agradecimento')}
                  variant="ghost"
                  className="px-3 py-2.5 text-left border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 hover:border-slate-350 transition-all flex flex-col gap-1 h-auto items-start"
                >
                  <span className="text-primary-600">1. Agradecimento</span>
                  <span className="text-[10px] font-normal text-slate-400 truncate w-full">Agradecer bate-papo recente</span>
                </Button>
                <Button
                  type="button"
                  onClick={() => aplicarTemplate('reuniao')}
                  variant="ghost"
                  className="px-3 py-2.5 text-left border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 hover:border-slate-350 transition-all flex flex-col gap-1 h-auto items-start"
                >
                  <span className="text-orange-600">2. Reunião Bairro</span>
                  <span className="text-[10px] font-normal text-slate-400 truncate w-full">Convite de encontro local</span>
                </Button>
                <Button
                  type="button"
                  onClick={() => aplicarTemplate('apoio')}
                  variant="ghost"
                  className="px-3 py-2.5 text-left border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 hover:border-slate-350 transition-all flex flex-col gap-1 h-auto items-start"
                >
                  <span className="text-emerald-600">3. Apoio Líder</span>
                  <span className="text-[10px] font-normal text-slate-400 truncate w-full">Pedido de multiplicação</span>
                </Button>
              </div>
            </div>

            {/* Área de Edição */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider">Texto da Mensagem (Editável):</label>
              <textarea
                rows={5}
                className="w-full p-3 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-slate-700"
                value={mensagemPersonalizada}
                onChange={(e) => setMensagemPersonalizada(e.target.value)}
              />
            </div>

            {/* Ações */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                onClick={() => setWhatsappEleitor(null)}
                variant="secondary"
              >
                Cancelar
              </Button>
              <Button
                onClick={enviarWhatsApp}
                variant="success"
                leftIcon={<Send className="w-4 h-4" />}
              >
                Enviar Mensagem
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Histórico do Eleitor (Perfil & Detalhes) */}
      {isMounted && historicoEleitor && createPortal(
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex min-h-full items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xl max-w-2xl w-full space-y-4 animate-in zoom-in-95 duration-200 text-left sm:my-8 relative max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg leading-tight flex items-center gap-2">
                    {historicoEleitor.nomeCompleto}
                    {historicoEleitor.isLider && (
                      <span className="inline-flex items-center px-1.5 py-0.5 bg-orange-100 text-primary-700 text-[10px] font-extrabold rounded border border-orange-200 uppercase">
                        Líder
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Detalhes do Eleitor e Histórico de Ações
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setHistoricoEleitor(null)}
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-4 border-b border-slate-200 flex-shrink-0">
              <button
                type="button"
                className={`pb-2.5 px-1 text-sm font-semibold transition-colors border-b-2 ${
                  activeTab === 'perfil'
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
                onClick={() => setActiveTab('perfil')}
              >
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  Ficha Cadastral
                </div>
              </button>
              <button
                type="button"
                className={`pb-2.5 px-1 text-sm font-semibold transition-colors border-b-2 ${
                  activeTab === 'historico'
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
                onClick={() => setActiveTab('historico')}
              >
                <div className="flex items-center gap-1.5">
                  <History className="w-4 h-4" />
                  Histórico de Registros
                </div>
              </button>
            </div>

            <div className="overflow-y-auto pr-1 flex-1 min-h-[300px]">
              {activeTab === 'perfil' ? (
                <div className="space-y-6">
                  {/* Seção de Contato e Endereço */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contato e Pessoal</h4>
                      <div className="flex flex-col gap-2 text-sm text-slate-700">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-emerald-500" />
                          <span className="font-medium">{historicoEleitor.telefone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Cake className="w-4 h-4 text-pink-500" />
                          <span className="font-medium">
                            {historicoEleitor.dataNascimento
                              ? `${formatarData(historicoEleitor.dataNascimento)} ${calcularIdade(historicoEleitor.dataNascimento) !== null ? `(${calcularIdade(historicoEleitor.dataNascimento)} anos)` : ''}`
                              : 'Não informado'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Thermometer className="w-4 h-4 text-orange-500" />
                          <span className="font-medium">
                            Temperatura: <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${getTempDetails(historicoEleitor.temperatura).corBadge}`}>
                              {getTempDetails(historicoEleitor.temperatura).label}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Localização</h4>
                      <div className="flex flex-col gap-2 text-sm text-slate-700">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                          <span className="font-medium">
                            <span className="font-bold text-slate-800">{historicoEleitor.bairro}</span> - {historicoEleitor.cidade}
                          </span>
                        </div>
                        <div className="pl-6 text-xs text-slate-500">
                          {historicoEleitor.logradouro ? (
                            <>
                              {historicoEleitor.logradouro}
                              {historicoEleitor.numero ? `, nº ${historicoEleitor.numero}` : ''}
                            </>
                          ) : (
                            <span className="italic">Endereço não informado</span>
                          )}
                        </div>
                      </div>

                      {historicoEleitor.liderNome && (
                        <div className="pt-2 border-t border-slate-200 mt-2">
                          <span className="text-xs text-slate-500 block">Indicado por (Líder):</span>
                          <span className="font-bold text-sm text-slate-700">{historicoEleitor.liderNome}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Seção de Etiquetas */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Etiquetas Associadas</h4>
                    <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
                      {historicoEleitor.etiquetas.length === 0 ? (
                        <span className="text-sm text-slate-400 italic">Nenhuma etiqueta atribuída a este eleitor.</span>
                      ) : (
                        historicoEleitor.etiquetas.map(tag => (
                          <div
                            key={tag.id}
                            style={{ backgroundColor: tag.cor + '15', borderColor: tag.cor }}
                            className="flex flex-col px-3 py-1.5 rounded-lg border"
                          >
                            <span className="text-xs font-bold" style={{ color: tag.cor }}>{tag.nome}</span>
                            <span className="text-[10px] text-slate-500 font-medium">{tag.categoria}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Aba Histórico (Timeline) */
                <>
                  {historicosLoad === null ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 py-10 space-y-3">
                      <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                      <p className="text-sm font-medium">Carregando histórico...</p>
                    </div>
                  ) : historicosLoad.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 py-10 space-y-2">
                      <History className="w-8 h-8 opacity-20" />
                      <p className="text-sm">Nenhum histórico registrado para este eleitor.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent pt-2">
                      {historicosLoad.map((hist, idx) => {
                        const data = new Date(hist.criadoEm)
                        return (
                          <div key={hist.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 group-[.is-active]:bg-blue-50 text-slate-500 group-[.is-active]:text-blue-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                              {hist.tipo === 'CRIACAO' ? <User className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                            </div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                              <div className="flex items-center justify-between space-x-2 mb-1">
                                <div className="font-bold text-slate-700 text-xs">{hist.tipo === 'CRIACAO' ? 'Criação' : 'Atualização'}</div>
                                <time className="text-[10px] font-medium text-slate-400">
                                  {data.toLocaleDateString('pt-BR')} às {data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </time>
                              </div>
                              <div className="text-slate-600 text-xs leading-relaxed">
                                {hist.descricao}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100 flex-shrink-0">
              <Button
                onClick={() => {
                  setHistoricoEleitor(null)
                  handleOpenWhatsappModal(historicoEleitor)
                }}
                variant="ghost"
                size="sm"
                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                leftIcon={<MessageSquare className="w-4 h-4" />}
              >
                Enviar Mensagem
              </Button>
              <Button
                onClick={() => setHistoricoEleitor(null)}
                variant="secondary"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Confirmação de Exclusão de Eleitor */}
      {isMounted && isOpenDeleteConfirm && createPortal(
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex min-h-full items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xl max-w-md w-full space-y-4 animate-in zoom-in-95 duration-200 text-left sm:my-8">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-full flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="font-bold text-slate-800 text-lg">
                  Confirmar Exclusão
                </h3>
                <p className="text-slate-500 text-sm">
                  Deseja realmente excluir o eleitor{' '}
                  <span className="font-bold text-slate-900">"{deleteTargetName}"</span>?
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-xs font-semibold leading-relaxed">
              Aviso: Esta ação é irreversível e removerá permanentemente o eleitor e todos os seus vínculos com etiquetas.
            </div>

            {deleteConfirmError && (
              <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100 font-bold leading-relaxed">
                {deleteConfirmError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <Button
                onClick={() => setIsOpenDeleteConfirm(false)}
                disabled={isPending}
                variant="secondary"
                size="sm"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmDelete}
                disabled={isPending}
                isLoading={isPending}
                variant="danger"
                size="sm"
              >
                Confirmar Exclusão
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* Modal Importação Eleitores */}
      {isMounted && importModal.isOpen && createPortal(
        <div className="fixed inset-0 z-[110] flex min-h-full items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xl max-w-2xl w-full relative space-y-4 animate-in zoom-in-95 duration-200 text-left sm:my-8 text-center">

            {importModal.step === 'reconciliation' && (
              <div className="text-left">
                <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <MapPin className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-xl text-center mb-2">Mapeamento de Localidades</h3>
                <p className="text-sm text-slate-600 mb-6 text-center">
                  {importModal.message}
                  <br/>
                  Para evitar duplicidade, mapeie-os para as localidades corretas ou confirme que são novos.
                </p>

                <div className="max-h-[50vh] overflow-y-auto space-y-6">
                  {importModal.unmappedCidades && importModal.unmappedCidades.length > 0 && (
                    <div className="border border-slate-200 rounded-lg">
                      <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 font-semibold text-slate-700 sticky top-0">
                        Cidades Desconhecidas
                      </div>
                      <table className="w-full text-left text-sm">
                        <thead className="bg-white border-b border-slate-100 text-slate-500">
                          <tr>
                            <th className="px-4 py-2 font-medium w-1/2">Cidade na Planilha</th>
                            <th className="px-4 py-2 font-medium w-1/2">Mapear para Sistema</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {importModal.unmappedCidades.map(cidadePlanilha => (
                            <tr key={cidadePlanilha} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3 font-medium text-slate-800">{cidadePlanilha}</td>
                              <td className="px-4 py-3">
                                <select
                                  value={cidadeMapping[cidadePlanilha] || 'CREATE_NEW'}
                                  onChange={(e) => setCidadeMapping({ ...cidadeMapping, [cidadePlanilha]: e.target.value })}
                                  className="w-full bg-white border border-slate-300 text-slate-800 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 p-2"
                                >
                                  <option value="CREATE_NEW" className="font-bold text-emerald-600">✨ Cadastrar como NOVA Cidade</option>
                                  <optgroup label="Cidades Existentes no Sistema">
                                    {cidades.map(c => (
                                      <option key={c.id} value={c.id}>{c.nome}</option>
                                    ))}
                                  </optgroup>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {importModal.unmappedBairros && importModal.unmappedBairros.length > 0 && (
                    <div className="border border-slate-200 rounded-lg">
                      <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 font-semibold text-slate-700 sticky top-0">
                        Bairros Desconhecidos
                      </div>
                      <table className="w-full text-left text-sm">
                        <thead className="bg-white border-b border-slate-100 text-slate-500">
                          <tr>
                            <th className="px-4 py-2 font-medium w-1/2">Bairro na Planilha</th>
                            <th className="px-4 py-2 font-medium w-1/2">Mapear para Sistema</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {importModal.unmappedBairros.map(bairroPlanilha => (
                            <tr key={bairroPlanilha} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3 font-medium text-slate-800">{bairroPlanilha}</td>
                              <td className="px-4 py-3">
                                <select
                                  value={bairroMapping[bairroPlanilha] || 'CREATE_NEW'}
                                  onChange={(e) => setBairroMapping({ ...bairroMapping, [bairroPlanilha]: e.target.value })}
                                  className="w-full bg-white border border-slate-300 text-slate-800 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 p-2"
                                >
                                  <option value="CREATE_NEW" className="font-bold text-emerald-600">✨ Cadastrar como NOVO Bairro</option>
                                  <optgroup label="Bairros Existentes no Sistema">
                                    {bairros.map(b => (
                                      <option key={b.id} value={b.id}>{b.nome} {b.cidade ? `(${b.cidade.nome})` : ''}</option>
                                    ))}
                                  </optgroup>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center mt-6">
                  <Button onClick={() => setImportModal({ ...importModal, isOpen: false })} variant="secondary">
                    Cancelar Importação
                  </Button>
                  <Button onClick={handleConfirmReconciliation} variant="primary" leftIcon={<ArrowRight className="w-4 h-4" />}>
                    Salvar e Continuar
                  </Button>
                </div>
              </div>
            )}

            {importModal.step === 'confirm' && (
              <>
                <div className="mx-auto w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-lg">Confirmar Importação</h3>
                <p className="text-sm text-slate-600 mb-6">{importModal.message}</p>
                <div className="flex justify-center gap-3">
                  <Button onClick={() => setImportModal({ ...importModal, isOpen: false })} variant="secondary">Cancelar</Button>
                  <Button onClick={confirmImport} variant="primary" leftIcon={<Upload className="w-4 h-4" />}>Importar Agora</Button>
                </div>
              </>
            )}

            {importModal.step === 'importing' && (
              <div className="py-8">
                <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
                <h3 className="font-bold text-slate-800 text-lg">Processando Planilha</h3>
                <p className="text-sm text-slate-500">Por favor aguarde, importando contatos e atualizando o sistema...</p>
              </div>
            )}

            {importModal.step === 'success' && (
              <>
                <div className="mx-auto w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-lg">Importação Concluída!</h3>
                <p className="text-sm text-slate-600">
                  <span className="font-bold text-emerald-600">{importModal.stats?.criados}</span> contatos criados.<br/>
                  <span className="font-bold text-blue-600">{importModal.stats?.atualizados}</span> contatos atualizados.
                </p>
                <div className="flex justify-center mt-6">
                  <Button onClick={() => setImportModal({ ...importModal, isOpen: false })} variant="success">Finalizar</Button>
                </div>
              </>
            )}

            {importModal.step === 'error' && (
              <>
                <div className="mx-auto w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-lg">Erro na Importação</h3>
                <p className="text-sm text-red-600 font-medium bg-red-50 p-3 rounded-lg border border-red-100 mb-6">
                  {importModal.message}
                </p>
                <div className="flex justify-center">
                  <Button onClick={() => setImportModal({ ...importModal, isOpen: false })} variant="secondary">Voltar</Button>
                </div>
              </>
            )}

          </div>
        </div>,
        document.body
      )}
      {/* Modal Edição em Massa */}
      {isMounted && isOpenBulkEdit && createPortal(
        <div className="fixed inset-0 z-[120] flex min-h-full items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xl max-w-md w-full relative space-y-4 animate-in zoom-in-95 duration-200 text-left sm:my-8">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-primary-500" />
                  Edição em Lote
                </h3>
                <p className="text-xs text-slate-500">Alterando {selectedIds.length} eleitor(es) simultaneamente.</p>
              </div>
              <Button onClick={() => setIsOpenBulkEdit(false)} variant="ghost" size="icon" className="text-slate-400">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-100 rounded flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-xs text-red-700 font-medium leading-tight">{errorMsg}</p>
              </div>
            )}

            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Mover para Bairro (Opcional)</label>
                <select
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  value={bulkEditData.bairroId}
                  onChange={e => {
                    const b = bairros.find(x => x.id === e.target.value)
                    setBulkEditData(prev => ({ ...prev, bairroId: e.target.value, cidadeId: b?.cidadeId || '' }))
                  }}
                >
                  <option value="">Não alterar bairro</option>
                  {bairros.map(b => (
                    <option key={b.id} value={b.id}>{b.nome} ({b.cidade?.nome})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Alterar Temperatura (Opcional)</label>
                <select
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  value={bulkEditData.temperatura}
                  onChange={e => setBulkEditData(prev => ({ ...prev, temperatura: Number(e.target.value) }))}
                >
                  <option value={0}>Não alterar temperatura</option>
                  {TEMPERATURAS.map(t => (
                    <option key={t.valor} value={t.valor}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Adicionar Etiquetas (Opcional)</label>
                <MultiSelect
                  options={etiquetas}
                  selectedIds={bulkEditData.addTags}
                  onChange={(val) => setBulkEditData(prev => ({ ...prev, addTags: val }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button onClick={() => setIsOpenBulkEdit(false)} variant="secondary" disabled={isPending}>Cancelar</Button>
              <Button onClick={handleBulkEdit} variant="primary" disabled={isPending || (!bulkEditData.bairroId && !bulkEditData.temperatura && bulkEditData.addTags.length === 0)}>
                {isPending ? 'Salvando...' : 'Aplicar Alterações'}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Exclusão em Massa */}
      {isMounted && isOpenBulkDelete && createPortal(
        <div className="fixed inset-0 z-[120] flex min-h-full items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border border-red-200 rounded-xl p-6 shadow-xl max-w-sm w-full relative space-y-4 animate-in zoom-in-95 duration-200 text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">Excluir {selectedIds.length} contatos?</h3>
            <p className="text-sm text-slate-600">
              Esta ação é irreversível. Todos os dados, histórico e etiquetas associadas a estes eleitores serão apagados.
            </p>

            {deleteConfirmError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded text-left mt-4">
                <p className="text-xs text-red-700 font-medium">{deleteConfirmError}</p>
              </div>
            )}

            <div className="flex justify-center gap-3 pt-4 mt-4 border-t border-slate-100">
              <Button onClick={() => setIsOpenBulkDelete(false)} variant="secondary" disabled={isPending}>Cancelar</Button>
              <Button onClick={handleBulkDelete} variant="danger" disabled={isPending}>
                {isPending ? 'Excluindo...' : 'Sim, Excluir Todos'}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Limpeza Automática de Duplicatas */}
      {isMounted && mergeModal.isOpen && createPortal(
        <div className="fixed inset-0 z-[120] flex min-h-full items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xl max-w-md w-full relative space-y-4 animate-in zoom-in-95 duration-200 text-left sm:my-8 text-center">

            {mergeModal.step === 'confirm' && (
              <>
                <div className="mx-auto w-12 h-12 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-lg">Limpeza Automática</h3>
                <p className="text-sm text-slate-600 mb-6">{mergeModal.message}</p>
                <div className="flex justify-center gap-3">
                  <Button onClick={() => setMergeModal({ ...mergeModal, isOpen: false })} variant="secondary">Cancelar</Button>
                  <Button onClick={confirmMerge} className="bg-orange-500 hover:bg-orange-600 text-white border-0" leftIcon={<Sparkles className="w-4 h-4" />}>
                    Iniciar Limpeza
                  </Button>
                </div>
              </>
            )}

            {mergeModal.step === 'merging' && (
              <div className="py-8">
                <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
                <h3 className="font-bold text-slate-800 text-lg">Varrendo Banco de Dados</h3>
                <p className="text-sm text-slate-500">Aguarde, identificando nomes iguais e mesclando os cadastros de forma segura...</p>
              </div>
            )}

            {mergeModal.step === 'success' && (
              <>
                <div className="mx-auto w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-lg">Limpeza Concluída!</h3>
                <p className="text-sm text-slate-600">
                  {mergeModal.message}
                </p>
                {mergeModal.count !== undefined && mergeModal.count > 0 && (
                  <p className="text-sm font-bold text-emerald-600 mt-2">
                    {mergeModal.count} registro(s) redundante(s) apagado(s).
                  </p>
                )}
                <div className="flex justify-center mt-6">
                  <Button onClick={() => setMergeModal({ ...mergeModal, isOpen: false })} variant="success">Finalizar</Button>
                </div>
              </>
            )}

            {mergeModal.step === 'error' && (
              <>
                <div className="mx-auto w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-lg">Erro na Limpeza</h3>
                <p className="text-sm text-red-600 font-medium bg-red-50 p-3 rounded-lg border border-red-100 mb-6">
                  {mergeModal.message}
                </p>
                <div className="flex justify-center">
                  <Button onClick={() => setMergeModal({ ...mergeModal, isOpen: false })} variant="secondary">Fechar</Button>
                </div>
              </>
            )}

          </div>
        </div>,
        document.body
      )}

    </>
  )
}
